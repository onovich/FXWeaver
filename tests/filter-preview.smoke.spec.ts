import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('a downscaled large transparent Sprite retains its visible source inside the Filter area', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Filter graph' }).click();
  await page.getByRole('searchbox', { name: 'Search nodes' }).fill('Source RGBA');
  await page.locator('.library-list button').filter({ hasText: 'Source RGBA' }).click();
  await page.getByRole('button', { name: 'Source RGBA RGBA output, vec4' }).click();
  await page.getByRole('button', { name: 'Filter Output RGBA input, vec4' }).click();
  const dataUrl = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 1300;
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#40bada'; ctx.fillRect(200, 200, 800, 900);
    return canvas.toDataURL();
  });
  if (await page.locator(".scene-settings").count() && !await page.locator(".scene-settings").evaluate(el => (el as HTMLDetailsElement).open)) await page.getByText("Scene & image settings", { exact: true }).click();
  await page.getByLabel('Import preview image').setInputFiles({ name: 'large-transparent.png', mimeType: 'image/png', buffer: Buffer.from(dataUrl.split(',')[1], 'base64') });
  await expect(page.getByText('large-transparent.png added to project preview assets.')).toBeVisible();
  await expect(page.getByText('Preview ready')).toBeVisible();
  const visible = () => page.locator('.preview-stage canvas').evaluate((item: HTMLCanvasElement) => {
    const copy = document.createElement('canvas'); copy.width = item.width; copy.height = item.height;
    const ctx = copy.getContext('2d')!; ctx.drawImage(item, 0, 0);
    const data = ctx.getImageData(0, 0, copy.width, copy.height).data;
    let count = 0; for (let i = 3; i < data.length; i += 4) if (data[i] > 0) count++;
    return count;
  });
  const full = await visible(); expect(full).toBeGreaterThan(1000);
  if (await page.locator(".scene-settings").count() && !await page.locator(".scene-settings").evaluate(el => (el as HTMLDetailsElement).open)) await page.getByText("Scene & image settings", { exact: true }).click();
  await page.getByRole('spinbutton', { name: 'Filter area inset' }).fill('32');
  await expect.poll(visible).toBeLessThan(full);
  await expect.poll(visible).toBeGreaterThan(100);
});

test('renders generated Filter on Sprite and Container and marks stale preview after invalid graph', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Filter graph' }).click();
  await expect(page.getByText('Preview unavailable')).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search nodes' }).fill('Source RGBA');
  await page.locator('.library-list button').filter({ hasText: 'Source RGBA' }).click();
  await page.getByRole('button', { name: 'Source RGBA RGBA output, vec4' }).click();
  await page.getByRole('button', { name: 'Filter Output RGBA input, vec4' }).click();
  await expect(page.getByText('Preview ready')).toBeVisible();
  const buildId = await page.getByTestId('preview-build-id').textContent();
  expect(buildId).toBeTruthy();
  const samplePixel = () => page.locator('.preview-stage canvas').evaluate((canvas: HTMLCanvasElement) => {
    const copy = document.createElement('canvas');
    copy.width = canvas.width;
    copy.height = canvas.height;
    const context = copy.getContext('2d')!;
    context.drawImage(canvas, 0, 0);
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    return Array.from({ length: canvas.width * canvas.height }, (_, index) => data[index * 4 + 3]).filter((alpha) => alpha > 0).length;
  });
  expect(await samplePixel()).toBeGreaterThan(0);

  if (await page.locator(".scene-settings").count() && !await page.locator(".scene-settings").evaluate(el => (el as HTMLDetailsElement).open)) await page.getByText("Scene & image settings", { exact: true }).click();
  await page.getByRole('combobox', { name: 'Preview host' }).selectOption('container');
  await expect(page.getByText('Preview ready')).toBeVisible();
  expect(await page.getByTestId('preview-build-id').textContent()).toBe(buildId);
  const fullAreaPixels = await samplePixel();
  expect(fullAreaPixels).toBeGreaterThan(0);
  if (await page.locator(".scene-settings").count() && !await page.locator(".scene-settings").evaluate(el => (el as HTMLDetailsElement).open)) await page.getByText("Scene & image settings", { exact: true }).click();
  await page.getByRole('spinbutton', { name: 'Filter area inset' }).fill('32');
  if (await page.locator(".scene-settings").count() && !await page.locator(".scene-settings").evaluate(el => (el as HTMLDetailsElement).open)) await page.getByText("Scene & image settings", { exact: true }).click();
  await page.getByRole('spinbutton', { name: 'Filter area inset' }).press('Tab');
  await expect(page.getByText('Preview ready')).toBeVisible();
  expect(await samplePixel()).toBeLessThan(fullAreaPixels);
  if (await page.locator(".scene-settings").count() && !await page.locator(".scene-settings").evaluate(el => (el as HTMLDetailsElement).open)) await page.getByText("Scene & image settings", { exact: true }).click();
  await page.getByRole('combobox', { name: 'Preview background' }).selectOption('light');
  await expect(page.locator('.preview-stage')).toHaveClass(/preview-background-light/);

  await page.getByRole('button', { name: 'Disconnect Filter Output RGBA' }).click();
  await expect(page.getByText('Old preview')).toBeVisible();
  await expect(page.getByTestId('preview-build-id')).toHaveText(buildId!);
  expect(await samplePixel()).toBeGreaterThan(0);
  const exported = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const download = await exported;
  const project = JSON.parse(await (await import('node:fs/promises')).readFile((await download.path())!, 'utf8'));
  expect(project.preview).toMatchObject({ host: 'container', background: 'light', filterAreaInset: 32 });
});

