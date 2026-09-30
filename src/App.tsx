import { useState } from 'react';
import { ProjectStart } from './components/ProjectStart';
import { RecoveryChoice } from './components/RecoveryChoice';
import { WorkspaceShell } from './components/WorkspaceShell';
import { deriveExample } from './examples/catalog';
import { createProject, serializeProject, type ProjectFile } from './graph/project';
import { FILTER_GRAPH_KIND, FOUNDATION_GRAPH_KIND } from './graph/registry';
import { chooseOpenHandle, readRecoveryDraft, readRecoveryDrafts, readProjectFile, type DraftProject, type ProjectFileHandle } from './storage/projectStorage';

interface ActiveSession {
  project: ProjectFile;
  fileHandle?: ProjectFileHandle;
  savedJson?: string;
  source: 'new' | 'draft' | 'file';
}

export function App() {
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [sessionToken, setSessionToken] = useState(0);
  const [draftRead, setDraftRead] = useState(() => readRecoveryDrafts());
  const [entryError, setEntryError] = useState<string | null>(null);
  const [recoveryReadWarning, setRecoveryReadWarning] = useState<string | null>(draftRead.error);
  const [recoveryWriteWarning, setRecoveryWriteWarning] = useState<string | null>(null);
  const [choice, setChoice] = useState<{ file: ActiveSession; draft: DraftProject; origin: 'entry' | 'editor' } | null>(null);

  function activate(next: ActiveSession) {
    setSession(next);
    setSessionToken((value) => value + 1);
  }

  function createNewProject(graphKind: typeof FOUNDATION_GRAPH_KIND | typeof FILTER_GRAPH_KIND) {
    setEntryError(null);
    activate({ project: createProject(crypto.randomUUID(), graphKind === FILTER_GRAPH_KIND ? 'Untitled filter' : 'Untitled test graph', graphKind, crypto.randomUUID()), source: 'new' });
  }

  function createFromExample(exampleId: string) {
    try {
      const project = deriveExample(exampleId, crypto.randomUUID());
      setEntryError(null);
      activate({ project, source: 'new' });
    } catch (error) {
      setEntryError(error instanceof Error ? error.message : 'Could not open the example.');
    }
  }

  function openResolved(next: ActiveSession, origin: 'entry' | 'editor') {
    const { value: draft, error } = readRecoveryDraft(next.project.id);
    if (error) setRecoveryReadWarning(error);
    if (draft && draft.json !== serializeProject(next.project)) setChoice({ file: next, draft, origin });
    else activate(next);
  }

  function returnToEntry() {
    const result = readRecoveryDrafts();
    setDraftRead(result);
    setRecoveryReadWarning(result.error);
    setSession(null);
  }

  async function openFromPicker() {
    try {
      const handle = await chooseOpenHandle();
      const file = await handle.getFile();
      const result = await readProjectFile(file);
      if (!result.ok) { setEntryError(`${result.code}: ${result.message}`); return; }
      setEntryError(null);
      openResolved({ project: result.project, fileHandle: handle, savedJson: result.migratedFromVersion ? undefined : serializeProject(result.project), source: 'file' }, 'entry');
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
      openResolved({ project: result.project, savedJson: result.migratedFromVersion ? undefined : serializeProject(result.project), source: 'file' }, 'entry');
    } catch (error) {
      setEntryError(error instanceof Error ? error.message : 'Could not read the project file.');
    }
  }

  return <>
    {session && <div style={choice?.origin === 'editor' ? { display: 'none' } : undefined}><WorkspaceShell key={sessionToken} project={session.project} initialHandle={session.fileHandle} initialSavedJson={session.savedJson} source={session.source} suspended={choice?.origin === 'editor'} onOpenSession={(project, handle, migrated) => openResolved({ project, fileHandle: handle, savedJson: migrated ? undefined : serializeProject(project), source: 'file' }, 'editor')} onBack={returnToEntry} onRecoveryWarning={setRecoveryWriteWarning} /></div>}
    {choice ? <RecoveryChoice file={choice.file.project} draft={choice.draft} onChooseFile={() => { activate(choice.file); setChoice(null); }} onChooseDraft={() => { activate({ ...choice.file, project: choice.draft.project, source: 'draft' }); setChoice(null); }} onCancel={() => { if (choice.origin === 'entry') setSession(null); setChoice(null); }} /> : !session && <ProjectStart onCreate={createNewProject} onCreateFromExample={createFromExample} onOpen={openFromPicker} onImport={importFile} onRecover={(draft) => activate({ project: draft.project, source: 'draft' })} drafts={draftRead.value} error={entryError} />}
    {(recoveryWriteWarning ?? recoveryReadWarning) && <div className="recovery-warning" role="status">{recoveryWriteWarning ?? recoveryReadWarning}<button type="button" onClick={() => { setRecoveryWriteWarning(null); setRecoveryReadWarning(null); }} aria-label="Dismiss recovery warning">×</button></div>}
  </>;
}
