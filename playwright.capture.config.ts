import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({ ...base, testMatch: '**/*.capture.spec.ts', workers: 1 });
