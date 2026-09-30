import { Filter, GlProgram, Texture, TextureSource, defaultFilterVert, type UniformGroup } from 'pixi.js';
import type { PreviewScene } from '../graph/assets';
import { isValueOfType } from '../graph/values';
import type { JsonValue, ValueType } from '../graph/schema';
import type { GeneratedFilter, ParameterBinding, TextureBinding } from '../compiler/generate';

export interface FilterRuntimeError {
  code: 'WEBGL2_UNAVAILABLE' | 'VERTEX_COMPILE' | 'FRAGMENT_COMPILE' | 'PROGRAM_LINK' |
    'PROGRAM_PREPARE' | 'MISSING_TEXTURE' | 'INVALID_PARAMETER' | 'DESTROYED';
  message: string;
  rawLog?: string;
  generatedLine?: number;
  nodeIds?: string[];
  assetId?: string;
}

export type RuntimeResult = { ok: true; runtime: FilterRuntime } | { ok: false; error: FilterRuntimeError };
export type UpdateResult = { ok: true } | { ok: false; error: FilterRuntimeError };

function uniformType(type: ValueType): 'f32' | 'vec2<f32>' | 'vec3<f32>' | 'vec4<f32>' {
  if (type === 'float') return 'f32';
  if (type === 'vec2') return 'vec2<f32>';
  if (type === 'vec3') return 'vec3<f32>';
  return 'vec4<f32>';
}

function uniformValue(value: JsonValue, type: ValueType): number | Float32Array {
  if (type === 'float') return value as number;
  if (type === 'color') {
    const hex = (value as string).slice(1);
    const alpha = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    return new Float32Array([0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255 * alpha).concat(alpha));
  }
  return new Float32Array(value as number[]);
}

function validatedValue(binding: ParameterBinding, value: JsonValue): boolean {
  return isValueOfType(value, binding.valueType) &&
    (typeof value !== 'number' || (binding.min === undefined || value >= binding.min) && (binding.max === undefined || value <= binding.max));
}

function fragmentLineOffset(processed: string, generated: string): number {
  const versioned = generated.startsWith('#version 300 es\n');
  const body = versioned ? generated.slice('#version 300 es\n'.length) : generated;
  const start = processed.indexOf(body);
  const linesBeforeBody = start < 0 ? 0 : processed.slice(0, start).split('\n').length - 1;
  return linesBeforeBody - (versioned ? 1 : 0);
}

function shaderError(code: FilterRuntimeError['code'], log: string, artifact: GeneratedFilter, processedFragment?: string): FilterRuntimeError {
  const processedLine = /(?:ERROR|WARNING):\s*\d+:(\d+):/.exec(log)?.[1];
  const generatedLine = code === 'FRAGMENT_COMPILE' && processedLine && processedFragment
    ? Number(processedLine) - fragmentLineOffset(processedFragment, artifact.fragmentSource) : undefined;
  const nodeIds = generatedLine && generatedLine > 0 ? Object.entries(artifact.nodeSourceRanges)
    .filter(([, range]) => generatedLine >= range.firstLine && generatedLine <= range.lastLine)
    .map(([id]) => id) : [];
  return { code, message: log.split('\n').find((line) => line.trim()) ?? code,
    rawLog: log, ...(generatedLine && generatedLine > 0 ? { generatedLine } : {}),
    ...(nodeIds.length > 0 ? { nodeIds } : {}) };
}

/** Compile Pixi's processed GLSL on the actual WebGL2 context before installing a Filter. */
function preflight(gl: WebGL2RenderingContext, program: GlProgram, artifact: GeneratedFilter): FilterRuntimeError | null {
  const vertexSource = program.vertex;
  const fragmentSource = program.fragment;
  if (!vertexSource || !fragmentSource) return { code: 'PROGRAM_PREPARE', message: 'PixiJS Shader source is unavailable.' };
  let vertex: WebGLShader | null = null;
  let fragment: WebGLShader | null = null;
  let linked: WebGLProgram | null = null;
  try {
    vertex = gl.createShader(gl.VERTEX_SHADER);
    fragment = gl.createShader(gl.FRAGMENT_SHADER);
    linked = gl.createProgram();
    if (!vertex || !fragment || !linked) return { code: 'PROGRAM_PREPARE', message: 'WebGL2 could not allocate a Shader program.' };
    gl.shaderSource(vertex, vertexSource);
    gl.compileShader(vertex);
    if (!gl.getShaderParameter(vertex, gl.COMPILE_STATUS)) {
      return shaderError('VERTEX_COMPILE', gl.getShaderInfoLog(vertex) || 'Vertex Shader compilation failed.', artifact);
    }
    gl.shaderSource(fragment, fragmentSource);
    gl.compileShader(fragment);
    if (!gl.getShaderParameter(fragment, gl.COMPILE_STATUS)) {
      return shaderError('FRAGMENT_COMPILE', gl.getShaderInfoLog(fragment) || 'Fragment Shader compilation failed.', artifact, fragmentSource);
    }
    gl.attachShader(linked, vertex);
    gl.attachShader(linked, fragment);
    gl.linkProgram(linked);
    if (!gl.getProgramParameter(linked, gl.LINK_STATUS)) {
      return shaderError('PROGRAM_LINK', gl.getProgramInfoLog(linked) || 'Shader program linking failed.', artifact);
    }
    return null;
  } finally {
    if (linked) gl.deleteProgram(linked);
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
  }
}

function isolatedSource(texture: Texture, sampling: PreviewScene['sampling']): TextureSource {
  const source = texture.source;
  if (!source.resource) throw new Error('A dependency texture must have image pixels.');
  return TextureSource.from({ resource: source.resource, width: source.width, height: source.height,
    resolution: source.resolution, format: source.format, alphaMode: source.alphaMode,
    scaleMode: sampling, addressMode: 'clamp-to-edge' });
}

