import { expect, test } from '@playwright/test';
import path from 'node:path';

test('capture public synthetic example with fit and enlarged preview', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Edit a copy of Hologram scan' }).click();
  await expect(page.getByText('Preview ready')).toBeVisible();
  await page.getByRole('button', { name: 'Fit all nodes', exact: true }).click();
  await page.screenshot({ path: path.resolve('docs/visuals/phase2-fit-all.png') });
  await page.getByRole('button', { name: 'Enlarge preview' }).click();
  await page.getByRole('button', { name: 'Split', exact: true }).click();
  await page.screenshot({ path: path.resolve('docs/visuals/phase2-enlarged-preview.png') });
});
