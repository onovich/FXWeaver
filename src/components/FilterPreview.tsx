import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { Application, Container, Rectangle, Sprite, Texture, type WebGLRenderer } from 'pixi.js';
import { GeneratedOutput } from './GeneratedOutput';
import { RuntimeControls } from './RuntimeControls';
import { generateFilter, type GeneratedFilter } from '../compiler/generate';
import { lowerFilterGraph } from '../compiler/ir';
import type { EmbeddedImage, PreviewScene, ProjectAssets } from '../graph/assets';
import { checkProjectAssets, findAssetIssues, MAX_IMAGE_BYTES, MAX_IMAGE_DIMENSION } from '../graph/assets';
import type { GraphDocument, JsonValue } from '../graph/schema';
import { createFilterRuntime, type FilterRuntime } from '../runtime/filterRuntime';

interface Props {
  graph: GraphDocument;
  assets: ProjectAssets;
  scene: PreviewScene;
  onSceneChange: Dispatch<SetStateAction<PreviewScene>>;
  onAssetsChange: (assets: ProjectAssets) => void;
}

type PreviewState = { kind: 'initial' | 'building' | 'ready' | 'old' | 'error' | 'unavailable'; message: string; buildId?: string };
type Display = { host: Container; runtime: FilterRuntime; textures: Texture[]; build: GeneratedFilter };

function defaultSource(): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d')!;
  context.fillStyle = 'rgba(24, 215, 232, 0.85)';
  context.fillRect(16, 16, 96, 96);
  context.fillStyle = 'rgba(255, 104, 75, 0.9)';
  context.beginPath();
  context.arc(64, 64, 37, 0, Math.PI * 2);
  context.fill();
  context.clearRect(53, 53, 22, 22);
  return Texture.from(canvas);
}

async function imageTexture(image: EmbeddedImage): Promise<Texture> {
  const element = new Image();
  element.src = image.dataUrl;
  await element.decode();
  if (element.naturalWidth !== image.width || element.naturalHeight !== image.height) {
    throw new Error(`${image.name} dimensions do not match the project asset record.`);
  }
  return Texture.from(element);
}

function destroyDisplay(display: Display): void {
  display.host.filters = [];
  display.runtime.destroy();
  display.host.destroy({ children: true });
  for (const texture of display.textures) texture.destroy(true);
}

function createHost(scene: PreviewScene, texture: Texture): Container {
  const size = Math.min(scene.width, scene.height) * 0.54;
  const sourceWidth = texture.width || 1;
  const sourceHeight = texture.height || 1;
  const scale = Math.min(size / sourceWidth, size / sourceHeight);
  const contentWidth = sourceWidth * scale;
  const contentHeight = sourceHeight * scale;
  const x = (scene.width - contentWidth) / 2;
  const y = (scene.height - contentHeight) / 2;
  let host: Container;
  if (scene.host === 'sprite') {
    const sprite = new Sprite(texture);
    sprite.position.set(x, y);
    sprite.width = contentWidth;
    sprite.height = contentHeight;
    host = sprite;
  } else {
    const container = new Container();
    const first = new Sprite(texture);
    first.width = contentWidth * 0.8;
    first.height = contentHeight * 0.8;
    const second = new Sprite(texture);
    second.position.set(contentWidth * 0.35, contentHeight * 0.35);
    second.width = contentWidth * 0.65;
    second.height = contentHeight * 0.65;
    container.position.set(x, y);
    container.addChild(first, second);
    host = container;
  }
  const inset = Math.min(scene.filterAreaInset, contentWidth / 2 - 1, contentHeight / 2 - 1);
  host.filterArea = new Rectangle(inset, inset, contentWidth - inset * 2, contentHeight - inset * 2);
  return host;
}

