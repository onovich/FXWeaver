import { useState } from 'react';
import { ProjectStart } from './components/ProjectStart';
import { WorkspaceShell } from './components/WorkspaceShell';
import { createProject, type ProjectFile } from './graph/project';
import { FOUNDATION_GRAPH_KIND } from './graph/registry';

export function App() {
  const [project, setProject] = useState<ProjectFile | null>(null);

  function createNewProject() {
    setProject(createProject(crypto.randomUUID(), 'Untitled test graph', FOUNDATION_GRAPH_KIND, crypto.randomUUID()));
  }

  return project ? (
    <WorkspaceShell project={project} onBack={() => setProject(null)} />
  ) : (
    <ProjectStart onCreate={createNewProject} />
  );
}
