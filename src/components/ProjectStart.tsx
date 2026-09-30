import { useRef } from 'react';
import { FILTER_GRAPH_KIND, FOUNDATION_GRAPH_KIND } from '../graph/registry';
import { examples } from '../examples/catalog';
import type { DraftProject } from '../storage/projectStorage';
import '../entry.css';

interface Props {
  onCreate: (graphKind: typeof FILTER_GRAPH_KIND | typeof FOUNDATION_GRAPH_KIND) => void;
  onCreateFromExample: (exampleId: string) => void;
  loadingExampleId: string | null;
  onOpen: () => void;
  onImport: (file: File) => void;
  onRecover: (draft: DraftProject) => void;
  drafts: DraftProject[];
  error: string | null;
}

export function ProjectStart({ onCreate, onCreateFromExample, loadingExampleId, onOpen, onImport, onRecover, drafts, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <main className="entry-shell">
      <header className="entry-header">
        <a className="wordmark" href="#top" aria-label="FXWeave home"><span className="brand-symbol" aria-hidden="true">◈</span>FXWeave</a>
        <nav aria-label="Main navigation"><a href="#examples">Effect graphs</a><a href="#project-files">Your projects</a></nav>
        <span className="header-subtitle">Game Shader Studio</span>
      </header>
      <div className="entry-content">
        <section className="entry-hero" id="top" aria-labelledby="start-heading">
          <div className="hero-copy">
            <p className="eyebrow">GAME SHADER STUDIO</p>
            <h1 id="start-heading">Shape the effect.<br /><span>See it come alive.</span></h1>
            <p className="entry-intro">A browser node studio for 2D game creators. Build a graph, tune the details, and preview your effect as you go.</p>
            <div className="entry-hero-actions">
              <button className="primary-button" type="button" onClick={() => onCreate(FILTER_GRAPH_KIND)}><span aria-hidden="true">＋</span>Create Filter graph</button>
              <button className="secondary-button" type="button" onClick={onOpen}><span aria-hidden="true">↗</span>Open project file</button>
            </div>
            <p className="hero-footnote">Made for 2D · Editable graphs · Live preview</p>
          </div>
          <figure className="hero-art"><img src="/art/shader-crystal-hero.png" alt="Crystal dissolving into warm fragments and blue scanlines" fetchPriority="high" /><figcaption>Concept artwork</figcaption></figure>
        </section>
        {error && <p className="entry-error" role="alert">{error}</p>}
        <section className="example-section" id="examples" aria-labelledby="examples-heading">
          <div className="example-heading"><div><p className="section-kicker">MADE WITH FXWEAVE</p><h2 id="examples-heading">An effect starts with a graph.</h2></div><p>Explore three editable effects.<br />Open a copy and make it yours.</p></div>
          <div className="example-grid">{examples.map((example) => <article className="example-card" key={example.id}>
            <div className={`example-image example-image-${example.id}`}><img src={example.imageUrl} alt={`${example.title} fixed WebGL2 preview`} loading="lazy" /><span>Live graph · {example.id}</span></div>
            <div className="example-card-body"><h3>{example.title}</h3><p>{example.purpose}</p>
              <button className="secondary-button" type="button" onClick={() => onCreateFromExample(example.id)}>{loadingExampleId === example.id ? `Opening ${example.title}…` : `Edit a copy of ${example.title}`}<span aria-hidden="true">→</span></button>
              <details className="example-details"><summary>Technical details</summary><small>Recorded build <code>{example.buildId}</code></small><div className="example-evidence"><a href={example.manifestUrl} download={`work${example.id}.manifest.json`}>Download manifest</a><a href={example.creationLogUrl} download={`work${example.id}.creation-log.json`}>Download creation record</a></div></details>
            </div>
          </article>)}</div>
        </section>
        <section className="entry-project-files" id="project-files" aria-labelledby="files-heading">
          <div><p className="section-kicker">YOUR WORKSPACE</p><h2 id="files-heading">Pick up where you left off.</h2><p>Bring a saved graph, or use a test graph to explore the editor.</p></div>
          <div className="entry-file-actions">
          <button className="secondary-button" type="button" onClick={() => inputRef.current?.click()}>Import JSON</button>
          <button className="secondary-button" type="button" onClick={() => onCreate(FOUNDATION_GRAPH_KIND)}>Create test graph</button>
          <input ref={inputRef} type="file" accept=".json,application/json" className="visually-hidden" aria-label="Import project JSON" onChange={(event) => { const file = event.target.files?.[0]; if (file) onImport(file); event.target.value = ''; }} />
          </div>
        </section>
        {drafts.length > 0 && <section className="draft-list" aria-labelledby="draft-heading"><h2 id="draft-heading">Recovery drafts on this browser</h2><p>Drafts protect work after a closed tab. Export or save a project file for a portable copy.</p><ul>{drafts.map((draft) => <li key={draft.projectId}><span><strong>{draft.project.name}</strong><small>{new Date(draft.savedAt).toLocaleString()}</small></span><button type="button" className="secondary-button" onClick={() => onRecover(draft)}>Recover draft</button></li>)}</ul></section>}
        <footer className="entry-caveat"><span>FXWeave · Game Shader Studio</span><span>Your graph is the source. Save a project file to keep creating.</span></footer>
      </div>
    </main>
  );
}
