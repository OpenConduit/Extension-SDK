/**
 * @openconduit/extension-sdk — manifest helpers
 *
 * Type-safe manifest definition and registration helper.
 */

import type { Permission } from './types.js';

// ─── Manifest schema ──────────────────────────────────────────────────────────

export interface ActivityBarItem {
  /** Must match your extension's panel id (typically the same as `id`). */
  panelId: string;
  /** Label shown below the icon in the activity bar. */
  label: string;
  /**
   * Inline SVG string for the activity bar icon.
   * Falls back to a default block icon when omitted.
   */
  iconSvg?: string;
  /** Controls the position in the bar — lower numbers appear first. */
  order?: number;
}

export interface SettingsContribution {
  /** Dot-separated key, namespaced under your extension id. e.g. `"my-ext.fontSize"` */
  key: string;
  type: 'string' | 'number' | 'boolean';
  title: string;
  description?: string;
  default?: string | number | boolean;
}

export interface ExtensionContributions {
  activityBarItems?: ActivityBarItem[];
  settings?: SettingsContribution[];
}

export interface ExtensionManifest {
  /**
   * Stable, globally unique identifier for your extension.
   * Use reverse-domain style: `"com.acme.my-extension"` or `"acme.my-extension"`.
   */
  id: string;
  /** Display name shown in the marketplace and activity bar tooltip. */
  name: string;
  /** Semver version string, e.g. `"1.0.0"`. */
  version: string;
  description?: string;
  author?: string;
  /**
   * Path to the bundled JS entry point, relative to the manifest.
   * Defaults to `"dist/index.js"` when omitted.
   */
  entryPoint?: string;
  /**
   * Permissions your extension requires for write operations.
   * Only declare what you actually use — the host respects the principle of
   * least privilege.
   */
  permissions?: Permission[];
  contributes?: ExtensionContributions;
}

// ─── defineManifest ───────────────────────────────────────────────────────────

/**
 * Identity helper that provides full TypeScript type-checking and autocomplete
 * for the manifest object — similar to Vite's `defineConfig`.
 *
 * Use this in a `manifest.ts` file alongside your extension source and export
 * its output to a `manifest.json` via your build tool's JSON serialisation.
 *
 * @example
 * // manifest.ts
 * import { defineManifest } from '@openconduit/extension-sdk';
 *
 * export default defineManifest({
 *   id: 'acme.my-extension',
 *   name: 'My Extension',
 *   version: '1.0.0',
 *   description: 'Does something useful.',
 *   permissions: ['settings.write'],
 *   contributes: {
 *     activityBarItems: [
 *       { panelId: 'acme.my-extension', label: 'My Extension', order: 100 },
 *     ],
 *   },
 * });
 */
export function defineManifest(manifest: ExtensionManifest): ExtensionManifest {
  return manifest;
}

// ─── register ─────────────────────────────────────────────────────────────────

/**
 * Register the extension with the OpenConduit host.
 *
 * Call this **once** at the top of your entry point, before any async work.
 * It posts an `oc:register` message via the runtime shim so the host knows
 * which panels and commands your extension contributes.
 *
 * @example
 * import { register } from '@openconduit/extension-sdk';
 * import manifest from '../manifest.json' assert { type: 'json' };
 *
 * register(manifest);
 */
export function register(manifest: ExtensionManifest, contributions?: ExtensionContributions): void {
  const contribs = contributions ?? manifest.contributes ?? {};
  // The runtime shim injected by the host exposes window.__openConduit.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reg = (window as any).__openConduit?.extensionRegistry;
  if (!reg) {
    console.error('[extension-sdk] window.__openConduit is not available. Is this running inside an OpenConduit sandbox?');
    return;
  }
  reg.registerExtension(
    {
      id: manifest.id,
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      author: manifest.author,
    },
    contribs,
  );
}
