import type { GeneratedFilter } from '../compiler/generate';

interface Props { build: GeneratedFilter | null; current: boolean }

function download(name: string, contents: string, type: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function GeneratedOutput({ build, current }: Props) {
  return <details className="generated-output">
    <summary>Generated code and bindings</summary>
    {build ? <div className="generated-output-content">
      <p className="generated-build-state">{current ? 'Current successful preview' : 'Previous successful build · preview is not current'}</p>
      <dl>
        <dt>Build ID</dt><dd data-testid="code-build-id">{build.buildId}</dd>
        <dt>Backend</dt><dd>{build.backend} · PixiJS {build.pixiVersion}</dd>
        <dt>Generator</dt><dd>v{build.generatorVersion} · IR v{build.irVersion}</dd>
      </dl>
      <div className="generated-actions">
        <button type="button" disabled={!current} onClick={() => void navigator.clipboard.writeText(build.fragmentSource)}>Copy GLSL</button>
        <button type="button" disabled={!current} onClick={() => download(`${build.buildId}.frag.glsl`, build.fragmentSource, 'text/plain')}>Download GLSL</button>
        <button type="button" disabled={!current} onClick={() => download(`${build.buildId}.manifest.json`, `${JSON.stringify({
          buildId: build.buildId, backend: build.backend, pixiVersion: build.pixiVersion,
          generatorVersion: build.generatorVersion, graphSchemaVersion: build.graphSchemaVersion, irVersion: build.irVersion,
          parameterBindings: build.parameterBindings, textureBindings: build.textureBindings,
          usesTime: build.usesTime, nodeSourceRanges: build.nodeSourceRanges,
        }, null, 2)}\n`, 'application/json')}>Download manifest</button>
      </div>
      <h3>Parameter bindings</h3>
      {build.parameterBindings.length ? <ul>{build.parameterBindings.map((binding) => <li key={binding.id}><code>{binding.uniformName}</code> ← {binding.name} ({binding.valueType}, ID {binding.id})</li>)}</ul> : <p>None</p>}
      <h3>Texture bindings</h3>
      {build.textureBindings.length ? <ul>{build.textureBindings.map((binding) => <li key={binding.assetId}><code>{binding.uniformName}</code> / <code>{binding.samplerName}</code> ← {binding.assetId}</li>)}</ul> : <p>None</p>}
      <h3>Fragment GLSL</h3>
      <pre data-testid="generated-glsl"><code>{build.fragmentSource}</code></pre>
    </div> : <p className="panel-note">No graph has compiled successfully yet.</p>}
  </details>;
}
