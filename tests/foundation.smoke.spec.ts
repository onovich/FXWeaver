import { expect, test } from '@playwright/test';

for (const viewport of [{ width: 1920, height: 1080 }, { width: 1366, height: 768 }]) {
  test(`opens the graph workbench at ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page).toHaveTitle('FXWeave — Game Shader Studio');
    await page.getByRole('button', { name: 'Create test graph' }).click();
    await expect(page.getByRole('heading', { name: 'Node canvas' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nodes' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Preview' })).toBeVisible();
    await expect(page.getByText('Renderer not configured')).toBeVisible();
    await expect(page.getByText('Draft only · Not saved to file')).toBeVisible();
    await expect(page.getByText('Problems 1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    await expect(page.getByText('Build OK')).toHaveCount(0);
  });
}
