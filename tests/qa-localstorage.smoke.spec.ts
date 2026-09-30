import { expect, test } from '@playwright/test';

test('project-file editor still starts when browser draft storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() { throw new DOMException('Storage disabled', 'SecurityError'); },
    });
    Object.defineProperty(window, 'indexedDB', { configurable: true, get() { throw new DOMException('Database disabled', 'SecurityError'); } });
    let saved = '';
    const handle = {
      name: 'qa.fxweave.json',
      createWritable: async () => ({ write: async (json: string) => { saved = json; Object.assign(window, { __qaSaved: json }); }, close: async () => {} }),
      getFile: async () => new File([saved], 'qa.fxweave.json', { type: 'application/json' }),
    };
    Object.assign(window, { showSaveFilePicker: async () => handle, showOpenFilePicker: async () => [handle], __qaSaved: '' });
  });
  await page.goto('/');
  await expect(page.locator('.recovery-warning')).toContainText('Recovery drafts unavailable');
  await page.getByRole('button', { name: 'Create test graph' }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('.file-state')).toContainText('Saved to project');
  const saved = await page.evaluate(() => (window as unknown as { __qaSaved: string }).__qaSaved);
  expect(saved).not.toBe('');

  await page.getByRole('searchbox', { name: 'Search nodes' }).fill('Number');
  await page.locator('.library-list button').filter({ hasText: 'Number' }).click();
  await page.getByRole('button', { name: 'Open project file' }).click();
  await expect(page.getByText('1 nodes')).toBeVisible();
  await expect(page.locator('.recovery-warning')).toBeVisible();

  await page.getByRole('searchbox', { name: 'Search nodes' }).fill('Number');
  await page.locator('.library-list button').filter({ hasText: 'Number' }).click();
  await page.locator('.library-file-actions input[type="file"]').setInputFiles({ name: 'qa.fxweave.json', mimeType: 'application/json', buffer: Buffer.from(saved) });
  await expect(page.getByText('1 nodes')).toBeVisible();

  await page.getByRole('button', { name: 'Return to project entry' }).click();
  await expect(page.getByRole('button', { name: 'Create test graph' })).toBeVisible();
  await expect(page.locator('.recovery-warning')).toBeVisible();
  await page.locator('.entry-file-actions input[type="file"]').setInputFiles({ name: 'qa.fxweave.json', mimeType: 'application/json', buffer: Buffer.from(saved) });
  await expect(page.getByText('1 nodes')).toBeVisible();
  await page.getByRole('button', { name: 'Return to project entry' }).click();
  await page.getByRole('button', { name: 'Open project file' }).click();
  await expect(page.getByText('1 nodes')).toBeVisible();
});
