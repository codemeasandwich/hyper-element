const { test, expect } = require('@playwright/test');
const { readdirSync } = require('fs');
const path = require('path');

// Auto-discover all HTML files in kitchensink directory (except index.html)
const htmlFiles = readdirSync(__dirname)
  .filter(f => f.endsWith('.html') && f !== 'index.html');

for (const file of htmlFiles) {
  test(`kitchensink/${file}`, async ({ page }) => {
    // Capture all console messages
    const logs = [];
    page.on('console', msg => {
      logs.push(`[${msg.type()}] ${msg.text()}`);
    });
    page.on('pageerror', err => {
      logs.push(`[pageerror] ${err.message}`);
    });

    // Navigate to page via web server
    await page.goto(`/kitchensink/${file}`);

    // Wait for all test sections to complete (no more 'pending' results)
    try {
      await expect(async () => {
        const pendingCount = await page.locator('[data-test-result="pending"]').count();
        expect(pendingCount).toBe(0);
      }).toPass({ timeout: 10000 });
    } catch (e) {
      // If timeout, output collected logs
      console.log(`\n--- Console logs for ${file} ---`);
      logs.forEach(l => console.log(l));
      console.log(`--- End logs ---\n`);
      throw e;
    }

    // Get all test sections
    const testSections = page.locator('[data-test-result]');
    const count = await testSections.count();

    // Ensure we have at least one test
    expect(count).toBeGreaterThan(0);

    // Check each section passed
    for (let i = 0; i < count; i++) {
      const section = testSections.nth(i);
      const testName = await section.getAttribute('data-test');
      const result = await section.getAttribute('data-test-result');

      if (result !== 'pass') {
        // Get element content for debugging
        const elemContent = await page.locator(`[data-test="${testName}"]`).textContent();
        console.log(`\n--- Failed test: ${testName} in ${file} ---`);
        console.log(`Element content: ${elemContent.substring(0, 200)}...`);
        logs.forEach(l => console.log(l));
        console.log(`--- End logs ---\n`);
      }

      expect(result, `Test "${testName}" in ${file}`).toBe('pass');
    }
  });
}
