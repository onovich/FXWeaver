import { defineConfig, devices } from '@playwright/test';

/** Runs the example round trip against the production output from npm run build. */
export default defineConfig({
  testDir: './tests',
  testMatch: ['example-gallery.smoke.spec.ts', 'preview-enlarge.smoke.spec.ts', 'fit-all.smoke.spec.ts'],
  use: {
    ...devices['Desktop Chrome'],
    channel: 'chrome',
    baseURL: 'http://127.0.0.1:4173',
  },
  webServer: {
    command: 'npx vite preview --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
