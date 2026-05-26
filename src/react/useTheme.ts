/**
 * useTheme — subscribe to the host app's current theme from inside a sandbox.
 *
 * Returns `'light'` or `'dark'` and re-renders whenever the host sends an
 * `oc:theme` postMessage (e.g. when the user toggles dark mode).
 *
 * @example
 * import { useTheme } from '@openconduit/extension-sdk/react';
 *
 * export function MyPanel() {
 *   const theme = useTheme();
 *   return <div style={{ background: theme === 'dark' ? '#0f172a' : '#f1f5f9' }}>…</div>;
 * }
 */

import { useState, useEffect } from 'react';
import type { Theme } from '../types.js';

function getInitialTheme(): Theme {
  return (document.documentElement.dataset.theme as Theme | undefined) ?? 'light';
}

export function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    function handler(event: MessageEvent): void {
      const msg = event.data as { type?: string; theme?: string };
      if (msg?.type === 'oc:theme' && (msg.theme === 'light' || msg.theme === 'dark')) {
        setTheme(msg.theme);
      }
    }
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return theme;
}
