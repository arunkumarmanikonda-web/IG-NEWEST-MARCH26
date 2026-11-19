import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  testDir: '.',
  testMatch: 'journeys.spec.mjs',
  timeout: 180000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  outputDir: '../qa-output/test-results',
  reporter: [['list'], ['html', { outputFolder: 'mobile/qa-output/report', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4178',
    browserName: 'chromium',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'phone-web-preview', use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } },
    { name: 'tablet-web-preview', use: { viewport: { width: 1024, height: 1366 }, deviceScaleFactor: 1, hasTouch: true } },
  ],
  webServer: { command: 'node mobile/qa/serve.mjs', cwd: fileURLToPath(new URL('../../', import.meta.url)), url: 'http://127.0.0.1:4178', reuseExistingServer: false, timeout: 30000 },
});
