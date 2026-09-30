import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const root = process.cwd();
const visualDirectory = resolve(root, 'docs/visuals');
await mkdir(visualDirectory, { recursive: true });

const server = await createServer({
  configFile: resolve(root, 'vite.config.ts'),
  server: { host: '127.0.0.1', port: 4175, strictPort: true },
});
let browser;

try {
  await server.listen();
  browser = await chromium.launch({ channel: 'chrome' });
  const context = await browser.newContext({ viewport: { width: 400, height: 360 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('http://127.0.0.1:4175/tests/fixtures/filter-spike.html');
  await page.waitForFunction(() => window.__filterSpike?.status !== undefined);
  const result = await page.evaluate(() => window.__filterSpike);
  if (result?.status !== 'ready') throw new Error(`WebGL2 spike did not render: ${JSON.stringify(result)}`);
  if (errors.length > 0) throw new Error(`Browser errors: ${errors.join('; ')}`);
  await page.screenshot({ path: resolve(visualDirectory, 'phase1-webgl-spike.png') });

  const unavailable = await context.newPage();
  await unavailable.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (contextId, ...args) {
      if (contextId === 'webgl2') return null;
      return Reflect.apply(original, this, [contextId, ...args]);
    };
  });
  await unavailable.goto('http://127.0.0.1:4175/tests/fixtures/filter-spike.html');
  await unavailable.waitForFunction(() => window.__filterSpike?.status !== undefined);
  const unavailableResult = await unavailable.evaluate(() => window.__filterSpike);
  if (unavailableResult?.status !== 'unavailable') throw new Error(`WebGL2 fallback status was wrong: ${JSON.stringify(unavailableResult)}`);
  await unavailable.screenshot({ path: resolve(visualDirectory, 'phase1-webgl-unavailable.png') });

  await writeFile(resolve(visualDirectory, 'phase1-webgl-spike.json'), `${JSON.stringify({ pixiVersion: '8.21.0', browser: await browser.version(), viewport: '400x360', result, unavailable: unavailableResult }, null, 2)}\n`);
  process.stdout.write('Captured real WebGL2 pixel probes and unavailable-state screenshots.\n');
} finally {
  await browser?.close();
  await server.close();
}
