import { expect, test } from '@playwright/test';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const examples = path.join(root, 'examples');
const visuals = path.join(root, 'docs', 'visuals');

test('create 09 local hologram scan from an empty editor graph and capture its generated artifact', async ({ page }) => {
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
  async function expose(alias: string, name: string, range?: [number, number]) {
    await select(alias);
    await page.locator('.inspector-content').getByRole('button', { name: 'Expose as parameter' }).click();
    const item = page.locator('.parameter-item').last();
    await item.getByRole('button', { name: /^Rename/ }).click();
    const input = item.getByRole('textbox', { name: 'Parameter name' });
    await input.fill(name);
    await input.press('Enter');
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

  for (const [alias, label] of [
    ['uv', 'Filter UV'], ['splitUv', 'Split Vector 2'], ['time', 'Time'],
    ['frequency', 'Number'], ['yFrequency', 'Multiply'], ['speed', 'Number'],
    ['timeSpeed', 'Multiply'], ['phase', 'Add'], ['sine', 'Sine'],
    ['one', 'Number'], ['sinPlusOne', 'Add'], ['half', 'Number'], ['wave01', 'Multiply'],
    ['low', 'Number'], ['high', 'Number'], ['smooth', 'Smoothstep'],
    ['intensity', 'Number'], ['scanAmount', 'Multiply'], ['brightness', 'Subtract'],
    ['source', 'Source RGBA'], ['channelOffset', 'Vector 2'], ['redUv', 'Add Vector 2'],
    ['redSample', 'Sample Source'], ['baseSplit', 'Split RGBA'], ['redSplit', 'Split RGBA'],
    ['redPremul', 'Multiply'], ['compose', 'Compose Vector 4'], ['dimmed', 'Scale Vector 4'],
  ]) await add(alias, label);
  await value('frequency', '72');
  await value('speed', '3');
  await value('one', '1');
  await value('half', '0.5');
  await value('low', '0.72');
  await value('high', '0.9');
  await value('intensity', '0.32');
  await value('channelOffset', '0.015, 0');
  await expose('frequency', 'Line frequency', [20, 120]);
  await expose('speed', 'Scan speed', [-10, 10]);
  await expose('intensity', 'Scan intensity', [0, 0.6]);
  await expose('channelOffset', 'Red channel offset');

  for (const [from, output, to, input] of [
    ['uv', 'uv', 'splitUv', 'vector'], ['splitUv', 'y', 'yFrequency', 'a'],
    ['frequency', 'value', 'yFrequency', 'b'], ['time', 'seconds', 'timeSpeed', 'a'],
    ['speed', 'value', 'timeSpeed', 'b'], ['yFrequency', 'value', 'phase', 'a'],
    ['timeSpeed', 'value', 'phase', 'b'], ['phase', 'value', 'sine', 'x'],
    ['sine', 'value', 'sinPlusOne', 'a'], ['one', 'value', 'sinPlusOne', 'b'],
    ['sinPlusOne', 'value', 'wave01', 'a'], ['half', 'value', 'wave01', 'b'],
    ['low', 'value', 'smooth', 'low'], ['high', 'value', 'smooth', 'high'],
    ['wave01', 'value', 'smooth', 'x'], ['smooth', 'value', 'scanAmount', 'a'],
    ['intensity', 'value', 'scanAmount', 'b'], ['one', 'value', 'brightness', 'a'],
    ['scanAmount', 'value', 'brightness', 'b'], ['uv', 'uv', 'redUv', 'a'],
    ['channelOffset', 'value', 'redUv', 'b'], ['redUv', 'value', 'redSample', 'uv'],
    ['source', 'rgba', 'baseSplit', 'rgba'], ['redSample', 'rgba', 'redSplit', 'rgba'],
    ['redSplit', 'r', 'redPremul', 'a'], ['baseSplit', 'a', 'redPremul', 'b'],
    ['redPremul', 'value', 'compose', 'x'], ['baseSplit', 'g', 'compose', 'y'],
    ['baseSplit', 'b', 'compose', 'z'], ['baseSplit', 'a', 'compose', 'w'],
    ['compose', 'value', 'dimmed', 'vector'], ['brightness', 'value', 'dimmed', 'scale'],
    ['dimmed', 'value', 'root', 'rgba'],
  ]) await connect(from, output, to, input);

  const tileDataUrl = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const context = canvas.getContext('2d')!;
    context.fillStyle = 'rgba(5, 28, 43, 0.9)';
    context.fillRect(8, 8, 112, 112);
    context.strokeStyle = '#53d4de';
    context.lineWidth = 3;
    context.strokeRect(10, 10, 108, 108);
    context.fillStyle = '#e8ffff';
    context.font = 'bold 18px sans-serif';
    context.fillText('HOLO 09', 18, 39);
    context.fillStyle = '#4ccad4';
    for (let y = 55; y < 105; y += 10) context.fillRect(19, y, 76 + y % 20, 3);
    context.fillStyle = '#f46478';
    context.fillRect(96, 55, 14, 47);
    return canvas.toDataURL('image/png');
  });
  await page.getByLabel('Import preview image').setInputFiles({ name: 'synthetic-terminal-panel.png', mimeType: 'image/png', buffer: Buffer.from(tileDataUrl.split(',')[1], 'base64') });
  operations.push({ action: 'import-preview-source', name: 'synthetic-terminal-panel.png' });
  await page.getByRole('combobox', { name: 'Preview host' }).selectOption('sprite');
  await page.getByRole('combobox', { name: 'Preview background' }).selectOption('dark');
  await page.getByRole('spinbutton', { name: 'Fixed preview time' }).fill('0.5');
  await expect(page.getByText('Problems 0')).toBeVisible();
  await expect(page.getByText('Preview ready')).toBeVisible();
  const buildId = (await page.getByTestId('preview-build-id').textContent())!;
  async function imageHash() {
    const png = await page.locator('.preview-stage canvas').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL('image/png'));
    return createHash('sha256').update(png).digest('hex');
  }
  const baselineHash = await imageHash();
  await mkdir(visuals, { recursive: true });
  await page.locator('.preview-stage').screenshot({ path: path.join(visuals, 'work09-hologram-scan.png') });
  await page.getByRole('spinbutton', { name: 'Fixed preview time' }).fill('1.4');
  const changedHash = await imageHash();
  expect(changedHash).not.toBe(baselineHash);
  await page.locator('.preview-stage').screenshot({ path: path.join(visuals, 'work09-time-change.png') });
  operations.push({ action: 'set-fixed-time', from: 0.5, to: 1.4, baselineHash, changedHash });
  await page.getByRole('spinbutton', { name: 'Fixed preview time' }).fill('0.5');
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
  project.name = '09 · Local Hologram Scan';
  const positions: Record<string, { x: number; y: number }> = {
    uv: { x: 40, y: 100 }, splitUv: { x: 260, y: 90 }, frequency: { x: 260, y: 290 },
    yFrequency: { x: 480, y: 170 }, time: { x: 260, y: 510 }, speed: { x: 260, y: 680 },
    timeSpeed: { x: 480, y: 550 }, phase: { x: 700, y: 300 }, sine: { x: 920, y: 300 },
    one: { x: 700, y: 70 }, sinPlusOne: { x: 1140, y: 300 }, half: { x: 920, y: 70 },
    wave01: { x: 1360, y: 300 }, low: { x: 1140, y: 70 }, high: { x: 1360, y: 70 },
    smooth: { x: 1580, y: 200 }, intensity: { x: 1360, y: 510 }, scanAmount: { x: 1800, y: 300 },
    brightness: { x: 2020, y: 250 }, source: { x: 40, y: 1010 }, channelOffset: { x: 260, y: 790 },
    redUv: { x: 480, y: 820 }, redSample: { x: 700, y: 820 }, baseSplit: { x: 260, y: 1060 },
    redSplit: { x: 920, y: 820 }, redPremul: { x: 1140, y: 820 }, compose: { x: 1580, y: 900 },
    dimmed: { x: 2020, y: 800 }, root: { x: 2240, y: 800 },
  };
  project.layout.nodePositions = Object.fromEntries(Object.entries(nodes).map(([alias, id]) => [id, positions[alias]]));
  project.layout.viewport = { x: 10, y: 10, zoom: 0.5 };
  project.layout.selectedNodeIds = [];
  await mkdir(path.join(examples, 'generated'), { recursive: true });
  const projectPath = path.join(examples, '09-hologram-scan.fxweave.json');
  await writeFile(projectPath, `${JSON.stringify(project, null, 2)}\n`, 'utf8');
  await writeFile(path.join(examples, 'generated', '09-hologram-scan.frag.glsl'), glsl, 'utf8');
  await writeFile(path.join(examples, 'generated', '09-hologram-scan.manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  await writeFile(path.join(examples, '09-hologram-scan.creation-log.json'), `${JSON.stringify({
    method: 'Playwright editor UI from Create Filter graph', startedAt: new Date(startedAt).toISOString(),
    durationSeconds: (Date.now() - startedAt) / 1000, buildId, baselineHash, changedHash, operations, nodeIds: nodes,
  }, null, 2)}\n`, 'utf8');
  await page.locator('input[aria-label="Import project JSON"]').setInputFiles({ name: '09-hologram-scan.fxweave.json', mimeType: 'application/json', buffer: Buffer.from(await readFile(projectPath)) });
  await expect(page.getByText('Preview ready')).toBeVisible();
  await expect(page.getByTestId('preview-build-id')).toHaveText(buildId);
  expect(await imageHash()).toBe(baselineHash);
  await page.screenshot({ path: path.join(visuals, 'work09-workbench.png'), fullPage: true });
});
