import { expect, test } from '@playwright/test';

test('saves a project file, reopens it, chooses a newer draft, and protects the current graph on bad import', async ({ page }) => {
  await page.addInitScript(() => {
    let fileText = '';
    const handle = {
      name: 'phase0-test.fxweave.json',
      createWritable: async () => ({
        write: async (text: string) => { fileText = text; Object.assign(window, { __fxSaved: text }); },
        close: async () => {},
      }),
      getFile: async () => new File([fileText], 'phase0-test.fxweave.json', { type: 'application/json' }),
    };
    Object.assign(window, { showSaveFilePicker: async () => handle, showOpenFilePicker: async () => [handle], __fxSaved: '' });
  });
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Create test graph' }).click();
  await page.getByRole('searchbox', { name: 'Search nodes' }).fill('Number');
  await page.locator('.library-list button').filter({ hasText: 'Number' }).click();
  await page.getByRole('button', { name: 'Number Value output, float' }).click();
  await page.getByRole('button', { name: 'Test Output Value input, float' }).click();
  const propertyValue = page.locator('.inspector-content').getByRole('spinbutton', { name: 'Value' });
  await propertyValue.fill('4');
  await propertyValue.press('Control+s');
  await expect(page.locator('.file-state')).toContainText('Saved to project');
  expect(JSON.parse(await page.evaluate(() => (window as unknown as { __fxSaved: string }).__fxSaved)).graph.nodes.find((node: { type: string }) => node.type === 'foundation.number').values.value).toBe(4);
  await page.getByRole('button', { name: 'Expose as parameter' }).click();
  const numberNode = page.locator('.canvas-node').filter({ has: page.getByRole('button', { name: 'Select Number node' }) });
  const numberBox = await numberNode.boundingBox();
  if (!numberBox) throw new Error('Number node is not visible');
  await page.getByRole('button', { name: 'Select Number node' }).hover();
  await page.mouse.down();
  await page.mouse.move(numberBox.x + 115, numberBox.y + 95, { steps: 6 });
  await page.mouse.up();
  const savedPosition = await numberNode.getAttribute('style');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('.file-state')).toContainText('Saved to project');
  const saved = await page.evaluate(() => (window as unknown as { __fxSaved: string }).__fxSaved);
  const savedProject = JSON.parse(saved);
  expect(savedProject.graph.nodes).toHaveLength(2);
  expect(savedProject.graph.edges).toHaveLength(1);
  expect(savedProject.graph.parameters[0].defaultValue).toBe(4);
  expect(savedProject.layout.nodePositions).toBeTruthy();

  await page.getByRole('button', { name: 'Return to project entry' }).click();
  await page.getByRole('button', { name: 'Open project file' }).click();
  await expect(page.getByText('Problems 0')).toBeVisible();
  await expect(page.locator('.file-state')).toContainText('Saved to project');
  await expect(page.locator('.canvas-node').filter({ has: page.getByRole('button', { name: 'Select Number node' }) })).toHaveAttribute('style', savedPosition!);
  const value = page.locator('.parameter-section').getByRole('spinbutton', { name: 'Value' });
  await expect(value).toHaveValue('4');

  await value.fill('6');
  await value.press('Enter');
  await expect(page.locator('.file-state')).toContainText('Changes not saved');
  await page.getByRole('button', { name: 'Open project file' }).click();
  await expect(page.getByRole('heading', { name: 'Choose which project version to open' })).toBeVisible();
  await page.getByRole('button', { name: 'Recover browser draft' }).click();
  await expect(page.locator('.parameter-section').getByRole('spinbutton', { name: 'Value' })).toHaveValue('6');

  await page.locator('.library-file-actions input[type="file"]').setInputFiles({ name: 'bad.fxweave.json', mimeType: 'application/json', buffer: Buffer.from('{') });
  await expect(page.getByRole('status').filter({ hasText: 'Import blocked: INVALID_JSON' })).toBeVisible();
  await expect(page.locator('.parameter-section').getByRole('spinbutton', { name: 'Value' })).toHaveValue('6');

  await expect(page.locator('.file-state')).toContainText('Changes not saved to project file');
  await page.reload();
  await page.getByRole('button', { name: 'Recover draft' }).click();
  await expect(page.locator('.parameter-section').getByRole('spinbutton', { name: 'Value' })).toHaveValue('6');
});

test('exports a portable JSON file and imports it into a new editor session', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create test graph' }).click();
  await page.getByRole('searchbox', { name: 'Search nodes' }).fill('Number');
  await page.locator('.library-list button').filter({ hasText: 'Number' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.fxweave\.json$/);
  const path = await download.path();
  if (!path) throw new Error('Export did not create a local file');
  await page.getByRole('button', { name: 'Return to project entry' }).click();
  await page.locator('.entry-file-actions input[type="file"]').setInputFiles(path);
  await expect(page.getByText('2 nodes')).toBeVisible();
  await expect(page.locator('.file-state')).toContainText('Opened from file · Save As required');
});
