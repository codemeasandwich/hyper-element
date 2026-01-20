#!/usr/bin/env bash
#
# Prettier Check for hyper-element
# Validates code formatting

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Prettier"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "  Checking code formatting..."
echo ""

# Run Prettier check on source files and configs (excluding .claude.md)
npx prettier --check "source/**/*.js" "*.json" "README.md" 2>&1

RESULT=$?

if [ $RESULT -eq 0 ]; then
    echo ""
    echo "  ✓ Prettier check passed"
else
    echo ""
    echo "  ✗ Prettier check failed"
    echo "  Run 'npx prettier --write .' to fix formatting"
    exit 1
fi

exit 0
