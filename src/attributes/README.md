# src/attributes/

Attribute handling utilities for hyper-element.

## Overview

This module provides functions for:

- Parsing element attributes with automatic type coercion (numbers, booleans, JSON)
- Creating proxied dataset objects with getter/setter type conversion
- Attaching shared function/object attributes from parent elements

## Key Features

- Automatic numeric coercion (`"42"` -> `42`)
- Boolean parsing (`"true"` -> `true`, `"false"` -> `false`)
- JSON array/object parsing (`"[1,2,3]"` -> `[1, 2, 3]`)
- Template attribute handling
- Shared attribute retrieval via `fn-` and `ob-` prefixes
