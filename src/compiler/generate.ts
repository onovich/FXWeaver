import { canonicalJsonValue, type JsonValue, type ValueType } from '../graph/schema';
import type { FilterIR, IrNode, IrProperty } from './ir';

export const GENERATOR_VERSION = 1 as const;
export const PIXI_BACKEND_VERSION = '8.21.0' as const;
export const FILTER_RENDERER = 'pixi.webgl2' as const;

export interface ParameterBinding {
  id: string;
  name: string;
  valueType: ValueType;
  uniformName: string;
  defaultValue: JsonValue;
  sourceNodeId: string;
  sourceKey: string;
  min?: number;
  max?: number;
}

export interface TextureBinding {
  assetId: string;
  uniformName: string;
  samplerName: string;
}

export interface NodeSourceRange { firstLine: number; lastLine: number }

export interface GeneratedFilter {
  buildId: string;
  generatorVersion: typeof GENERATOR_VERSION;
  backend: typeof FILTER_RENDERER;
  pixiVersion: typeof PIXI_BACKEND_VERSION;
  graphSchemaVersion: number;
  irVersion: number;
  fragmentSource: string;
  parameterBindings: ParameterBinding[];
  textureBindings: TextureBinding[];
  usesTime: boolean;
  nodeSourceRanges: Record<string, NodeSourceRange>;
}

const floatBinary: Record<string, string> = {
  add: '+', subtract: '-', multiply: '*', divide: '/', min: 'min', max: 'max', mod: 'mod', pow: 'pow',
};
const floatUnary = new Set(['sin', 'cos', 'abs', 'floor', 'fract']);
const fixedTypes = new Set([
  'filter.output', 'filter.source', 'filter.uv', 'filter.time', 'filter.float', 'filter.vec2',
  'filter.vec3', 'filter.vec4', 'filter.color', 'filter.color-rgba', 'filter.sample-source',
  'filter.sample-image', 'filter.uv-transform', 'filter.input-size', 'filter.input-texel',
  'filter.clamp-float', 'filter.step-float', 'filter.smoothstep-float', 'filter.mix-float',
  'filter.add-vec2', 'filter.subtract-vec2', 'filter.scale-vec2', 'filter.length-vec2',
  'filter.distance-vec2', 'filter.add-vec3', 'filter.scale-vec3', 'filter.mix-vec3',
  'filter.add-vec4', 'filter.scale-vec4', 'filter.mix-vec4', 'filter.split-vec2',
  'filter.compose-vec2', 'filter.split-vec4', 'filter.rgb-vec4', 'filter.alpha-vec4',
  'filter.compose-vec3', 'filter.compose-vec4', 'filter.compose-rgba',
]);

export function supportsFilterNode(type: string): boolean {
  if (fixedTypes.has(type)) return true;
  const binary = /^filter\.([a-z]+)-float$/.exec(type);
  return binary ? binary[1] in floatBinary || floatUnary.has(binary[1]) : false;
}

function glslType(type: ValueType): string {
  if (type === 'float') return 'float';
  if (type === 'texture') throw new Error('Textures are sampler resources, not value outputs.');
  return type === 'color' ? 'vec4' : type;
}

function glslFloat(value: number): string {
  if (!Number.isFinite(value) || Math.abs(value) > 3.402823466e38) throw new Error('A value outside GLSL float range cannot be generated.');
  if (Object.is(value, -0)) return '-0.0';
  const literal = String(value);
  if (literal.includes('e')) return literal.replace(/^(-?\d+)(e)/, '$1.0$2');
  return literal.includes('.') ? literal : `${literal}.0`;
}

function glslValue(value: JsonValue, type: ValueType): string {
  if (type === 'float') return glslFloat(value as number);
  if (type === 'vec2' || type === 'vec3' || type === 'vec4') {
    return `${type}(${(value as number[]).map(glslFloat).join(', ')})`;
  }
  if (type === 'color') {
    const hex = (value as string).slice(1);
    const alpha = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    const rgb = [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255 * alpha);
    return `vec4(${[...rgb, alpha].map(glslFloat).join(', ')})`;
  }
  throw new Error('A texture asset ID cannot be emitted as a GLSL value.');
}

