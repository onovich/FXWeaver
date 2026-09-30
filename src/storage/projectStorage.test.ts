import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createProject } from '../graph/project';
import { FILTER_GRAPH_KIND, FOUNDATION_GRAPH_KIND } from '../graph/registry';
import { listRecoveryDrafts, loadRecoveryDraft, projectFilename, readRecoveryDraft, readRecoveryDrafts, saveRecoveryDraft } from './projectStorage';

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() { return data.size; },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => { data.delete(key); },
    setItem: (key, value) => { data.set(key, value); },
  };
}

describe('browser recovery boundary', async () => {
  beforeEach(() => vi.stubGlobal('localStorage', memoryStorage()));
  afterEach(() => vi.unstubAllGlobals());

  it('keeps a recoverable project separate from portable file naming', async () => {
    const project = createProject('p-1', 'Test: draft?', FOUNDATION_GRAPH_KIND, 'root');
    expect(projectFilename(project)).toBe('Test- draft-.fxweave.json');
    const record = await saveRecoveryDraft(project);
    expect(record.projectId).toBe(project.id);
    expect((await loadRecoveryDraft(project.id))?.project).toEqual(project);
    expect((await listRecoveryDrafts()).map((draft) => draft.projectId)).toEqual(['p-1']);
  });

  it('recovers a versioned Filter draft with embedded dependency and preview scene', async () => {
    const base = createProject('filter-draft', 'With image', FILTER_GRAPH_KIND, 'root');
    const image = { id: 'host-image', name: 'host.png', mimeType: 'image/png' as const, dataUrl: 'data:image/png;base64,AA==', width: 1, height: 1 };
    const project = { ...base, assets: { dependencies: [], preview: [image] },
      preview: { ...base.preview, sourceAssetId: image.id, timeSeconds: 1.25 } };
    await saveRecoveryDraft(project);
    expect((await loadRecoveryDraft(project.id))?.project).toEqual(project);
  });

  it('ignores corrupted local recovery records', async () => {
    localStorage.setItem('fxweave:draft:v1:bad', '{');
    expect(await loadRecoveryDraft('bad')).toBeNull();
    expect(await listRecoveryDrafts()).toEqual([]);
  });

  it('reports unavailable draft reads without throwing into project-file workflows', async () => {
    vi.stubGlobal('localStorage', {
      get length() { throw new DOMException('Storage disabled', 'SecurityError'); },
      getItem() { throw new DOMException('Storage disabled', 'SecurityError'); },
    });
    expect(await readRecoveryDrafts()).toMatchObject({ value: [], error: expect.stringContaining('Storage disabled') });
    expect(await listRecoveryDrafts()).toEqual([]);
    expect(await readRecoveryDraft('p-1')).toMatchObject({ value: null, error: expect.stringContaining('Storage disabled') });
    expect(await loadRecoveryDraft('p-1')).toBeNull();
  });
});
