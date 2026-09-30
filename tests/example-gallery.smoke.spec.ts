import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const cases = [
  { id: '03', title: 'Radial burn', file: '03-radial-burn', parameter: 'Radius', value: '0.18' },
  { id: '05', title: 'Local melt', file: '05-local-melt', parameter: 'Frequency', value: '28' },
  { id: '09', title: 'Hologram scan', file: '09-hologram-scan', parameter: 'Scan intensity', value: '0' },
];

for (const sample of cases) test(`work ${sample.id} opens as an editable copy and survives Save As and reopen`, async ({ page }) => {
  const original = JSON.parse(await readFile(path.resolve(import.meta.dirname, '..', 'examples', `${sample.file}.fxweave.json`), 'utf8'));
  const manifest = JSON.parse(await readFile(path.resolve(import.meta.dirname, '..', 'examples', 'generated', `${sample.file}.manifest.json`), 'utf8'));
  await page.addInitScript(() => {
    let saved = '';
    const handle = {
      name: 'example-copy.fxweave.json',
      createWritable: async () => ({ write: async (text: string) => { saved = text; Object.assign(window, { __fxSaved: text }); }, close: async () => {} }),
      getFile: async () => new File([saved], 'example-copy.fxweave.json', { type: 'application/json' }),
    };
    Object.assign(window, { showSaveFilePicker: async () => handle, showOpenFilePicker: async () => [handle], __fxSaved: '' });
  });
  await page.goto('/');
  const card = page.locator('.example-card').filter({ hasText: sample.title });
  await card.getByText('Technical details', { exact: true }).click();
  await expect(card).toContainText(manifest.buildId);
  await expect(card.getByRole('link', { name: 'Download manifest' })).toHaveAttribute('href', /^(data:|\/|https?:)/);
  await expect(card.getByRole('link', { name: 'Download creation record' })).toHaveAttribute('href', /^(data:|\/|https?:)/);
  const publishedManifest = await card.getByRole('link', { name: 'Download manifest' }).getAttribute('href');
  const publishedLog = await card.getByRole('link', { name: 'Download creation record' }).getAttribute('href');
  expect(await page.evaluate(async (url) => JSON.parse(await (await fetch(url!)).text()).buildId, publishedManifest)).toBe(manifest.buildId);
  expect(await page.evaluate(async (url) => JSON.parse(await (await fetch(url!)).text()).buildId, publishedLog)).toBe(manifest.buildId);
  const manifestDownload = page.waitForEvent('download');
  await card.getByRole('link', { name: 'Download manifest' }).click();
  const downloadedManifest = await manifestDownload;
  expect(downloadedManifest.suggestedFilename()).toBe(`work${sample.id}.manifest.json`);
  expect(JSON.parse(await readFile((await downloadedManifest.path())!, 'utf8')).buildId).toBe(manifest.buildId);
  const logDownload = page.waitForEvent('download');
  await card.getByRole('link', { name: 'Download creation record' }).click();
  const downloadedLog = await logDownload;
  expect(downloadedLog.suggestedFilename()).toBe(`work${sample.id}.creation-log.json`);
  expect(JSON.parse(await readFile((await downloadedLog.path())!, 'utf8')).buildId).toBe(manifest.buildId);
  await card.getByRole('button', { name: `Edit a copy of ${sample.title}` }).click();
  await expect(page.getByText('Preview ready')).toBeVisible();
  await expect(page.getByTestId('preview-build-id')).toHaveText(manifest.buildId);
  await expect(page.getByText('Problems 0')).toBeVisible();
  await expect(page.locator('.file-state')).toContainText('no project file');
  const baseline = await page.locator('.preview-stage canvas').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  const property = page.locator('.parameter-section').getByRole('spinbutton', { name: sample.parameter });
  await property.fill(sample.value);
  await property.press('Enter');
  await expect(page.getByText('Preview ready')).toBeVisible();
  await expect(page.getByTestId('preview-build-id')).toHaveText(manifest.buildId);
  await expect.poll(() => page.locator('.preview-stage canvas').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL())).not.toBe(baseline);
  const changed = await page.locator('.preview-stage canvas').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  await page.getByRole('button', { name: 'Save As' }).click();
  await expect(page.locator('.file-state')).toContainText('Saved to project');
  const saved = JSON.parse(await page.evaluate(() => (window as unknown as { __fxSaved: string }).__fxSaved));
  expect(saved.id).not.toBe(original.id);
  expect(saved.name).toBe(`${original.name} copy`);
  expect(saved.graph.nodes).toHaveLength(original.graph.nodes.length);
  expect(saved.graph.edges).toHaveLength(original.graph.edges.length);
  expect(saved.graph.nodes).not.toEqual(original.graph.nodes);
  expect(saved.assets).toEqual(original.assets);
  expect(saved.preview).toEqual(original.preview);
  await page.getByRole('button', { name: 'Return to project entry' }).click();
  await page.getByRole('button', { name: 'Open project file' }).click();
  await expect(page.getByText('Preview ready')).toBeVisible();
  await expect(page.getByTestId('preview-build-id')).toHaveText(manifest.buildId);
  await expect(page.locator('.parameter-section').getByRole('spinbutton', { name: sample.parameter })).toHaveValue(sample.value);
  expect(await page.locator('.preview-stage canvas').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL())).toBe(changed);
});

