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
    await expect(page.locator('.file-state')).toContainText(/Draft only|Recovery draft saved/);
    await expect(page.getByText('Problems 1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    await expect(page.getByText('Build OK')).toHaveCount(0);
  });
}

test('edits a typed test graph and explains a rejected connection', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Create test graph' }).click();

  await page.getByRole('searchbox', { name: 'Search nodes' }).fill('Number');
  await page.locator('.library-list button').filter({ hasText: 'Number' }).click();
  await expect(page.getByText('2 nodes')).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search nodes' }).fill('Vector 2');
  await page.locator('.library-list button').filter({ hasText: 'Vector 2' }).click();
  await page.getByRole('button', { name: 'Vector 2 Value output, vec2' }).click();
  await page.getByRole('button', { name: 'Test Output Value input, float' }).click();
  await expect(page.getByRole('alert')).toContainText('vec2 cannot connect to float');
  await expect(page.getByText('Problems 1')).toBeVisible();

  await page.getByRole('button', { name: 'Number Value output, float' }).click();
  await page.getByRole('button', { name: 'Test Output Value input, float' }).click();
  await expect(page.getByText('Problems 0')).toBeVisible();
  await expect(page.locator('.connection-path')).toHaveCount(1);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByText('Problems 1')).toBeVisible();
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect(page.getByText('Problems 0')).toBeVisible();

  const number = page.locator('.canvas-node').filter({ has: page.getByRole('button', { name: 'Select Number node' }) });
  const before = await number.boundingBox();
  if (!before) throw new Error('Number node is not visible');
  await page.getByRole('button', { name: 'Select Number node' }).hover();
  await page.mouse.down();
  await page.mouse.move(before.x + 130, before.y + 100, { steps: 8 });
  await page.mouse.up();
  const after = await number.boundingBox();
  expect(after?.x).toBeGreaterThan(before.x + 20);

  await page.getByRole('button', { name: 'Zoom in' }).click();
  await expect(page.getByLabel('Canvas zoom')).toHaveText('125%');
  const world = page.locator('.canvas-world');
  const canvas = page.getByLabel('Node graph canvas');
  await canvas.hover({ position: { x: 25, y: 25 } });
  await page.mouse.wheel(0, -300);
  await expect(page.getByLabel('Canvas zoom')).not.toHaveText('125%');
  const transformBefore = await world.getAttribute('style');
  const canvasBox = await canvas.boundingBox();
  if (!canvasBox) throw new Error('Canvas is not visible');
  await page.mouse.move(canvasBox.x + 15, canvasBox.y + 15);
  await page.mouse.down();
  await page.mouse.move(canvasBox.x + 50, canvasBox.y + 45, { steps: 4 });
  await page.mouse.up();
  expect(await world.getAttribute('style')).not.toBe(transformBefore);
  expect(consoleErrors).toEqual([]);
});

test('focuses a problem and edits one source value through inspector and exposed parameter', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Create test graph' }).click();
  await page.getByRole('button', { name: 'Problems 1' }).click();
  await page.locator('.problem-list button').first().click();
  await expect(page.locator('.canvas-node.selected')).toContainText('Test Output');
  await expect(page.locator('.inspector-content')).toContainText('Test Output');

  await page.getByRole('searchbox', { name: 'Search nodes' }).fill('Number');
  await page.locator('.library-list button').filter({ hasText: 'Number' }).click();
  const inspectorValue = page.locator('.inspector-content').getByRole('spinbutton', { name: 'Value' });
  await inspectorValue.fill('5');
  await inspectorValue.press('Enter');
  await expect(inspectorValue).toHaveValue('5');
  await page.getByRole('button', { name: 'Expose as parameter' }).click();
  await expect(page.locator('.inspector-content')).toContainText('Linked to Value');
  const parameterValue = page.locator('.parameter-section').getByRole('spinbutton', { name: 'Value' });
  await parameterValue.fill('7');
  await parameterValue.press('Enter');
  await expect(parameterValue).toHaveValue('7');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(parameterValue).toHaveValue('5');
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect(parameterValue).toHaveValue('7');

  await parameterValue.fill('999');
  await parameterValue.press('Enter');
  await expect(page.getByText('Value rejected; the previous value is preserved.')).toBeVisible();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(parameterValue).toHaveValue('5');
  await page.getByRole('button', { name: 'Rename Value' }).click();
  const parameterName = page.locator('.parameter-section').getByRole('textbox', { name: 'Parameter name' });
  await parameterName.fill('Amount');
  await parameterName.press('Enter');
  await expect(page.locator('.inspector-content')).toContainText('Linked to Amount');
  await expect(page.locator('.parameter-section').getByRole('spinbutton', { name: 'Amount' })).toHaveValue('5');
});

