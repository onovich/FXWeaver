import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const projectPath = path.resolve(import.meta.dirname, '..', 'examples', '09-hologram-scan.fxweave.json');
const manifestPath = path.resolve(import.meta.dirname, '..', 'examples', 'generated', '09-hologram-scan.manifest.json');

test('09 hologram graph isolates scan and red-channel offset on a local Sprite', async ({ page }) => {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  await page.goto('/');
  await page.locator('.entry-file-actions input[type="file"]').setInputFiles(projectPath);
  await expect(page.getByText('Preview ready')).toBeVisible();
  await expect(page.getByText('Problems 0')).toBeVisible();
  await expect(page.getByTestId('preview-build-id')).toHaveText(manifest.buildId);
  if (await page.locator(".scene-settings").count() && !await page.locator(".scene-settings").evaluate(el => (el as HTMLDetailsElement).open)) await page.getByText("Scene & image settings", { exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Preview host' })).toHaveValue('sprite');
  expect(manifest.usesTime).toBe(true);
  expect(manifest.textureBindings).toHaveLength(0);
  const image = () => page.locator('.preview-stage canvas').evaluate((canvas: HTMLCanvasElement) => {
    const copy = document.createElement('canvas');
    copy.width = canvas.width;
    copy.height = canvas.height;
    const context = copy.getContext('2d')!;
    context.drawImage(canvas, 0, 0);
    return { width: canvas.width, height: canvas.height, pixels: [...context.getImageData(0, 0, canvas.width, canvas.height).data] };
  });
  const hash = async () => createHash('sha256').update(await page.locator('.preview-stage canvas').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL('image/png'))).digest('hex');
  const base = await image();
  const baseHash = await hash();
  expect(base.pixels[3]).toBe(0);
  const center = (Math.floor(base.height / 2) * base.width + Math.floor(base.width / 2)) * 4;
  expect(base.pixels[center + 3]).toBeGreaterThan(0);

  const time = page.getByRole('spinbutton', { name: 'Fixed preview time' });
  await time.fill('1.4');
  expect(await hash()).not.toBe(baseHash);
  await time.fill('0.5');
  expect(await hash()).toBe(baseHash);

  const intensity = page.locator('.runtime-parameter').getByRole('spinbutton', { name: 'Scan intensity' });
  await intensity.fill('0');
  await intensity.press('Enter');
  const noScan = await hash();
  expect(noScan).not.toBe(baseHash);
  await time.fill('1.4');
  expect(await hash()).toBe(noScan);
  await intensity.fill('0.32');
  await intensity.press('Enter');
  await time.fill('0.5');
  expect(await hash()).toBe(baseHash);

  const offset = page.locator('.runtime-parameter').getByRole('textbox', { name: 'Red channel offset' });
  await offset.fill('0, 0');
  await offset.press('Enter');
  const aligned = await image();
  let changedRed = 0;
  let changedGreen = 0;
  let changedBlue = 0;
  for (let index = 0; index < base.pixels.length; index += 4) {
    if (base.pixels[index] !== aligned.pixels[index]) changedRed++;
    if (base.pixels[index + 1] !== aligned.pixels[index + 1]) changedGreen++;
    if (base.pixels[index + 2] !== aligned.pixels[index + 2]) changedBlue++;
  }
  expect(changedRed).toBeGreaterThan(20);
  expect(changedGreen).toBe(0);
  expect(changedBlue).toBe(0);
  await offset.fill('0.015, 0');
  await offset.press('Enter');
  expect(await hash()).toBe(baseHash);

  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.waitForTimeout(250);
  await page.getByRole('button', { name: 'Pause' }).click();
  const paused = await hash();
  await page.waitForTimeout(250);
  expect(await hash()).toBe(paused);
  await expect(page.getByTestId('preview-build-id')).toHaveText(manifest.buildId);
  await page.getByText('Generated code and bindings').click();
  await expect(page.getByTestId('code-build-id')).toHaveText(manifest.buildId);
});
