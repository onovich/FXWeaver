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
  const [recoveryWarning, setRecoveryWarning] = useState<string | null>(null);
  const [choice, setChoice] = useState<{ file: ActiveSession; draft: DraftProject; origin: 'entry' | 'editor' } | null>(null);

  function activate(next: ActiveSession) {
    setSession(next);
    setSessionToken((value) => value + 1);
  }

  function createNewProject() {
    setEntryError(null);
    activate({ project: createProject(crypto.randomUUID(), 'Untitled test graph', FOUNDATION_GRAPH_KIND, crypto.randomUUID()), source: 'new' });
  }

  function openResolved(next: ActiveSession, origin: 'entry' | 'editor') {
    const draft = loadRecoveryDraft(next.project.id);
    if (draft && draft.json !== serializeProject(next.project)) setChoice({ file: next, draft, origin });
    else activate(next);
  }

  async function openFromPicker() {
    try {
      const handle = await chooseOpenHandle();
      const file = await handle.getFile();
      const result = await readProjectFile(file);
      if (!result.ok) { setEntryError(`${result.code}: ${result.message}`); return; }
      setEntryError(null);
      openResolved({ project: result.project, fileHandle: handle, savedJson: serializeProject(result.project), source: 'file' }, 'entry');
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
      openResolved({ project: result.project, savedJson: serializeProject(result.project), source: 'file' }, 'entry');
    } catch (error) {
      setEntryError(error instanceof Error ? error.message : 'Could not read the project file.');
    }
  }

  return <>
    {session && <div style={choice?.origin === 'editor' ? { display: 'none' } : undefined}><WorkspaceShell key={sessionToken} project={session.project} initialHandle={session.fileHandle} initialSavedJson={session.savedJson} source={session.source} suspended={choice?.origin === 'editor'} onOpenSession={(project, handle) => openResolved({ project, fileHandle: handle, savedJson: serializeProject(project), source: 'file' }, 'editor')} onBack={() => { setSession(null); setDrafts(listRecoveryDrafts()); }} onRecoveryWarning={setRecoveryWarning} /></div>}
    {choice ? <RecoveryChoice file={choice.file.project} draft={choice.draft} onChooseFile={() => { activate(choice.file); setChoice(null); }} onChooseDraft={() => { activate({ ...choice.file, project: choice.draft.project, source: 'draft' }); setChoice(null); }} onCancel={() => { if (choice.origin === 'entry') setSession(null); setChoice(null); }} /> : !session && <ProjectStart onCreate={createNewProject} onOpen={openFromPicker} onImport={importFile} onRecover={(draft) => activate({ project: draft.project, source: 'draft' })} drafts={drafts} error={entryError} />}
    {recoveryWarning && <div className="recovery-warning" role="status">{recoveryWarning}<button type="button" onClick={() => setRecoveryWarning(null)} aria-label="Dismiss recovery warning">×</button></div>}
  </>;
}
