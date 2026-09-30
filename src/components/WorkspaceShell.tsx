import { useEffect, useRef, useState } from 'react';
import { GraphCanvas } from './GraphCanvas';
import { Inspector } from './Inspector';
import { ProblemsPanel } from './ProblemsPanel';
import { FilterPreview } from './FilterPreview';
import { DependencyAssets } from './DependencyAssets';
import { findAssetIssues } from '../graph/assets';
import type { GraphCommand } from '../graph/commands';
import { applyHistoryCommand, createHistory, redo, undo } from '../graph/history';
import { getGraphKind, listNodeDefinitions } from '../graph/registry';
import { serializeProject, withEditorDocument, type ProjectFile } from '../graph/project';
import type { GraphIssue } from '../graph/diagnostics';
import type { GraphPortRef } from '../graph/schema';
import { validateGraph } from '../graph/validation';
import { chooseOpenHandle, chooseSaveHandle, downloadProject, hasFilePicker, readProjectFile, saveRecoveryDraft, writeProjectFile, type ProjectFileHandle } from '../storage/projectStorage';

interface Props { project: ProjectFile; initialHandle?: ProjectFileHandle; initialSavedJson?: string; source: 'new' | 'draft' | 'file'; suspended: boolean; onOpenSession: (project: ProjectFile, handle?: ProjectFileHandle, migrated?: boolean) => void; onBack: () => void; onRecoveryWarning: (warning: string | null) => void }

