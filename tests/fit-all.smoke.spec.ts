import { expect, test } from '@playwright/test';

for (const title of ['Radial burn', 'Local melt', 'Hologram scan']) test(`fit all ${title} nodes without changing generated semantics`, async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await page.getByRole('button', { name: `Edit a copy of ${title}` }).click();
  await expect(page.getByText('Preview ready')).toBeVisible();
  await page.getByText('Generated code and bindings').click();
  const buildId = await page.getByTestId('preview-build-id').innerText();
  const glsl = await page.getByTestId('generated-glsl').innerText();
  const world = page.locator('.canvas-world'); const originalStyle = await world.getAttribute('style');
  const search = page.getByRole('searchbox', { name: 'Search nodes' });
  await search.fill(''); await search.press('f');
  await expect(search).toHaveValue('f'); await expect(world).toHaveAttribute('style', originalStyle!);
  await page.getByRole('button', { name: 'Fit all nodes', exact: true }).click();
  const inBounds = () => page.locator('.graph-canvas').evaluate((canvas) => {
    const area = canvas.getBoundingClientRect();
    return [...canvas.querySelectorAll('.canvas-node')].every((node) => {
      const box = node.getBoundingClientRect();
      return box.left >= area.left + 30 && box.top >= area.top + 30 && box.right <= area.right - 30 && box.bottom <= area.bottom - 30;
    });
  });
  await expect.poll(inBounds).toBe(true);
  await expect(page.getByTestId('preview-build-id')).toHaveText(buildId);
  expect(await page.getByTestId('generated-glsl').innerText()).toBe(glsl);
  await page.getByRole('button', { name: 'Restore view' }).click();
  await expect(world).toHaveAttribute('style', originalStyle!);
  await page.getByRole('heading', { name: 'Node canvas' }).click(); await page.keyboard.press('f');
  await expect.poll(inBounds).toBe(true);
  const fittedStyle = await world.getAttribute('style');
  await page.getByRole('button', { name: 'Enlarge preview' }).click(); await page.keyboard.press('f');
  await expect(world).toHaveAttribute('style', fittedStyle!);
  await page.keyboard.press('Escape');
});
