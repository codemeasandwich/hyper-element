# Plan: Replace hyperHTML with uhtml-inspired Rendering Core (v2.0)

## Goal
Replace hyperHTML with a custom uhtml-inspired rendering core. This is a clean break (v2.0) with simplified APIs while preserving the `{+each}/{+if}` block syntax that enables hyper-element's "layout as content" design pattern.

---

## API Design Decisions

| Feature | Decision | Rationale |
|---------|----------|-----------|
| Signals | ✅ Include | Add `signal()`, `computed()`, `effect()` for built-in reactivity |
| Store support | ✅ Keep | Maintain `onNext(store)` for external state management |
| Block syntax | ✅ Keep | `{+each}`, `{+if}`, `{+unless}` enable layout/logic separation |
| Fragments | ✅ Keep full protocol | Async loading with `{ placeholder:, once:, text:/any:/html:/template: }` |
| Template attribute | ✅ Keep | External templates via `<el template>{var}</el>` |
| Array rendering | ✅ Simplify | No `wire()` needed! Just `Html`...`` in maps. Optional `key` attr (dev warning if missing) |
| Compatibility | Clean break | v2.0 - new API only (just replacing hyperHTML internals) |

---

## New API Overview

### Render Function
```javascript
class MyElement extends hyperElement {
  render(html) {
    html`<div>${this.attrs.name}</div>`;
  }
}
```

### Signals (New)
```javascript
import { hyperElement, signal, computed, effect } from 'hyper-element';

class Counter extends hyperElement {
  count = signal(0);
  doubled = computed(() => this.count.value * 2);

  setup() {
    // Optional: effects for side-effects
    return effect(() => console.log('Count:', this.count.value));
  }

  render(html) {
    html`
      <span>${this.count}</span>
      <span>${this.doubled}</span>
      <button onclick=${() => this.count.value++}>+1</button>
    `;
  }
}
```

### Store Support (Kept)
```javascript
class MyElement extends hyperElement {
  setup(onNext) {
    const store = createExternalStore();
    onNext(store.getState);
    return () => store.unsubscribe();
  }

  render(html, storeData) {
    html`<div>${storeData.value}</div>`;
  }
}
```

### Block Syntax (Kept)
```javascript
render(html) {
  html`
    <ul>
      {+each ${this.items}}
        <li data-id={id}>{name}</li>
      {-each}
    </ul>

    {+if ${this.isLoggedIn}}
      <user-profile />
    {else}
      <login-form />
    {-if}
  `;
}
```

### Fragment Methods (Kept - Full Protocol)
```javascript
// Async fragment with placeholder
AsyncList(data) {
  return {
    placeholder: 'Loading...',
    template: fetch('/api/list').then(r => r.text()),
    values: data
  };
}

// Cached fragment
Header(data) {
  return {
    once: true,
    any: `<header>${data.title}</header>`
  };
}

// Return types:
// - { text: string }     - Escaped string output
// - { any: content }     - Any content type
// - { html: string }     - Raw HTML (not sanitized)
// - { template: string } - Template with {var} placeholders (sanitized)
// - Plus: { placeholder: content } and { once: true }

// Usage in render
render(Html) {
  Html`<div>${{ Header: { title: 'Welcome' } }}</div>`;
}
```

### Raw HTML (Kept)
```javascript
Html`<div>${Html.raw('<b>trusted HTML</b>')}</div>`;
```

### Template Attribute (Kept)
```html
<!-- Define template in innerHTML -->
<my-list template>
  <ul>{+each ${items}}<li>{name}</li>{-each}</ul>
</my-list>

<!-- Simple {var} interpolation -->
<user-card template>
  <div class="card">
    <h2>{name}</h2>
    <p>{email}</p>
  </div>
</user-card>
```

```javascript
// Element just provides data, template is in markup
class UserCard extends hyperElement {
  render(Html) {
    Html.template({ name: this.attrs.name, email: this.attrs.email });
  }
}
```

