#!/usr/bin/env bash
# check-types.sh - Validate TypeScript type declarations

# Check that index.d.ts is valid
if ! npx tsc --noEmit 2>&1; then
    echo "TypeScript type checking failed"
    exit 1
fi

exit 0
