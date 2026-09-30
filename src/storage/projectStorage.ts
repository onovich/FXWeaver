import { canonicalJsonValue } from '../graph/schema';
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
export interface RecoveryDraftRead<T> { value: T; error: string | null }

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

// Keep binary-heavy portable projects out of localStorage's small synchronous quota.
// Legacy records remain intact; reads merge them with the newer IndexedDB store.
const DB_NAME = 'fxweave-recovery';
const STORE_NAME = 'drafts';
const NAVIGATION_STORE = 'navigation-drafts';
const writeQueues = new Map<string, Promise<unknown>>();
let recoveryDatabase: IDBDatabase | null = null;

function openRecoveryDatabase(): Promise<IDBDatabase> {
  if (recoveryDatabase) return Promise.resolve(recoveryDatabase);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    let blocked = false;
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: 'projectId' });
      if (!request.result.objectStoreNames.contains(NAVIGATION_STORE)) request.result.createObjectStore(NAVIGATION_STORE, { keyPath: ['projectId', 'savedAt'] });
    };
    request.onsuccess = () => {
      if (blocked) { request.result.close(); return; }
      recoveryDatabase = request.result;
      request.result.onversionchange = () => { request.result.close(); if (recoveryDatabase === request.result) recoveryDatabase = null; };
      resolve(request.result);
    };
    request.onerror = () => reject(request.error ?? new Error('Recovery database could not be opened'));
    request.onblocked = () => { blocked = true; reject(new Error('Recovery database is blocked by another browser tab')); };
  });
}

async function databaseOperation<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>, storeName = STORE_NAME): Promise<T> {
  const database = recoveryDatabase ?? await openRecoveryDatabase();
  return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(storeName, mode);
      const request = action(transaction.objectStore(storeName));
      // A successful request is not sufficient: disk/quota failures can abort commit.
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = transaction.onabort = () => reject(transaction.error ?? request.error ?? new Error('Recovery transaction failed'));
  });
}

