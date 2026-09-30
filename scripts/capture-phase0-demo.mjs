import { mkdir, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const root = process.cwd();
const visualDirectory = resolve(root, 'docs/visuals');
const videoDirectory = resolve(root, 'test-results/demo-video');
await mkdir(videoDirectory, { recursive: true });

const server = await createServer({
  configFile: resolve(root, 'vite.config.ts'),
  server: { host: '127.0.0.1', port: 4174, strictPort: true },
});
let browser;

try {
  await server.listen();
  browser = await chromium.launch({ channel: 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, recordVideo: { dir: videoDirectory, size: { width: 1366, height: 768 } } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('http://127.0.0.1:4174/');
  await page.getByRole('button', { name: 'Create test graph' }).click();
  await page.waitForTimeout(300);
  await page.getByRole('searchbox', { name: 'Search nodes' }).fill('Number');
  await page.locator('.library-list button').filter({ hasText: 'Number' }).click();
  const source = await page.getByRole('button', { name: 'Number Value output, float' }).boundingBox();
  const target = await page.getByRole('button', { name: 'Test Output Value input, float' }).boundingBox();
  if (!source || !target) throw new Error('Demo ports are not visible.');
  await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
  await page.mouse.down();
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 14 });
  await page.mouse.up();
  await page.getByText('Problems 0').waitFor();
  const amount = page.locator('.inspector-content').getByRole('spinbutton', { name: 'Value' });
  await amount.fill('4.5');
  await amount.press('Enter');
  await page.getByRole('button', { name: 'Expose as parameter' }).click();
  await page.waitForTimeout(350);
  await page.screenshot({ path: resolve(visualDirectory, 'phase0-workbench.png') });

  await page.getByRole('searchbox', { name: 'Search nodes' }).fill('Vector 2');
  await page.locator('.library-list button').filter({ hasText: 'Vector 2' }).click();
  await page.getByRole('button', { name: 'Vector 2 Value output, vec2' }).click();
  await page.getByRole('button', { name: 'Test Output Value input, float' }).click();
  await page.getByRole('alert').waitFor();
  await page.waitForTimeout(350);
  await page.screenshot({ path: resolve(visualDirectory, 'phase0-rejected-connection.png') });
  if (errors.length > 0) throw new Error(`Browser errors during demo: ${errors.join('; ')}`);

  const video = page.video();
  await context.close();
  if (video) await copyFile(await video.path(), resolve(visualDirectory, 'phase0-demo.webm'));
  process.stdout.write('Captured Phase 0 workbench, rejection screenshot, and browser video.\n');
} finally {
  await browser?.close();
  await server.close();
}
