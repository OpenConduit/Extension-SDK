import { defineConfig } from 'tsup';

export default defineConfig([
  // ─── Library ──────────────────────────────────────────────────────────────
  {
    entry: {
      index: 'src/index.ts',
      'react/index': 'src/react/index.ts',
    },
    format: ['esm'],
    dts: true,
    clean: true,
    outDir: 'dist',
  },
  // ─── CLI (ocx-scan) ───────────────────────────────────────────────────────
  // Bundled standalone so fflate is inlined — no extra deps at runtime.
  {
    entry: {
      scan: 'src/cli/scan.ts',
      pack: 'src/cli/pack.ts',
    },
    format: ['esm'],
    dts: false,
    outDir: 'dist/cli',
    bundle: true,
    banner: { js: '#!/usr/bin/env node' },
    // Don't bundle Node built-ins
    external: ['node:fs', 'node:path'],
  },
]);
