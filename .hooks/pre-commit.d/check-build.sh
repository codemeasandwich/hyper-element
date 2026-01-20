#!/usr/bin/env bash
#
# Build Check for hyper-element
# Ensures the minified build succeeds

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Build"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "  Building minified bundle..."
echo ""

# Run the build
npm run build 2>&1

RESULT=$?

if [ $RESULT -ne 0 ]; then
    echo ""
    echo "  ✗ Build failed"
    exit 1
fi

# Verify output exists
if [ ! -f "build/hyperElement.min.js" ]; then
    echo ""
    echo "  ✗ Build output not found: build/hyperElement.min.js"
    exit 1
fi

echo ""
echo "  ✓ Build check passed"
exit 0
