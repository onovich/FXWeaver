import { expect, test } from '@playwright/test';

test('generated Filter compiles, binds, renders, and diagnoses errors in real WebGL2', async ({ page }) => {
  await page.goto('/tests/fixtures/generated-filter.html');
  await expect(page.getByRole('status')).toContainText('compiled and rendered');
  const result = await page.evaluate(() => window.__generatedSpike);
  expect(result?.status).toBe('ready');
  expect(result?.source?.[0]).toBeGreaterThan(240);
  expect(result?.source?.[3]).toBeGreaterThan(110);
  expect(result?.parameterRed?.[0]).toBeGreaterThan(240);
  expect(result?.parameterGreen?.[1]).toBeGreaterThan(240);
  expect(result?.parameterGreen?.[0]).toBeLessThan(10);
  expect(result?.parameterAfterInvalid).toEqual(result?.parameterGreen);
  expect(result?.extraLinear?.[0]).toBeGreaterThan(100);
  expect(result?.extraLinear?.[2]).toBeGreaterThan(100);
  expect(result?.extraNearest?.[2]).toBeGreaterThan(240);
  expect(result?.extraReplaced?.[1]).toBeGreaterThan(240);
  expect(result?.extraReplaced?.[0]).toBeLessThan(10);
  expect(result?.inputTextureUntouched).toBe(true);
  expect(result?.missingTexture).toBe('MISSING_TEXTURE');
  expect(result?.invalidShader).toMatchObject({ code: 'FRAGMENT_COMPILE', nodeIds: ['source'] });
  expect(result?.destroyedUpdate).toBe('rejected');
});