export function WorkspaceShell({ project, initialHandle, initialSavedJson, source, suspended, onOpenSession, onBack, onRecoveryWarning }: Props) {
  const [history, setHistory] = useState(() => createHistory({ graph: project.graph, layout: project.layout }));
  const [pendingFrom, setPendingFrom] = useState<GraphPortRef | null>(null);
  const [actionIssue, setActionIssue] = useState<GraphIssue | null>(null);
  const [search, setSearch] = useState('');
  const [problemsOpen, setProblemsOpen] = useState(false);
  const [fitRequest, setFitRequest] = useState(0);
  const [beforeFitViewport, setBeforeFitViewport] = useState<typeof project.layout.viewport | null>(null);
  const [fileHandle, setFileHandle] = useState<ProjectFileHandle | null>(initialHandle ?? null);
  const [lastSavedJson, setLastSavedJson] = useState<string | null>(initialSavedJson ?? null);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [previewScene, setPreviewScene] = useState(project.preview);
  const [projectAssets, setProjectAssets] = useState(project.assets);
  const searchRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const document = history.present;
  const graphKind = getGraphKind(document.graph.graphKind)!;
  const activeParameters = new Map(document.graph.parameters.map((parameter) => [parameter.id, parameter]));
  const activeParameterValues = Object.fromEntries(Object.entries(previewScene.parameterValues).filter(([id, value]) => {
    const parameter = activeParameters.get(id);
    return parameter && (typeof value !== 'number' ||
      (parameter.min === undefined || value >= parameter.min) && (parameter.max === undefined || value <= parameter.max));
  }));
  const safePreviewScene = Object.keys(activeParameterValues).length === Object.keys(previewScene.parameterValues).length
    ? previewScene : { ...previewScene, parameterValues: activeParameterValues };
  const currentProject = { ...withEditorDocument(project, document), assets: projectAssets, preview: safePreviewScene };
  const currentProjectRef = useRef(currentProject);
  currentProjectRef.current = currentProject;
  const currentJson = serializeProject(currentProject);
  const issues = validateGraph(document.graph);
  const assetIssues = findAssetIssues(document.graph, currentProject.assets, currentProject.preview);
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
    const index = Math.max(0, document.graph.nodes.length - 1);
    const position = { x: 64 + (index % 2) * 228, y: 100 + Math.floor(index / 2) * 180 };
    if (dispatch({ type: 'add-node', nodeId, nodeType, position })) {
      setSelection([nodeId]);
      setSearch('');
    }
  }

  function connect(from: GraphPortRef, to: GraphPortRef) {
    if (dispatch({ type: 'connect', edgeId: crypto.randomUUID(), from, to, replaceExisting: true })) setPendingFrom(null);
  }

  function changeZoom(factor: number) {
    setViewport({ ...document.layout.viewport, zoom: Math.min(2, Math.max(.01, document.layout.viewport.zoom * factor)) });
  }

  function fitAllNodes() {
    setBeforeFitViewport(document.layout.viewport);
    setFitRequest((value) => value + 1);
  }

  function focusIssue(issue: GraphIssue) {
    if (!issue.nodeId) return;
    const position = document.layout.nodePositions[issue.nodeId];
    setSelection([issue.nodeId]);
    if (position) setViewport({ ...document.layout.viewport, x: 110 - position.x * document.layout.viewport.zoom, y: 110 - position.y * document.layout.viewport.zoom });
  }

  function preserveRecoveryDraft(snapshot: ProjectFile) {
    try {
      setDraftSavedAt(saveRecoveryDraft(snapshot).savedAt);
      onRecoveryWarning(null);
    } catch (error) {
      onRecoveryWarning(`Recovery draft unavailable: ${error instanceof Error ? error.message : 'Unknown error'}. Save or export a project file to keep this work.`);
    }
  }

  async function saveToFile(saveAs = false) {
    try {
      const snapshot = currentProjectRef.current;
      preserveRecoveryDraft(snapshot);
      let handle = saveAs ? null : fileHandle;
      if (!handle) {
        if (!hasFilePicker()) {
          downloadProject(snapshot);
          setSaveNotice('Project JSON downloaded. No working file is linked; future edits still need export.');
          return;
        }
        handle = await chooseSaveHandle(snapshot);
      }
      const json = await writeProjectFile(handle, snapshot);
      setFileHandle(handle);
      setLastSavedJson(json);
      setSaveNotice(`Saved to ${handle.name}.`);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') setSaveNotice('Save cancelled. Current editor remains open.');
      else setSaveNotice(`Save failed: ${error instanceof Error ? error.message : 'Unknown error'}. The project file was not updated.`);
    }
  }

  function returnToEntry() {
    window.setTimeout(() => {
      preserveRecoveryDraft(currentProjectRef.current);
      onBack();
    }, 0);
  }

  async function openProjectFromPicker() {
    try {
      preserveRecoveryDraft(currentProjectRef.current);
      const handle = await chooseOpenHandle();
      const result = await readProjectFile(await handle.getFile());
      if (!result.ok) { setSaveNotice(`Open blocked: ${result.code}: ${result.message} Current project unchanged.`); return; }
      onOpenSession(result.project, handle, !!result.migratedFromVersion);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setSaveNotice(`Open failed: ${error instanceof Error ? error.message : 'Unknown error'}. Current project unchanged.`);
    }
  }

  async function importProjectFile(file: File) {
    try {
      preserveRecoveryDraft(currentProjectRef.current);
      const result = await readProjectFile(file);
      if (!result.ok) { setSaveNotice(`Import blocked: ${result.code}: ${result.message} Current project unchanged.`); return; }
      onOpenSession(result.project, undefined, !!result.migratedFromVersion);
    } catch (error) {
      setSaveNotice(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}. Current project unchanged.`);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      preserveRecoveryDraft(currentProject);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [currentJson]);

  useEffect(() => {
    if (suspended) return;
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (target instanceof HTMLElement && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable)) {
          target.blur();
          window.setTimeout(() => { void saveToFile(); }, 0);
        } else void saveToFile();
        return;
      }
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || (target instanceof HTMLElement && target.isContentEditable)) return;
      if (window.document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      if (event.key.toLowerCase() === 'f' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault(); fitAllNodes();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
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
        <button className="brand-button" type="button" onClick={returnToEntry} aria-label="Return to project entry">FXWeave</button>
        <div className="header-divider" aria-hidden="true" />
        <div className="project-heading"><strong>{project.name}</strong><span>{graphKind.label}</span></div>
        <div className="header-spacer" />
        <span className="file-state">{fileHandle ? lastSavedJson === currentJson ? `Saved to project · ${fileHandle.name}` : 'Changes not saved to project file' : source === 'file' ? 'Opened from file · Save As required' : draftSavedAt ? 'Recovery draft saved · no project file' : 'Draft only · Not saved to file'}</span>
        <button className="header-tool" type="button" disabled={history.past.length === 0} onClick={() => setHistory(undo(history))}>Undo</button>
        <button className="header-tool" type="button" disabled={history.future.length === 0} onClick={() => setHistory(redo(history))}>Redo</button>
        <button className="header-tool" type="button" onClick={() => void saveToFile()}>Save</button>
        <button className="header-tool" type="button" onClick={() => void saveToFile(true)}>Save As</button>
        <button className="header-tool" type="button" onClick={() => { downloadProject(currentProject); setSaveNotice('Project JSON downloaded; this is a separate copy.'); }}>Export JSON</button>
        <span className="phase-chip">{project.rendererTarget ?? 'Renderer pending'}</span>
      </header>
      {saveNotice && <div className="save-notice" role="status">{saveNotice}<button type="button" onClick={() => setSaveNotice(null)} aria-label="Dismiss save notice">×</button></div>}

      <div className="workbench-grid">
        <aside className="library-panel" aria-labelledby="library-heading">
          <div className="panel-heading"><p className="section-kicker">GRAPH TOOLS</p><h2 id="library-heading">Nodes</h2></div>
          <label className="search-label" htmlFor="node-search">Search nodes</label>
          <input id="node-search" ref={searchRef} className="node-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or purpose" />
          <p className="panel-note">{graphKind.isTestOnly ? 'Test nodes only. No Shader code is generated.' : 'Filter graph nodes generate the live WebGL2 preview.'}</p>
          <ul className="library-list">
            {definitions.map((definition) => {
              const rootExists = document.graph.nodes.some((node) => node.type === definition.type);
              const isRoot = definition.type === graphKind.rootNodeType;
              return <li key={definition.type}><button type="button" onClick={() => addNode(definition.type)} disabled={isRoot && rootExists} title={definition.description}><span className="library-category">{definition.category}</span><strong>{definition.label}</strong></button></li>;
            })}
          </ul>
          {definitions.length === 0 && <p className="panel-note" role="status">No matching nodes.</p>}
          {pendingFrom && <p className="pending-help" role="status">Choose a compatible input port. Press Esc to cancel.</p>}
          {!graphKind.isTestOnly && <DependencyAssets graph={document.graph} assets={projectAssets} onAssetsChange={setProjectAssets} />}
          <div className="library-file-actions">
            <p className="section-kicker">PROJECT FILE</p>
            <button className="secondary-button" type="button" onClick={() => void openProjectFromPicker()}>Open project file</button>
            <button className="secondary-button" type="button" onClick={() => importRef.current?.click()}>Import JSON</button>
            <input ref={importRef} type="file" accept=".json,application/json" className="visually-hidden" aria-label="Import project JSON" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importProjectFile(file); event.target.value = ''; }} />
          </div>
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
              <button type="button" onClick={fitAllNodes} aria-keyshortcuts="F" title="Fit all nodes (F)">Fit all nodes</button>
              {beforeFitViewport && <button type="button" onClick={() => { setViewport(beforeFitViewport); setBeforeFitViewport(null); }}>Restore view</button>}
            </div>
          </div>
          <GraphCanvas document={document} pendingFrom={pendingFrom} onPendingFrom={setPendingFrom} onSelect={setSelection} onMove={(positions) => { dispatch({ type: 'move-nodes', positions }); }} onConnect={connect} onDisconnect={(edgeId) => { dispatch({ type: 'disconnect', edgeId }); }} onViewport={setViewport} onSearch={() => searchRef.current?.focus()} fitRequest={fitRequest} />
          {actionIssue && <div className="canvas-feedback" role="alert">Connection or edit rejected: {actionIssue.message}</div>}
        </section>

        <aside className="context-panel" aria-label="Preview and inspector">
          {graphKind.isTestOnly ? <section className="preview-panel" aria-labelledby="preview-heading">
            <div className="panel-heading"><p className="section-kicker">TARGET STATUS</p><h2 id="preview-heading">Preview</h2></div>
            <div className="preview-unconfigured" role="status"><span className="preview-mark" aria-hidden="true">◇</span><strong>{assetIssues.length ? 'Missing project image' : graphKind.isTestOnly ? 'Renderer not configured' : 'Filter preview not yet available'}</strong><p>{assetIssues.length ? assetIssues.map((issue) => issue.message).join(' ') : graphKind.isTestOnly ? 'This foundation graph tests editing and has no Shader target.' : 'This graph targets PixiJS WebGL2. Generated output will appear here when the compiler is connected.'}</p></div>
          </section> : <FilterPreview graph={document.graph} assets={projectAssets} scene={safePreviewScene} onSceneChange={setPreviewScene} onAssetsChange={setProjectAssets} />}
          <Inspector graph={document.graph} assets={projectAssets} selectedNodeId={selectedId} dispatch={dispatch} onDelete={() => { dispatch({ type: 'delete-nodes', nodeIds: document.layout.selectedNodeIds }); }} />
        </aside>
      </div>

      <ProblemsPanel issues={issues} expanded={problemsOpen} onToggle={() => setProblemsOpen(!problemsOpen)} onFocus={focusIssue} actionIssue={actionIssue} />
    </main>
  );
}
