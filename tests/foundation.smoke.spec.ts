import { expect, test } from '@playwright/test';

test('opens the editor foundation without implying a renderer exists', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('FXWeave — Game Shader Studio');
  await expect(page.getByRole('heading', { name: 'Editor foundation' })).toBeVisible();
  await expect(page.getByText('No renderer is configured yet.')).toBeVisible();
});
