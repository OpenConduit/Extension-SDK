/**
 * @openconduit/extension-sdk — API bridge
 *
 * Provides `callApi()` (raw postMessage primitive) and `createApi()` (fully
 * typed convenience wrapper) for communicating with the OpenConduit host from
 * inside a sandboxed extension iframe.
 */

import type { SandboxApi } from './types.js';

// ─── Internal counter for unique message IDs ──────────────────────────────────

let _seq = 0;
function nextId(): string {
  return `oc-sdk-${Date.now()}-${++_seq}`;
}

// ─── Core postMessage bridge ──────────────────────────────────────────────────

/**
 * Call an OpenConduit host API method from inside a sandboxed extension.
 *
 * Internally posts an `oc:api` message to `window.parent` and waits for the
 * matching `oc:api-response`. The returned Promise resolves with the method's
 * return value, or rejects with an Error if the host reports a failure.
 *
 * @param path  Dot-separated API path, e.g. `"conversations.getActive"`.
 * @param args  Arguments to forward to the method.
 *
 * @example
 * const conv = await callApi<Conversation | null>('conversations.getActive');
 * await callApi('ui.showNotification', { message: 'Hello!', type: 'success' });
 */
export function callApi<T = unknown>(path: string, ...args: unknown[]): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = nextId();

    function handler(event: MessageEvent): void {
      const msg = event.data as { type?: string; id?: string; result?: unknown; error?: string };
      if (!msg || msg.type !== 'oc:api-response' || msg.id !== id) return;
      window.removeEventListener('message', handler);
      if (msg.error) {
        reject(new Error(msg.error));
      } else {
        resolve(msg.result as T);
      }
    }

    window.addEventListener('message', handler);
    window.parent.postMessage({ type: 'oc:api', id, path, args }, '*');
  });
}

// ─── Typed convenience wrapper ────────────────────────────────────────────────

/**
 * Returns a fully-typed `SandboxApi` object that wraps `callApi()`.
 *
 * Call this once at the top of your extension's entry point and reuse the
 * returned object throughout — it is stateless and safe to share.
 *
 * @example
 * import { createApi } from '@openconduit/extension-sdk';
 *
 * const api = createApi();
 *
 * const conv = await api.conversations.getActive();
 * await api.ui.showNotification({ message: `Active: ${conv?.title}` });
 * await api.settings.set('my-ext.lastRun', Date.now());
 */
export function createApi(): SandboxApi {
  return {
    conversations: {
      getActive: () => callApi('conversations.getActive'),
      getAll: () => callApi('conversations.getAll'),
      list: () => callApi('conversations.list'),
      sendMessage: (text) => callApi('conversations.sendMessage', text),
    },
    settings: {
      get: <T>(key: string) => callApi<T | undefined>('settings.get', key),
      getAll: () => callApi('settings.getAll'),
      set: (key, value) => callApi('settings.set', key, value),
    },
    ui: {
      showNotification: (opts) => callApi('ui.showNotification', opts),
      getActivePanel: () => callApi('ui.getActivePanel'),
    },
    store: {
      getPersonas: () => callApi('store.getPersonas'),
      getSavedFiles: () => callApi('store.getSavedFiles'),
      getTasks: () => callApi('store.getTasks'),
    },
  };
}
