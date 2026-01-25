/**
 * @file Playwright configuration for hyper-element tests.
 * Configures test runner, web server, and browser settings.
 */

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './kitchensink',
  testMatch: '*.spec.js',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to ensure coverage merges correctly
  reporter: [['html'], ['list']],

  use: {
    baseURL: 'http://localhost:5555',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome', // Use system Chrome instead of headless shell
      },
    },
  ],

  webServer: {
    command: 'npx serve . -l 5555',
    url: 'http://localhost:5555',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