async function migrateLegacyDraft(record: DraftRecord, rejectStaleWrite = false): Promise<void> {
  const database = recoveryDatabase ?? await openRecoveryDatabase();
  await new Promise<void>((resolve, reject) => {
    // Include navigation snapshots in the atomic version check. A departing tab
    // appends its final snapshot without overwriting another tab's newer version.
    const transaction = database.transaction([STORE_NAME, NAVIGATION_STORE], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const navigation = transaction.objectStore(NAVIGATION_STORE);
    const range = IDBKeyRange.bound([record.projectId, 0], [record.projectId, Infinity]);
    const main = store.get(record.projectId);
    const snapshots = navigation.getAll(range);
    snapshots.onsuccess = () => {
      const candidates = [main.result, ...snapshots.result].filter(Boolean) as DraftRecord[];
      const existing = candidates.sort((a, b) => b.savedAt - a.savedAt)[0];
      if (rejectStaleWrite && existing && existing.savedAt > record.savedAt && existing.json !== record.json) {
        transaction.abort();
        reject(new Error('A newer recovery draft exists in another tab. Save a project file to preserve this version.'));
        return;
      }
      if (!existing || existing.savedAt < record.savedAt || rejectStaleWrite && existing.savedAt === record.savedAt) {
        store.put(record);
        // Only delete versions represented by this successfully committed record.
        navigation.delete(IDBKeyRange.bound([record.projectId, 0], [record.projectId, record.savedAt]));
      }
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = transaction.onabort = () => reject(transaction.error ?? new Error('Recovery transaction failed'));
  });
}

const latestWrites = new Map<string, DraftRecord>();

const snapshotRecords = new Map<string, DraftRecord>();

function recoveryRecord(project: ProjectFile): DraftRecord {
  const json = serializeProject(project);
  const previous = snapshotRecords.get(project.id);
  if (previous?.json === json) return previous;
  const record = { projectId: project.id, savedAt: Math.max(Date.now(), (previous?.savedAt ?? 0) + 1), json };
  snapshotRecords.set(project.id, record);
  return record;
}

const JOURNAL_PREFIX = 'fxweave:navigation:v1:';
const failedWrites = new Map<string, number>();

const assetSignatures = new WeakMap<ProjectFile['assets'], string>();

function assetSignature(project: ProjectFile): string {
  const cached = assetSignatures.get(project.assets);
  if (cached) return cached;
  const text = JSON.stringify(canonicalJsonValue({ dependencies: [...project.assets.dependencies].sort((a, b) => a.id.localeCompare(b.id)), preview: [...project.assets.preview].sort((a, b) => a.id.localeCompare(b.id)) }));
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  const signature = `${text.length}:${hash >>> 0}`;
  assetSignatures.set(project.assets, signature);
  return signature;
}

function writeNavigationJournal(project: ProjectFile, record: DraftRecord): void {
  try {
    if (typeof sessionStorage === 'undefined' || failedWrites.get(project.id) === record.savedAt) return;
    // Separate per-tab synchronous quota: never duplicate embedded image bytes.
    // This journal can restore the last edit after navigation aborts a large IDB
    // transaction, provided the matching assets were already committed.
    const { assets: _assets, ...document } = project;
    sessionStorage.setItem(`${JOURNAL_PREFIX}${project.id}`, JSON.stringify({ savedAt: record.savedAt, document, assetSignature: assetSignature(project) }));
  } catch { /* IndexedDB remains authoritative when the optional journal is unavailable. */ }
}

function applyNavigationJournals(drafts: Map<string, DraftProject>): void {
  try {
    if (typeof sessionStorage === 'undefined') return;
    for (let index = 0; index < sessionStorage.length; index++) {
      const key = sessionStorage.key(index);
      if (!key?.startsWith(JOURNAL_PREFIX)) continue;
      try {
        const journal = JSON.parse(sessionStorage.getItem(key)!);
        const projectId = key.slice(JOURNAL_PREFIX.length);
        const base = drafts.get(projectId);
        if (!base || !Number.isFinite(journal.savedAt) || journal.savedAt < base.savedAt || journal.document.id !== projectId || journal.assetSignature !== assetSignature(base.project)) continue;
        const json = serializeProject({ ...journal.document, assets: base.project.assets });
        const recovered = parseRecoveryDraft(JSON.stringify({ projectId, savedAt: journal.savedAt, json }), projectId);
        if (recovered) drafts.set(projectId, recovered);
      } catch { /* Ignore malformed journals without changing the committed draft. */ }
    }
  } catch { /* Browsers can disable session storage independently of IndexedDB. */ }
}

export async function saveRecoveryDraft(project: ProjectFile): Promise<DraftRecord> {
  const record = recoveryRecord(project);
  latestWrites.set(project.id, record);
  let pending = writeQueues.get(project.id) as Promise<DraftRecord> | undefined;
  if (!pending) {
    pending = Promise.resolve().then(async () => {
      let committed: DraftRecord;
      do {
        committed = latestWrites.get(project.id)!;
        if (typeof indexedDB === 'undefined') localStorage.setItem(`${DRAFT_PREFIX}${project.id}`, JSON.stringify(committed));
        else await migrateLegacyDraft(committed, true);
        // While a transaction commits, replace intermediate scroll/drag snapshots
        // with the latest one. Flush callers still await that latest commit.
      } while (latestWrites.get(project.id) !== committed);
      failedWrites.delete(project.id);
      return committed;
    }).catch((error) => {
      const failed = latestWrites.get(project.id);
      if (failed) failedWrites.set(project.id, failed.savedAt);
      try { sessionStorage.removeItem(`${JOURNAL_PREFIX}${project.id}`); } catch { /* Optional journal may be disabled. */ }
      throw error;
    }).finally(() => {
      if (writeQueues.get(project.id) === pending) { writeQueues.delete(project.id); latestWrites.delete(project.id); }
    });
    writeQueues.set(project.id, pending);
  }
  return pending;
}

/** Start the final transaction synchronously during pagehide when a connection
 * is ready. Browser termination cannot promise completion, so portable files
 * remain the durable user-controlled backup. */
export async function flushRecoveryDraft(project: ProjectFile): Promise<void> {
  const record = recoveryRecord(project);
  writeNavigationJournal(project, record);
  if (latestWrites.has(project.id)) latestWrites.set(project.id, record);
  if (typeof indexedDB === 'undefined') localStorage.setItem(`${DRAFT_PREFIX}${project.id}`, JSON.stringify(record));
  else await databaseOperation('readwrite', (store) => store.put(record), NAVIGATION_STORE);
}

function parseRecoveryDraft(raw: string | null, projectId: string): DraftProject | null {
  if (!raw) return null;
  try {
    const record = JSON.parse(raw) as DraftRecord;
    if (record.projectId !== projectId || !Number.isFinite(record.savedAt) || typeof record.json !== 'string') return null;
    const parsed = parseProject(record.json);
    return parsed.ok ? { ...record, project: parsed.project } : null;
  } catch { return null; }
}

function recoveryReadError(error: unknown): string {
  return `Recovery drafts unavailable: ${error instanceof Error ? error.message : 'Browser storage could not be read'}. Project files can still be opened and saved.`;
}

function readLegacyDrafts(): RecoveryDraftRead<DraftProject[]> {
  try {
    const drafts: DraftProject[] = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key?.startsWith(DRAFT_PREFIX)) continue;
      const draft = parseRecoveryDraft(localStorage.getItem(key), key.slice(DRAFT_PREFIX.length));
      if (draft) drafts.push(draft);
    }
    return { value: drafts, error: null };
  } catch (error) { return { value: [], error: recoveryReadError(error) }; }
}

