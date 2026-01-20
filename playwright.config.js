const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './kitchensink',
  testMatch: '*.spec.js',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],

  use: {
    baseURL: 'http://localhost:5555',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'source',
      use: {
        ...devices['Desktop Chrome'],
        // Test against source file (default)
      },
    },
    {
      name: 'minified',
      use: {
        ...devices['Desktop Chrome'],
        // Test against minified build
        buildType: 'minified',
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
