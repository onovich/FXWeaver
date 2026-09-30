import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createProject } from '../graph/project';
import { FOUNDATION_GRAPH_KIND } from '../graph/registry';
import { listRecoveryDrafts, loadRecoveryDraft, projectFilename, saveRecoveryDraft } from './projectStorage';

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

describe('browser recovery boundary', () => {
  beforeEach(() => vi.stubGlobal('localStorage', memoryStorage()));
  afterEach(() => vi.unstubAllGlobals());

  it('keeps a recoverable project separate from portable file naming', () => {
    const project = createProject('p-1', 'Test: draft?', FOUNDATION_GRAPH_KIND, 'root');
    expect(projectFilename(project)).toBe('Test- draft-.fxweave.json');
    const record = saveRecoveryDraft(project);
    expect(record.projectId).toBe(project.id);
    expect(loadRecoveryDraft(project.id)?.project).toEqual(project);
    expect(listRecoveryDrafts().map((draft) => draft.projectId)).toEqual(['p-1']);
  });

  it('ignores corrupted local recovery records', () => {
    localStorage.setItem('fxweave:draft:v1:bad', '{');
    expect(loadRecoveryDraft('bad')).toBeNull();
    expect(listRecoveryDrafts()).toEqual([]);
  });
});