export async function readRecoveryDrafts(): Promise<RecoveryDraftRead<DraftProject[]>> {
  await Promise.allSettled([...writeQueues.values()]);
  const legacy = readLegacyDrafts();
  const drafts = new Map(legacy.value.map((draft) => [draft.projectId, draft]));
  try {
    if (typeof indexedDB === 'undefined') return { ...legacy, value: legacy.value.sort((a, b) => b.savedAt - a.savedAt) };
    const records = [
      ...await databaseOperation<DraftRecord[]>('readonly', (store) => store.getAll()),
      ...await databaseOperation<DraftRecord[]>('readonly', (store) => store.getAll(), NAVIGATION_STORE),
    ];
    for (const record of records) {
      const draft = parseRecoveryDraft(JSON.stringify(record), record.projectId);
      if (draft && (!drafts.has(draft.projectId) || drafts.get(draft.projectId)!.savedAt <= draft.savedAt)) drafts.set(draft.projectId, draft);
    }
    // Preserve original timestamps and never delete legacy user data.
    for (const draft of legacy.value) {
      const existing = records.find((record) => record.projectId === draft.projectId);
      if (!existing || existing.savedAt < draft.savedAt) await migrateLegacyDraft({ projectId: draft.projectId, savedAt: draft.savedAt, json: draft.json });
    }
    applyNavigationJournals(drafts);
    for (const draft of drafts.values()) if (!snapshotRecords.has(draft.projectId)) snapshotRecords.set(draft.projectId, { projectId: draft.projectId, savedAt: draft.savedAt, json: draft.json });
    return { value: [...drafts.values()].sort((a, b) => b.savedAt - a.savedAt), error: legacy.error };
  } catch (error) { return { value: [...drafts.values()].sort((a, b) => b.savedAt - a.savedAt), error: recoveryReadError(error) }; }
}

export async function readRecoveryDraft(projectId: string): Promise<RecoveryDraftRead<DraftProject | null>> {
  const result = await readRecoveryDrafts();
  return { value: result.value.find((draft) => draft.projectId === projectId) ?? null, error: result.error };
}

export async function loadRecoveryDraft(projectId: string): Promise<DraftProject | null> {
  return (await readRecoveryDraft(projectId)).value;
}

export async function listRecoveryDrafts(): Promise<DraftProject[]> {
  return (await readRecoveryDrafts()).value;
}