test('drags a compatible wire and keeps the old wire after an incompatible drop', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Create test graph' }).click();
  await page.getByRole('searchbox', { name: 'Search nodes' }).fill('Number');
  await page.locator('.library-list button').filter({ hasText: 'Number' }).click();
  const input = page.getByRole('button', { name: 'Test Output Value input, float' });
  const source = page.getByRole('button', { name: 'Number Value output, float' });
  const from = await source.boundingBox();
  const to = await input.boundingBox();
  if (!from || !to) throw new Error('Ports are not visible');
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await expect(input).toHaveClass(/port-accept/);
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 10 });
  await expect(page.locator('.connection-preview')).toHaveCount(1);
  await page.mouse.up();
  await expect(page.locator('.connection-path')).toHaveCount(1);
  await expect(page.getByText('Problems 0')).toBeVisible();

  await page.getByRole('searchbox', { name: 'Search nodes' }).fill('Vector 2');
  await page.locator('.library-list button').filter({ hasText: 'Vector 2' }).click();
  const vector = await page.getByRole('button', { name: 'Vector 2 Value output, vec2' }).boundingBox();
  const target = await input.boundingBox();
  if (!vector || !target) throw new Error('Ports are not visible');
  await page.mouse.move(vector.x + vector.width / 2, vector.y + vector.height / 2);
  await page.mouse.down();
  await expect(input).toHaveClass(/port-reject/);
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 10 });
  await page.mouse.up();
  await expect(page.getByRole('alert')).toContainText('vec2 cannot connect to float');
  await expect(page.locator('.connection-path')).toHaveCount(1);
});

test('rejects a cycle before adding its second edge', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create test graph' }).click();
  for (let index = 0; index < 2; index += 1) {
    await page.getByRole('searchbox', { name: 'Search nodes' }).fill('Pass');
    await page.locator('.library-list button').filter({ hasText: 'Pass' }).click();
  }
  const passNodes = page.locator('.canvas-node').filter({ has: page.getByRole('button', { name: 'Select Pass node' }) });
  const firstBox = await passNodes.nth(0).boundingBox();
  const secondBox = await passNodes.nth(1).boundingBox();
  if (!firstBox || !secondBox) throw new Error('Pass nodes are not visible');
  expect(firstBox.x + firstBox.width <= secondBox.x || secondBox.x + secondBox.width <= firstBox.x || firstBox.y + firstBox.height <= secondBox.y || secondBox.y + secondBox.height <= firstBox.y).toBe(true);
  await passNodes.nth(0).getByRole('button', { name: 'Pass Out output, float' }).click();
  await passNodes.nth(1).getByRole('button', { name: 'Pass In input, float' }).click();
  await expect(page.locator('.connection-path')).toHaveCount(1);
  await passNodes.nth(1).getByRole('button', { name: 'Pass Out output, float' }).click();
  await passNodes.nth(0).getByRole('button', { name: 'Pass In input, float' }).click();
  await expect(page.getByRole('alert')).toContainText('create a cycle');
  await expect(page.locator('.connection-path')).toHaveCount(1);
});
