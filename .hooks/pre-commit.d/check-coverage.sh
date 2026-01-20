#!/usr/bin/env bash
#
# Coverage Check for hyper-element
# Runs Playwright tests with coverage enforcement
#
# Target: 100% coverage

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Tests + Coverage"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "  Running Playwright tests with coverage..."
echo ""

# Run tests (coverage is collected by Playwright config)
npm test 2>&1

RESULT=$?

if [ $RESULT -eq 0 ]; then
    echo ""
    echo "  ✓ Tests + coverage check passed"
else
    echo ""
    echo "  ✗ Tests + coverage check failed"
    exit 1
fi

exit 0
