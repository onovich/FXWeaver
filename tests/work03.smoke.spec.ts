import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const projectPath = path.resolve(import.meta.dirname, '..', 'examples', '03-radial-burn.fxweave.json');
const manifestPath = path.resolve(import.meta.dirname, '..', 'examples', 'generated', '03-radial-burn.manifest.json');

test('03 radial burn graph responds to radius, center, edge and color while preserving transparency', async ({ page }) => {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  await page.goto('/');
  await page.locator('.entry-file-actions input[type="file"]').setInputFiles(projectPath);
  await expect(page.getByText('Preview ready')).toBeVisible();
  await expect(page.getByTestId('preview-build-id')).toHaveText(manifest.buildId);
  await expect(page.getByText('Problems 0')).toBeVisible();
  const metrics = () => page.locator('.preview-stage canvas').evaluate((canvas: HTMLCanvasElement) => {
    const copy = document.createElement('canvas');
    copy.width = canvas.width;
    copy.height = canvas.height;
    const context = copy.getContext('2d')!;
    context.drawImage(canvas, 0, 0);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let visible = 0;
    let sumX = 0;
    let red = 0;
    let blue = 0;
    for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
      const index = (y * canvas.width + x) * 4;
      if (data[index + 3] < 8) continue;
      visible++;
      sumX += x;
      red += data[index];
      blue += data[index + 2];
    }
    return { visible, centroidX: visible ? sumX / visible : 0, red, blue,
      cornerAlpha: data[3], centerAlpha: data[(Math.floor(canvas.height / 2) * canvas.width + Math.floor(canvas.width / 2)) * 4 + 3] };
  });
  const base = await metrics();
  expect(base.visible).toBeGreaterThan(100);
  expect(base.cornerAlpha).toBe(0);
  expect(base.centerAlpha).toBeGreaterThan(0);

  const radius = page.locator('.runtime-parameter').getByRole('spinbutton', { name: 'Radius' });
  await radius.fill('0.18');
  await radius.press('Enter');
  const smaller = await metrics();
  expect(smaller.visible).toBeLessThan(base.visible);
  await radius.fill('0.34');
  await radius.press('Enter');

  const center = page.locator('.runtime-parameter').getByRole('textbox', { name: 'Center' });
  await center.fill('0.65, 0.5');
  await center.press('Enter');
  const moved = await metrics();
  expect(moved.centroidX).toBeGreaterThan(base.centroidX + 5);
  await center.fill('0.5, 0.5');
  await center.press('Enter');

  const width = page.locator('.runtime-parameter').getByRole('spinbutton', { name: 'Edge width' });
  await width.fill('0.16');
  await width.press('Enter');
  const wider = await metrics();
  expect(wider.visible).not.toBe(base.visible);
  await width.fill('0.07');
  await width.press('Enter');

  const color = page.locator('.runtime-parameter').getByRole('textbox', { name: 'Edge color' });
  await color.fill('#306dffff');
  await color.press('Enter');
  const blueEdge = await metrics();
  expect(blueEdge.blue).toBeGreaterThan(base.blue);
  await expect(page.getByTestId('preview-build-id')).toHaveText(manifest.buildId);
  await page.getByText('Generated code and bindings').click();
  await expect(page.getByTestId('code-build-id')).toHaveText(manifest.buildId);
  expect(manifest.textureBindings).toHaveLength(1);
  expect(manifest.parameterBindings).toHaveLength(5);
});
