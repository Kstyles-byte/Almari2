// If Buffer is not globally available (e.g. in some edge runtimes),
// import it from the buffer module. This is tree-shaken away in Node env.
import { Buffer } from 'buffer';

export function decodeSupabaseCookie(raw: string | undefined): string | undefined {
  if (!raw) return raw;

  // Supabase server-side helpers prefix JSON session cookies with 'base64-'
  if (raw.startsWith('base64-')) {
    try {
      // Strip the prefix and decode the base64 payload
      const base64Payload = raw.substring(7);
      const decoded = Buffer.from(base64Payload, 'base64').toString('utf-8');
      return decoded;
    } catch {
      // Fallback – return the original value if decoding fails
      return raw;
    }
  }

  return raw;
} 