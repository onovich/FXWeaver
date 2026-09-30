interface Props { onCreate: () => void }

export function ProjectStart({ onCreate }: Props) {
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
        <p className="entry-caveat">Editor infrastructure only. No Shader is generated and no live effect preview is available in this phase.</p>
      </div>
    </main>
  );
}
