# OpenConduit Extension Examples + SDK

Reference extensions and the official TypeScript SDK for building [OpenConduit](https://openconduit.ai) extensions.

---

## `@openconduit/extension-sdk`

The SDK lives in the root of this repo. It gives you:

- **`createApi()`** — fully-typed async wrapper around the sandbox postMessage bridge
- **`callApi()`** — raw primitive for advanced use
- **`register()`** — registers your extension with the host
- **`defineManifest()`** — type-checked manifest definition helper
- **`CSS_VARS` + `cssVar()`** — all `--oc-*` CSS tokens with autocomplete
- **React hooks** — `useApi`, `useTheme`, `useActiveConversation`

### Install

```bash
npm install @openconduit/extension-sdk
```

### Quick start (vanilla JS/TS)

```typescript
import { register, createApi, defineManifest } from '@openconduit/extension-sdk';

// 1. Register with the host
register(defineManifest({
  id: 'acme.my-extension',
  name: 'My Extension',
  version: '1.0.0',
  permissions: ['settings.write'],
  contributes: {
    activityBarItems: [{ panelId: 'acme.my-extension', label: 'My Extension', order: 100 }],
  },
}));

// 2. Use the API
const api = createApi();
const conv = await api.conversations.getActive();
await api.ui.showNotification({ message: `Active: ${conv?.title ?? 'none'}`, type: 'info' });
await api.settings.set('acme.my-extension.lastRun', Date.now());
```

### Quick start (React)

```tsx
import { register } from '@openconduit/extension-sdk';
import { useApi, useTheme, useActiveConversation } from '@openconduit/extension-sdk/react';
import { createRoot } from 'react-dom/client';

register({ id: 'acme.my-extension', name: 'My Extension', version: '1.0.0',
  contributes: { activityBarItems: [{ panelId: 'acme.my-extension', label: 'My Extension' }] } });

function App() {
  const api = useApi();
  const theme = useTheme();           // 'light' | 'dark' — live
  const conv = useActiveConversation(); // polls every 2s

  return (
    <div style={{ background: 'var(--oc-bg)', color: 'var(--oc-text)', padding: 16 }}>
      <p>Theme: {theme}</p>
      <p>Active conversation: {conv?.title ?? 'none'}</p>
      <button onClick={() => api.ui.showNotification({ message: 'Hello!', type: 'success' })}>
        Notify
      </button>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
```

### API reference

#### `callApi<T>(path, ...args): Promise<T>`

Raw bridge. Posts an `oc:api` message and returns the result.

```typescript
const conv = await callApi<Conversation | null>('conversations.getActive');
await callApi('ui.showNotification', { message: 'Done', type: 'success' });
```

#### `createApi(): SandboxApi`

Typed wrapper. Same methods as `callApi` but organised into namespaces:

| Namespace | Methods |
|---|---|
| `conversations` | `getActive()`, `getAll()`, `list()`, `sendMessage(text)` |
| `settings` | `get(key)`, `getAll()`, `set(key, value)` |
| `ui` | `showNotification(opts)`, `getActivePanel()` |
| `store` | `getPersonas()`, `getSavedFiles()`, `getTasks()` |

> `sendMessage` requires `"conversations.write"` in `manifest.permissions`.  
> `settings.set` requires `"settings.write"`.

#### CSS variables

All `--oc-*` variables are injected automatically. Use them directly in CSS:

```css
.my-card {
  background: var(--oc-bg-surface);
  border: 1px solid var(--oc-border);
  color: var(--oc-text);
  box-shadow: var(--oc-card-shadow);
}
```

Or use `CSS_VARS` / `cssVar()` in JS:

```typescript
import { cssVar } from '@openconduit/extension-sdk';
el.style.color = cssVar('text');            // → "var(--oc-text)"
el.style.background = cssVar('bgSurface'); // → "var(--oc-bg-surface)"
```

---

## Reference extensions

| Extension | Description |
|---|---|
| [`examples/word-counter`](./examples/word-counter/) | Conversation stats — messages, words, estimated tokens |
| [`examples/export-conversation`](./examples/export-conversation/) | Export active conversation as Markdown or plain text |
| [`examples/sticky-notes`](./examples/sticky-notes/) | Persistent scratchpad stored in extension settings |

---

## Building an extension

### Project structure

```
my-extension/
  manifest.json        ← extension metadata (id, name, contributes, …)
  src/
    main.ts            ← entry point
  dist/
    index.js           ← bundled output (what gets installed)
  vite.config.ts
  package.json
```

### Recommended `vite.config.ts`

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/main.ts',
      formats: ['es'],
      fileName: 'index',
    },
    outDir: 'dist',
    rollupOptions: {
      // Keep React external if you don't want it bundled (advanced):
      // external: ['react', 'react-dom'],
    },
  },
});
```

Running `vite build` produces `dist/index.js` — the single file that gets installed.

### manifest.json

```json
{
  "id": "acme.my-extension",
  "name": "My Extension",
  "version": "1.0.0",
  "description": "A useful extension.",
  "author": "Acme Corp",
  "entryPoint": "dist/index.js",
  "permissions": ["settings.write"],
  "contributes": {
    "activityBarItems": [
      { "panelId": "acme.my-extension", "label": "My Extension", "order": 100 }
    ]
  }
}
```

### Development

Load extensions locally without installing them:

```bash
OPENCONDUIT_DEV_EXTENSIONS=/path/to/my-extension npm start
```

The directory is scanned for sub-folders, each with a `manifest.json`.

---

## Security model

Extensions run inside `<iframe sandbox="allow-scripts">` — no same-origin flag,
no access to the host window, localStorage, cookies, or Node.js APIs. All
communication with the host goes through the `postMessage` bridge exposed by
this SDK. The sandbox IS the security boundary; extensions are granted
`conversations.write` and `settings.write` unconditionally.

Subscription methods (`onNewMessage`, `onChange`, `registerMessageDecorator`)
cannot cross the bridge. Use polling (e.g. `useActiveConversation`) instead.