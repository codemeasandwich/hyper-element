# Signals Module Files

## Directory Structure

```
src/signals/
└── index.js    # Signal primitives: signal, computed, effect
```

## Files

### `index.js`

Implements reactive primitives:

- **signal(value)** - Creates a mutable reactive container
- **computed(fn)** - Creates a derived value with automatic dependency tracking
- **effect(fn)** - Runs side effects that re-execute when dependencies change

Uses a context-based dependency tracking system where reading a signal during effect/computed execution automatically subscribes to updates.
