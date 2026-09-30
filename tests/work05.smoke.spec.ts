import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const projectPath = path.resolve(import.meta.dirname, '..', 'examples', '05-local-melt.fxweave.json');
const manifestPath = path.resolve(import.meta.dirname, '..', 'examples', 'generated', '05-local-melt.manifest.json');

test('05 local melt resamples host UV with deterministic fixed time and live strength controls', async ({ page }) => {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  await page.goto('/');
  await page.locator('.entry-file-actions input[type="file"]').setInputFiles(projectPath);
  await expect(page.getByText('Preview ready')).toBeVisible();
  await expect(page.getByText('Problems 0')).toBeVisible();
  await expect(page.getByTestId('preview-build-id')).toHaveText(manifest.buildId);
  expect(manifest.usesTime).toBe(true);
  const frame = async () => {
    const dataUrl = await page.locator('.preview-stage canvas').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL('image/png'));
    return createHash('sha256').update(dataUrl).digest('hex');
  };
  const pixels = () => page.locator('.preview-stage canvas').evaluate((canvas: HTMLCanvasElement) => {
    const copy = document.createElement('canvas');
    copy.width = canvas.width;
    copy.height = canvas.height;
    const context = copy.getContext('2d')!;
    context.drawImage(canvas, 0, 0);
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    return { cornerAlpha: data[3], centerAlpha: data[(Math.floor(canvas.height / 2) * canvas.width + Math.floor(canvas.width / 2)) * 4 + 3] };
  });
  const base = await frame();
  await page.waitForTimeout(200);
  expect(await frame()).toBe(base);
  expect((await pixels()).cornerAlpha).toBe(0);
  expect((await pixels()).centerAlpha).toBeGreaterThan(0);

  const time = page.getByRole('spinbutton', { name: 'Fixed preview time' });
  await time.fill('1.2');
  expect(await frame()).not.toBe(base);
  await time.fill('0.75');
  expect(await frame()).toBe(base);

  const amplitude = page.locator('.runtime-parameter').getByRole('spinbutton', { name: 'Amplitude' });
  await amplitude.fill('0');
  await amplitude.press('Enter');
  const noWave = await frame();
  expect(noWave).not.toBe(base);
  await time.fill('1.2');
  expect(await frame()).toBe(noWave);
  await amplitude.fill('0.08');
  await amplitude.press('Enter');
  await time.fill('0.75');
  expect(await frame()).toBe(base);

  const frequency = page.locator('.runtime-parameter').getByRole('spinbutton', { name: 'Frequency' });
  await frequency.fill('26');
  await frequency.press('Enter');
  expect(await frame()).not.toBe(base);
  await frequency.fill('16');
  await frequency.press('Enter');
  expect(await frame()).toBe(base);

  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.waitForTimeout(250);
  await page.getByRole('button', { name: 'Pause' }).click();
  const paused = await frame();
  await page.waitForTimeout(250);
  expect(await frame()).toBe(paused);
  await expect(page.getByTestId('preview-build-id')).toHaveText(manifest.buildId);
  await page.getByText('Generated code and bindings').click();
  await expect(page.getByTestId('code-build-id')).toHaveText(manifest.buildId);
  await expect(page.getByTestId('generated-glsl')).toContainText('fxSampleSource');
});
