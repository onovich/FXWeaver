import { useState } from 'react';
import { ProjectStart } from './components/ProjectStart';
import { RecoveryChoice } from './components/RecoveryChoice';
import { WorkspaceShell } from './components/WorkspaceShell';
import { createProject, serializeProject, type ProjectFile } from './graph/project';
import { FOUNDATION_GRAPH_KIND } from './graph/registry';
import { chooseOpenHandle, listRecoveryDrafts, loadRecoveryDraft, readProjectFile, type DraftProject, type ProjectFileHandle } from './storage/projectStorage';

interface ActiveSession {
  project: ProjectFile;
  fileHandle?: ProjectFileHandle;
  savedJson?: string;
  source: 'new' | 'draft' | 'file';
}

export function App() {
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [sessionToken, setSessionToken] = useState(0);
  const [drafts, setDrafts] = useState(() => listRecoveryDrafts());
  const [entryError, setEntryError] = useState<string | null>(null);
  const [choice, setChoice] = useState<{ file: ActiveSession; draft: DraftProject } | null>(null);

  function activate(next: ActiveSession) {
    setSession(next);
    setSessionToken((value) => value + 1);
  }

  function createNewProject() {
    setEntryError(null);
    activate({ project: createProject(crypto.randomUUID(), 'Untitled test graph', FOUNDATION_GRAPH_KIND, crypto.randomUUID()), source: 'new' });
  }

  function openResolved(next: ActiveSession) {
    const draft = loadRecoveryDraft(next.project.id);
    if (draft && draft.json !== serializeProject(next.project)) { setSession(null); setChoice({ file: next, draft }); }
    else activate(next);
  }

  async function openFromPicker() {
    try {
      const handle = await chooseOpenHandle();
      const file = await handle.getFile();
      const result = await readProjectFile(file);
      if (!result.ok) { setEntryError(`${result.code}: ${result.message}`); return; }
      setEntryError(null);
      openResolved({ project: result.project, fileHandle: handle, savedJson: serializeProject(result.project), source: 'file' });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setEntryError(error instanceof Error ? error.message : 'Could not open the project file.');
    }
  }

  async function importFile(file: File) {
    try {
      const result = await readProjectFile(file);
      if (!result.ok) { setEntryError(`${result.code}: ${result.message}`); return; }
      setEntryError(null);
      openResolved({ project: result.project, savedJson: serializeProject(result.project), source: 'file' });
    } catch (error) {
      setEntryError(error instanceof Error ? error.message : 'Could not read the project file.');
    }
  }

  return session ? (
    <WorkspaceShell key={sessionToken} project={session.project} initialHandle={session.fileHandle} initialSavedJson={session.savedJson} source={session.source} onOpenSession={(project, handle) => openResolved({ project, fileHandle: handle, savedJson: serializeProject(project), source: 'file' })} onBack={() => { setSession(null); setDrafts(listRecoveryDrafts()); }} />
  ) : choice ? (
    <RecoveryChoice file={choice.file.project} draft={choice.draft} onChooseFile={() => { activate(choice.file); setChoice(null); }} onChooseDraft={() => { activate({ ...choice.file, project: choice.draft.project, source: 'draft' }); setChoice(null); }} onCancel={() => setChoice(null)} />
  ) : (
    <ProjectStart onCreate={createNewProject} onOpen={openFromPicker} onImport={importFile} onRecover={(draft) => activate({ project: draft.project, source: 'draft' })} drafts={drafts} error={entryError} />
  );
}
