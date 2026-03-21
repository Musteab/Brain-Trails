# Architecture

## Simple Flow Diagram

```mermaid
graph TD
    A[Browser / Client] -->|Next.js Request| B[Next.js Middleware]
    B -->|Check Session| C{Auth Valid?}
    C -->|Yes| D[App Pages Server / Client Components]
    C -->|No| E[Redirect to /login]
    
    D -->|Real-time Data / Store| F[Zustand Stores: useGameStore, useUIStore]
    D -->|Database Operations| G[Supabase PostgREST]
    
    F <-->|Subscribe & Fetch| G
    G -->|RPC / Tables| H[(Supabase PostgreSQL)]
```

## Component Architecture

- **Next.js App Router**: Handles routing, SSR, layout nesting (`app/`).
- **Middleware (`middleware.ts`)**: Server-side session validation. Intercepts all requests to ensure only authenticated users hit the dashboard.
- **Supabase Auth**: JWT-based authentication storing tokens in HTTP-only cookies (via `@supabase/ssr`).
- **Zustand**: Client-side state management for ephemeral UI states (modals, toasts) and cached game stats (XP, level) that need optimistic updates.
- **Framer Motion**: Handles all client-side animations, page transitions, and interactive UI micro-interactions.
