/**
 * ocx-scan — local security scanner for OpenConduit extensions.
 *
 * Runs the same checks as the marketplace CI so you can verify your
 * extension before submitting a PR.
 *
 * Usage:
 *   npx ocx-scan ./dist/my-ext-1.0.0.ocx    # scan a packed .ocx archive
 *   npx ocx-scan .                           # scan an extension directory (uses dist/index.js)
 *   npx ocx-scan ./path/to/extension-dir/   # same, explicit path
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { unzipSync } from 'fflate';

// ─── Pattern rules (mirrored from marketplace/scripts/scan-ocx.ts) ────────────

interface PatternRule {
  name: string;
  severity: 'error' | 'warning';
  test: (source: string) => boolean;
}

const RULES: PatternRule[] = [
  {
    name: 'eval()',
    severity: 'error',
    test: (s) => /\beval\s*\(/.test(s),
  },
  {
    name: 'new Function()',
    severity: 'error',
    test: (s) => /new\s+Function\s*\(/.test(s),
  },
  {
    name: 'document.write()',
    severity: 'error',
    test: (s) => /document\.write\s*\(/.test(s),
  },
  {
    name: 'atob()+eval() — likely obfuscation',
    severity: 'error',
    test: (s) => /atob\s*\(/.test(s) && /\beval\s*\(/.test(s),
  },
  {
    name: 'process.env access',
    severity: 'warning',
    test: (s) => /\bprocess\.env\b/.test(s),
  },
  {
    name: 'require() call (unexpected in ESM bundle)',
    severity: 'warning',
    test: (s) => /\brequire\s*\(/.test(s),
  },
  {
    name: 'window.parent / window.top access',
    severity: 'warning',
    test: (s) => /\b(window\.parent|window\.top)\b/.test(s),
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED    = '\x1b[31m';
const RESET  = '\x1b[0m';

function ok(msg: string)   { console.log(`${GREEN}  ✓${RESET}  ${msg}`); }
function warn(msg: string) { console.warn(`${YELLOW}  ⚠${RESET}  ${msg}`); }
function fail(msg: string) { console.error(`${RED}  ✗${RESET}  ${msg}`); }

function scanBundle(source: string): { errors: number; warnings: number } {
  let errors = 0;
  let warnings = 0;
  for (const rule of RULES) {
    if (rule.test(source)) {
      if (rule.severity === 'error') {
        fail(`dangerous pattern: ${rule.name}`);
        errors++;
      } else {
        warn(`review required: ${rule.name}`);
        warnings++;
      }
    }
  }
  return { errors, warnings };
}

// ─── Scan a .ocx archive ──────────────────────────────────────────────────────

function scanOcx(filePath: string): boolean {
  console.log(`\nScanning archive: ${filePath}\n`);

  let zipBytes: Uint8Array;
  try {
    zipBytes = new Uint8Array(readFileSync(filePath));
  } catch (err) {
    fail(`Cannot read file: ${(err as Error).message}`);
    return false;
  }

  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(zipBytes);
  } catch (err) {
    fail(`Not a valid ZIP / .ocx archive: ${(err as Error).message}`);
    return false;
  }

  // Validate manifest.json
  const manifestBytes = entries['manifest.json'];
  if (!manifestBytes) {
    fail('manifest.json not found in archive root');
    return false;
  }
  let manifest: Record<string, unknown>;
  try {
    manifest = JSON.parse(new TextDecoder().decode(manifestBytes));
    ok(`manifest.json — id: ${manifest['id']}, version: ${manifest['version']}`);
  } catch {
    fail('manifest.json is not valid JSON');
    return false;
  }

  if (manifest['entryPoint'] !== 'dist/index.js') {
    fail(`manifest.entryPoint must be "dist/index.js", got "${manifest['entryPoint']}"`);
    return false;
  }

  const bundleBytes = entries['dist/index.js'];
  if (!bundleBytes) {
    fail('dist/index.js not found in archive');
    return false;
  }

  ok(`bundle size: ${(bundleBytes.length / 1024).toFixed(1)} KB`);

  const source = new TextDecoder().decode(bundleBytes);
  const { errors, warnings } = scanBundle(source);

  return printSummary(errors, warnings);
}

// ─── Scan an extension directory ──────────────────────────────────────────────

function scanDir(dirPath: string): boolean {
  console.log(`\nScanning directory: ${dirPath}\n`);

  const manifestPath = resolve(dirPath, 'manifest.json');
  const bundlePath   = resolve(dirPath, 'dist', 'index.js');

  if (!existsSync(manifestPath)) {
    fail(`manifest.json not found at ${manifestPath}`);
    return false;
  }
  if (!existsSync(bundlePath)) {
    fail(`dist/index.js not found at ${bundlePath} — run "npm run build" first`);
    return false;
  }

  let manifest: Record<string, unknown>;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    ok(`manifest.json — id: ${manifest['id']}, version: ${manifest['version']}`);
  } catch {
    fail('manifest.json is not valid JSON');
    return false;
  }

  if (manifest['entryPoint'] !== 'dist/index.js') {
    fail(`manifest.entryPoint must be "dist/index.js", got "${manifest['entryPoint']}"`);
    return false;
  }

  const source = readFileSync(bundlePath, 'utf-8');
  ok(`bundle size: ${(Buffer.byteLength(source) / 1024).toFixed(1)} KB`);

  const { errors, warnings } = scanBundle(source);
  return printSummary(errors, warnings);
}

// ─── Summary ──────────────────────────────────────────────────────────────────

function printSummary(errors: number, warnings: number): boolean {
  console.log('');
  console.log('─'.repeat(50));
  if (errors > 0) {
    console.error(`${RED}FAILED${RESET} — ${errors} error(s), ${warnings} warning(s).`);
    console.error('Fix errors before submitting to the marketplace.');
    return false;
  } else if (warnings > 0) {
    console.warn(`${YELLOW}PASSED with warnings${RESET} — ${warnings} warning(s). Maintainer review required.`);
  } else {
    console.log(`${GREEN}PASSED${RESET} — bundle is clean.`);
  }
  return true;
}

// ─── Entry point ──────────────────────────────────────────────────────────────

const target = process.argv[2];

if (!target) {
  console.error('Usage: ocx-scan <path-to.ocx | extension-directory>');
  process.exit(1);
}

const resolved = resolve(process.cwd(), target);

if (!existsSync(resolved)) {
  console.error(`Path not found: ${resolved}`);
  process.exit(1);
}

const passed = extname(resolved) === '.ocx' ? scanOcx(resolved) : scanDir(resolved);
process.exit(passed ? 0 : 1);
