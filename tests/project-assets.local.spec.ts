import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const unityRoot = path.resolve(process.env.UNITY_PROJECT_ROOT ?? 'D:/UnityProjects/UnregisteredScene');
const output = path.resolve(import.meta.dirname, '..', '.fxweave-local');
const samples = [
  { id: '03', title: 'Radial burn', source: 'Assets/Resources_Runtime/Sprite/UI/Investigation/Anomaly/Chapters/Chapter01/anomaly-ch01-001.png' },
  { id: '05', title: 'Local melt', source: 'Assets/Resources_Editor/sample_card_a.png' },
  { id: '09', title: 'Hologram scan', source: 'Assets/Resources_Editor/InvestigationVisualSystem/Hologram/HologramPartner.png' },
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
