import { parseProject, serializeProject, type ProjectFile, type ProjectImportResult } from '../graph/project';

const DRAFT_PREFIX = 'fxweave:draft:v1:';

export interface ProjectFileHandle {
  name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<{ write(data: string): Promise<void>; close(): Promise<void> }>;
}

interface PickerWindow extends Window {
  showSaveFilePicker?: (options?: unknown) => Promise<ProjectFileHandle>;
  showOpenFilePicker?: (options?: unknown) => Promise<ProjectFileHandle[]>;
}

export interface DraftRecord {
  projectId: string;
  savedAt: number;
  json: string;
}

export interface DraftProject extends DraftRecord { project: ProjectFile }

function pickerWindow(): PickerWindow { return window as PickerWindow; }

export function hasFilePicker(): boolean {
  return typeof pickerWindow().showSaveFilePicker === 'function' && typeof pickerWindow().showOpenFilePicker === 'function';
}

export function projectFilename(project: ProjectFile): string {
  const stem = project.name.trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/\.+$/, '') || 'FXWeave-project';
  return `${stem}.fxweave.json`;
}

export async function chooseSaveHandle(project: ProjectFile): Promise<ProjectFileHandle> {
  const picker = pickerWindow().showSaveFilePicker;
  if (!picker) throw new Error('Direct file saving is unavailable in this browser.');
  return picker.call(window, { suggestedName: projectFilename(project), types: [{ description: 'FXWeave project', accept: { 'application/json': ['.json'] } }] });
}

export async function chooseOpenHandle(): Promise<ProjectFileHandle> {
  const picker = pickerWindow().showOpenFilePicker;
  if (!picker) throw new Error('Direct file opening is unavailable in this browser.');
  const [handle] = await picker.call(window, { multiple: false, types: [{ description: 'FXWeave project', accept: { 'application/json': ['.json'] } }] });
  if (!handle) throw new Error('No project file was selected.');
  return handle;
}

export async function writeProjectFile(handle: ProjectFileHandle, project: ProjectFile): Promise<string> {
  const json = serializeProject(project);
  const writer = await handle.createWritable();
  await writer.write(json);
  await writer.close();
  return json;
}

export async function readProjectFile(file: File): Promise<ProjectImportResult> {
  return parseProject(await file.text());
}

export function downloadProject(project: ProjectFile): void {
  const url = URL.createObjectURL(new Blob([serializeProject(project)], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = projectFilename(project);
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function saveRecoveryDraft(project: ProjectFile): DraftRecord {
  const record = { projectId: project.id, savedAt: Date.now(), json: serializeProject(project) };
  localStorage.setItem(`${DRAFT_PREFIX}${project.id}`, JSON.stringify(record));
  return record;
}

export function loadRecoveryDraft(projectId: string): DraftProject | null {
  const raw = localStorage.getItem(`${DRAFT_PREFIX}${projectId}`);
  if (!raw) return null;
  try {
    const record = JSON.parse(raw) as DraftRecord;
    if (record.projectId !== projectId || !Number.isFinite(record.savedAt) || typeof record.json !== 'string') return null;
    const parsed = parseProject(record.json);
    return parsed.ok ? { ...record, project: parsed.project } : null;
  } catch { return null; }
}

export function listRecoveryDrafts(): DraftProject[] {
  const drafts: DraftProject[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key?.startsWith(DRAFT_PREFIX)) continue;
    const draft = loadRecoveryDraft(key.slice(DRAFT_PREFIX.length));
    if (draft) drafts.push(draft);
  }
  return drafts.sort((a, b) => b.savedAt - a.savedAt);
}
