import { useRef } from 'react';
import type { DraftProject } from '../storage/projectStorage';

interface Props {
  onCreate: () => void;
  onOpen: () => void;
  onImport: (file: File) => void;
  onRecover: (draft: DraftProject) => void;
  drafts: DraftProject[];
  error: string | null;
}

export function ProjectStart({ onCreate, onOpen, onImport, onRecover, drafts, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <main className="entry-shell">
      <header className="entry-header">
        <span className="wordmark">FXWeave</span>
        <span className="header-subtitle">Game Shader Studio</span>
      </header>
      <div className="entry-content">
        <p className="eyebrow">Internal editor · Phase 0</p>
        <h1>Make the graph editable first.</h1>
        <p className="entry-intro">This workspace tests typed nodes, connections, and project files before a rendering target is selected.</p>
        <section className="entry-action" aria-labelledby="start-heading">
          <div>
            <p className="section-kicker">START HERE</p>
            <h2 id="start-heading">New test graph</h2>
            <p>Begin with a single output root. Add and connect test nodes in the workspace.</p>
          </div>
          <button className="primary-button" type="button" onClick={onCreate}>Create test graph <span aria-hidden="true">→</span></button>
        </section>
        <div className="entry-file-actions">
          <button className="secondary-button" type="button" onClick={onOpen}>Open project file</button>
          <button className="secondary-button" type="button" onClick={() => inputRef.current?.click()}>Import JSON</button>
          <input ref={inputRef} type="file" accept=".json,application/json" className="visually-hidden" aria-label="Import project JSON" onChange={(event) => { const file = event.target.files?.[0]; if (file) onImport(file); event.target.value = ''; }} />
        </div>
        {error && <p className="entry-error" role="alert">{error}</p>}
        {drafts.length > 0 && <section className="draft-list" aria-labelledby="draft-heading"><h2 id="draft-heading">Recovery drafts on this browser</h2><p>Drafts protect work after a closed tab. Export or save a project file for a portable copy.</p><ul>{drafts.map((draft) => <li key={draft.projectId}><span><strong>{draft.project.name}</strong><small>{new Date(draft.savedAt).toLocaleString()}</small></span><button type="button" className="secondary-button" onClick={() => onRecover(draft)}>Recover draft</button></li>)}</ul></section>}
        <p className="entry-caveat">Editor infrastructure only. No Shader is generated and no live effect preview is available in this phase.</p>
      </div>
    </main>
  );
}
