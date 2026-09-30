import { useRef } from 'react';
import { FILTER_GRAPH_KIND, FOUNDATION_GRAPH_KIND } from '../graph/registry';
import { examples } from '../examples/catalog';
import type { DraftProject } from '../storage/projectStorage';

interface Props {
  onCreate: (graphKind: typeof FILTER_GRAPH_KIND | typeof FOUNDATION_GRAPH_KIND) => void;
  onCreateFromExample: (exampleId: string) => void;
  onOpen: () => void;
  onImport: (file: File) => void;
  onRecover: (draft: DraftProject) => void;
  drafts: DraftProject[];
  error: string | null;
}

export function ProjectStart({ onCreate, onCreateFromExample, onOpen, onImport, onRecover, drafts, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <main className="entry-shell">
      <header className="entry-header">
        <span className="wordmark">FXWeave</span>
        <span className="header-subtitle">Game Shader Studio</span>
      </header>
      <div className="entry-content">
        <p className="eyebrow">Internal editor · Filter graph</p>
        <h1>Make an effect from a graph.</h1>
        <p className="entry-intro">Start a PixiJS 2D Filter graph, or open an earlier project.</p>
        <section className="entry-action" aria-labelledby="start-heading">
          <div>
            <p className="section-kicker">START HERE</p>
            <h2 id="start-heading">New PixiJS Filter</h2>
            <p>Begin with a single RGBA output root. The graph targets WebGL2.</p>
          </div>
          <button className="primary-button" type="button" onClick={() => onCreate(FILTER_GRAPH_KIND)}>Create Filter graph <span aria-hidden="true">→</span></button>
        </section>
        <section className="example-section" aria-labelledby="examples-heading">
          <div className="example-heading"><div><p className="section-kicker">EDITABLE EXAMPLES</p><h2 id="examples-heading">Start from a finished graph</h2></div><p>Each button creates a separate project. The committed example stays untouched.</p></div>
          <div className="example-grid">{examples.map((example) => <article className="example-card" key={example.id}>
            <img src={example.imageUrl} alt={`${example.title} fixed WebGL2 preview`} loading="lazy" />
            <div className="example-card-body"><p className="section-kicker">WORK {example.id}</p><h3>{example.title}</h3><p>{example.purpose}</p><small>Recorded build <code>{example.buildId}</code></small>
              <button className="secondary-button" type="button" onClick={() => onCreateFromExample(example.id)}>Edit a copy of {example.title}</button>
              <div className="example-evidence"><a href={example.manifestUrl} download={`work${example.id}.manifest.json`}>Download manifest</a><a href={example.creationLogUrl} download={`work${example.id}.creation-log.json`}>Download creation record</a></div>
            </div>
          </article>)}</div>
        </section>
        <button className="secondary-button" type="button" onClick={() => onCreate(FOUNDATION_GRAPH_KIND)}>Create test graph</button>
        <div className="entry-file-actions">
          <button className="secondary-button" type="button" onClick={onOpen}>Open project file</button>
          <button className="secondary-button" type="button" onClick={() => inputRef.current?.click()}>Import JSON</button>
          <input ref={inputRef} type="file" accept=".json,application/json" className="visually-hidden" aria-label="Import project JSON" onChange={(event) => { const file = event.target.files?.[0]; if (file) onImport(file); event.target.value = ''; }} />
        </div>
        {error && <p className="entry-error" role="alert">{error}</p>}
        {drafts.length > 0 && <section className="draft-list" aria-labelledby="draft-heading"><h2 id="draft-heading">Recovery drafts on this browser</h2><p>Drafts protect work after a closed tab. Export or save a project file for a portable copy.</p><ul>{drafts.map((draft) => <li key={draft.projectId}><span><strong>{draft.project.name}</strong><small>{new Date(draft.savedAt).toLocaleString()}</small></span><button type="button" className="secondary-button" onClick={() => onRecover(draft)}>Recover draft</button></li>)}</ul></section>}
        <p className="entry-caveat">The editor generates WebGL2 Shader from the graph. Save As writes your editable copy to a project file.</p>
      </div>
    </main>
  );
}