function hashText(input: string): string {
  let hash = 0xcbf29ce484222325n;
  for (const character of input) {
    hash ^= BigInt(character.codePointAt(0)!);
    hash = (hash * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return hash.toString(16).padStart(16, '0');
}

/** Runtime defaults are omitted: changing a parameter value updates a uniform, not generated code. */
export function compileIdentityJson(ir: FilterIR): string {
  return JSON.stringify(canonicalJsonValue({
    generatorVersion: GENERATOR_VERSION,
    backend: FILTER_RENDERER,
    pixiVersion: PIXI_BACKEND_VERSION,
    compileSettings: { precision: 'highp', alpha: 'premultiplied', outsideUv: 'transparent' },
    ir: { ...ir,
      parameters: ir.parameters.map(({ defaultValue: _defaultValue, ...parameter }) => parameter),
      nodes: ir.nodes.map((node) => ({ ...node, properties: node.properties.map((property) =>
        property.parameterId ? { ...property, value: '<runtime-uniform>' } : property) })),
    },
  }));
}

export function generateFilter(ir: FilterIR): GeneratedFilter {
  if (ir.graphKind !== 'pixi.filter2d') throw new Error('Only pixi.filter2d IR can generate a Filter.');
  const parameterBindings: ParameterBinding[] = ir.parameters.map((parameter, index) => ({
    ...parameter, uniformName: `uParam${index}`,
  }));
  const textureBindings: TextureBinding[] = ir.dependencyAssetIds.map((assetId, index) => ({
    assetId, uniformName: `uAsset${index}`, samplerName: `uAsset${index}Sampler`,
  }));
  const parameterById = new Map(parameterBindings.map((binding) => [binding.id, binding]));
  const textureById = new Map(textureBindings.map((binding, index) => [binding.assetId, { ...binding, index }]));
  const usesTime = ir.nodes.some((node) => node.type === 'filter.time');
  const lines: string[] = [
    '#version 300 es',
    'precision highp float;',
    'in vec2 vTextureCoord;',
    'out vec4 finalColor;',
    'uniform sampler2D uTexture;',
    'uniform highp vec4 uInputSize;',
    'uniform highp vec4 uOutputFrame;',
    'uniform highp vec4 uInputClamp;',
    ...parameterBindings.map((binding) => `uniform ${glslType(binding.valueType)} ${binding.uniformName};`),
    ...textureBindings.map((binding) => `uniform sampler2D ${binding.uniformName};`),
    ...(usesTime ? ['uniform float uTime;'] : []),
    '',
  ];
  if (ir.nodes.some((node) => node.type === 'filter.sample-source')) {
    lines.push('vec4 fxSampleSource(vec2 frameUv) {',
      '  if (any(lessThan(frameUv, vec2(0.0))) || any(greaterThan(frameUv, vec2(1.0)))) return vec4(0.0);',
      '  vec2 inputUv = frameUv * (uOutputFrame.zw * uInputSize.zw);',
      '  return texture(uTexture, clamp(inputUv, uInputClamp.xy, uInputClamp.zw));',
      '}', '');
  }
  for (const [index, binding] of textureBindings.entries()) {
    lines.push(`vec4 fxSampleAsset${index}(vec2 uv) {`,
      '  if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) return vec4(0.0);',
      `  return texture(${binding.uniformName}, uv);`, '}', '');
  }
  lines.push('void main() {');
  const values = new Map<string, string>();
  const nodeSourceRanges: Record<string, NodeSourceRange> = {};
  const key = (nodeId: string, portId: string) => `${nodeId}\0${portId}`;
  function input(node: IrNode, portId: string): string {
    const source = node.inputs.find((item) => item.portId === portId);
    const value = source && values.get(key(source.fromNodeId, source.fromPortId));
    if (!value) throw new Error(`IR input ${node.id}.${portId} has no generated value.`);
    return value;
  }
  function property(node: IrNode, id: string): IrProperty {
    const value = node.properties.find((item) => item.id === id);
    if (!value) throw new Error(`IR property ${node.id}.${id} is missing.`);
    return value;
  }
  function emit(node: IrNode, statement: string): void {
    const line = lines.length + 1;
    lines.push(`  ${statement}`);
    const range = nodeSourceRanges[node.id];
    if (range) range.lastLine = line;
    else nodeSourceRanges[node.id] = { firstLine: line, lastLine: line };
  }
  function output(node: IrNode, nodeIndex: number, portId: string, expression: string): void {
    const port = node.outputs.find((item) => item.portId === portId);
    if (!port) throw new Error(`IR output ${node.id}.${portId} is not defined.`);
    const variable = `v${nodeIndex}_${portId}`;
    emit(node, `${glslType(port.valueType)} ${variable} = ${expression};`);
    values.set(key(node.id, portId), variable);
  }

  for (const [nodeIndex, node] of ir.nodes.entries()) {
    const type = node.type;
    if (type === 'filter.output') { emit(node, `finalColor = ${input(node, 'rgba')};`); continue; }
    if (type === 'filter.source') { output(node, nodeIndex, 'rgba', 'texture(uTexture, vTextureCoord)'); continue; }
    if (type === 'filter.uv') { output(node, nodeIndex, 'uv', 'vTextureCoord / (uOutputFrame.zw * uInputSize.zw)'); continue; }
    if (type === 'filter.time') { output(node, nodeIndex, 'seconds', 'uTime'); continue; }
    if (['filter.float', 'filter.vec2', 'filter.vec3', 'filter.vec4', 'filter.color'].includes(type)) {
      const item = property(node, 'value');
      const uniform = item.parameterId && parameterById.get(item.parameterId)?.uniformName;
      output(node, nodeIndex, type === 'filter.color' ? 'color' : 'value', uniform || glslValue(item.value, item.valueType));
      continue;
    }
    if (type === 'filter.color-rgba') { output(node, nodeIndex, 'rgba', input(node, 'color')); continue; }
    if (type === 'filter.sample-source') { output(node, nodeIndex, 'rgba', `fxSampleSource(${input(node, 'uv')})`); continue; }
    if (type === 'filter.sample-image') {
      const asset = textureById.get(property(node, 'image').value as string);
      if (!asset) throw new Error(`IR image binding for ${node.id} is missing.`);
      output(node, nodeIndex, 'rgba', `fxSampleAsset${asset.index}(${input(node, 'uv')})`);
      continue;
    }
    if (type === 'filter.uv-transform') { output(node, nodeIndex, 'transformed', `(${input(node, 'uv')} * ${input(node, 'scale')} + ${input(node, 'offset')})`); continue; }
    if (type === 'filter.input-size') { output(node, nodeIndex, 'pixels', 'uOutputFrame.zw'); continue; }
    if (type === 'filter.input-texel') { output(node, nodeIndex, 'uv', '(vec2(1.0) / max(uOutputFrame.zw, vec2(1.0)))'); continue; }
    const floatOperation = /^filter\.([a-z]+)-float$/.exec(type)?.[1];
    if (floatOperation && floatOperation in floatBinary) {
      const operator = floatBinary[floatOperation];
      const expression = ['min', 'max', 'mod', 'pow'].includes(floatOperation)
        ? `${operator}(${input(node, 'a')}, ${input(node, 'b')})`
        : `(${input(node, 'a')} ${operator} ${input(node, 'b')})`;
      output(node, nodeIndex, 'value', expression);
      continue;
    }
    if (floatOperation && floatUnary.has(floatOperation)) { output(node, nodeIndex, 'value', `${floatOperation}(${input(node, 'x')})`); continue; }
    if (type === 'filter.clamp-float') { output(node, nodeIndex, 'value', `clamp(${input(node, 'x')}, ${input(node, 'low')}, ${input(node, 'high')})`); continue; }
    if (type === 'filter.step-float') { output(node, nodeIndex, 'value', `step(${input(node, 'edge')}, ${input(node, 'x')})`); continue; }
    if (type === 'filter.smoothstep-float') { output(node, nodeIndex, 'value', `smoothstep(${input(node, 'low')}, ${input(node, 'high')}, ${input(node, 'x')})`); continue; }
    if (type.startsWith('filter.mix-')) { output(node, nodeIndex, 'value', `mix(${input(node, 'a')}, ${input(node, 'b')}, ${input(node, 't')})`); continue; }
    if (type === 'filter.add-vec2' || type === 'filter.add-vec3' || type === 'filter.add-vec4' || type === 'filter.subtract-vec2') {
      output(node, nodeIndex, 'value', `(${input(node, 'a')} ${type === 'filter.subtract-vec2' ? '-' : '+'} ${input(node, 'b')})`);
      continue;
    }
    if (type.startsWith('filter.scale-vec')) { output(node, nodeIndex, 'value', `(${input(node, 'vector')} * ${input(node, 'scale')})`); continue; }
    if (type === 'filter.length-vec2') { output(node, nodeIndex, 'value', `length(${input(node, 'vector')})`); continue; }
    if (type === 'filter.distance-vec2') { output(node, nodeIndex, 'value', `distance(${input(node, 'a')}, ${input(node, 'b')})`); continue; }
    if (type === 'filter.split-vec2') {
      for (const channel of ['x', 'y']) output(node, nodeIndex, channel, `${input(node, 'vector')}.${channel}`);
      continue;
    }
    if (type === 'filter.split-vec4') {
      for (const channel of ['r', 'g', 'b', 'a']) output(node, nodeIndex, channel, `${input(node, 'rgba')}.${channel}`);
      continue;
    }
    if (type === 'filter.rgb-vec4') { output(node, nodeIndex, 'rgb', `${input(node, 'rgba')}.rgb`); continue; }
    if (type === 'filter.alpha-vec4') { output(node, nodeIndex, 'alpha', `${input(node, 'rgba')}.a`); continue; }
    if (type === 'filter.compose-vec2') { output(node, nodeIndex, 'value', `vec2(${input(node, 'x')}, ${input(node, 'y')})`); continue; }
    if (type === 'filter.compose-vec3') { output(node, nodeIndex, 'value', `vec3(${input(node, 'x')}, ${input(node, 'y')}, ${input(node, 'z')})`); continue; }
    if (type === 'filter.compose-vec4') { output(node, nodeIndex, 'value', `vec4(${input(node, 'x')}, ${input(node, 'y')}, ${input(node, 'z')}, ${input(node, 'w')})`); continue; }
    if (type === 'filter.compose-rgba') { output(node, nodeIndex, 'rgba', `vec4(${input(node, 'rgb')}, ${input(node, 'alpha')})`); continue; }
    throw new Error(`Node type ${type} has no Filter generator.`);
  }
  lines.push('}', '');
  return {
    buildId: `f${GENERATOR_VERSION}-${hashText(compileIdentityJson(ir))}`,
    generatorVersion: GENERATOR_VERSION, backend: FILTER_RENDERER, pixiVersion: PIXI_BACKEND_VERSION,
    graphSchemaVersion: ir.graphSchemaVersion, irVersion: ir.irVersion,
    fragmentSource: lines.join('\n'), parameterBindings, textureBindings, usesTime, nodeSourceRanges,
  };
}
