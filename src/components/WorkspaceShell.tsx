import { getNodeDefinition, listNodeDefinitions } from '../graph/registry';
import type { ProjectFile } from '../graph/project';
import { validateGraph } from '../graph/validation';

interface Props { project: ProjectFile; onBack: () => void }

export function WorkspaceShell({ project, onBack }: Props) {
  const issues = validateGraph(project.graph);
  const definitions = listNodeDefinitions(project.graph.graphKind);

  return (
    <main className="workbench">
      <header className="workbench-header">
        <button className="brand-button" type="button" onClick={onBack} aria-label="Return to project entry">FXWeave</button>
        <div className="header-divider" aria-hidden="true" />
        <div className="project-heading">
          <strong>{project.name}</strong>
          <span>Foundation test graph</span>
        </div>
        <div className="header-spacer" />
        <span className="file-state">Draft only · Not saved to file</span>
        <span className="phase-chip">Renderer pending</span>
      </header>

      <div className="workbench-grid">
        <aside className="library-panel" aria-labelledby="library-heading">
          <div className="panel-heading">
            <p className="section-kicker">GRAPH TOOLS</p>
            <h2 id="library-heading">Nodes</h2>
          </div>
          <p className="panel-note">Test definitions for editor validation. They do not create Shader code.</p>
          <ul className="library-list">
            {definitions.map((definition) => (
              <li key={definition.type}>
                <span className="library-category">{definition.category}</span>
                <strong>{definition.label}</strong>
              </li>
            ))}
          </ul>
        </aside>

        <section className="graph-panel" aria-labelledby="graph-heading">
          <div className="graph-toolbar">
            <div>
              <p className="section-kicker">SOURCE GRAPH</p>
              <h1 id="graph-heading">Node canvas</h1>
            </div>
            <span className="canvas-count">{project.graph.nodes.length} node{project.graph.nodes.length === 1 ? '' : 's'}</span>
          </div>
          <div className="graph-canvas" aria-label="Node graph canvas">
            {project.graph.nodes.map((node) => {
              const definition = getNodeDefinition(project.graph.graphKind, node.type);
              const position = project.layout.nodePositions[node.id] ?? { x: 0, y: 0 };
              return (
                <article className="canvas-node" key={node.id} style={{ left: position.x, top: position.y }}>
                  <div className="canvas-node-title">{definition?.label ?? node.type}</div>
                  <div className="canvas-node-body">
                    {definition?.inputs.map((port) => <span className="port-line" key={port.id}><i className={`port-dot port-${port.type}`} />{port.label}<small>{port.type}</small></span>)}
                    {definition?.outputs.map((port) => <span className="port-line output-port" key={port.id}>{port.label}<small>{port.type}</small><i className={`port-dot port-${port.type}`} /></span>)}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="context-panel" aria-label="Preview and inspector">
          <section className="preview-panel" aria-labelledby="preview-heading">
            <div className="panel-heading"><p className="section-kicker">TARGET STATUS</p><h2 id="preview-heading">Preview</h2></div>
            <div className="preview-unconfigured" role="status">
              <span className="preview-mark" aria-hidden="true">◇</span>
              <strong>Renderer not configured</strong>
              <p>The first effect host and web renderer are still to be chosen. This area will run generated output in a later phase.</p>
            </div>
          </section>
          <section className="inspector-panel" aria-labelledby="inspector-heading">
            <div className="panel-heading"><p className="section-kicker">SELECTION</p><h2 id="inspector-heading">Inspector</h2></div>
            <p className="panel-note">Select a node to inspect its properties. Editing arrives with canvas interactions.</p>
          </section>
        </aside>
      </div>

      <section className="problem-bar" aria-label="Graph problems">
        <strong>Problems {issues.length}</strong>
        <span>{issues[0]?.message ?? 'No graph issues found.'}</span>
        <span className="problem-context">Test graph · No build</span>
      </section>
    </main>
  );
}
