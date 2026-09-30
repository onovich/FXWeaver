import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const unityRoot = path.resolve(process.env.UNITY_PROJECT_ROOT ?? 'D:/UnityProjects/UnregisteredScene');
const output = path.resolve(import.meta.dirname, '..', '.fxweave-local');
const samples = [
  { id: '03', title: 'Radial burn', parameter: 'Radius', graphValue: '0.4', runtimeValue: '0.3', time: '0', source: 'Assets/Resources_Runtime/Sprite/UI/Investigation/Anomaly/Chapters/Chapter01/anomaly-ch01-001.png' },
  { id: '05', title: 'Local melt', parameter: 'Amplitude', graphValue: '0.06', runtimeValue: '0.1', time: '0.75', source: 'Assets/Resources_Editor/sample_card_a.png' },
  { id: '09', title: 'Hologram scan', parameter: 'Scan intensity', graphValue: '0.25', runtimeValue: '0.4', time: '0.5', source: 'Assets/Resources_Editor/InvestigationVisualSystem/Hologram/HologramPartner.png' },
];
const hash = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex');
const unityStatus = () => execFileSync('git', ['-C', unityRoot, 'status', '--porcelain=v1'], { encoding: 'utf8' });
let baseline: { status: string; hashes: string[] };
const records: unknown[] = [];

test.beforeAll(async () => {
  await mkdir(output, { recursive: true });
  const hashes = await Promise.all(samples.map(async (sample) => {
    try { return hash(await readFile(path.join(unityRoot, sample.source))); }
    catch { throw new Error(`Local trial source is missing or unreadable: ${path.join(unityRoot, sample.source)}`); }
  }));
  baseline = { status: unityStatus(), hashes };
  await writeFile(path.join(output, 'source-baseline.json'), JSON.stringify({ unityRoot, ...baseline }, null, 2));
});

test.afterAll(async () => {
  if (!baseline) return;
  expect(unityStatus()).toBe(baseline.status);
  const hashes = await Promise.all(samples.map(async (sample) => hash(await readFile(path.join(unityRoot, sample.source)))));
  expect(hashes).toEqual(baseline.hashes);
  await writeFile(path.join(output, 'asset-import-results.json'), JSON.stringify({ operator: 'Codex via Playwright', recordedAt: new Date().toISOString(), unityRoot, unchangedUnityBaseline: true, records }, null, 2));
});

for (const [index, sample] of samples.entries()) test(`local work ${sample.id}: import actual project image through the editor`, async ({ page }) => {
  const startedAt = Date.now();
  const sourcePath = path.join(unityRoot, sample.source);
  const bytes = await readFile(sourcePath);
  const pixels = await page.evaluate(async (url) => {
    const image = new Image(); image.src = url; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext('2d')!; context.drawImage(image, 0, 0);
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0; let partial = 0;
    for (let i = 3; i < data.length; i += 4) { if (data[i] === 0) transparent++; else if (data[i] < 255) partial++; }
    return { width: image.width, height: image.height, transparentPixels: transparent, partialAlphaPixels: partial };
  }, `data:image/png;base64,${bytes.toString('base64')}`);
  await page.goto('/');
  await page.getByRole('button', { name: `Edit a copy of ${sample.title}` }).click();
  await expect(page.getByText('Preview ready')).toBeVisible();
  await page.getByLabel('Import preview image').setInputFiles(sourcePath);
  await expect(page.getByRole('combobox', { name: 'Preview source' })).toContainText(path.basename(sourcePath));
  await expect(page.getByText('Preview ready')).toBeVisible();
  await page.getByText('Generated code and bindings').click();
  const buildId = await page.getByTestId('preview-build-id').innerText();
  await expect(page.getByTestId('code-build-id')).toHaveText(buildId);
  records.push({ work: sample.id, source: sample.source, sourceHash: baseline.hashes[index], bytes: bytes.length, ...pixels, buildId, durationSeconds: (Date.now() - startedAt) / 1000 });
});

