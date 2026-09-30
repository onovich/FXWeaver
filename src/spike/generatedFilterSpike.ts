import { Application, Sprite, Texture, type WebGLRenderer } from 'pixi.js';
import { generateFilter, type GeneratedFilter } from '../compiler/generate';
import { lowerFilterGraph } from '../compiler/ir';
import { applyCommand, type EditorDocument } from '../graph/commands';
import { createProject } from '../graph/project';
import { FILTER_GRAPH_KIND } from '../graph/registry';
import { createFilterRuntime, type FilterRuntimeError } from '../runtime/filterRuntime';

type Pixel = [number, number, number, number];
interface ProbeResult {
  status: 'ready' | 'unavailable' | 'error';
  source?: Pixel;
  parameterRed?: Pixel;
  parameterGreen?: Pixel;
  parameterAfterInvalid?: Pixel;
  extraLinear?: Pixel;
  extraNearest?: Pixel;
  extraReplaced?: Pixel;
  inputTextureUntouched?: boolean;
  missingTexture?: string;
  invalidShader?: FilterRuntimeError;
  destroyedUpdate?: string;
  buildId?: string;
  message?: string;
}
declare global { interface Window { __generatedSpike?: ProbeResult } }

const status = document.querySelector<HTMLElement>('#status')!;
const stage = document.querySelector<HTMLElement>('#stage')!;
const width = 256;
const height = 180;

function add(document: EditorDocument, id: string, nodeType: string): EditorDocument {
  const result = applyCommand(document, { type: 'add-node', nodeId: id, nodeType, position: { x: 0, y: 0 } });
  if (!result.ok) throw new Error(result.issue.message);
  return result.document;
}

function connect(document: EditorDocument, id: string, fromNode: string, fromPort: string, toNode: string, toPort: string): EditorDocument {
  const result = applyCommand(document, { type: 'connect', edgeId: id,
    from: { nodeId: fromNode, portId: fromPort }, to: { nodeId: toNode, portId: toPort } });
  if (!result.ok) throw new Error(result.issue.message);
  return result.document;
}

function build(document: EditorDocument): GeneratedFilter {
  const lowered = lowerFilterGraph(document.graph);
  if (!lowered.ok) throw new Error(JSON.stringify(lowered.issues));
  return generateFilter(lowered.ir);
}

function pixel(canvas: HTMLCanvasElement, x: number, y: number): Pixel {
  const copy = document.createElement('canvas');
  copy.width = width;
  copy.height = height;
  const context = copy.getContext('2d')!;
  context.drawImage(canvas, 0, 0);
  const sample = context.getImageData(x, y, 1, 1).data;
  return [sample[0], sample[1], sample[2], sample[3]];
}

function hostTexture(): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d')!;
  context.fillStyle = 'rgba(255, 0, 0, 0.5)';
  context.fillRect(0, 0, 64, 64);
  return Texture.from(canvas);
}

function bandTexture(): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 1;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#ff0000';
  context.fillRect(0, 0, 1, 1);
  context.fillStyle = '#0000ff';
  context.fillRect(1, 0, 1, 1);
  return Texture.from(canvas);
}