export function FilterPreview({ graph, assets, scene, onSceneChange, onAssetsChange }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const displayRef = useRef<Display | null>(null);
  const requestRef = useRef(0);
  const sceneRef = useRef(scene);
  sceneRef.current = scene;
  const timeRef = useRef(scene.timeSeconds);
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<PreviewState>({ kind: 'initial', message: 'Checking WebGL2…' });
  const [assetMessage, setAssetMessage] = useState<string | null>(null);
  const [successfulBuild, setSuccessfulBuild] = useState<GeneratedFilter | null>(null);
  const [originalSnapshot, setOriginalSnapshot] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState<'effect' | 'original' | 'split'>('effect');
  const [playing, setPlaying] = useState(false);
  const [displayTime, setDisplayTime] = useState(scene.timeSeconds);
  const structuralSceneKey = JSON.stringify({ host: scene.host, sourceAssetId: scene.sourceAssetId,
    width: scene.width, height: scene.height, filterAreaInset: scene.filterAreaInset,
    padding: scene.padding, resolution: scene.resolution, sampling: scene.sampling });

  useEffect(() => {
    let disposed = false;
    const app = new Application();
    if (!document.createElement('canvas').getContext('webgl2')) {
      setState({ kind: 'unavailable', message: 'WebGL2 is unavailable. Generated Filter preview needs WebGL2.' });
      return;
    }
    void app.init({ width: scene.width, height: scene.height, preference: 'webgl', preferWebGLVersion: 2,
      preserveDrawingBuffer: true, backgroundAlpha: 0, autoStart: false, antialias: false }).then(() => {
      if (disposed) { app.destroy(); return; }
      if (!((app.renderer as WebGLRenderer).gl instanceof WebGL2RenderingContext)) {
        app.destroy();
        setState({ kind: 'unavailable', message: 'PixiJS did not create a WebGL2 renderer.' });
        return;
      }
      appRef.current = app;
      mountRef.current?.append(app.canvas);
      setReady(true);
    }).catch((cause: unknown) => {
      if (!disposed) setState({ kind: 'unavailable', message: `WebGL2 initialization failed: ${cause instanceof Error ? cause.message : String(cause)}` });
    });
    return () => {
      disposed = true;
      requestRef.current++;
      if (displayRef.current) destroyDisplay(displayRef.current);
      displayRef.current = null;
      if (appRef.current) appRef.current.destroy();
      appRef.current = null;
    };
  }, []);

  useEffect(() => {
    const app = appRef.current;
    if (!ready || !app) return;
    const request = ++requestRef.current;
    const oldBuildId = displayRef.current?.build.buildId;
    setState({ kind: 'building', message: 'Generating and compiling latest graph…', buildId: oldBuildId });
    const fail = (message: string) => {
      if (request !== requestRef.current) return;
      setState(oldBuildId
        ? { kind: 'old', message, buildId: oldBuildId }
        : { kind: 'error', message });
    };
    const build = async () => {
      const issues = findAssetIssues(graph, assets, scene);
      if (issues.length) { fail(issues.map((issue) => issue.message).join(' ')); return; }
      const lowered = lowerFilterGraph(graph);
      if (!lowered.ok) { fail(lowered.issues.map((issue) => issue.message).join(' ')); return; }
      let generated: GeneratedFilter;
      try { generated = generateFilter(lowered.ir); }
      catch (cause) { fail(cause instanceof Error ? cause.message : String(cause)); return; }
      const textures: Texture[] = [];
      let runtime: FilterRuntime | null = null;
      let host: Container | null = null;
      try {
        const sourceImage = assets.preview.find((image) => image.id === scene.sourceAssetId);
        const source = sourceImage ? await imageTexture(sourceImage) : defaultSource();
        textures.push(source);
        const dependencies = new Map<string, Texture>();
        for (const binding of generated.textureBindings) {
          const image = assets.dependencies.find((item) => item.id === binding.assetId);
          if (!image) throw new Error(`Dependency image ${binding.assetId} is missing.`);
          const texture = await imageTexture(image);
          textures.push(texture);
          dependencies.set(binding.assetId, texture);
        }
        if (request !== requestRef.current) return;
        app.renderer.resize(scene.width, scene.height);
        const result = createFilterRuntime((app.renderer as WebGLRenderer).gl, generated, dependencies, scene);
        if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}${result.error.nodeIds?.length ? ` (nodes: ${result.error.nodeIds.join(', ')})` : ''}`);
        runtime = result.runtime;
        const updated = runtime.update(timeRef.current, sceneRef.current.parameterValues);
        if (!updated.ok) throw new Error(updated.error.message);
        host = createHost(scene, source);
        host.filters = [runtime.filter];
        const previous = displayRef.current;
        if (previous) app.stage.removeChild(previous.host);
        app.stage.addChild(host);
        let original: string;
        try {
          host.filters = [];
          app.renderer.render(app.stage);
          original = app.canvas.toDataURL('image/png');
          host.filters = [runtime.filter];
          app.renderer.render(app.stage);
        }
        catch (cause) {
          host.filters = [];
          app.stage.removeChild(host);
          if (previous) { app.stage.addChild(previous.host); app.renderer.render(app.stage); }
          throw cause;
        }
        if (request !== requestRef.current) {
          app.stage.removeChild(host);
          if (previous) { app.stage.addChild(previous.host); app.renderer.render(app.stage); }
          return;
        }
        displayRef.current = { host, runtime, textures, build: generated };
        runtime = null;
        host = null;
        if (previous) destroyDisplay(previous);
        setOriginalSnapshot(original);
        setSuccessfulBuild(generated);
        setState({ kind: 'ready', message: 'Generated Filter rendered in WebGL2.', buildId: generated.buildId });
      } catch (cause) {
        fail(cause instanceof Error ? cause.message : String(cause));
      } finally {
        if (host) host.destroy({ children: true });
        if (runtime) runtime.destroy();
        if (runtime || host) for (const texture of textures) texture.destroy(true);
        if (request !== requestRef.current && !runtime && !host) for (const texture of textures) texture.destroy(true);
      }
    };
    void build();
    return () => { requestRef.current++; };
  }, [ready, graph, assets, structuralSceneKey]);

  useEffect(() => {
    if (playing) return;
    timeRef.current = scene.timeSeconds;
    setDisplayTime(scene.timeSeconds);
  }, [scene.timeSeconds, playing]);

  useEffect(() => {
    if (state.kind !== 'ready') return;
    const display = displayRef.current;
    const app = appRef.current;
    if (!display || !app) return;
    const result = display.runtime.update(timeRef.current, scene.parameterValues);
    if (!result.ok) {
      setState({ kind: 'old', message: result.error.message, buildId: display.build.buildId });
      return;
    }
    app.renderer.render(app.stage);
  }, [scene.timeSeconds, scene.parameterValues, state.kind]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    let lastLabel = last;
    let lastCheckpoint = last;
    const tick = (now: number) => {
      timeRef.current += Math.min((now - last) / 1000, 0.1);
      last = now;
      if (state.kind === 'ready' && displayRef.current && appRef.current) {
        const result = displayRef.current.runtime.update(timeRef.current, sceneRef.current.parameterValues);
        if (result.ok) appRef.current.renderer.render(appRef.current.stage);
        else setState({ kind: 'old', message: result.error.message, buildId: displayRef.current.build.buildId });
      }
      if (now - lastLabel >= 100) { setDisplayTime(timeRef.current); lastLabel = now; }
      if (now - lastCheckpoint >= 500) {
        onSceneChange((current) => ({ ...current, timeSeconds: timeRef.current }));
        lastCheckpoint = now;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, state.kind, onSceneChange]);

  const update = (patch: Partial<PreviewScene>) => onSceneChange((current) => ({ ...current, ...patch }));
  const setTime = (seconds: number) => {
    setPlaying(false);
    timeRef.current = seconds;
    setDisplayTime(seconds);
    update({ timeSeconds: seconds });
  };
  const setParameter = (id: string, value: JsonValue) => {
    onSceneChange((current) => ({ ...current, parameterValues: { ...current.parameterValues, [id]: value } }));
  };
  const addPreviewImage = async (file: File) => {
    try {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Use a PNG, JPEG, or WebP image.');
      if (file.size > MAX_IMAGE_BYTES) throw new Error('A preview image must be 2 MiB or smaller.');
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Could not read the preview image.'));
        reader.readAsDataURL(file);
      });
      const element = new Image();
      element.src = dataUrl;
      await element.decode();
      if (element.naturalWidth > MAX_IMAGE_DIMENSION || element.naturalHeight > MAX_IMAGE_DIMENSION) {
        throw new Error('Image dimensions must be at most 4096 × 4096.');
      }
      const image: EmbeddedImage = { id: crypto.randomUUID(), name: file.name, mimeType: file.type as EmbeddedImage['mimeType'],
        dataUrl, width: element.naturalWidth, height: element.naturalHeight };
      const candidate = { ...assets, preview: [...assets.preview, image] };
      const checked = checkProjectAssets(candidate);
      if (!checked.ok) throw new Error(checked.message);
      onAssetsChange(candidate);
      update({ sourceAssetId: image.id });
      setAssetMessage(`${file.name} added to project preview assets.`);
    } catch (cause) {
      setAssetMessage(cause instanceof Error ? cause.message : String(cause));
    }
  };
  return <section className="preview-panel filter-preview-panel" aria-labelledby="preview-heading">
    <div className="panel-heading"><p className="section-kicker">PIXIJS WEBGL2 FILTER</p><h2 id="preview-heading">Preview</h2></div>
    <div className={`preview-stage preview-background-${scene.background}`} ref={mountRef} aria-label="Generated Filter canvas">
      {originalSnapshot && compareMode !== 'effect' && <img className={`preview-original preview-original-${compareMode}`} src={originalSnapshot} alt="Original host pixels before Filter" />}
    </div>
    <div className={`preview-status preview-status-${state.kind}`} role="status">
      <strong>{state.kind === 'old' ? 'Old preview' : state.kind === 'ready' ? 'Preview ready' : state.kind === 'building' ? 'Building preview' : state.kind === 'unavailable' ? 'WebGL2 unavailable' : 'Preview unavailable'}</strong>
      {state.buildId && <code data-testid="preview-build-id">{state.buildId}</code>}
      <p>{state.message}</p>
    </div>
    <div className="preview-controls">
      <div className="preview-compare" role="group" aria-label="Preview comparison">
        <button type="button" aria-pressed={compareMode === 'effect'} onClick={() => setCompareMode('effect')}>Effect</button>
        <button type="button" aria-pressed={compareMode === 'original'} onClick={() => setCompareMode('original')}>Original</button>
        <button type="button" aria-pressed={compareMode === 'split'} onClick={() => setCompareMode('split')}>Split</button>
      </div>
      <RuntimeControls graph={graph} scene={scene} playing={playing} displayTime={displayTime}
        onPlayChange={(next) => {
          if (!next) update({ timeSeconds: timeRef.current });
          setPlaying(next);
        }} onSetTime={setTime} onParameterChange={setParameter}
        onResetParameters={() => update({ parameterValues: {} })} />
      <label>Host<select aria-label="Preview host" value={scene.host} onChange={(event) => update({ host: event.target.value as PreviewScene['host'] })}><option value="sprite">Sprite</option><option value="container">Container</option></select></label>
      <label>Source<select aria-label="Preview source" value={scene.sourceAssetId ?? ''} onChange={(event) => update({ sourceAssetId: event.target.value || null })}><option value="">Built-in transparent sample</option>{assets.preview.map((image) => <option key={image.id} value={image.id}>{image.name}</option>)}</select></label>
      <label>Import preview image<input aria-label="Import preview image" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void addPreviewImage(file); event.target.value = ''; }} /></label>
      {scene.sourceAssetId && <button type="button" className="secondary-button" onClick={() => { onAssetsChange({ ...assets, preview: assets.preview.filter((image) => image.id !== scene.sourceAssetId) }); update({ sourceAssetId: null }); setAssetMessage('Preview image removed from the project.'); }}>Remove selected preview image</button>}
      {assetMessage && <p className="preview-asset-message" role="status">{assetMessage}</p>}
      <label>Background<select aria-label="Preview background" value={scene.background} onChange={(event) => update({ background: event.target.value as PreviewScene['background'] })}><option value="checker">Checker</option><option value="dark">Dark</option><option value="light">Light</option></select></label>
      <div className="preview-control-grid">
        <label>Area W<input aria-label="Preview area width" type="number" min="64" max="2048" value={scene.width} onChange={(event) => { const value = Number(event.target.value); if (value >= 64 && value <= 2048) update({ width: value }); }} /></label>
        <label>Area H<input aria-label="Preview area height" type="number" min="64" max="2048" value={scene.height} onChange={(event) => { const value = Number(event.target.value); if (value >= 64 && value <= 2048) update({ height: value }); }} /></label>
        <label>Area inset<input aria-label="Filter area inset" type="number" min="0" max="64" value={scene.filterAreaInset} onChange={(event) => { const value = Number(event.target.value); if (value >= 0 && value <= 64) update({ filterAreaInset: value }); }} /></label>
        <label>Padding<input aria-label="Filter padding" type="number" min="0" max="256" value={scene.padding} onChange={(event) => { const value = Number(event.target.value); if (value >= 0 && value <= 256) update({ padding: value }); }} /></label>
        <label>Resolution<select aria-label="Filter resolution" value={scene.resolution} onChange={(event) => update({ resolution: Number(event.target.value) })}><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select></label>
        <label>Sampling<select aria-label="Texture sampling" value={scene.sampling} onChange={(event) => update({ sampling: event.target.value as PreviewScene['sampling'] })}><option value="linear">Linear</option><option value="nearest">Nearest</option></select></label>
      </div>
      <p className="preview-note">Filter samples the host's rendered pixels; it cannot sample the background outside this host.</p>
      <GeneratedOutput build={successfulBuild} current={state.kind === 'ready'} />
    </div>
  </section>;
}
