import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function canvasPixel(page: Page): Promise<number[]> {
  return page.locator('.preview-stage canvas').evaluate((canvas: HTMLCanvasElement) => {
    const copy = document.createElement('canvas');
    copy.width = canvas.width;
    copy.height = canvas.height;
    const context = copy.getContext('2d')!;
    context.drawImage(canvas, 0, 0);
    return [...context.getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data];
  });
}

test('runtime parameter and comparison use the successful generated build', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Filter graph' }).click();
  await page.getByRole('searchbox', { name: 'Search nodes' }).fill('Vector 4');
  await page.locator('.library-list button').filter({ hasText: 'Vector 4' }).first().click();
  const inspectorValue = page.locator('.inspector-content').getByRole('textbox', { name: 'Value' });
  await inspectorValue.fill('0.5, 0, 0, 1');
  await inspectorValue.press('Enter');
  await page.getByRole('button', { name: 'Expose as parameter' }).click();
  await page.getByRole('button', { name: 'Vector 4 Value output, vec4' }).click();
  await page.getByRole('button', { name: 'Filter Output RGBA input, vec4' }).click();
  await expect(page.getByText('Preview ready')).toBeVisible();
  const buildId = await page.getByTestId('preview-build-id').textContent();
  const before = await canvasPixel(page);
  expect(before[0]).toBeGreaterThan(before[1]);
  const runtimeValue = page.locator('.runtime-parameter').getByRole('textbox', { name: 'Value' });
  await runtimeValue.fill('0, 0.5, 0, 1');
  await runtimeValue.press('Enter');
  await expect(page.getByText('Preview ready')).toBeVisible();
  const after = await canvasPixel(page);
  expect(after[1]).toBeGreaterThan(after[0]);
  expect(await page.getByTestId('preview-build-id').textContent()).toBe(buildId);

  await page.getByText('Generated code and bindings').click();
  await expect(page.getByTestId('code-build-id')).toHaveText(buildId!);
  await expect(page.getByTestId('generated-glsl')).toContainText('uParam0');
  await expect(page.getByRole('button', { name: 'Download GLSL' })).toBeEnabled();
  const glslDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download GLSL' }).click();
  const glsl = await glslDownload;
  expect(await readFile((await glsl.path())!, 'utf8')).toContain('uniform vec4 uParam0;');
  expect(glsl.suggestedFilename()).toBe(`${buildId}.frag.glsl`);
  const manifestDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download manifest' }).click();
  const manifest = JSON.parse(await readFile((await (await manifestDownload).path())!, 'utf8'));
  expect(manifest).toMatchObject({ buildId, backend: 'pixi.webgl2', parameterBindings: [{ uniformName: 'uParam0' }] });

  await page.getByRole('button', { name: 'Original', exact: true }).click();
  const original = page.locator('.preview-original');
  await expect(original).toBeVisible();
  const originalCenter = await original.evaluate((image: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0);
    return [...context.getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data];
  });
  expect(originalCenter[3]).toBe(0);
  await page.getByRole('button', { name: 'Split', exact: true }).click();
  await expect(original).toHaveClass(/preview-original-split/);
  await page.getByRole('button', { name: 'Effect', exact: true }).click();
  await expect(original).toHaveCount(0);

  await page.getByRole('button', { name: 'Disconnect Filter Output RGBA' }).click();
  await expect(page.getByText('Old preview')).toBeVisible();
  await expect(page.getByTestId('code-build-id')).toHaveText(buildId!);
  await expect(page.getByRole('button', { name: 'Download GLSL' })).toBeDisabled();
});

test('fixed time and pause update the uniform without a new build', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Filter graph' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const blank = JSON.parse(await readFile((await (await downloadPromise).path())!, 'utf8'));
  const rootId: string = blank.graph.nodes[0].id;
  blank.id = crypto.randomUUID();
  blank.graph.nodes.push(
    { id: 'time', type: 'filter.time', definitionVersion: 1, values: {} },
    { id: 'zero', type: 'filter.float', definitionVersion: 1, values: { value: 0 } },
    { id: 'one', type: 'filter.float', definitionVersion: 1, values: { value: 1 } },
    { id: 'compose', type: 'filter.compose-vec4', definitionVersion: 1, values: {} },
  );
  blank.graph.edges.push(
    { id: 'x', from: { nodeId: 'time', portId: 'seconds' }, to: { nodeId: 'compose', portId: 'x' } },
    { id: 'y', from: { nodeId: 'zero', portId: 'value' }, to: { nodeId: 'compose', portId: 'y' } },
    { id: 'z', from: { nodeId: 'zero', portId: 'value' }, to: { nodeId: 'compose', portId: 'z' } },
    { id: 'w', from: { nodeId: 'one', portId: 'value' }, to: { nodeId: 'compose', portId: 'w' } },
    { id: 'output', from: { nodeId: 'compose', portId: 'value' }, to: { nodeId: rootId, portId: 'rgba' } },
  );
  Object.assign(blank.layout.nodePositions, { time: { x: 20, y: 20 }, zero: { x: 20, y: 180 }, one: { x: 20, y: 320 }, compose: { x: 290, y: 140 } });
  await page.locator('input[aria-label="Import project JSON"]').setInputFiles({ name: 'time.fxweave.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(blank)) });
  await expect(page.getByText('Preview ready')).toBeVisible();
  const buildId = await page.getByTestId('preview-build-id').textContent();
  expect((await canvasPixel(page))[0]).toBeLessThan(10);

  await page.getByRole('spinbutton', { name: 'Fixed preview time' }).fill('0.5');
  await page.getByRole('spinbutton', { name: 'Fixed preview time' }).press('Tab');
  const fixed = await canvasPixel(page);
  expect(fixed[0]).toBeGreaterThan(100);
  await page.waitForTimeout(250);
  expect(await canvasPixel(page)).toEqual(fixed);
  expect(await page.getByTestId('preview-build-id').textContent()).toBe(buildId);

  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.waitForTimeout(700);
  const playingExport = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const playingProject = JSON.parse(await readFile((await (await playingExport).path())!, 'utf8'));
  expect(playingProject.preview.timeSeconds).toBeGreaterThan(0.5);
  await page.getByRole('button', { name: 'Pause' }).click();
  const paused = await canvasPixel(page);
  expect(paused[0]).toBeGreaterThan(fixed[0]);
  await page.waitForTimeout(250);
  expect(await canvasPixel(page)).toEqual(paused);
  await page.getByRole('button', { name: 'Reset to 0' }).click();
  expect((await canvasPixel(page))[0]).toBeLessThan(10);
  expect(await page.getByTestId('preview-build-id').textContent()).toBe(buildId);
});
