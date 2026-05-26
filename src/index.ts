/**
 * @openconduit/extension-sdk
 *
 * Main entry point — re-exports everything from the SDK sub-modules.
 *
 * Usage:
 *   import { createApi, register, defineManifest, CSS_VARS } from '@openconduit/extension-sdk';
 *
 * React hooks:
 *   import { useApi, useTheme, useActiveConversation } from '@openconduit/extension-sdk/react';
 */

// API bridge
export { callApi, createApi } from './api.js';

// Manifest helpers
export { defineManifest, register } from './manifest.js';
export type { ExtensionManifest, ExtensionContributions, ActivityBarItem, SettingsContribution } from './manifest.js';

// CSS variables
export { CSS_VARS, cssVar } from './css-vars.js';
export type { CssVarName } from './css-vars.js';

// Types
export type {
  // Domain types
  Conversation,
  Message,
  MessageRole,
  Persona,
  AiTask,
  SavedFile,
  // API surface
  SandboxApi,
  NotificationType,
  Theme,
  Permission,
  // Protocol
  ApiCallMessage,
  ApiResponseMessage,
  ThemeMessage,
  ReadyMessage,
  HostToSandboxMessage,
  SandboxToHostMessage,
} from './types.js';
