/**
 * useActiveConversation — keeps the active conversation in sync via polling.
 *
 * Because subscription methods (`onNewMessage`) cannot cross the sandbox
 * postMessage bridge, this hook polls `conversations.getActive()` on a
 * configurable interval and whenever the window gains focus.
 *
 * @param refreshMs  How often to poll in milliseconds. Default: 2000.
 *
 * @example
 * import { useActiveConversation } from '@openconduit/extension-sdk/react';
 *
 * export function MyPanel() {
 *   const conv = useActiveConversation();
 *   if (!conv) return <p>No active conversation.</p>;
 *   return <p>{conv.title} — {conv.messages.length} messages</p>;
 * }
 */

import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi.js';
import type { Conversation } from '../types.js';

export function useActiveConversation(refreshMs = 2000): Conversation | null {
  const api = useApi();
  const [conv, setConv] = useState<Conversation | null>(null);

  const refresh = useCallback(() => {
    api.conversations.getActive().then(setConv).catch(() => undefined);
  }, [api]);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, refreshMs);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [refresh, refreshMs]);

  return conv;
}
