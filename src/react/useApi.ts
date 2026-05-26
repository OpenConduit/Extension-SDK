/**
 * useApi — returns a stable `SandboxApi` instance for the lifetime of the
 * component tree. The object is created once and reused across renders.
 *
 * @example
 * import { useApi } from '@openconduit/extension-sdk/react';
 *
 * export function MyPanel() {
 *   const api = useApi();
 *   const [conv, setConv] = useState(null);
 *
 *   useEffect(() => {
 *     api.conversations.getActive().then(setConv);
 *   }, [api]);
 * }
 */

import { useRef } from 'react';
import { createApi } from '../api.js';
import type { SandboxApi } from '../types.js';

export function useApi(): SandboxApi {
  const ref = useRef<SandboxApi | null>(null);
  if (!ref.current) {
    ref.current = createApi();
  }
  return ref.current;
}