async function run(): Promise<void> {
  if (!document.createElement('canvas').getContext('webgl2')) {
    window.__generatedSpike = { status: 'unavailable' };
    status.textContent = 'WebGL2 unavailable for generated Filter.';
    return;
  }
  const app = new Application();
  await app.init({ width, height, preference: 'webgl', preferWebGLVersion: 2,
    preserveDrawingBuffer: true, backgroundAlpha: 0, autoStart: false, antialias: false });
  const gl = (app.renderer as WebGLRenderer).gl;
  if (!(gl instanceof WebGL2RenderingContext)) throw new Error('PixiJS did not create WebGL2.');
  stage.append(app.canvas);

  const sourceBase = createProject('source', 'Source', FILTER_GRAPH_KIND, 'root');
  let sourceDocument: EditorDocument = add(sourceBase, 'source', 'filter.source');
  sourceDocument = connect(sourceDocument, 'edge', 'source', 'rgba', 'root', 'rgba');
  const sourceBuild = build(sourceDocument);
  const sourceResult = createFilterRuntime(gl, sourceBuild, new Map(), sourceBase.preview);
  if (!sourceResult.ok) throw new Error(JSON.stringify(sourceResult.error));
  const sourceSprite = new Sprite(hostTexture());
  sourceSprite.position.set(20, 20);
  sourceSprite.filters = [sourceResult.runtime.filter];
  app.stage.addChild(sourceSprite);
  app.renderer.render(app.stage);
  const source = pixel(app.canvas, 52, 52);
  app.stage.removeChild(sourceSprite);
  sourceResult.runtime.destroy();
  const destroyedUpdate = sourceResult.runtime.update(0).ok ? 'accepted' : 'rejected';

  const parameterBase = createProject('parameter', 'Parameter', FILTER_GRAPH_KIND, 'root');
  let parameterDocument: EditorDocument = add(parameterBase, 'value', 'filter.vec4');
  parameterDocument = connect(parameterDocument, 'edge', 'value', 'value', 'root', 'rgba');
  const changed = applyCommand(parameterDocument, { type: 'set-property', nodeId: 'value', propertyId: 'value', value: [0.5, 0, 0, 0.5] });
  parameterDocument = changed.document;
  const exposed = applyCommand(parameterDocument, { type: 'expose-parameter', parameterId: 'tint', nodeId: 'value', propertyId: 'value', name: 'Tint' });
  parameterDocument = exposed.document;
  const parameterBuild = build(parameterDocument);
  const parameterResult = createFilterRuntime(gl, parameterBuild, new Map(), parameterBase.preview);
  if (!parameterResult.ok) throw new Error(JSON.stringify(parameterResult.error));
  const parameterSprite = new Sprite(Texture.WHITE);
  parameterSprite.position.set(100, 20);
  parameterSprite.width = 64;
  parameterSprite.height = 64;
  parameterSprite.filters = [parameterResult.runtime.filter];
  app.stage.addChild(parameterSprite);
  app.renderer.render(app.stage);
  const parameterRed = pixel(app.canvas, 132, 52);
  const update = parameterResult.runtime.update(0, { tint: [0, 0.5, 0, 0.5] });
  if (!update.ok) throw new Error(JSON.stringify(update.error));
  app.renderer.render(app.stage);
  const parameterGreen = pixel(app.canvas, 132, 52);
  const invalidUpdate = parameterResult.runtime.update(0, { tint: [1e100, 0, 0, 1] });
  if (invalidUpdate.ok || invalidUpdate.error.code !== 'INVALID_PARAMETER') throw new Error('Invalid uniform value was accepted.');
  app.renderer.render(app.stage);
  const parameterAfterInvalid = pixel(app.canvas, 132, 52);
  app.stage.removeChild(parameterSprite);
  parameterResult.runtime.destroy();

  const imageBase = createProject('image', 'Image', FILTER_GRAPH_KIND, 'root');
  let imageDocument: EditorDocument = add(imageBase, 'uv', 'filter.uv');
  imageDocument = add(imageDocument, 'image', 'filter.sample-image');
  const bound = applyCommand(imageDocument, { type: 'set-property', nodeId: 'image', propertyId: 'image', value: 'band' });
  imageDocument = bound.document;
  imageDocument = connect(imageDocument, 'uv-edge', 'uv', 'uv', 'image', 'uv');
  imageDocument = connect(imageDocument, 'out-edge', 'image', 'rgba', 'root', 'rgba');
  const imageBuild = build(imageDocument);
  const missingResult = createFilterRuntime(gl, imageBuild, new Map(), imageBase.preview);
  const missingTexture = missingResult.ok ? 'accepted' : missingResult.error.code;
  const band = bandTexture();
  const imageResult = createFilterRuntime(gl, imageBuild, new Map([['band', band]]), imageBase.preview);
  if (!imageResult.ok) throw new Error(JSON.stringify(imageResult.error));
  const imageSprite = new Sprite(Texture.WHITE);
  imageSprite.position.set(180, 20);
  imageSprite.width = 64;
  imageSprite.height = 64;
  imageSprite.filters = [imageResult.runtime.filter];
  app.stage.addChild(imageSprite);
  app.renderer.render(app.stage);
  const extraLinear = pixel(app.canvas, 212, 52);
  imageResult.runtime.setSampling('nearest');
  app.renderer.render(app.stage);
  const extraNearest = pixel(app.canvas, 212, 52);
  const greenCanvas = document.createElement('canvas');
  greenCanvas.width = 1;
  greenCanvas.height = 1;
  greenCanvas.getContext('2d')!.fillStyle = '#00ff00';
  greenCanvas.getContext('2d')!.fillRect(0, 0, 1, 1);
  imageResult.runtime.setTexture('band', Texture.from(greenCanvas));
  app.renderer.render(app.stage);
  const extraReplaced = pixel(app.canvas, 212, 52);
  app.stage.removeChild(imageSprite);
  imageResult.runtime.destroy();
  const inputTextureUntouched = !band.source.destroyed && band.source.style.scaleMode === 'linear';

  const brokenLines = sourceBuild.fragmentSource.split('\n');
  brokenLines[sourceBuild.nodeSourceRanges.source.firstLine - 1] = '  this is invalid GLSL;';
  const invalidResult = createFilterRuntime(gl, { ...sourceBuild, fragmentSource: brokenLines.join('\n') }, new Map(), sourceBase.preview);
  const invalidShader = invalidResult.ok ? undefined : invalidResult.error;
  if (invalidResult.ok) invalidResult.runtime.destroy();

  // Keep three independent generated builds visible for the capture artifact.
  const displaySource = createFilterRuntime(gl, sourceBuild, new Map(), sourceBase.preview);
  const displayParameter = createFilterRuntime(gl, parameterBuild, new Map(), parameterBase.preview);
  const displayImage = createFilterRuntime(gl, imageBuild, new Map([['band', band]]), imageBase.preview);
  if (!displaySource.ok || !displayParameter.ok || !displayImage.ok) throw new Error('Display Filter could not be recreated.');
  displayParameter.runtime.update(0, { tint: [0, 0.5, 0, 0.5] });
  displayImage.runtime.setSampling('nearest');
  sourceSprite.filters = [displaySource.runtime.filter];
  parameterSprite.filters = [displayParameter.runtime.filter];
  imageSprite.filters = [displayImage.runtime.filter];
  app.stage.addChild(sourceSprite, parameterSprite, imageSprite);
  app.renderer.render(app.stage);

  window.__generatedSpike = { status: 'ready', source, parameterRed, parameterGreen, parameterAfterInvalid,
    extraLinear, extraNearest, extraReplaced, inputTextureUntouched,
    missingTexture, invalidShader, destroyedUpdate, buildId: sourceBuild.buildId };
  status.textContent = 'Generated Filter compiled and rendered in WebGL2.';
}

void run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  window.__generatedSpike = { status: 'error', message };
  status.textContent = `Generated Filter probe failed: ${message}`;
});
