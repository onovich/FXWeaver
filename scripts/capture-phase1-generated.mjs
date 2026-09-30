import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const root = process.cwd();
const visualDirectory = resolve(root, 'docs/visuals');
await mkdir(visualDirectory, { recursive: true });
const server = await createServer({
  configFile: resolve(root, 'vite.config.ts'),
  server: { host: '127.0.0.1', port: 4176, strictPort: true },
});
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 400, height: 280 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('http://127.0.0.1:4176/tests/fixtures/generated-filter.html');
  await page.waitForFunction(() => window.__generatedSpike?.status !== undefined);
  const result = await page.evaluate(() => window.__generatedSpike);
  if (result?.status !== 'ready' || result.invalidShader?.code !== 'FRAGMENT_COMPILE' ||
      !result.invalidShader.nodeIds?.includes('source') || errors.length > 0) {
    throw new Error(`Generated Filter probe failed: ${JSON.stringify({ result, errors })}`);
  }
  await page.screenshot({ path: resolve(visualDirectory, 'phase1-generated-filter.png') });
  await writeFile(resolve(visualDirectory, 'phase1-generated-filter.json'),
    `${JSON.stringify({ pixiVersion: '8.21.0', browser: await browser.version(), result }, null, 2)}\n`);
  process.stdout.write('Captured generated Filter WebGL2 pixels and diagnostics.\n');
} finally {
  await browser?.close();
  await server.close();
}
