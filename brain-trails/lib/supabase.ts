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
// We disable the Web Lock API (`lock: false`) because React Strict Mode
// (and Next.js dev mode) double-mounts components, causing two auth
// clients to fight over the same lock and trigger cascading AbortErrors.
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "pkce",
    lock: false,
  },
});