### Simplified Array Rendering (New - No wire() needed!)
```javascript
// OLD - required explicit wire()
Html`<ul>${users.map(user => Html.wire(user, ':item')`<li>${user.name}</li>`)}</ul>`;

// NEW - just works! No wire() needed
Html`<ul>${users.map(user => Html`<li>${user.name}</li>`)}</ul>`;

// With key attribute for optimal reordering (recommended, dev warning if missing)
Html`<ul>${users.map(user => Html`<li key=${user.id}>${user.name}</li>`)}</ul>`;

// Or use {+each} which handles keying automatically
Html`<ul>{+each ${users}}<li>{name}</li>{-each}</ul>`;
```

**Why this works:**
- All `Html` calls inside `.map()` share the same TemplateStringsArray (same code location)
- Template parsing happens once, cached for all iterations
- Array diffing handles DOM reuse efficiently
- `key` attribute optional but recommended (dev warning if missing)

---

## Module Structure

```
src/
  render/                      # NEW: Core rendering system
    index.js                   # Exports: html, bind, wire
    constants.js               # Type flags
    parser.js                  # Template parser (NUL system)
    hole.js                    # Hole class (cache + updates)
    update.js                  # Update handlers
    creator.js                 # DOM fragment creation
    resolve.js                 # Path-based traversal
    diff.js                    # Array diffing (udomdiff)
    keyed.js                   # Key tracking
    persistent-fragment.js     # Multi-node fragments

  signals/                     # NEW: Reactivity primitives
    index.js                   # signal, computed, effect

  html/
    createHtml.js              # MODIFY: Use new render core
    parseEachBlocks.js         # KEEP: Block syntax processing

  template/
    buildTemplate.js           # MODIFY: Use new wire()
    processAdvancedTemplate.js # KEEP: Block syntax in templates

  lifecycle/
    connectedCallback.js       # MODIFY: Use new define(), keep fragment protocol
    onNext.js                  # KEEP: Store support
```

---

## Implementation Phases

### Phase 1: Core Rendering Engine
Create the uhtml-inspired rendering core:

1. **`src/render/constants.js`** - Type flags
   ```javascript
   export const ATTRIBUTE = 1 << 0;
   export const EVENT = 1 << 1;
   export const TEXT = 1 << 2;
   export const COMMENT = 1 << 3;  // Node interpolation
   export const ARRAY = 1 << 4;
   export const TOGGLE = 1 << 5;   // ?attr
   export const PROP = 1 << 6;     // .prop
   export const UNSAFE = 1 << 7;
   export const KEY = 1 << 8;
   ```

2. **`src/render/creator.js`** - Fragment creation
   ```javascript
   export function createFragment(html) {
     const tpl = document.createElement('template');
     tpl.innerHTML = html;
     return tpl.content;
   }
   ```

3. **`src/render/resolve.js`** - Path traversal
   ```javascript
   export function resolve(root, path) {
     return path.reduceRight((node, i) =>
       i < 0 ? node.content : node.childNodes[i], root);
   }
   ```

4. **`src/render/diff.js`** - Copy udomdiff from `/Users/bri/www/uhtml/src/dom/diff.js`

5. **`src/render/persistent-fragment.js`** - Multi-node handling with comment markers

6. **`src/render/parser.js`** - Template parser
   - Join strings with NUL (`\x00`)
   - Parse HTML, track interpolation points
   - Build path arrays
   - Handle: attributes, events, text, toggles, props, keys
   - Handle table auto-tbody

7. **`src/render/update.js`** - Type-specific handlers
   - ATTRIBUTE: `setAttribute`/`removeAttribute`
   - EVENT: Add/remove listeners
   - TEXT: `textContent`
   - COMMENT: Replace nodes
   - ARRAY: Use diff
   - TOGGLE: Boolean attrs
   - PROP: Direct property
   - UNSAFE: innerHTML
   - KEY: Track for keying

8. **`src/render/keyed.js`** - WeakMap + WeakRef tracking

9. **`src/render/hole.js`** - Hole class
   ```javascript
   export class Hole {
     constructor(template, values) {
       this.t = template;  // [fragment, updates, keyed?]
       this.v = values;
       this.n = null;      // Rendered node
       this.k = -1;        // Key index (-1 = no key)
     }
     valueOf() { /* First render: clone, resolve paths, apply values */ }
     update(hole) { /* Re-render: compare values, update only changes */ }
   }
   ```

   **Array of Holes handling:**
   - When diff sees array of Holes with same template, uses `hole.update()`
   - TemplateStringsArray identity = same template (shared across .map() calls)
   - `key` attribute tracked for stable reordering
   - Dev warning if arrays lack keys

