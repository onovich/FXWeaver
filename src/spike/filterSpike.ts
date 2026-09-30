import { Application, Filter, GlProgram, Sprite, Texture, defaultFilterVert, type WebGLRenderer } from 'pixi.js';

type Pixel = [number, number, number, number];

interface SpikeResult {
  status: 'ready' | 'unavailable' | 'error';
  glVersion?: string;
  original?: Pixel;
  filtered?: Pixel;
  maskedOut?: Pixel;
  noPadding?: Pixel;
  withPadding?: Pixel;
  uvLeft?: Pixel;
  uvRight?: Pixel;
  sourceInside?: Pixel;
  sourceOutside?: Pixel;
  extraNearest?: Pixel;
  extraLinear?: Pixel;
  extraOutside?: Pixel;
  invalidShader?: string;
  message?: string;
}

declare global { interface Window { __filterSpike?: SpikeResult } }

const status = document.querySelector<HTMLElement>('#status')!;
const stage = document.querySelector<HTMLElement>('#stage')!;
const width = 320;
const height = 180;

function solidTexture(color: string): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  canvas.getContext('2d')!.fillStyle = color;
  canvas.getContext('2d')!.fillRect(0, 0, 1, 1);
  return Texture.from(canvas);
}

function sourceTexture(): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d')!;
  context.fillStyle = 'rgba(255, 0, 0, 0.5)';
  context.fillRect(8, 8, 48, 48);
  return Texture.from(canvas);
}

function bandTexture(scaleMode: 'nearest' | 'linear'): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 1;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#ff0000';
  context.fillRect(0, 0, 1, 1);
  context.fillStyle = '#0000ff';
  context.fillRect(1, 0, 1, 1);
  const texture = Texture.from(canvas);
  texture.source.style.scaleMode = scaleMode;
  return texture;
}

function pixel(canvas: HTMLCanvasElement, x: number, y: number): Pixel {
  const copy = document.createElement('canvas');
  copy.width = width;
  copy.height = height;
  const context = copy.getContext('2d')!;
  context.drawImage(canvas, 0, 0);
  const value = context.getImageData(x, y, 1, 1).data;
  return [value[0], value[1], value[2], value[3]];
}

const sampleFragment = `
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform sampler2D uMaskTexture;
uniform float uGain;
void main() {
  vec4 source = texture(uTexture, vTextureCoord);
  float mask = texture(uMaskTexture, vec2(0.5)).r;
  finalColor = vec4(source.rgb * uGain * mask, source.a);
}`;

const paddingFragment = `
in vec2 vTextureCoord;
out vec4 finalColor;
void main() {
  finalColor = vec4(0.0, 0.5, 0.0, 0.5);
}`;

const uvFragment = `
in vec2 vTextureCoord;
out vec4 finalColor;
uniform highp vec4 uInputSize;
uniform highp vec4 uInputPixel;
uniform highp vec4 uOutputFrame;
void main() {
  vec2 frameUv = vTextureCoord / (uOutputFrame.zw * uInputSize.zw);
  finalColor = vec4(frameUv, uInputPixel.z * 16.0, 1.0);
}`;

function sourceProbeFragment(x: number): string { return `
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform highp vec4 uInputSize;
uniform highp vec4 uOutputFrame;
uniform highp vec4 uInputClamp;
void main() {
  vec2 frameUv = vec2(${x.toFixed(2)}, 0.5);
  if (any(lessThan(frameUv, vec2(0.0))) || any(greaterThan(frameUv, vec2(1.0)))) {
    finalColor = vec4(0.0);
  } else {
    vec2 inputUv = frameUv * (uOutputFrame.zw * uInputSize.zw);
    finalColor = texture(uTexture, clamp(inputUv, uInputClamp.xy, uInputClamp.zw));
  }
}`; }

function extraProbeFragment(x: number): string { return `
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uExtra;
void main() {
  vec2 uv = vec2(${x.toFixed(2)}, 0.5);
  finalColor = any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))
    ? vec4(0.0) : texture(uExtra, uv);
}`; }

