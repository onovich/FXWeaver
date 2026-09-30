import { expect, test } from '@playwright/test';

test('PixiJS custom Filter compiles and draws in real WebGL2', async ({ page }) => {
  await page.goto('/tests/fixtures/filter-spike.html');
  await expect(page.getByRole('status')).toContainText('pixel probes recorded');
  const result = await page.evaluate(() => window.__filterSpike);
  expect(result?.status).toBe('ready');
  expect(result?.glVersion).toContain('WebGL 2.0');
  expect(result?.original?.[0]).toBeGreaterThan(240);
  expect(result?.original?.[3]).toBeGreaterThan(110);
  expect(result?.filtered?.[0]).toBeLessThan(160);
  expect(result?.filtered?.[0]).toBeGreaterThan(90);
  expect(result?.filtered?.[3]).toBe(result?.original?.[3]);
  expect(result?.maskedOut?.[0]).toBe(0);
  expect(result?.noPadding?.[3]).toBe(0);
  expect(result?.withPadding?.[1]).toBeGreaterThan(220);
  expect(result?.withPadding?.[3]).toBeGreaterThan(110);
  expect(result?.uvRight?.[0]).toBeGreaterThan((result?.uvLeft?.[0] ?? 0) + 100);
  expect(result?.uvLeft?.[2]).toBeGreaterThan(0);
  expect(result?.sourceInside).toEqual(result?.original);
  expect(result?.sourceOutside?.[3]).toBe(0);
  expect(result?.extraNearest?.[2]).toBeGreaterThan(240);
  expect(result?.extraNearest?.[0]).toBeLessThan(10);
  expect(result?.extraLinear?.[0]).toBeGreaterThan(110);
  expect(result?.extraLinear?.[2]).toBeGreaterThan(110);
  expect(result?.extraOutside?.[3]).toBe(0);
  expect(result?.invalidShader).toContain('Could not initialize shader');
  await page.screenshot({ path: 'test-results/webgl-spike.png' });
});

test('unavailable WebGL2 has an explicit status', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, contextId: string, ...args: unknown[]) {
      if (contextId === 'webgl2') return null;
      return Reflect.apply(original, this, [contextId, ...args]) as RenderingContext | null;
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto('/tests/fixtures/filter-spike.html');
  await expect(page.getByRole('status')).toContainText('WebGL2 unavailable');
  expect(await page.evaluate(() => window.__filterSpike?.status)).toBe('unavailable');
});
