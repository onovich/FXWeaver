import { expect, test } from '@playwright/test';

test('formal project save works when recovery draft storage fails', async ({ page }) => {
  await page.addInitScript(() => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith('fxweave:draft:')) throw new DOMException('Storage full', 'QuotaExceededError');
      return originalSetItem.call(this, key, value);
    };
    let saved = '';
    const handle = {
      name: 'qa.fxweave.json',
      createWritable: async () => ({ write: async (json: string) => { saved = json; Object.assign(window, { __qaSaved: json }); }, close: async () => {} }),
      getFile: async () => new File([saved], 'qa.fxweave.json', { type: 'application/json' }),
    };
    Object.assign(window, { showSaveFilePicker: async () => handle, showOpenFilePicker: async () => [handle], __qaSaved: '' });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Create test graph' }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('.file-state')).toContainText('Saved to project');
  await expect(page.locator('.recovery-warning')).toContainText('Recovery draft unavailable');
  expect(await page.evaluate(() => (window as unknown as { __qaSaved: string }).__qaSaved)).not.toBe('');

  await page.getByRole('searchbox', { name: 'Search nodes' }).fill('Number');
  await page.locator('.library-list button').filter({ hasText: 'Number' }).click();
  await expect(page.getByText('2 nodes')).toBeVisible();
  await page.getByRole('button', { name: 'Open project file' }).click();
  await expect(page.getByText('1 nodes')).toBeVisible();
  await expect(page.locator('.recovery-warning')).toContainText('Recovery draft unavailable');

  await page.getByRole('searchbox', { name: 'Search nodes' }).fill('Number');
  await page.locator('.library-list button').filter({ hasText: 'Number' }).click();
  const saved = await page.evaluate(() => (window as unknown as { __qaSaved: string }).__qaSaved);
  await page.locator('.library-file-actions input[type="file"]').setInputFiles({ name: 'qa.fxweave.json', mimeType: 'application/json', buffer: Buffer.from(saved) });
  await expect(page.getByText('1 nodes')).toBeVisible();
  await page.getByRole('button', { name: 'Return to project entry' }).click();
  await expect(page.getByRole('button', { name: 'Create test graph' })).toBeVisible();
  await expect(page.locator('.recovery-warning')).toContainText('Recovery draft unavailable');
});

test('cancelling a version choice returns to the current editor', async ({ page }) => {
  await page.addInitScript(() => {
    let saved = '';
    const handle = {
      name: 'qa.fxweave.json',
      createWritable: async () => ({ write: async (json: string) => { saved = json; }, close: async () => {} }),
      getFile: async () => new File([saved], 'qa.fxweave.json', { type: 'application/json' }),
    };
    Object.assign(window, { showSaveFilePicker: async () => handle, showOpenFilePicker: async () => [handle] });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Create test graph' }).click();
  await page.getByRole('searchbox', { name: 'Search nodes' }).fill('Number');
  await page.locator('.library-list button').filter({ hasText: 'Number' }).click();
  await page.getByRole('button', { name: 'Save As' }).click();
  await expect(page.locator('.file-state')).toContainText('Saved to project');
  await page.locator('.inspector-content').getByRole('spinbutton', { name: 'Value' }).fill('7');
  await page.locator('.inspector-content').getByRole('spinbutton', { name: 'Value' }).press('Enter');
  await page.getByRole('button', { name: 'Open project file' }).click();
  await expect(page.getByRole('heading', { name: 'Choose which project version to open' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('heading', { name: 'Node canvas' })).toBeVisible();
  await expect(page.locator('.inspector-content').getByRole('spinbutton', { name: 'Value' })).toHaveValue('7');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.inspector-content').getByRole('spinbutton', { name: 'Value' })).toHaveValue('0');
});

test('cancelling a version choice opened from the entry returns to the entry', async ({ page }) => {
  await page.addInitScript(() => {
    let saved = '';
    const handle = {
      name: 'qa.fxweave.json',
      createWritable: async () => ({ write: async (json: string) => { saved = json; }, close: async () => {} }),
      getFile: async () => new File([saved], 'qa.fxweave.json', { type: 'application/json' }),
    };
    Object.assign(window, { showSaveFilePicker: async () => handle, showOpenFilePicker: async () => [handle] });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Create test graph' }).click();
  await page.getByRole('searchbox', { name: 'Search nodes' }).fill('Number');
  await page.locator('.library-list button').filter({ hasText: 'Number' }).click();
  await page.getByRole('button', { name: 'Save As' }).click();
  await expect(page.locator('.file-state')).toContainText('Saved to project');
  await page.locator('.inspector-content').getByRole('spinbutton', { name: 'Value' }).fill('7');
  await page.locator('.inspector-content').getByRole('spinbutton', { name: 'Value' }).press('Enter');
  await page.getByRole('button', { name: 'Return to project entry' }).click();
  await page.getByRole('button', { name: 'Open project file' }).click();
  await expect(page.getByRole('heading', { name: 'Choose which project version to open' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('button', { name: 'Create test graph' })).toBeVisible();
});