for (const sample of samples) test(`local work ${sample.id}: modify graph, compare, Save As and reopen`, async ({ page }) => {
  const startedAt = Date.now();
  const projectPath = path.join(output, `work${sample.id}.fxweave.json`);
  await page.exposeFunction('__writeLocalProject', async (text: string) => writeFile(projectPath, text, 'utf8'));
  await page.addInitScript(() => {
    const handle = { name: 'local-trial.fxweave.json', createWritable: async () => ({
      write: async (text: string) => (window as unknown as { __writeLocalProject: (text: string) => Promise<void> }).__writeLocalProject(text), close: async () => {},
    }) };
    Object.assign(window, { showSaveFilePicker: async () => handle });
  });
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto('/');
  await page.getByRole('button', { name: `Edit a copy of ${sample.title}` }).click();
  await expect(page.getByText('Preview ready')).toBeVisible();
  await page.getByLabel('Import preview image').setInputFiles(path.join(unityRoot, sample.source));
  await expect(page.getByText(`${path.basename(sample.source)} added to project preview assets.`)).toBeVisible();
  await page.getByRole('combobox', { name: 'Preview host' }).selectOption(sample.id === '05' ? 'container' : 'sprite');
  await page.getByRole('spinbutton', { name: 'Preview area width' }).fill('768');
  await page.getByRole('spinbutton', { name: 'Preview area height' }).fill('512');
  await page.getByRole('spinbutton', { name: 'Fixed preview time' }).fill(sample.time);
  await page.getByRole('button', { name: 'Defaults', exact: true }).click();
  await expect(page.getByText('Preview ready')).toBeVisible();
  const canvas = page.locator('.preview-stage canvas');
  const pixels = () => canvas.evaluate((item: HTMLCanvasElement) => item.toDataURL());
  const pixelHash = async () => hash(await pixels());
  await expect.poll(() => canvas.getAttribute('width')).toBe('768');
  const before = await pixels();
  await page.locator('.preview-stage').screenshot({ path: path.join(output, `work${sample.id}-before.png`) });
  const graphParameter = page.locator('.parameter-section').getByRole('spinbutton', { name: sample.parameter });
  await graphParameter.fill(sample.graphValue); await graphParameter.press('Enter');
  await expect.poll(pixelHash).not.toBe(hash(before));
  const graphChanged = await pixels();
  const runtimeParameter = page.locator('.runtime-parameter').getByRole('spinbutton', { name: sample.parameter });
  await runtimeParameter.fill(sample.runtimeValue); await runtimeParameter.press('Enter');
  await expect.poll(pixelHash).not.toBe(hash(graphChanged));
  const fixed = await pixels();
  await page.waitForTimeout(150);
  expect(await pixelHash()).toBe(hash(fixed));
  if (sample.id !== '03') {
    await page.getByRole('spinbutton', { name: 'Fixed preview time' }).fill('1.2');
    await expect.poll(pixelHash).not.toBe(hash(fixed));
    await page.getByRole('spinbutton', { name: 'Fixed preview time' }).fill(sample.time);
    await expect.poll(pixelHash).toBe(hash(fixed));
  }
  const alpha = await canvas.evaluate((item: HTMLCanvasElement) => {
    const copy = document.createElement('canvas'); copy.width = item.width; copy.height = item.height;
    const ctx = copy.getContext('2d')!; ctx.drawImage(item, 0, 0);
    const data = ctx.getImageData(0, 0, copy.width, copy.height).data;
    let visible = 0; for (let i = 3; i < data.length; i += 4) if (data[i] > 0) visible++;
    return { visible, cornerAlpha: data[3] };
  });
  expect(alpha.visible).toBeGreaterThan(100); expect(alpha.cornerAlpha).toBe(0);
  await page.getByRole('button', { name: 'Original', exact: true }).click();
  await expect(page.getByAltText('Original host pixels before Filter')).toBeVisible();
  await page.locator('.preview-stage').screenshot({ path: path.join(output, `work${sample.id}-original.png`) });
  await page.getByRole('button', { name: 'Effect', exact: true }).click();
  await page.locator('.preview-stage').screenshot({ path: path.join(output, `work${sample.id}-effect.png`) });
  await page.getByText('Generated code and bindings').click();
  const buildId = await page.getByTestId('preview-build-id').innerText();
  await expect(page.getByTestId('code-build-id')).toHaveText(buildId);
  await page.getByRole('button', { name: 'Fit all nodes', exact: true }).click();
  await expect.poll(() => page.locator('.graph-canvas').evaluate((area) => {
    const frame = area.getBoundingClientRect();
    return [...area.querySelectorAll('.canvas-node')].every((node) => {
      const box = node.getBoundingClientRect();
      return box.left >= frame.left + 30 && box.top >= frame.top + 30 && box.right <= frame.right - 30 && box.bottom <= frame.bottom - 30;
    });
  })).toBe(true);
  const viewportStyle = await page.locator('.canvas-world').getAttribute('style');
  await page.screenshot({ path: path.join(output, `work${sample.id}-workbench.png`) });
  const small = (await canvas.boundingBox())!;
  await page.getByRole('button', { name: 'Enlarge preview' }).click();
  expect((await canvas.boundingBox())!.width).toBeGreaterThan(small.width * 2);
  expect(await pixelHash()).toBe(hash(fixed));
  await runtimeParameter.fill(sample.graphValue); await runtimeParameter.press('Enter');
  await expect.poll(pixelHash).not.toBe(hash(fixed));
  await runtimeParameter.fill(sample.runtimeValue); await runtimeParameter.press('Enter');
  await expect.poll(pixelHash).toBe(hash(fixed));
  await page.getByRole('button', { name: 'Split', exact: true }).click();
  await expect(page.getByAltText('Original host pixels before Filter')).toHaveClass(/split/);
  await page.locator('.preview-stage').screenshot({ path: path.join(output, `work${sample.id}-enlarged-split.png`) });
  await page.getByRole('button', { name: 'Effect', exact: true }).click();
  await page.locator('.preview-stage').screenshot({ path: path.join(output, `work${sample.id}-enlarged-effect.png`) });
  await page.keyboard.press('Escape');
  expect(await pixelHash()).toBe(hash(fixed));
  await expect(page.getByTestId('preview-build-id')).toHaveText(buildId);
  await page.getByRole('button', { name: 'Save As' }).click();
  await expect(page.locator('.file-state')).toContainText('Saved to project');
  const saved = await readFile(projectPath, 'utf8');
  const project = JSON.parse(saved);
  expect(project.graph.parameters.find((item: { name: string }) => item.name === sample.parameter).defaultValue).toBe(Number(sample.graphValue));
  await page.getByRole('button', { name: 'Return to project entry' }).click();
  await page.locator('.entry-file-actions input[type="file"]').setInputFiles(projectPath);
  await expect(page.getByText('Preview ready')).toBeVisible();
  await expect(page.getByTestId('preview-build-id')).toHaveText(buildId);
  expect(await pixelHash()).toBe(hash(fixed));
  await expect(page.locator('.canvas-world')).toHaveAttribute('style', viewportStyle!);
  const result = { work: sample.id, operator: 'Codex via Playwright', recordedAt: new Date().toISOString(),
    source: sample.source, projectFile: path.basename(projectPath), projectHash: hash(saved),
    buildId, fixedCanvasHash: hash(fixed), alpha, graphParameter: { name: sample.parameter, value: sample.graphValue },
    runtimeValue: sample.runtimeValue, fixedTime: sample.time, host: project.preview.host,
    usability: { fitAllNodes: true, enlargedParameterResponse: true, enlargedSplit: true, reopenedViewport: viewportStyle },
    persistenceMethod: 'UI Save As with a disk-writing file-handle bridge; physical JSON file reimport',
    durationSeconds: (Date.now() - startedAt) / 1000 };
  await writeFile(path.join(output, `work${sample.id}-result.json`), JSON.stringify(result, null, 2));
});
