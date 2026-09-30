import { expect, test } from '@playwright/test';

// Use the browser's actual synchronous quota, not a mock which removes writes.
test('six image-heavy showcase copies recover with localStorage already full', async ({ page }) => {
  await page.goto('/');
  const full = await page.evaluate(() => {
    const block = 'q'.repeat(256 * 1024);
    let index = 0;
    try { for (; index < 100; index++) localStorage.setItem(`quota-fixture-${index}`, block); }
    catch (error) { return (error as DOMException).name; }
    return 'not-full';
  });
  expect(full).toBe('QuotaExceededError');
  for (const title of ['Radial burn', 'Local melt', 'Hologram scan', 'Radial burn', 'Local melt', 'Hologram scan']) {
    await page.getByRole('button', { name: `Edit a copy of ${title}` }).click();
    await expect(page.locator('.file-state')).toContainText('Recovery draft saved');
    await expect(page.locator('.recovery-warning')).toHaveCount(0);
    await page.getByRole('button', { name: 'Return to project entry' }).click();
    await expect(page.getByRole('heading', { name: 'Recovery drafts on this browser' })).toBeVisible();
  }
  await expect(page.getByRole('button', { name: 'Recover draft', exact: true })).toHaveCount(6);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Recover draft', exact: true })).toHaveCount(6);
  const records = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('fxweave-recovery', 2); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    const records = await new Promise<Array<{ projectId: string; json: string }>>((resolve, reject) => { const request = db.transaction('drafts').objectStore('drafts').getAll(); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    db.close();
    return records.map(record => ({ id: record.projectId, bytes: record.json.length, project: JSON.parse(record.json) }));
  });
  expect(new Set(records.map(record => record.id)).size).toBe(6);
  expect(records.every(record => record.bytes > 2_000_000)).toBe(true);
  expect(records.every(record => record.project.assets.preview[0].dataUrl.startsWith('data:image/png'))).toBe(true);
  await page.getByRole('button', { name: 'Recover draft', exact: true }).first().click();
  await expect(page.getByText('Preview ready', { exact: true })).toBeVisible();
});

test('last runtime edit survives immediate reload and return to entry', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Edit a copy of Local melt' }).click();
  await expect(page.locator('.file-state')).toContainText('Recovery draft saved');
  const amplitude = page.getByRole('spinbutton', { name: 'Amplitude', exact: true });
  await amplitude.fill('0.071');
  await amplitude.press('Enter');
  await page.reload();
  await page.getByRole('button', { name: 'Recover draft', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: 'Amplitude', exact: true })).toHaveValue('0.071');
  await page.getByRole('spinbutton', { name: 'Amplitude', exact: true }).fill('0.063');
  await page.getByRole('button', { name: 'Return to project entry' }).click();
  await page.getByRole('button', { name: 'Recover draft', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: 'Amplitude', exact: true })).toHaveValue('0.063');
});

test('legacy localStorage draft migrates without deletion and newer IndexedDB edits win', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create test graph' }).click();
  await expect(page.locator('.file-state')).toContainText('Recovery draft saved');
  await page.getByRole('button', { name: 'Return to project entry' }).click();
  const legacyKey = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => { const request = indexedDB.open('fxweave-recovery', 2); request.onsuccess = () => resolve(request.result); });
    const record = await new Promise<{ projectId: string; savedAt: number; json: string }>((resolve) => { const request = db.transaction('drafts').objectStore('drafts').getAll(); request.onsuccess = () => resolve(request.result[0]); });
    const key = `fxweave:draft:v1:${record.projectId}`;
    localStorage.setItem(key, JSON.stringify({ ...record, savedAt: record.savedAt - 1000 }));
    await new Promise<void>((resolve) => { const transaction = db.transaction('drafts', 'readwrite'); transaction.objectStore('drafts').clear(); transaction.oncomplete = () => resolve(); });
    db.close(); return key;
  });
  await page.reload();
  await page.getByRole('button', { name: 'Recover draft', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search nodes' }).fill('Number');
  await page.locator('.library-list button').filter({ hasText: 'Number' }).click();
  await page.getByRole('button', { name: 'Return to project entry' }).click();
  expect(await page.evaluate(key => localStorage.getItem(key), legacyKey)).not.toBeNull();
  await page.reload();
  await page.getByRole('button', { name: 'Recover draft', exact: true }).click();
  await expect(page.getByText('2 nodes', { exact: true })).toBeVisible();
});

test('aborted IndexedDB commit reports failure, keeps prior draft, and file saving works', async ({ page }) => {
  await page.addInitScript(() => {
    const handle = { name: 'abort.fxweave.json', createWritable: async () => ({ write: async (json: string) => Object.assign(window, { __abortSaved: json }), close: async () => {} }), getFile: async () => new File([''], 'abort.fxweave.json') };
    Object.assign(window, { showSaveFilePicker: async () => handle, showOpenFilePicker: async () => [handle] });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Create test graph' }).click();
  await expect(page.locator('.file-state')).toContainText('Recovery draft saved');
  await page.evaluate(() => {
    const originalPut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      const request = originalPut.apply(this, args);
      this.transaction.abort();
      return request;
    };
  });
  await page.getByRole('searchbox', { name: 'Search nodes' }).fill('Number');
  await page.locator('.library-list button').filter({ hasText: 'Number' }).click();
  await expect(page.locator('.recovery-warning')).toContainText('Recovery draft unavailable');
  await expect(page.locator('.file-state')).not.toContainText('Recovery draft saved');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('.file-state')).toContainText('Saved to project');
  const saved = await page.evaluate(() => JSON.parse((window as unknown as { __abortSaved: string }).__abortSaved));
  expect(saved.graph.nodes).toHaveLength(2);
  const committedNodes = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => { const request = indexedDB.open('fxweave-recovery', 2); request.onsuccess = () => resolve(request.result); });
    const records = await new Promise<Array<{ json: string }>>((resolve) => { const request = db.transaction('drafts').objectStore('drafts').getAll(); request.onsuccess = () => resolve(request.result); });
    db.close(); return JSON.parse(records[0].json).graph.nodes.length;
  });
  expect(committedNodes).toBe(1);
  await page.reload();
  await page.getByRole('button', { name: 'Recover draft', exact: true }).click();
  await expect(page.getByText('1 nodes', { exact: true })).toBeVisible();
});

test('closing an unchanged older tab cannot replace a newer draft from another tab', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Edit a copy of Local melt' }).click();
  await expect(page.locator('.file-state')).toContainText('Recovery draft saved');
  const newer = await context.newPage();
  await newer.goto('/');
  await newer.getByRole('button', { name: 'Recover draft', exact: true }).click();
  await expect(newer.locator('.file-state')).toContainText('Recovery draft saved');
  await newer.getByRole('spinbutton', { name: 'Amplitude', exact: true }).fill('0.083');
  await newer.getByRole('spinbutton', { name: 'Amplitude', exact: true }).press('Enter');
  await newer.getByRole('button', { name: 'Return to project entry' }).click();
  // A real navigation on the old tab fires pagehide and appends its old version.
  await page.goto('about:blank');
  await newer.reload();
  await newer.getByRole('button', { name: 'Recover draft', exact: true }).click();
  await expect(newer.getByRole('spinbutton', { name: 'Amplitude', exact: true })).toHaveValue('0.083');
});
