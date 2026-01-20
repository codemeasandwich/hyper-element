const { test, expect } = require('@playwright/test');
const {
  readdirSync,
  mkdirSync,
  writeFileSync,
  existsSync,
  readFileSync,
} = require('fs');
const path = require('path');
const v8toIstanbul = require('v8-to-istanbul');

// Auto-discover all HTML files in kitchensink directory (except index.html)
const htmlFiles = readdirSync(__dirname).filter(
  (f) => f.endsWith('.html') && f !== 'index.html'
);

// Coverage data storage (shared across workers via file)
const coverageDir = path.join(__dirname, '..', 'coverage');
const coverageFile = path.join(coverageDir, 'v8-coverage.json');

for (const file of htmlFiles) {
  test(`kitchensink/${file}`, async ({ page, browserName }, testInfo) => {
    // Determine if we're testing minified build
    const isMinified = testInfo.project.name === 'minified';
    const buildParam = isMinified ? '?build=minified' : '';

    // Start coverage collection for source tests only
    const collectCoverage = !isMinified && browserName === 'chromium';
    if (collectCoverage) {
      await page.coverage.startJSCoverage({ reportAnonymousScripts: true });
    }

    // Capture all console messages
    const logs = [];
    page.on('console', (msg) => {
      logs.push(`[${msg.type()}] ${msg.text()}`);
    });
    page.on('pageerror', (err) => {
      logs.push(`[pageerror] ${err.message}`);
    });

    // Navigate to page via web server
    await page.goto(`/kitchensink/${file}${buildParam}`);

    // Wait for all test sections to complete (no more 'pending' results)
    try {
      await expect(async () => {
        const pendingCount = await page
          .locator('[data-test-result="pending"]')
          .count();
        expect(pendingCount).toBe(0);
      }).toPass({ timeout: 10000 });
    } catch (e) {
      // If timeout, output collected logs
      console.log(`\n--- Console logs for ${file} ---`);
      logs.forEach((l) => console.log(l));
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
        const elemContent = await page
          .locator(`[data-test="${testName}"]`)
          .textContent();
        console.log(`\n--- Failed test: ${testName} in ${file} ---`);
        console.log(`Element content: ${elemContent.substring(0, 200)}...`);
        logs.forEach((l) => console.log(l));
        console.log(`--- End logs ---\n`);
      }

      expect(result, `Test "${testName}" in ${file}`).toBe('pass');
    }

    // Collect coverage data
    if (collectCoverage) {
      const coverage = await page.coverage.stopJSCoverage();
      // Filter to only include hyperElement.js (source, not minified)
      const hyperElementCoverage = coverage.filter((entry) =>
        entry.url.includes('source/hyperElement.js')
      );

      if (hyperElementCoverage.length > 0) {
        // Ensure coverage directory exists
        if (!existsSync(coverageDir)) {
          mkdirSync(coverageDir, { recursive: true });
        }

        // Load existing coverage or create new
        let allCoverage = [];
        if (existsSync(coverageFile)) {
          try {
            allCoverage = JSON.parse(readFileSync(coverageFile, 'utf8'));
          } catch (e) {
            allCoverage = [];
          }
        }

        // Add new coverage data
        allCoverage.push(...hyperElementCoverage);

        // Save updated coverage
        writeFileSync(coverageFile, JSON.stringify(allCoverage, null, 2));
      }
    }
  });
}