test('a delayed image decode cannot replace a newer preview request', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Filter graph' }).click();
  await page.getByRole('searchbox', { name: 'Search nodes' }).fill('Source RGBA');
  await page.locator('.library-list button').filter({ hasText: 'Source RGBA' }).click();
  await page.getByRole('button', { name: 'Source RGBA RGBA output, vec4' }).click();
  await page.getByRole('button', { name: 'Filter Output RGBA input, vec4' }).click();
  await expect(page.getByText('Preview ready')).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const download = await downloadPromise;
  const project = JSON.parse(await readFile((await download.path())!, 'utf8'));
  const [red, blue] = await page.evaluate(() => ['#ff0000', '#0000ff'].map((color) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 2;
    canvas.getContext('2d')!.fillStyle = color;
    canvas.getContext('2d')!.fillRect(0, 0, 2, 2);
    return canvas.toDataURL('image/png');
  }));
  project.id = crypto.randomUUID();
  project.assets.preview = [
    { id: 'red', name: 'Red', mimeType: 'image/png', dataUrl: red, width: 2, height: 2 },
    { id: 'blue', name: 'Blue', mimeType: 'image/png', dataUrl: blue, width: 2, height: 2 },
  ];
  project.preview.sourceAssetId = 'red';
  await page.locator('input[aria-label="Import project JSON"]').setInputFiles({ name: 'race.fxweave.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(project)) });
  await expect(page.getByText('Preview ready')).toBeVisible();
  await page.evaluate((blueUrl) => {
    const decode = Image.prototype.decode;
    Image.prototype.decode = function () {
      const result = decode.call(this);
      return this.src === blueUrl ? result.then(() => new Promise<void>((resolve) => setTimeout(resolve, 250))) : result;
    };
  }, blue);
  if (await page.locator(".scene-settings").count() && !await page.locator(".scene-settings").evaluate(el => (el as HTMLDetailsElement).open)) await page.getByText("Scene & image settings", { exact: true }).click();
  await page.getByRole('combobox', { name: 'Preview source' }).selectOption('blue');
  if (await page.locator(".scene-settings").count() && !await page.locator(".scene-settings").evaluate(el => (el as HTMLDetailsElement).open)) await page.getByText("Scene & image settings", { exact: true }).click();
  await page.getByRole('combobox', { name: 'Preview source' }).selectOption('red');
  await expect(page.getByText('Preview ready')).toBeVisible();
  await page.waitForTimeout(350);
  await expect(page.getByText('Preview ready')).toBeVisible();
  const pixel = await page.locator('.preview-stage canvas').evaluate((canvas: HTMLCanvasElement) => {
    const copy = document.createElement('canvas');
    copy.width = canvas.width;
    copy.height = canvas.height;
    const context = copy.getContext('2d')!;
    context.drawImage(canvas, 0, 0);
    return [...context.getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data];
  });
  expect(pixel[0]).toBeGreaterThan(200);
  expect(pixel[2]).toBeLessThan(50);
});

test('imports a preview image into the project and reports oversize input', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Filter graph' }).click();
  await page.getByRole('searchbox', { name: 'Search nodes' }).fill('Source RGBA');
  await page.locator('.library-list button').filter({ hasText: 'Source RGBA' }).click();
  await page.getByRole('button', { name: 'Source RGBA RGBA output, vec4' }).click();
  await page.getByRole('button', { name: 'Filter Output RGBA input, vec4' }).click();
  await expect(page.getByText('Preview ready')).toBeVisible();
  const dataUrl = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 4;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#21dd7b';
    context.fillRect(0, 0, 4, 4);
    return canvas.toDataURL('image/png');
  });
  if (await page.locator(".scene-settings").count() && !await page.locator(".scene-settings").evaluate(el => (el as HTMLDetailsElement).open)) await page.getByText("Scene & image settings", { exact: true }).click();
  await page.getByLabel('Import preview image').setInputFiles({ name: 'green.png', mimeType: 'image/png', buffer: Buffer.from(dataUrl.split(',')[1], 'base64') });
  await expect(page.getByText('green.png added to project preview assets.')).toBeVisible();
  await expect(page.getByText('Preview ready')).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const download = await downloadPromise;
  const project = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(project.assets.preview).toMatchObject([{ name: 'green.png', width: 4, height: 4 }]);
  expect(project.preview.sourceAssetId).toBe(project.assets.preview[0].id);
  if (await page.locator(".scene-settings").count() && !await page.locator(".scene-settings").evaluate(el => (el as HTMLDetailsElement).open)) await page.getByText("Scene & image settings", { exact: true }).click();
  await page.getByLabel('Import preview image').setInputFiles({ name: 'large.png', mimeType: 'image/png', buffer: Buffer.alloc(2 * 1024 * 1024 + 1) });
  await expect(page.getByText('An image must be 2 MiB or smaller.')).toBeVisible();
  await expect(page.getByText('Preview ready')).toBeVisible();
});

test('reports unavailable WebGL2 in the workbench', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...args: unknown[]) {
      if (kind === 'webgl2') return null;
      return Reflect.apply(original, this, [kind, ...args]);
    } as typeof original;
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Filter graph' }).click();
  await expect(page.getByText('WebGL2 unavailable')).toBeVisible();
  await expect(page.getByText('WebGL2 is unavailable. Generated Filter preview needs WebGL2.')).toBeVisible();
});
