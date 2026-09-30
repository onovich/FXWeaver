import { expect, test } from '@playwright/test';

for (const width of [1920, 1024]) test(`studio at ${width} keeps file actions and node editing usable`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Edit a copy of Radial burn' }).click();
  await expect(page.getByText('Preview ready')).toBeVisible();
  for (const name of ['Save', 'Save As', 'Export JSON']) {
    const box = (await page.getByRole('button', { name, exact: true }).boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(width);
  }
  await page.getByRole('searchbox', { name: 'Search nodes' }).fill('Number');
  const add = page.locator('.library-list').getByRole('button', { name: 'Number', exact: true });
  await add.focus(); await page.keyboard.press('Enter');
  const property = page.locator('.inspector-content').getByRole('spinbutton', { name: 'Value' });
  await property.fill('0.6'); await property.press('Enter'); await expect(property).toHaveValue('0.6');
  await page.getByRole('button', { name: 'Fit all nodes', exact: true }).click();
  await page.getByRole('button', { name: 'Enlarge preview' }).click();
  await page.getByText('Generated code and bindings').click();
  const download = page.getByRole('button', { name: 'Download GLSL', exact: true });
  await download.scrollIntoViewIfNeeded();
  const box = (await download.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(width);
  const event = page.waitForEvent('download'); await download.click(); expect((await event).suggestedFilename()).toMatch(/\.frag\.glsl$/);
  await page.keyboard.press('Escape'); await expect(page.getByRole('button', { name: 'Enlarge preview' })).toBeFocused();
  await expect(page.locator('.problem-context')).toHaveText('Filter graph · WebGL2');
});
