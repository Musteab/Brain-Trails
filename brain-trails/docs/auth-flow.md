# Authentication Flow

Brain Trails uses Supabase Auth with `@supabase/ssr` to ensure secure, SSR-compatible authentication.

## How it works together

1. **The Middleware (`middleware.ts`)**
   - Intercepts every incoming request.
   - Reconstructs the Supabase client using server-side cookies.
   - Calls `supabase.auth.getUser()` to verify the token securely on the server.
   - If the user is unauthenticated and tries to access a protected route (like `/` or `/focus`), they are redirected to `/login`.
   - If they are authenticated and visit `/login` or `/register`, they are redirected to `/`.

2. **The Auth Context (`context/AuthContext.tsx`)**
   - Provides a client-side wrapper around the user session.
   - Listens to `supabase.auth.onAuthStateChange` to keep the React state in sync with the actual session (e.g. when logging in/out in another tab).
   - Also listens to `visibilitychange` to re-fetch `getUser()` when a tab is un-frozen or waking from sleep to ensure stale tokens don't cause silent errors.
   - When a user logs in, it fetches their profile from the `profiles` table. If none exists (e.g. after OAuth), it creates a fallback profile with default game stats.

3. **OAuth Callback (`app/auth/callback/route.ts`)**
   - Handles the code exchange for Google OAuth.
   - When Google redirects back with a code, this server route exchanges the code for an active session and sets the cookies before redirecting to the destination URL.

## Security Decisions

- **Cookies over LocalStorage**: We use cookies instead of `localStorage` because Next.js middleware runs on the Edge/Node server. It cannot read `localStorage`. Using cookies ensures the first HTML payload returned by the server is already authenticated, preventing layout shift or flashing login screens.
- **getUser vs getSession**: `getUser()` sends a request to the Supabase Auth API to validate the token. `getSession()` only decodes the local cookie. For critical security checks (like middleware), we use `getUser()` to ensure the user hasn't been banned or deleted on the backend.