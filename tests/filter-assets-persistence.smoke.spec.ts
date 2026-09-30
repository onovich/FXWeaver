import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('portable Filter project preserves dependency and preview images through save, reopen, draft, and import', async ({ page }) => {
  await page.addInitScript(() => {
    let fileText = '';
    const handle = {
      name: 'assets.fxweave.json',
      createWritable: async () => ({ write: async (text: string) => { fileText = text; Object.assign(window, { __fxSaved: text }); }, close: async () => {} }),
      getFile: async () => new File([fileText], 'assets.fxweave.json', { type: 'application/json' }),
    };
    Object.assign(window, { showSaveFilePicker: async () => handle, showOpenFilePicker: async () => [handle], __fxSaved: '' });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Filter graph' }).click();
  await page.getByRole('searchbox', { name: 'Search nodes' }).fill('Filter UV');
  await page.locator('.library-list button').filter({ hasText: 'Filter UV' }).click();
  await page.getByRole('searchbox', { name: 'Search nodes' }).fill('Sample Image');
  await page.locator('.library-list button').filter({ hasText: 'Sample Image' }).click();
  await page.getByRole('button', { name: 'Filter UV UV output, vec2' }).click();
  await page.getByRole('button', { name: 'Sample Image UV input, vec2' }).click();
  await page.getByRole('button', { name: 'Sample Image RGBA output, vec4' }).click();
  await page.getByRole('button', { name: 'Filter Output RGBA input, vec4' }).click();

  const [green, red] = await page.evaluate(() => ['#00ff00', '#ff0000'].map((color) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 4;
    const context = canvas.getContext('2d')!;
    context.fillStyle = color;
    context.fillRect(0, 0, 4, 4);
    return canvas.toDataURL('image/png');
  }));
  await page.getByLabel('Import dependency image').setInputFiles({ name: 'green.png', mimeType: 'image/png', buffer: Buffer.from(green.split(',')[1], 'base64') });
  await expect(page.getByText('green.png added as a graph dependency. Select it in a Sample Image node.')).toBeVisible();
  await page.getByRole('button', { name: 'Select Sample Image node' }).click();
  const dependency = page.getByRole('combobox', { name: 'Dependency image' });
  const dependencyId = await dependency.locator('option').filter({ hasText: 'green.png' }).getAttribute('value');
  await dependency.selectOption(dependencyId!);
  await page.getByLabel('Import preview image').setInputFiles({ name: 'red.png', mimeType: 'image/png', buffer: Buffer.from(red.split(',')[1], 'base64') });
  await expect(page.getByText('Preview ready')).toBeVisible();
  await page.getByRole('combobox', { name: 'Preview host' }).selectOption('container');
  await page.getByRole('combobox', { name: 'Preview background' }).selectOption('light');
  await page.getByRole('combobox', { name: 'Texture sampling' }).selectOption('nearest');
  await page.getByRole('spinbutton', { name: 'Filter area inset' }).fill('12');
  await page.getByRole('spinbutton', { name: 'Fixed preview time' }).fill('1.25');
  await expect(page.getByText('Preview ready')).toBeVisible();

  await page.getByRole('searchbox', { name: 'Search nodes' }).fill('Number');
  await page.locator('.library-list button').filter({ hasText: 'Number' }).first().click();
  await page.getByRole('button', { name: 'Expose as parameter' }).click();
  const runtimeValue = page.locator('.runtime-parameter').getByRole('spinbutton', { name: 'Value' });
  await runtimeValue.fill('0.75');
  await runtimeValue.press('Enter');
  await expect(page.getByText('Preview ready')).toBeVisible();
  const buildId = await page.getByTestId('preview-build-id').textContent();
  const pixel = () => page.locator('.preview-stage canvas').evaluate((canvas: HTMLCanvasElement) => {
    const copy = document.createElement('canvas');
    copy.width = canvas.width;
    copy.height = canvas.height;
    const context = copy.getContext('2d')!;
    context.drawImage(canvas, 0, 0);
    return [...context.getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data];
  });
  const before = await pixel();
  expect(before[1]).toBeGreaterThan(200);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('.file-state')).toContainText('Saved to project');
  const saved = JSON.parse(await page.evaluate(() => (window as unknown as { __fxSaved: string }).__fxSaved));
  expect(saved).toMatchObject({ projectVersion: 4, assets: { dependencies: [{ name: 'green.png' }], preview: [{ name: 'red.png' }] },
    preview: { host: 'container', background: 'light', sampling: 'nearest', filterAreaInset: 12, timeSeconds: 1.25 } });
  expect(saved.graph.parameters).toHaveLength(1);
  expect(saved.preview.parameterValues[saved.graph.parameters[0].id]).toBe(0.75);
  expect(saved.graph.nodes.find((node: { type: string }) => node.type === 'filter.sample-image').values.image).toBe(saved.assets.dependencies[0].id);

  await page.getByRole('button', { name: 'Return to project entry' }).click();
  await page.getByRole('button', { name: 'Open project file' }).click();
  await expect(page.getByText('Preview ready')).toBeVisible();
  expect(await page.getByTestId('preview-build-id').textContent()).toBe(buildId);
  expect(await pixel()).toEqual(before);
  await page.getByRole('button', { name: 'Select Sample Image node' }).click();
  await expect(page.getByRole('combobox', { name: 'Dependency image' })).toHaveValue(saved.assets.dependencies[0].id);
  await expect(page.getByRole('combobox', { name: 'Preview source' })).toHaveValue(saved.assets.preview[0].id);
  await expect(page.locator('.runtime-parameter').getByRole('spinbutton', { name: 'Value' })).toHaveValue('0.75');

  await page.getByRole('combobox', { name: 'Preview background' }).selectOption('dark');
  await expect(page.locator('.file-state')).toContainText('Changes not saved');
  await page.waitForTimeout(450);
  await page.reload();
  await page.getByRole('button', { name: 'Recover draft' }).click();
  await expect(page.getByText('Preview ready')).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Preview background' })).toHaveValue('dark');
  expect(await page.getByTestId('preview-build-id').textContent()).toBe(buildId);
  expect(await pixel()).toEqual(before);

  const exportPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const exported = await exportPromise;
  const exportedJson = await readFile((await exported.path())!, 'utf8');
  await page.getByRole('button', { name: 'Return to project entry' }).click();
  await page.locator('.entry-file-actions input[type="file"]').setInputFiles({ name: 'portable.fxweave.json', mimeType: 'application/json', buffer: Buffer.from(exportedJson) });
  await expect(page.getByText('Preview ready')).toBeVisible();
  expect(await page.getByTestId('preview-build-id').textContent()).toBe(buildId);
  expect(await pixel()).toEqual(before);
  await page.getByRole('button', { name: 'Remove dependency green.png' }).click();
  await expect(page.getByText('Old preview')).toBeVisible();
  await expect(page.locator('.preview-status')).toContainText('Dependency image');
  expect(await pixel()).toEqual(before);
});
