import { expect, test } from '@playwright/test';

test('edits a Filter source path and rejects a UV-to-RGBA connection', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Filter graph' }).click();
  await page.getByRole('button', { name: 'Select Filter Output node' }).click();
  await expect(page.getByRole('button', { name: 'Delete selected' })).toBeDisabled();
  await page.getByRole('searchbox', { name: 'Search nodes' }).fill('Source RGBA');
  await page.locator('.library-list button').filter({ hasText: 'Source RGBA' }).click();
  await page.getByRole('button', { name: 'Source RGBA RGBA output, vec4' }).click();
  await page.getByRole('button', { name: 'Filter Output RGBA input, vec4' }).click();
  await expect(page.getByText('Problems 0')).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search nodes' }).fill('Filter UV');
  await page.locator('.library-list button').filter({ hasText: 'Filter UV' }).click();
  await page.getByRole('button', { name: 'Filter UV UV output, vec2' }).click();
  await page.getByRole('button', { name: 'Filter Output RGBA input, vec4' }).click();
  await expect(page.getByRole('alert')).toContainText('vec2 cannot connect to vec4');
  await expect(page.locator('.connection-path')).toHaveCount(1);
});