// Final coverage report - runs after all tests in this file
test.afterAll(async ({}, testInfo) => {
  // Only generate report for the source project
  if (testInfo.project.name !== 'source') return;

  if (!existsSync(coverageFile)) {
    console.log('No coverage data collected');
    return;
  }

  const allCoverage = JSON.parse(readFileSync(coverageFile, 'utf8'));
  if (allCoverage.length === 0) {
    console.log('No coverage data collected');
    return;
  }

  // Use the source file path
  const sourceFile = path.join(__dirname, '..', 'source', 'hyperElement.js');

  try {
    // Merge all coverage data for the same file
    const mergedFunctions = new Map();

    for (const entry of allCoverage) {
      for (const func of entry.functions || []) {
        const key = `${func.functionName}-${func.ranges[0]?.startOffset}-${func.ranges[0]?.endOffset}`;
        if (!mergedFunctions.has(key)) {
          mergedFunctions.set(key, {
            ...func,
            ranges: func.ranges.map((r) => ({ ...r })),
          });
        } else {
          // Merge counts - add counts for matching ranges, use max for coverage
          const existing = mergedFunctions.get(key);
          for (let i = 0; i < func.ranges.length; i++) {
            if (existing.ranges[i]) {
              // Sum the counts
              existing.ranges[i].count += func.ranges[i].count;
            }
          }
        }
      }
    }

    // Create merged coverage entry
    const mergedEntry = {
      url: allCoverage[0].url,
      scriptId: allCoverage[0].scriptId,
      source: allCoverage[0].source,
      functions: Array.from(mergedFunctions.values()),
    };

    // Convert to Istanbul format
    const converter = v8toIstanbul(sourceFile, 0, {
      source: mergedEntry.source,
    });
    await converter.load();
    converter.applyCoverage(mergedEntry.functions);
    const istanbulCoverage = converter.toIstanbul();

    // Write Istanbul format coverage
    writeFileSync(
      path.join(coverageDir, 'coverage-final.json'),
      JSON.stringify(istanbulCoverage, null, 2)
    );

    // Calculate and display summary
    const fileCoverage = Object.values(istanbulCoverage)[0];
    if (fileCoverage) {
      const { s: statements, f: functions, b: branches } = fileCoverage;
      const stmtHit = Object.values(statements).filter((v) => v > 0).length;
      const stmtTotal = Object.values(statements).length;
      const fnHit = Object.values(functions).filter((v) => v > 0).length;
      const fnTotal = Object.values(functions).length;

      let branchHit = 0,
        branchTotal = 0;
      for (const branchArr of Object.values(branches)) {
        branchTotal += branchArr.length;
        branchHit += branchArr.filter((v) => v > 0).length;
      }

      const stmtPct =
        stmtTotal > 0 ? ((stmtHit / stmtTotal) * 100).toFixed(2) : 0;
      const fnPct = fnTotal > 0 ? ((fnHit / fnTotal) * 100).toFixed(2) : 0;
      const branchPct =
        branchTotal > 0 ? ((branchHit / branchTotal) * 100).toFixed(2) : 0;

      console.log(`\n${'='.repeat(50)}`);
      console.log(`Code Coverage Summary for source/hyperElement.js`);
      console.log(`${'='.repeat(50)}`);
      console.log(`Statements : ${stmtHit}/${stmtTotal} (${stmtPct}%)`);
      console.log(`Functions  : ${fnHit}/${fnTotal} (${fnPct}%)`);
      console.log(`Branches   : ${branchHit}/${branchTotal} (${branchPct}%)`);
      console.log(`${'='.repeat(50)}\n`);

      // Find uncovered statements
      const uncoveredStmts = Object.entries(statements)
        .filter(([_, count]) => count === 0)
        .map(([id]) => {
          const loc = fileCoverage.statementMap[id];
          return loc ? loc.start.line : null;
        })
        .filter(Boolean);

      if (uncoveredStmts.length > 0) {
        const uniqueLines = [...new Set(uncoveredStmts)].sort((a, b) => a - b);
        console.log(`Uncovered lines: ${uniqueLines.join(', ')}`);
      }

      // Write summary file
      writeFileSync(
        path.join(coverageDir, 'summary.txt'),
        `Statements: ${stmtPct}% (${stmtHit}/${stmtTotal})\nFunctions: ${fnPct}% (${fnHit}/${fnTotal})\nBranches: ${branchPct}% (${branchHit}/${branchTotal})\nUncovered lines: ${[...new Set(uncoveredStmts)].sort((a, b) => a - b).join(', ')}`
      );

      // Check for 100% coverage requirement
      if (stmtPct !== '100.00') {
        console.log(
          `\n⚠️  Coverage is not 100%! Missing statements on lines: ${[...new Set(uncoveredStmts)].sort((a, b) => a - b).join(', ')}`
        );
      }
    }
  } catch (e) {
    console.error('Error generating coverage report:', e);
  }
});
