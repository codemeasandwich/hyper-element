#!/usr/bin/env bash
#
# ESLint Check for hyper-element
# Validates JavaScript code quality and style

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ESLint"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "  Checking source files..."
echo ""

# Run ESLint on source directory
npx eslint source/ 2>&1

RESULT=$?

if [ $RESULT -eq 0 ]; then
    echo ""
    echo "  ✓ ESLint check passed"
else
    echo ""
    echo "  ✗ ESLint check failed"
    exit 1
fi

exit 0
