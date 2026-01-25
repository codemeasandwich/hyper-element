# Signals

Lightweight reactive primitives for hyper-element. Provides automatic dependency tracking and re-rendering when signal values change.

## Overview

Signals are reactive containers that notify subscribers when their value changes. This module provides three primitives:

- **signal()** - Mutable reactive value
- **computed()** - Derived value with automatic dependency tracking
- **effect()** - Side effect that re-runs when dependencies change

## Usage

```javascript
import { signal, computed, effect } from './signals/index.js';

// Create a signal
const count = signal(0);

// Read value
console.log(count.value); // 0

// Write value (triggers updates)
count.value = 1;

// Derived value
const doubled = computed(() => count.value * 2);

// Side effect
const cleanup = effect(() => {
  console.log('Count changed:', count.value);
});

// Cleanup when done
cleanup();
```

## API

### `signal(initialValue)`

Creates a reactive signal with getter/setter `.value` property.

### `computed(fn)`

Creates a derived signal that automatically tracks dependencies and recomputes when they change.

### `effect(fn)`

Runs a function and re-runs it whenever its dependencies change. Returns a cleanup function.

## Integration with hyper-element

Signals can be used as class properties in hyper-element components:

```javascript
class Counter extends hyperElement {
  count = signal(0);
  doubled = computed(() => this.count.value * 2);

  render(Html) {
    Html`
      <span>${this.count.value}</span>
      <button onclick=${() => this.count.value++}>+1</button>
    `;
  }
}
```
