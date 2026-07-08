import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const artifactsDir = path.resolve(__dirname, '../../artifacts/playwright');

export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: path.join(artifactsDir, 'html'), open: 'never' }],
    ['junit', { outputFile: path.join(artifactsDir, 'junit.xml') }],
  ],
  outputDir: path.join(artifactsDir, 'test-results'),
  use: {
    baseURL: process.env.QA_FRONTEND_BASE || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
