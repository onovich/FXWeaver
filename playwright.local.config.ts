import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({ ...base, testMatch: '**/*.local.spec.ts', workers: 1,
  use: { ...base.use, screenshot: 'off', trace: 'off', video: 'off' } });
