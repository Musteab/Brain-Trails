import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Use createBrowserClient from @supabase/ssr so auth tokens are stored
// in cookies (matching the server-side middleware client), not localStorage.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
