import { expect, test } from '@playwright/test';
import path from 'node:path';

for (const width of [1440, 390]) test(`capture Phase 3 homepage at ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Shape the effect. See it come alive.' })).toBeVisible();
  await page.locator('.entry-shell img').evaluateAll(async (images) => {
    await Promise.all(images.map((image) => (image as HTMLImageElement).decode()));
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: path.resolve(`docs/visuals/phase3-home-${width}.png`), fullPage: true });
});
