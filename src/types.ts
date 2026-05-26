/**
 * @openconduit/extension-sdk — type definitions
 *
 * Lightweight types for the OpenConduit sandbox API surface. These are
 * intentionally self-contained — the SDK has no runtime dependency on
 * `@openconduit/core` so that extension bundles stay small.
 */

// ─── Primitives ───────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export type Theme = 'light' | 'dark';

export type Permission = 'conversations.write' | 'settings.write';

// ─── Core domain types ────────────────────────────────────────────────────────

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  thinking?: string;
  timestamp: number;
  isStreaming?: boolean;
  model?: string;
  providerId?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  systemPrompt?: string;
  providerId?: string;
  model?: string;
  folderId?: string | null;
}

export interface Persona {
  id: string;
  name: string;
  systemPrompt: string;
  color?: string;
  version?: string;
  defaultProviderId?: string;
  defaultModel?: string;
  isDefault?: boolean;
}

export interface AiTask {
  id: string;
  text: string;
  status: 'pending' | 'in-progress' | 'done' | 'cancelled';
}

export interface SavedFile {
  id: string;
  name: string;
  content: string;
  mimeType: string;
  size: number;
  conversationId?: string;
  savedAt: number;
}

// ─── Extension API ────────────────────────────────────────────────────────────

/**
 * The async API surface available to sandboxed extensions.
 *
 * Every method is a Promise because calls are bridged via postMessage to the
 * host process. Subscription methods (`onNewMessage`, `onChange`) are NOT
 * available in the sandbox — use polling or the React hooks in
 * `@openconduit/extension-sdk/react` instead.
 */
export interface SandboxApi {
  conversations: {
    /** Returns the currently active conversation, or `null` if none is open. */
    getActive(): Promise<Conversation | null>;
    /** Returns all conversations. */
    getAll(): Promise<Conversation[]>;
    /** Alias for {@link getAll}. */
    list(): Promise<Conversation[]>;
    /**
     * Injects a message into the active conversation as if the user typed it.
     * Requires the `'conversations.write'` permission in the manifest.
     */
    sendMessage(text: string): Promise<void>;
  };

  settings: {
    /** Read a settings value by its dot-separated key. */
    get<T = unknown>(key: string): Promise<T | undefined>;
    /** Returns the entire settings object. */
    getAll(): Promise<Record<string, unknown> | null>;
    /**
     * Persist a settings value by its dot-separated key.
     * Requires the `'settings.write'` permission in the manifest.
     */
    set(key: string, value: unknown): Promise<void>;
  };

  ui: {
    /** Display a notification toast in the host app. */
    showNotification(opts: {
      message: string;
      type?: NotificationType;
    }): Promise<void>;
    /** Returns the id of the currently active sidebar panel (e.g. `'chats'`). */
    getActivePanel(): Promise<string>;
  };

  store: {
    /** Returns all defined personas. */
    getPersonas(): Promise<Persona[]>;
    /** Returns all saved files. */
    getSavedFiles(): Promise<SavedFile[]>;
    /** Returns the current task list. */
    getTasks(): Promise<AiTask[]>;
  };
}

// ─── postMessage protocol ─────────────────────────────────────────────────────

/** Message the extension sends to the host to invoke an API method. */
export interface ApiCallMessage {
  type: 'oc:api';
  id: string;
  path: string;
  args: unknown[];
}

/** Response from the host after an API call. */
export interface ApiResponseMessage {
  type: 'oc:api-response';
  id: string;
  result?: unknown;
  error?: string;
}

/** Sent by the sandbox runtime to signal it is ready. */
export interface ReadyMessage {
  type: 'oc:ready';
}

/** Sent by the host to synchronise the current theme. */
export interface ThemeMessage {
  type: 'oc:theme';
  theme: Theme;
}

export type HostToSandboxMessage = ApiResponseMessage | ThemeMessage;
export type SandboxToHostMessage = ApiCallMessage | ReadyMessage;
