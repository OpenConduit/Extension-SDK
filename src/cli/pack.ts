/**
 * ocx-pack — Pack an OpenConduit extension into a .ocx archive.
 *
 * A .ocx is a standard ZIP containing:
 *   manifest.json   ← extension metadata
 *   dist/index.js   ← bundled extension entry point
 *
 * Usage:
 *   npx ocx-pack            # pack the extension in the current directory
 *   npx ocx-pack ./my-ext   # pack an extension at the given path
 *
 * Output: <extension-dir>/dist/<id>-<version>.ocx
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { zipSync, strToU8 } from 'fflate';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GREEN = '\x1b[32m';
const RED   = '\x1b[31m';
const RESET = '\x1b[0m';

function ok(msg: string)   { console.log(`${GREEN}  ✓${RESET}  ${msg}`); }
function fail(msg: string) { console.error(`${RED}  ✗${RESET}  ${msg}`); }

// ─── Pack ─────────────────────────────────────────────────────────────────────

function pack(dir: string): boolean {
  const manifestPath = resolve(dir, 'manifest.json');
  const bundlePath   = resolve(dir, 'dist', 'index.js');

  if (!existsSync(manifestPath)) {
    fail(`manifest.json not found at ${manifestPath}`);
    return false;
  }
  if (!existsSync(bundlePath)) {
    fail(`dist/index.js not found at ${bundlePath} — run your build step first`);
    return false;
  }

  let manifest: Record<string, unknown>;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  } catch {
    fail('manifest.json is not valid JSON');
    return false;
  }

  const { id, version } = manifest as { id?: string; version?: string };

  if (!id || !version) {
    fail('manifest.json must contain "id" and "version" fields');
    return false;
  }

  if (manifest['entryPoint'] !== 'dist/index.js') {
    fail(`manifest.entryPoint must be "dist/index.js", got "${manifest['entryPoint']}"`);
    return false;
  }

  const bundle = readFileSync(bundlePath);

  const zip = zipSync({
    'manifest.json': strToU8(JSON.stringify(manifest, null, 2)),
    'dist/index.js': bundle,
  });

  const outPath = resolve(dir, 'dist', `${id}-${version}.ocx`);
  writeFileSync(outPath, zip);

  ok(`packed → dist/${id}-${version}.ocx  (${(zip.length / 1024).toFixed(1)} KB)`);
  return true;
}

// ─── Entry point ──────────────────────────────────────────────────────────────

const target  = process.argv[2] ?? '.';
const resolved = resolve(process.cwd(), target);

if (!existsSync(resolved)) {
  console.error(`Path not found: ${resolved}`);
  process.exit(1);
}

const passed = pack(resolved);
process.exit(passed ? 0 : 1);
