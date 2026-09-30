import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

test('capture the three editable examples in the entry gallery', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Start from a finished graph' })).toBeVisible();
  for (const title of ['Radial burn', 'Local melt', 'Hologram scan']) {
    await expect(page.getByRole('button', { name: `Edit a copy of ${title}` })).toBeVisible();
  }
  const output = path.resolve(import.meta.dirname, '..', 'docs', 'visuals');
  await mkdir(output, { recursive: true });
  await page.screenshot({ path: path.join(output, 'phase1-example-gallery.png'), fullPage: true });
});
