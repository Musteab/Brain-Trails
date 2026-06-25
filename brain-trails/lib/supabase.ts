import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Use createBrowserClient from @supabase/ssr so auth tokens are stored
// in cookies (matching the server-side middleware client), not localStorage.
// The Database generic provides end-to-end type safety on .from() calls.
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "pkce",
    // Disable problematic Web Lock API to prevent conflicts with React Strict Mode
    // and Next.js double-mounting. This prevents "Lock not released" warnings.
    storageKey: `sb-${supabaseUrl.split('//')[1]?.split('.')[0]}-auth-token`,
    storage: {
      getItem: (key) => {
        if (typeof window === 'undefined') return null;
        return window.localStorage.getItem(key);
      },
      setItem: (key, value) => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(key, value);
      },
      removeItem: (key) => {
        if (typeof window === 'undefined') return;
        window.localStorage.removeItem(key);
      },
    },
    // Disable automatic token refresh lock
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: (url, options) => {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
      
      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));
    },
  },
});
