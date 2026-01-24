#!/usr/bin/env bash
#
# Coverage Check for hyper-element
# Runs Playwright tests twice:
#   1. Coverage check on unminified bundle (100% required)
#   2. All tests pass on minified bundle
#
# Target: 100% coverage on source, all tests pass on minified

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Tests + Coverage (dual run)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "  Phase 1: Coverage on unminified bundle"
echo "  Phase 2: Tests on minified bundle"
echo ""

# Run tests (npm test runs both phases)
npm test 2>&1

RESULT=$?

if [ $RESULT -eq 0 ]; then
    echo ""
    echo "  ✓ Both test phases passed"
else
    echo ""
    echo "  ✗ Tests failed"
    exit 1
fi

exit 0
