import { expect, test } from '@playwright/test';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const examples = path.join(root, 'examples');
const visuals = path.join(root, 'docs', 'visuals');

test('create 05 local melt from an empty editor graph and capture its generated artifact', async ({ page }) => {
  test.setTimeout(180_000);
  const startedAt = Date.now();
  const operations: unknown[] = [];
  const nodes: Record<string, string> = {};
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Filter graph' }).click();
  nodes.root = (await page.locator('.canvas-node').first().getAttribute('data-node-id'))!;

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
  async function expose(alias: string, name: string, range: [number, number]) {
    await select(alias);
    await page.locator('.inspector-content').getByRole('button', { name: 'Expose as parameter' }).click();
    const item = page.locator('.parameter-item').last();
    await item.getByRole('button', { name: /^Rename/ }).click();
    const input = item.getByRole('textbox', { name: 'Parameter name' });
    await input.fill(name);
    await input.press('Enter');
    await item.getByRole('spinbutton', { name: 'Slider minimum' }).fill(String(range[0]));
    await item.getByRole('spinbutton', { name: 'Slider maximum' }).fill(String(range[1]));
    await item.getByRole('button', { name: 'Set range' }).click();
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

  for (const [alias, label] of [
    ['uv', 'Filter UV'], ['splitUv', 'Split Vector 2'], ['time', 'Time'],
    ['frequency', 'Number'], ['yFrequency', 'Multiply'], ['speed', 'Number'],
    ['timeSpeed', 'Multiply'], ['phase', 'Add'], ['sine', 'Sine'],
    ['amplitude', 'Number'], ['waveAmplitude', 'Multiply'], ['strength', 'Number'],
    ['displacement', 'Multiply'], ['zero', 'Number'], ['offset', 'Compose Vector 2'],
    ['distortedUv', 'Add Vector 2'], ['sample', 'Sample Source'],
  ]) await add(alias, label);
  await value('frequency', '16');
  await value('speed', '2');
  await value('amplitude', '0.08');
  await value('strength', '1');
  await value('zero', '0');
  await expose('frequency', 'Frequency', [0, 40]);
  await expose('speed', 'Speed', [-10, 10]);
  await expose('amplitude', 'Amplitude', [0, 0.25]);
  await expose('strength', 'Strength', [0, 1]);

  for (const [from, output, to, input] of [
    ['uv', 'uv', 'splitUv', 'vector'], ['splitUv', 'y', 'yFrequency', 'a'],
    ['frequency', 'value', 'yFrequency', 'b'], ['time', 'seconds', 'timeSpeed', 'a'],
    ['speed', 'value', 'timeSpeed', 'b'], ['yFrequency', 'value', 'phase', 'a'],
    ['timeSpeed', 'value', 'phase', 'b'], ['phase', 'value', 'sine', 'x'],
    ['sine', 'value', 'waveAmplitude', 'a'], ['amplitude', 'value', 'waveAmplitude', 'b'],
    ['waveAmplitude', 'value', 'displacement', 'a'], ['strength', 'value', 'displacement', 'b'],
    ['displacement', 'value', 'offset', 'x'], ['zero', 'value', 'offset', 'y'],
    ['uv', 'uv', 'distortedUv', 'a'], ['offset', 'value', 'distortedUv', 'b'],
    ['distortedUv', 'value', 'sample', 'uv'], ['sample', 'rgba', 'root', 'rgba'],
  ]) await connect(from, output, to, input);

  const tileDataUrl = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const context = canvas.getContext('2d')!;
    context.fillStyle = 'rgba(12, 45, 52, 0.95)';
    context.fillRect(5, 5, 118, 118);
    context.fillStyle = '#49d8c0';
    for (let y = 10; y < 120; y += 14) context.fillRect(8, y, 112, 4);
    context.fillStyle = '#153647';
    context.fillRect(15, 15, 98, 42);
    context.fillStyle = '#e7f7ed';
    context.font = 'bold 20px sans-serif';
    context.fillText('MELT 05', 19, 43);
    context.strokeStyle = '#8bf0d7';
    context.lineWidth = 3;
    context.strokeRect(6, 6, 116, 116);
    return canvas.toDataURL('image/png');
  });
  await page.getByLabel('Import preview image').setInputFiles({ name: 'synthetic-transition-card.png', mimeType: 'image/png', buffer: Buffer.from(tileDataUrl.split(',')[1], 'base64') });
  operations.push({ action: 'import-preview-source', name: 'synthetic-transition-card.png' });
  await page.getByRole('combobox', { name: 'Preview host' }).selectOption('container');
  await page.getByRole('combobox', { name: 'Preview background' }).selectOption('dark');
  await page.getByRole('spinbutton', { name: 'Fixed preview time' }).fill('0.75');
  await expect(page.getByText('Problems 0')).toBeVisible();
  await expect(page.getByText('Preview ready')).toBeVisible();
  const buildId = (await page.getByTestId('preview-build-id').textContent())!;
  async function imageHash() {
    const png = await page.locator('.preview-stage canvas').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL('image/png'));
    return createHash('sha256').update(png).digest('hex');
  }
  const baselineHash = await imageHash();
  await mkdir(visuals, { recursive: true });
  await page.locator('.preview-stage').screenshot({ path: path.join(visuals, 'work05-local-melt.png') });
  await page.getByRole('spinbutton', { name: 'Fixed preview time' }).fill('1.2');
  const changedHash = await imageHash();
  expect(changedHash).not.toBe(baselineHash);
  await page.locator('.preview-stage').screenshot({ path: path.join(visuals, 'work05-time-change.png') });
  operations.push({ action: 'set-fixed-time', from: 0.75, to: 1.2, baselineHash, changedHash });
  await page.getByRole('spinbutton', { name: 'Fixed preview time' }).fill('0.75');
  expect(await imageHash()).toBe(baselineHash);

  await page.getByText('Generated code and bindings').click();
  const manifestDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download manifest' }).click();
  const manifest = JSON.parse(await readFile((await (await manifestDownload).path())!, 'utf8'));
  const glslDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download GLSL' }).click();
  const glsl = await readFile((await (await glslDownload).path())!, 'utf8');
  expect(manifest.buildId).toBe(buildId);
  expect(manifest.usesTime).toBe(true);
  expect(glsl).toContain('fxSampleSource');

  const projectDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const project = JSON.parse(await readFile((await (await projectDownload).path())!, 'utf8'));
  project.id = randomUUID();
  project.name = '05 · Local Melt / Wave Distortion';
  const positions: Record<string, { x: number; y: number }> = {
    uv: { x: 40, y: 110 }, splitUv: { x: 280, y: 100 }, frequency: { x: 280, y: 290 },
    yFrequency: { x: 530, y: 180 }, time: { x: 280, y: 510 }, speed: { x: 280, y: 680 },
    timeSpeed: { x: 530, y: 540 }, phase: { x: 780, y: 300 }, sine: { x: 1020, y: 300 },
    amplitude: { x: 780, y: 540 }, waveAmplitude: { x: 1250, y: 380 }, strength: { x: 1020, y: 620 },
    displacement: { x: 1250, y: 520 }, zero: { x: 1250, y: 730 }, offset: { x: 1490, y: 550 },
    distortedUv: { x: 1730, y: 300 }, sample: { x: 1970, y: 300 }, root: { x: 2210, y: 300 },
  };
  project.layout.nodePositions = Object.fromEntries(Object.entries(nodes).map(([alias, id]) => [id, positions[alias]]));
  project.layout.viewport = { x: 10, y: 10, zoom: 0.5 };
  project.layout.selectedNodeIds = [];
  await mkdir(path.join(examples, 'generated'), { recursive: true });
  const projectPath = path.join(examples, '05-local-melt.fxweave.json');
  await writeFile(projectPath, `${JSON.stringify(project, null, 2)}\n`, 'utf8');
  await writeFile(path.join(examples, 'generated', '05-local-melt.frag.glsl'), glsl, 'utf8');
  await writeFile(path.join(examples, 'generated', '05-local-melt.manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  await writeFile(path.join(examples, '05-local-melt.creation-log.json'), `${JSON.stringify({
    method: 'Playwright editor UI from Create Filter graph', startedAt: new Date(startedAt).toISOString(),
    durationSeconds: (Date.now() - startedAt) / 1000, buildId, baselineHash, changedHash, operations, nodeIds: nodes,
  }, null, 2)}\n`, 'utf8');
  await page.locator('input[aria-label="Import project JSON"]').setInputFiles({ name: '05-local-melt.fxweave.json', mimeType: 'application/json', buffer: Buffer.from(await readFile(projectPath)) });
  await expect(page.getByText('Preview ready')).toBeVisible();
  await expect(page.getByTestId('preview-build-id')).toHaveText(buildId);
  expect(await imageHash()).toBe(baselineHash);
  await page.screenshot({ path: path.join(visuals, 'work05-workbench.png'), fullPage: true });
});