10. **`src/render/index.js`** - Public API
    ```javascript
    export function html(strings, ...values) → Hole
    export function bind(element) → boundHtml
    export function wire(obj, id) → keyedHtml
    export function define(name, callback) → void  // For fragments
    ```

### Phase 2: Signals System
Add reactive primitives:

11. **`src/signals/index.js`**
    ```javascript
    export function signal(initial) {
      // Returns { value: getter/setter, peek(), subscribe() }
    }

    export function computed(fn) {
      // Auto-tracks dependencies, returns signal-like
    }

    export function effect(fn) {
      // Runs fn, re-runs when dependencies change
      // Returns cleanup function
    }
    ```

### Phase 3: Integration
Connect new core to hyper-element:

12. **`src/html/createHtml.js`** - Replace hyperHTML
    ```javascript
    import { bind, wire, html as rawHtml } from '../render/index.js';

    export function createHtml(shadow) {
      const boundRender = bind(shadow);

      function Html(...args) {
        // Transform {+each} blocks (keep existing logic)
        // Handle sharedAttrs (keep existing logic)
        // Call boundRender
      }

      Html.wire = wire;
      Html.raw = (str) => ({ __unsafe: true, value: str });
      return Html;
    }
    ```

13. **`src/lifecycle/connectedCallback.js`** - Update fragment handling
    - Keep full fragment protocol: `{ placeholder:, once:, text:/any:/html:/template: }`
    - Replace `hyperHTML.define()` with new `define()` from render core
    - Fragment methods continue to work exactly as documented

14. **`src/template/buildTemplate.js`** - Use new wire()

15. **`scripts/build.js`** - Update build
    - Remove hyperHTML bundling
    - Add render/ and signals/ files
    - Update file order

16. **`package.json`** - Remove hyperHTML dependency

### Phase 4: TypeScript & Docs
17. **`index.d.ts`** - Update types
    ```typescript
    export function signal<T>(value: T): Signal<T>;
    export function computed<T>(fn: () => T): Computed<T>;
    export function effect(fn: () => void): () => void;
    ```

### Phase 5: Update Tests
18. **Update existing kitchensink tests** to use new patterns where applicable:
    - Update any `Html.wire()` in arrays to simpler `Html` syntax
    - Add `key` attributes where appropriate
    - Verify all existing tests pass with new render core

19. **Add new test files:**
    - `kitchensink/signals.html` - Test signal, computed, effect
    - `kitchensink/key-attribute.html` - Test key-based array rendering
    - `kitchensink/simplified-arrays.html` - Test no-wire array patterns

### Phase 6: Documentation
20. **`README.md`** - Add v2.0 Upgrade Guide section:
    ```markdown
    ## Upgrading from v1.x to v2.0

    ### Breaking Changes
    - `Html.lite` removed - use `Html.wire()` for unbound templates
    - hyperHTML internals no longer accessible

    ### Simplified Array Rendering (Migration)
    ```js
    // v1.x - required wire()
    Html`<ul>${items.map(item => Html.wire(item, ':id')`<li>${item.name}</li>`)}</ul>`;

    // v2.0 - just works!
    Html`<ul>${items.map(item => Html`<li key=${item.id}>${item.name}</li>`)}</ul>`;
    ```

    ### New Features
    - **Signals**: Built-in reactivity with `signal()`, `computed()`, `effect()`
    - **Key attribute**: Automatic keying for arrays
    - **Dev warnings**: Helpful warnings for missing keys
    ```

---

## Critical Files

### To Create
| File | Purpose | Lines (est) |
|------|---------|-------------|
| `src/render/constants.js` | Type flags | ~20 |
| `src/render/creator.js` | DOM fragments | ~15 |
| `src/render/resolve.js` | Path traversal | ~10 |
| `src/render/diff.js` | udomdiff (copy) | ~100 |
| `src/render/persistent-fragment.js` | Multi-node | ~50 |
| `src/render/parser.js` | Template parsing | ~250 |
| `src/render/update.js` | Update handlers | ~150 |
| `src/render/keyed.js` | Key tracking | ~40 |
| `src/render/hole.js` | Hole class | ~150 |
| `src/render/index.js` | Public API | ~80 |
| `src/signals/index.js` | Reactivity | ~100 |

