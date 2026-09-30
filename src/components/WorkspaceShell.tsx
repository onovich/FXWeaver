import { useEffect, useRef, useState } from 'react';
import { GraphCanvas } from './GraphCanvas';
import { Inspector } from './Inspector';
import { ProblemsPanel } from './ProblemsPanel';
import type { GraphCommand } from '../graph/commands';
import { applyHistoryCommand, createHistory, redo, undo } from '../graph/history';
import { listNodeDefinitions } from '../graph/registry';
import type { ProjectFile } from '../graph/project';
import type { GraphIssue } from '../graph/diagnostics';
import type { GraphPortRef } from '../graph/schema';
import { validateGraph } from '../graph/validation';

interface Props { project: ProjectFile; onBack: () => void }

export function WorkspaceShell({ project, onBack }: Props) {
  const [history, setHistory] = useState(() => createHistory({ graph: project.graph, layout: project.layout }));
  const [pendingFrom, setPendingFrom] = useState<GraphPortRef | null>(null);
  const [actionIssue, setActionIssue] = useState<GraphIssue | null>(null);
  const [search, setSearch] = useState('');
  const [problemsOpen, setProblemsOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const document = history.present;
  const issues = validateGraph(document.graph);
  const selectedId = document.layout.selectedNodeIds[0];
  const definitions = listNodeDefinitions(document.graph.graphKind).filter((definition) =>
    `${definition.label} ${definition.category} ${definition.description}`.toLowerCase().includes(search.toLowerCase()),
  );

  function dispatch(command: GraphCommand): boolean {
    const result = applyHistoryCommand(history, command);
    setHistory(result.history);
    setActionIssue(result.issue ?? null);
    return !result.issue;
  }

  function setSelection(ids: string[]) {
    setHistory((current) => ({ ...current, present: { ...current.present, layout: { ...current.present.layout, selectedNodeIds: ids } } }));
  }

  function setViewport(viewport: { x: number; y: number; zoom: number }) {
    setHistory((current) => ({ ...current, present: { ...current.present, layout: { ...current.present.layout, viewport } } }));
  }

  function addNode(nodeType: string) {
    const nodeId = crypto.randomUUID();
    const count = document.graph.nodes.length;
    if (dispatch({ type: 'add-node', nodeId, nodeType, position: { x: 80 + (count % 4) * 46, y: 110 + (count % 5) * 72 } })) {
      setSelection([nodeId]);
      setSearch('');
    }
  }

  function connect(from: GraphPortRef, to: GraphPortRef) {
    if (dispatch({ type: 'connect', edgeId: crypto.randomUUID(), from, to, replaceExisting: true })) setPendingFrom(null);
  }

  function changeZoom(factor: number) {
    setViewport({ ...document.layout.viewport, zoom: Math.min(2, Math.max(.5, Math.round(document.layout.viewport.zoom * factor * 100) / 100)) });
  }

  function focusIssue(issue: GraphIssue) {
    if (!issue.nodeId) return;
    const position = document.layout.nodePositions[issue.nodeId];
    setSelection([issue.nodeId]);
    if (position) setViewport({ ...document.layout.viewport, x: 110 - position.x * document.layout.viewport.zoom, y: 110 - position.y * document.layout.viewport.zoom });
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || (target instanceof HTMLElement && target.isContentEditable)) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        setHistory((current) => event.shiftKey ? redo(current) : undo(current));
        setActionIssue(null);
      } else if (event.key === 'Delete' && document.layout.selectedNodeIds.length > 0) {
        event.preventDefault();
        dispatch({ type: 'delete-nodes', nodeIds: document.layout.selectedNodeIds });
      } else if (event.key === 'Escape') {
        setPendingFrom(null);
        setActionIssue(null);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <main className={`workbench ${problemsOpen ? 'problems-open' : ''}`}>
      <header className="workbench-header">
        <button className="brand-button" type="button" onClick={onBack} aria-label="Return to project entry">FXWeave</button>
        <div className="header-divider" aria-hidden="true" />
        <div className="project-heading"><strong>{project.name}</strong><span>Foundation test graph</span></div>
        <div className="header-spacer" />
        <span className="file-state">Draft only · Not saved to file</span>
        <button className="header-tool" type="button" disabled={history.past.length === 0} onClick={() => setHistory(undo(history))}>Undo</button>
        <button className="header-tool" type="button" disabled={history.future.length === 0} onClick={() => setHistory(redo(history))}>Redo</button>
        <span className="phase-chip">Renderer pending</span>
      </header>

      <div className="workbench-grid">
        <aside className="library-panel" aria-labelledby="library-heading">
          <div className="panel-heading"><p className="section-kicker">GRAPH TOOLS</p><h2 id="library-heading">Nodes</h2></div>
          <label className="search-label" htmlFor="node-search">Search nodes</label>
          <input id="node-search" ref={searchRef} className="node-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or purpose" />
          <p className="panel-note">Test nodes only. No Shader code is generated.</p>
          <ul className="library-list">
            {definitions.map((definition) => {
              const rootExists = document.graph.nodes.some((node) => node.type === definition.type);
              const isRoot = definition.type === 'foundation.output';
              return <li key={definition.type}><button type="button" onClick={() => addNode(definition.type)} disabled={isRoot && rootExists} title={definition.description}><span className="library-category">{definition.category}</span><strong>{definition.label}</strong></button></li>;
            })}
          </ul>
          {definitions.length === 0 && <p className="panel-note" role="status">No matching nodes.</p>}
          {pendingFrom && <p className="pending-help" role="status">Choose a compatible input port. Press Esc to cancel.</p>}
        </aside>

        <section className="graph-panel" aria-labelledby="graph-heading">
          <div className="graph-toolbar">
            <div><p className="section-kicker">SOURCE GRAPH</p><h1 id="graph-heading">Node canvas</h1></div>
            <div className="canvas-tools">
              <span className="canvas-count">{document.graph.nodes.length} nodes</span>
              <button type="button" onClick={() => changeZoom(.8)} aria-label="Zoom out">−</button>
              <span aria-label="Canvas zoom">{Math.round(document.layout.viewport.zoom * 100)}%</span>
              <button type="button" onClick={() => changeZoom(1.25)} aria-label="Zoom in">+</button>
              <button type="button" onClick={() => setViewport({ x: 0, y: 0, zoom: 1 })}>Reset view</button>
            </div>
          </div>
          <GraphCanvas document={document} pendingFrom={pendingFrom} onPendingFrom={setPendingFrom} onSelect={setSelection} onMove={(positions) => { dispatch({ type: 'move-nodes', positions }); }} onConnect={connect} onDisconnect={(edgeId) => { dispatch({ type: 'disconnect', edgeId }); }} onViewport={setViewport} onSearch={() => searchRef.current?.focus()} />
          {actionIssue && <div className="canvas-feedback" role="alert">Connection or edit rejected: {actionIssue.message}</div>}
        </section>

        <aside className="context-panel" aria-label="Preview and inspector">
          <section className="preview-panel" aria-labelledby="preview-heading">
            <div className="panel-heading"><p className="section-kicker">TARGET STATUS</p><h2 id="preview-heading">Preview</h2></div>
            <div className="preview-unconfigured" role="status"><span className="preview-mark" aria-hidden="true">◇</span><strong>Renderer not configured</strong><p>The first effect host and web renderer are still to be chosen. This area will run generated output in a later phase.</p></div>
          </section>
          <Inspector graph={document.graph} selectedNodeId={selectedId} dispatch={dispatch} onDelete={() => { dispatch({ type: 'delete-nodes', nodeIds: document.layout.selectedNodeIds }); }} />
        </aside>
      </div>

      <ProblemsPanel issues={issues} expanded={problemsOpen} onToggle={() => setProblemsOpen(!problemsOpen)} onFocus={focusIssue} actionIssue={actionIssue} />
    </main>
  );
}
