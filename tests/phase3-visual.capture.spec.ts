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

for (const width of [1920, 1024]) test(`capture usable studio at ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Edit a copy of Radial burn' }).click();
  await expect(page.getByText('Preview ready')).toBeVisible();
  await page.getByRole('button', { name: 'Fit all nodes', exact: true }).click();
  await page.getByRole('button', { name: 'Select Number node', exact: true }).first().click();
  await page.screenshot({ path: path.resolve(`docs/visuals/phase3-studio-${width}.png`) });
});

test('capture unified Filter workbench, properties, generated result and enlarged preview', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Edit a copy of Hologram scan' }).click();
  await expect(page.getByText('Preview ready')).toBeVisible();
  await expect(page.locator('.problem-context')).toHaveText('Filter graph · WebGL2');
  await page.getByRole('button', { name: 'Select Filter Output node' }).click();
  await page.getByRole('button', { name: 'Fit all nodes', exact: true }).click();
  await page.screenshot({ path: path.resolve('docs/visuals/phase3-studio-1440.png') });
  await page.getByRole('button', { name: 'Enlarge preview' }).click();
  await page.getByText('Generated code and bindings').click();
  await page.locator('.generated-output').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.resolve('docs/visuals/phase3-generated-output.png') });
  await page.getByRole('button', { name: 'Split', exact: true }).scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Split', exact: true }).click();
  await page.screenshot({ path: path.resolve('docs/visuals/phase3-enlarged-preview.png') });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Return to project entry' }).click();
  await page.getByRole('button', { name: 'Create Filter graph' }).click();
  await expect(page.getByText('Preview unavailable')).toBeVisible();
  await page.screenshot({ path: path.resolve('docs/visuals/phase3-empty-filter.png') });
});