function bindTextureResources(resources: Record<string, unknown>, binding: TextureBinding, source: TextureSource): void {
  resources[binding.uniformName] = source;
  resources[binding.samplerName] = source.style;
}

export class FilterRuntime {
  readonly filter: Filter;
  readonly artifact: GeneratedFilter;
  private readonly uniformGroup: UniformGroup | null;
  private readonly sources: Map<string, TextureSource>;
  private disposed = false;

  constructor(filter: Filter, artifact: GeneratedFilter, uniformGroup: UniformGroup | null,
    sources: Map<string, TextureSource>) {
    this.filter = filter;
    this.artifact = artifact;
    this.uniformGroup = uniformGroup;
    this.sources = sources;
  }

  update(timeSeconds: number, values: Record<string, JsonValue> = {}): UpdateResult {
    if (this.disposed) return { ok: false, error: { code: 'DESTROYED', message: 'This Filter runtime has been destroyed.' } };
    if (!Number.isFinite(timeSeconds) || timeSeconds < 0) {
      return { ok: false, error: { code: 'INVALID_PARAMETER', message: 'Preview time must be a nonnegative finite number.' } };
    }
    const next: Record<string, number | Float32Array> = {};
    for (const binding of this.artifact.parameterBindings) {
      const value = values[binding.id] ?? binding.defaultValue;
      if (!validatedValue(binding, value)) {
        return { ok: false, error: { code: 'INVALID_PARAMETER', message: `Parameter ${binding.name} has an invalid ${binding.valueType} value.` } };
      }
      next[binding.uniformName] = uniformValue(value, binding.valueType);
    }
    if (this.artifact.usesTime) next.uTime = timeSeconds;
    if (this.uniformGroup) Object.assign(this.uniformGroup.uniforms, next);
    return { ok: true };
  }

  setTexture(assetId: string, texture: Texture): UpdateResult {
    if (this.disposed) return { ok: false, error: { code: 'DESTROYED', message: 'This Filter runtime has been destroyed.' } };
    const binding = this.artifact.textureBindings.find((item) => item.assetId === assetId);
    if (!binding) return { ok: false, error: { code: 'MISSING_TEXTURE', message: `No texture binding exists for ${assetId}.`, assetId } };
    let source: TextureSource;
    try { source = isolatedSource(texture, this.sources.get(assetId)!.style.scaleMode); }
    catch (cause) { return { ok: false, error: { code: 'MISSING_TEXTURE', message: cause instanceof Error ? cause.message : String(cause), assetId } }; }
    const oldSource = this.sources.get(assetId)!;
    this.sources.set(assetId, source);
    bindTextureResources(this.filter.resources, binding, source);
    oldSource.destroy();
    return { ok: true };
  }

  setSampling(sampling: PreviewScene['sampling']): UpdateResult {
    if (this.disposed) return { ok: false, error: { code: 'DESTROYED', message: 'This Filter runtime has been destroyed.' } };
    for (const binding of this.artifact.textureBindings) {
      const source = this.sources.get(binding.assetId)!;
      source.style.scaleMode = sampling;
      source.style.update();
    }
    return { ok: true };
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.filter.destroy();
    for (const source of this.sources.values()) source.destroy();
    this.sources.clear();
  }
}

export function createFilterRuntime(gl: WebGL2RenderingContext, artifact: GeneratedFilter,
  textures: ReadonlyMap<string, Texture>, scene: Pick<PreviewScene, 'padding' | 'resolution' | 'sampling'>): RuntimeResult {
  if (typeof WebGL2RenderingContext === 'undefined' || !(gl instanceof WebGL2RenderingContext)) {
    return { ok: false, error: { code: 'WEBGL2_UNAVAILABLE', message: 'WebGL2 is required for generated Filter preview.' } };
  }
  for (const binding of artifact.textureBindings) {
    if (!textures.has(binding.assetId)) {
      return { ok: false, error: { code: 'MISSING_TEXTURE', message: `Dependency image ${binding.assetId} is missing.`, assetId: binding.assetId } };
    }
  }
  const sources = new Map<string, TextureSource>();
  try {
    const program = GlProgram.from({ vertex: defaultFilterVert, fragment: artifact.fragmentSource,
      name: `fxweave_${artifact.buildId.replace(/[^A-Za-z0-9_]/g, '_')}` });
    const error = preflight(gl, program, artifact);
    if (error) return { ok: false, error };
    const resources: Record<string, unknown> = {};
    const uniforms: Record<string, { value: number | Float32Array; type: ReturnType<typeof uniformType> }> = {};
    for (const binding of artifact.parameterBindings) {
      uniforms[binding.uniformName] = { value: uniformValue(binding.defaultValue, binding.valueType), type: uniformType(binding.valueType) };
    }
    if (artifact.usesTime) uniforms.uTime = { value: 0, type: 'f32' };
    if (Object.keys(uniforms).length > 0) resources.fxUniforms = uniforms;
    for (const binding of artifact.textureBindings) {
      const texture = textures.get(binding.assetId)!;
      const source = isolatedSource(texture, scene.sampling);
      sources.set(binding.assetId, source);
      bindTextureResources(resources, binding, source);
    }
    const filter = new Filter({ glProgram: program, resources, padding: scene.padding, resolution: scene.resolution });
    return { ok: true, runtime: new FilterRuntime(filter, artifact,
      Object.keys(uniforms).length > 0 ? filter.resources.fxUniforms as UniformGroup : null,
      sources) };
  } catch (cause) {
    for (const source of sources.values()) source.destroy();
    return { ok: false, error: { code: 'PROGRAM_PREPARE', message: cause instanceof Error ? cause.message : String(cause) } };
  }
}