test('a late example load cannot replace a newer choice', async ({ page }) => {
  let releaseOld!: () => void;
  let oldRequested!: () => void;
  const held = new Promise<void>((resolve) => { releaseOld = resolve; });
  const requested = new Promise<void>((resolve) => { oldRequested = resolve; });
  await page.route(/03-radial-burn\.fxweave/, async (route) => {
    oldRequested();
    await held;
    await route.continue();
  });
  await page.goto('/');
  const oldResponse = page.waitForResponse(/03-radial-burn\.fxweave/);
  try {
    await page.getByRole('button', { name: 'Edit a copy of Radial burn' }).click();
    await requested;
    await page.getByRole('button', { name: 'Edit a copy of Local melt' }).click();
    await expect(page.locator('.project-heading')).toContainText('05 · Local Melt / Wave Distortion copy');
    await expect(page.getByText('Preview ready')).toBeVisible();
  } finally {
    releaseOld();
  }
  await oldResponse;
  await expect(page.locator('.project-heading')).toContainText('05 · Local Melt / Wave Distortion copy');
});

test('saving one derived work leaves the original available for another independent copy', async ({ page }) => {
  const original = JSON.parse(await readFile(path.resolve(import.meta.dirname, '..', 'examples', '03-radial-burn.fxweave.json'), 'utf8'));
  const manifest = JSON.parse(await readFile(path.resolve(import.meta.dirname, '..', 'examples', 'generated', '03-radial-burn.manifest.json'), 'utf8'));
  await page.addInitScript(() => {
    const handle = { name: 'first-copy.fxweave.json', createWritable: async () => ({ write: async (text: string) => { Object.assign(window, { __firstCopy: text }); }, close: async () => {} }) };
    Object.assign(window, { showSaveFilePicker: async () => handle, __firstCopy: '' });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Edit a copy of Radial burn' }).click();
  await expect(page.getByText('Preview ready')).toBeVisible();
  const radius = page.locator('.parameter-section').getByRole('spinbutton', { name: 'Radius' });
  await radius.fill('0.18');
  await radius.press('Enter');
  await page.getByRole('button', { name: 'Save As' }).click();
  await expect(page.locator('.file-state')).toContainText('Saved to project');
  const first = JSON.parse(await page.evaluate(() => (window as unknown as { __firstCopy: string }).__firstCopy));
  expect(first.id).not.toBe(original.id);
  await page.getByRole('button', { name: 'Return to project entry' }).click();
  await page.getByRole('button', { name: 'Edit a copy of Radial burn' }).click();
  await expect(page.getByText('Preview ready')).toBeVisible();
  await expect(page.getByTestId('preview-build-id')).toHaveText(manifest.buildId);
  await expect(page.locator('.parameter-section').getByRole('spinbutton', { name: 'Radius' })).toHaveValue('0.34');
  const secondDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const second = JSON.parse(await readFile((await (await secondDownload).path())!, 'utf8'));
  expect(second.id).not.toBe(first.id);
  expect(second.id).not.toBe(original.id);
  expect(second.graph).toEqual(original.graph);
});
