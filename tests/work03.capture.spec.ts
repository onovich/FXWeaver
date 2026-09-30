import { expect, test } from '@playwright/test';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');
const examples = path.join(projectRoot, 'examples');
const visuals = path.join(projectRoot, 'docs', 'visuals');

test('create 03 radial burn from an empty editor graph and capture its generated artifact', async ({ page }) => {
  test.setTimeout(180_000);
  const startedAt = Date.now();
  const operations: unknown[] = [];
  const nodes: Record<string, string> = {};
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Filter graph' }).click();

  async function add(alias: string, label: string) {
    const before = new Set(await page.locator('.canvas-node').evaluateAll((items) => items.map((item) => item.getAttribute('data-node-id'))));
    await page.getByRole('searchbox', { name: 'Search nodes' }).fill(label);
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await page.locator('.library-list button').filter({ has: page.locator('strong').filter({ hasText: new RegExp(`^${escaped}$`) }) }).click();
    const after = await page.locator('.canvas-node').evaluateAll((items) => items.map((item) => item.getAttribute('data-node-id')));
    const id = after.find((item) => item && !before.has(item));
    if (!id) throw new Error(`Could not identify new ${label} node.`);
    nodes[alias] = id;
    operations.push({ action: 'add-node', alias, label, nodeId: id });
  }
  async function select(alias: string) {
    const title = page.locator(`.canvas-node[data-node-id="${nodes[alias]}"] .canvas-node-title`);
    await title.focus();
    await title.press('Enter');
  }
  async function value(alias: string, raw: string) {
    await select(alias);
    const input = page.locator(`#inspector-${nodes[alias]}-value`);
    await input.fill(raw);
    await input.press('Enter');
    operations.push({ action: 'set-property', alias, value: raw });
  }
  async function expose(alias: string, name: string, range?: [number, number]) {
    await select(alias);
    await page.locator('.inspector-content').getByRole('button', { name: 'Expose as parameter' }).click();
    const item = page.locator('.parameter-item').last();
    await item.getByRole('button', { name: /^Rename/ }).click();
    const nameInput = item.getByRole('textbox', { name: 'Parameter name' });
    await nameInput.fill(name);
    await nameInput.press('Enter');
    if (range) {
      await item.getByRole('spinbutton', { name: 'Slider minimum' }).fill(String(range[0]));
      await item.getByRole('spinbutton', { name: 'Slider maximum' }).fill(String(range[1]));
      await item.getByRole('button', { name: 'Set range' }).click();
    }
    operations.push({ action: 'expose-parameter', alias, name, range });
  }
  async function connect(from: string, output: string, to: string, input: string) {
    const source = page.locator(`[data-output-node="${nodes[from]}"][data-output-port="${output}"]`);
    const target = page.locator(`[data-input-node="${nodes[to]}"][data-input-port="${input}"]`);
    await source.focus();
    await source.press('Enter');
    await target.focus();
    await target.press('Enter');
    operations.push({ action: 'connect', from, output, to, input });
  }

  nodes.root = (await page.locator('.canvas-node').first().getAttribute('data-node-id'))!;
  for (const [alias, label] of [
    ['uv', 'Filter UV'], ['center', 'Vector 2'], ['distance', 'Vector 2 Distance'],
    ['noise', 'Sample Image'], ['noiseChannel', 'Split RGBA'], ['noiseStrength', 'Number'],
    ['noiseShift', 'Multiply'], ['radius', 'Number'], ['edgeLimit', 'Add'],
    ['edgeWidth', 'Number'], ['outerRadius', 'Add'], ['smooth', 'Smoothstep'],
    ['one', 'Number'], ['mask', 'Subtract'], ['source', 'Source RGBA'],
    ['edgeColor', 'Color'], ['edgeRgba', 'Color to RGBA'], ['blend', 'Mix Vector 4'],
    ['masked', 'Scale Vector 4'],
  ]) await add(alias, label);

  await value('center', '0.5, 0.5');
  await value('noiseStrength', '0.08');
  await value('radius', '0.34');
  await value('edgeWidth', '0.07');
  await value('one', '1');
  await value('edgeColor', '#ff6226ff');
  await expose('center', 'Center');
  await expose('radius', 'Radius', [0, 0.8]);
  await expose('edgeWidth', 'Edge width', [0.01, 0.2]);
  await expose('noiseStrength', 'Noise amount', [0, 0.2]);
  await expose('edgeColor', 'Edge color');

  const noiseDataUrl = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 32;
    const context = canvas.getContext('2d')!;
    const image = context.createImageData(32, 32);
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      const index = (y * 32 + x) * 4;
      const value = (x * 91 + y * 47 + x * y * 13) % 256;
      image.data[index] = image.data[index + 1] = image.data[index + 2] = value;
      image.data[index + 3] = 255;
    }
    context.putImageData(image, 0, 0);
    return canvas.toDataURL('image/png');
  });
  await page.getByLabel('Import dependency image').setInputFiles({ name: 'synthetic-noise.png', mimeType: 'image/png', buffer: Buffer.from(noiseDataUrl.split(',')[1], 'base64') });
  await select('noise');
  const dependency = page.getByRole('combobox', { name: 'Dependency image' });
  const dependencyId = await dependency.locator('option').filter({ hasText: 'synthetic-noise.png' }).getAttribute('value');
  await dependency.selectOption(dependencyId!);
  operations.push({ action: 'import-dependency', name: 'synthetic-noise.png', assetId: dependencyId });

  const tileDataUrl = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const context = canvas.getContext('2d')!;
    context.fillStyle = 'rgba(13, 39, 54, 0.9)';
    context.fillRect(8, 8, 112, 112);
    context.strokeStyle = '#74d6e4';
    context.lineWidth = 4;
    context.strokeRect(10, 10, 108, 108);
    context.fillStyle = '#d6f3f4';
    context.font = 'bold 17px sans-serif';
    context.fillText('CASE 03', 20, 40);
    context.fillStyle = '#36a9b8';
    context.fillRect(20, 54, 76, 7);
    context.fillRect(20, 70, 91, 7);
    context.fillRect(20, 86, 54, 7);
    context.fillStyle = '#f78856';
    context.fillRect(96, 94, 16, 16);
    return canvas.toDataURL('image/png');
  });
  await page.getByLabel('Import preview image').setInputFiles({ name: 'synthetic-evidence-tile.png', mimeType: 'image/png', buffer: Buffer.from(tileDataUrl.split(',')[1], 'base64') });
  operations.push({ action: 'import-preview-source', name: 'synthetic-evidence-tile.png' });

  for (const [from, output, to, input] of [
    ['uv', 'uv', 'distance', 'a'], ['center', 'value', 'distance', 'b'],
    ['uv', 'uv', 'noise', 'uv'], ['noise', 'rgba', 'noiseChannel', 'rgba'],
    ['noiseChannel', 'r', 'noiseShift', 'a'], ['noiseStrength', 'value', 'noiseShift', 'b'],
    ['radius', 'value', 'edgeLimit', 'a'], ['noiseShift', 'value', 'edgeLimit', 'b'],
    ['edgeLimit', 'value', 'outerRadius', 'a'], ['edgeWidth', 'value', 'outerRadius', 'b'],
    ['edgeLimit', 'value', 'smooth', 'low'], ['outerRadius', 'value', 'smooth', 'high'],
    ['distance', 'value', 'smooth', 'x'], ['one', 'value', 'mask', 'a'],
    ['smooth', 'value', 'mask', 'b'], ['source', 'rgba', 'blend', 'a'],
    ['edgeColor', 'color', 'edgeRgba', 'color'], ['edgeRgba', 'rgba', 'blend', 'b'],
    ['smooth', 'value', 'blend', 't'], ['blend', 'value', 'masked', 'vector'],
    ['mask', 'value', 'masked', 'scale'], ['masked', 'value', 'root', 'rgba'],
  ]) await connect(from, output, to, input);

  await expect(page.getByText('Problems 0')).toBeVisible();
  await expect(page.getByText('Preview ready')).toBeVisible();
  await page.getByRole('combobox', { name: 'Preview host' }).selectOption('container');
  await page.getByRole('combobox', { name: 'Preview background' }).selectOption('dark');
  await expect(page.getByText('Preview ready')).toBeVisible();
  const buildId = (await page.getByTestId('preview-build-id').textContent())!;
  async function imageHash() {
    const png = await page.locator('.preview-stage canvas').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL('image/png'));
    return createHash('sha256').update(png).digest('hex');
  }
  const baselineHash = await imageHash();
  await mkdir(visuals, { recursive: true });
  await page.locator('.preview-stage').screenshot({ path: path.join(visuals, 'work03-radial-burn.png') });

  const radiusItem = page.locator('.parameter-item').filter({ has: page.getByRole('button', { name: 'Rename Radius' }) });
  const radiusDefault = radiusItem.getByRole('spinbutton', { name: 'Radius', exact: true });
  await radiusDefault.fill('0.18');
  await radiusDefault.press('Enter');
  await expect(page.getByText('Preview ready')).toBeVisible();
  const changedHash = await imageHash();
  expect(changedHash).not.toBe(baselineHash);
  await page.locator('.preview-stage').screenshot({ path: path.join(visuals, 'work03-radius-change.png') });
  operations.push({ action: 'change-radius-default', from: 0.34, to: 0.18, baselineHash, changedHash });
  await radiusDefault.fill('0.34');
  await radiusDefault.press('Enter');
  await expect(page.getByText('Preview ready')).toBeVisible();
  expect(await imageHash()).toBe(baselineHash);

  await page.getByText('Generated code and bindings').click();
  const manifestDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download manifest' }).click();
  const manifest = JSON.parse(await readFile((await (await manifestDownload).path())!, 'utf8'));
  const glslDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download GLSL' }).click();
  const glsl = await readFile((await (await glslDownload).path())!, 'utf8');
  expect(manifest.buildId).toBe(buildId);
  expect(glsl).toContain('uAsset0');

  const projectDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const project = JSON.parse(await readFile((await (await projectDownload).path())!, 'utf8'));
  project.id = randomUUID();
  project.name = '03 · Radial Burn / Dissolve';
  const positions: Record<string, { x: number; y: number }> = {
    uv: { x: 40, y: 80 }, center: { x: 40, y: 310 }, noise: { x: 40, y: 520 }, noiseChannel: { x: 280, y: 540 },
    noiseStrength: { x: 280, y: 760 }, noiseShift: { x: 520, y: 620 }, radius: { x: 520, y: 810 },
    edgeLimit: { x: 760, y: 670 }, edgeWidth: { x: 760, y: 880 }, outerRadius: { x: 1000, y: 790 },
    distance: { x: 280, y: 160 }, smooth: { x: 1240, y: 490 }, one: { x: 1000, y: 70 },
    mask: { x: 1470, y: 270 }, source: { x: 1000, y: 310 }, edgeColor: { x: 760, y: 1060 },
    edgeRgba: { x: 1000, y: 1060 }, blend: { x: 1470, y: 600 }, masked: { x: 1720, y: 430 }, root: { x: 1970, y: 430 },
  };
  project.layout.nodePositions = Object.fromEntries(Object.entries(nodes).map(([alias, id]) => [id, positions[alias]]));
  project.layout.viewport = { x: 10, y: 10, zoom: 0.5 };
  project.layout.selectedNodeIds = [];
  await mkdir(examples, { recursive: true });
  await mkdir(path.join(examples, 'generated'), { recursive: true });
  const projectPath = path.join(examples, '03-radial-burn.fxweave.json');
  await writeFile(projectPath, `${JSON.stringify(project, null, 2)}\n`, 'utf8');
  await writeFile(path.join(examples, 'generated', '03-radial-burn.frag.glsl'), glsl, 'utf8');
  await writeFile(path.join(examples, 'generated', '03-radial-burn.manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  await writeFile(path.join(examples, '03-radial-burn.creation-log.json'), `${JSON.stringify({
    method: 'Playwright editor UI from Create Filter graph', startedAt: new Date(startedAt).toISOString(),
    durationSeconds: (Date.now() - startedAt) / 1000, buildId, baselineHash, changedHash,
    operations, nodeIds: nodes, dependencyAssetId: dependencyId,
  }, null, 2)}\n`, 'utf8');

  await page.locator('input[aria-label="Import project JSON"]').setInputFiles({ name: '03-radial-burn.fxweave.json', mimeType: 'application/json', buffer: Buffer.from(await readFile(projectPath)) });
  await expect(page.getByText('Preview ready')).toBeVisible();
  await expect(page.getByTestId('preview-build-id')).toHaveText(buildId);
  expect(await imageHash()).toBe(baselineHash);
  await page.screenshot({ path: path.join(visuals, 'work03-workbench.png'), fullPage: true });
});