### To Modify
| File | Changes |
|------|---------|
| `src/html/createHtml.js` | Use new bind/wire, keep block syntax processing |
| `src/lifecycle/connectedCallback.js` | Use new define(), keep full fragment protocol |
| `src/template/buildTemplate.js` | Use new wire() |
| `scripts/build.js` | Remove hyperHTML, add new files |
| `package.json` | Remove hyperHTML dep, bump to v2.0.0 |
| `index.d.ts` | Add signal types |
| `README.md` | Add v2.0 Upgrade Guide section |
| `kitchensink/*.html` | Update tests to new patterns where applicable |

### To Keep Unchanged
| File | Reason |
|------|--------|
| `src/template/processAdvancedTemplate.js` | Block syntax processing for templates |
| `src/html/parseEachBlocks.js` | Block syntax processing for Html tags |
| `src/lifecycle/onNext.js` | Store support |
| `src/utils/escape.js` | XSS prevention |
| `src/attributes/*` | Attribute handling |
| `src/core/manager.js` | Instance management |

### Reference Files (uhtml)
| File | What to adapt |
|------|---------------|
| `/Users/bri/www/uhtml/src/parser/index.js` | NUL parser pattern |
| `/Users/bri/www/uhtml/src/dom/rabbit.js` | Hole class |
| `/Users/bri/www/uhtml/src/dom/update.js` | Update handlers |
| `/Users/bri/www/uhtml/src/dom/diff.js` | Copy directly |
| `/Users/bri/www/uhtml/src/dom/keyed.js` | Key tracking |

---

## Verification

### Run Tests After Each Phase
```bash
npm test
```

### Key Test Scenarios
| Test File | Validates |
|-----------|-----------|
| `basic-rendering.html` | Core html`` rendering |
| `auto-wire-each.html` | `{+each}` blocks |
| `attributes.html` | Attribute binding |
| `event-callbacks.html` | Event handlers |
| `complex-type-attrs.html` | sharedAttrs |
| `fragments-templates.html` | Fragment methods (update for new API) |
| `corner-cases.html` | Edge cases |

### Tests to Update
- Update `Html.wire()` patterns in existing tests to simpler `Html` syntax
- Add `key` attributes to array rendering tests
- Ensure all kitchensink tests pass with new render core

### New Tests to Create
- `kitchensink/signals.html` - Signal reactivity tests
- `kitchensink/key-attribute.html` - Key-based array rendering
- `kitchensink/simplified-arrays.html` - No-wire array patterns
- `kitchensink/dev-warnings.html` - Verify dev warnings work correctly

### Manual Verification
1. `npm run build`
2. Open kitchensink pages in browser
3. Verify no console errors
4. Check bundle size (target: similar or smaller)

---

## Breaking Changes Summary (v2.0)

| Change | Details |
|--------|---------|
| hyperHTML removed | Replaced with built-in uhtml-inspired render core |
| `Html.lite` removed | Use `Html.wire()` for unbound templates |
| Internal APIs | hyperHTML internals no longer accessible |

**Features Preserved (No Breaking Changes):**
- Fragment protocol: `{ placeholder:, once:, text:/any:/html:/template: }`
- Block syntax: `{+each}`, `{+if}`, `{+unless}`
- Template attribute: `<el template>{var}</el>`
- Store support: `setup(onNext)` pattern
- Shared attributes for custom element communication
- XSS prevention with Html.raw() for trusted content
- `Html.wire()` still available for explicit keying when needed

| Added | Purpose |
|-------|---------|
| `signal(value)` | Reactive state |
| `computed(fn)` | Derived state |
| `effect(fn)` | Side effects |
| `key` attribute | Automatic keying in arrays |
| Simplified arrays | No `wire()` needed for `.map()` patterns - just use `Html` directly |
| Dev warnings | Warns when `key` missing in array rendering |