async function run(): Promise<void> {
  const probe = document.createElement('canvas').getContext('webgl2');
  if (!probe) {
    status.textContent = 'WebGL2 unavailable. Filter preview cannot run.';
    window.__filterSpike = { status: 'unavailable' };
    return;
  }

  const app = new Application();
  await app.init({ width, height, preference: 'webgl', preferWebGLVersion: 2, preserveDrawingBuffer: true, backgroundAlpha: 0, autoStart: false, antialias: false });
  const gl = (app.renderer as WebGLRenderer).gl;
  if (!(gl instanceof WebGL2RenderingContext)) throw new Error('PixiJS selected a renderer other than WebGL2.');
  stage.append(app.canvas);

  const main = new Sprite(sourceTexture());
  main.position.set(32, 50);
  app.stage.addChild(main);
  app.renderer.render(app.stage);
  const original = pixel(app.canvas, 64, 82);

  const white = solidTexture('#ffffff');
  const black = solidTexture('#000000');
  const filter = new Filter({
    glProgram: GlProgram.from({ vertex: defaultFilterVert, fragment: sampleFragment, name: 'fxweave-filter-spike' }),
    resources: {
      spikeUniforms: { uGain: { value: 0.5, type: 'f32' } },
      uMaskTexture: white.source,
      uMaskSampler: white.source.style,
    },
  });
  main.filters = [filter];
  app.renderer.render(app.stage);
  const filtered = pixel(app.canvas, 64, 82);

  filter.resources.uMaskTexture = black.source;
  filter.resources.uMaskSampler = black.source.style;
  app.renderer.render(app.stage);
  const maskedOut = pixel(app.canvas, 64, 82);
  filter.resources.uMaskTexture = white.source;
  filter.resources.uMaskSampler = white.source.style;

  const uvFilter = new Filter({ glProgram: GlProgram.from({ vertex: defaultFilterVert, fragment: uvFragment, name: 'fxweave-uv-spike' }) });
  main.filters = [uvFilter];
  app.renderer.render(app.stage);
  const uvLeft = pixel(app.canvas, 40, 82);
  const uvRight = pixel(app.canvas, 80, 82);
  main.filters = [filter];

  const sourceInsideFilter = new Filter({ glProgram: GlProgram.from({ vertex: defaultFilterVert, fragment: sourceProbeFragment(0.5), name: 'fxweave-source-inside-spike' }) });
  main.filters = [sourceInsideFilter];
  app.renderer.render(app.stage);
  const sourceInside = pixel(app.canvas, 64, 82);
  const sourceOutsideFilter = new Filter({ glProgram: GlProgram.from({ vertex: defaultFilterVert, fragment: sourceProbeFragment(-0.2), name: 'fxweave-source-outside-spike' }) });
  main.filters = [sourceOutsideFilter];
  app.renderer.render(app.stage);
  const sourceOutside = pixel(app.canvas, 64, 82);

  const nearest = bandTexture('nearest');
  const linear = bandTexture('linear');
  function extraFilter(texture: Texture, uvX: number): Filter {
    return new Filter({
      glProgram: GlProgram.from({ vertex: defaultFilterVert, fragment: extraProbeFragment(uvX), name: `fxweave-extra-${texture.source.style.scaleMode}-${uvX}` }),
      resources: { uExtra: texture.source, uExtraSampler: texture.source.style },
    });
  }
  main.filters = [extraFilter(nearest, 0.5)];
  app.renderer.render(app.stage);
  const extraNearest = pixel(app.canvas, 64, 82);
  main.filters = [extraFilter(linear, 0.5)];
  app.renderer.render(app.stage);
  const extraLinear = pixel(app.canvas, 64, 82);
  main.filters = [extraFilter(linear, -0.2)];
  app.renderer.render(app.stage);
  const extraOutside = pixel(app.canvas, 64, 82);
  main.filters = [filter];

  const padSprite = new Sprite(solidTexture('#ffffff'));
  padSprite.position.set(190, 65);
  padSprite.width = 40;
  padSprite.height = 40;
  const padFilter = new Filter({ glProgram: GlProgram.from({ vertex: defaultFilterVert, fragment: paddingFragment, name: 'fxweave-padding-spike' }), padding: 0 });
  padSprite.filters = [padFilter];
  app.stage.addChild(padSprite);
  app.renderer.render(app.stage);
  const noPadding = pixel(app.canvas, 184, 85);
  padFilter.padding = 12;
  app.renderer.render(app.stage);
  const withPadding = pixel(app.canvas, 184, 85);

  const shaderErrors: string[] = [];
  const broken = new Filter({ glProgram: GlProgram.from({ vertex: defaultFilterVert, fragment: 'void main() { this is invalid GLSL; }', name: 'fxweave-invalid-spike' }) });
  main.filters = [broken];
  const originalError = console.error;
  const originalWarn = console.warn;
  console.error = (...messages: unknown[]) => { shaderErrors.push(messages.map(String).join(' ')); };
  console.warn = (...messages: unknown[]) => { shaderErrors.push(messages.map(String).join(' ')); };
  try { app.renderer.render(app.stage); }
  catch (error) { shaderErrors.push(error instanceof Error ? error.message : String(error)); }
  finally { console.error = originalError; console.warn = originalWarn; }
  main.filters = [filter];
  app.renderer.render(app.stage);

  window.__filterSpike = { status: 'ready', glVersion: gl.getParameter(gl.VERSION) as string, original, filtered, maskedOut, noPadding, withPadding, uvLeft, uvRight,
    sourceInside, sourceOutside, extraNearest, extraLinear, extraOutside,
    invalidShader: shaderErrors.map((message) => message.split('\n')[0]).join(' | ') };
  status.textContent = 'WebGL2 Filter rendered; pixel probes recorded.';
}

void run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  window.__filterSpike = { status: 'error', message };
  status.textContent = `Filter spike failed: ${message}`;
});
