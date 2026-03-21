# Technical Decisions

Here are the key architectural choices made during the development of Brain Trails.

## 1. Why App Router & Server Components?

Next.js App Router (`app/`) offers improved rendering performance, React Server Components (RSC), and built-in nested layouts.
- **Decision**: All pages default to Server Components unless interactivity (like `onClick`, `useState`, framer-motion) is required, at which point they are prefixed with `"use client"`.
- **Reasoning**: This minimizes the JavaScript bundle shipped to the browser, making the app faster on lower-end devices.

## 2. Why Zustand instead of Context API?

- **Context API** triggers a re-render of every component consuming it whenever its state changes.
- **Zustand** allows components to subscribe to specific slices of state (like `useGameStore(state => state.xp)`).
- **Decision**: We use Context for Auth (`AuthContext`) and Theme (`ThemeContext`) since they wrap the entire app and change infrequently. We use Zustand for the rapidly changing Game and UI states (`useGameStore`, `useUIStore`).

## 3. Why Supabase for Backend?

- Provides PostgreSQL out of the box with Row-Level Security (RLS).
- Has real-time subscriptions built-in (`pg_changes`), which powers the Activity Feed and Dashboard stats.
- Auth handles OAuth perfectly with Next.js edge middleware.

## 4. Why Cookies over LocalStorage?

- **SSR Support**: Middleware and Server Components cannot access `window.localStorage`.
- By storing Supabase Auth tokens in HTTP cookies, the server can authenticate the user *before* rendering the HTML, avoiding the "flicker" of a login screen on refresh.

## 5. Why Tailwind CSS v4 & Framer Motion?

- Tailwind v4 eliminates the need for complex configuration files (`tailwind.config.js`) by moving configuration to CSS (`@theme inline`).
- Framer Motion handles complex, physics-based UI animations (like the floating stats and layout transitions) that would be difficult to do cleanly in CSS alone.
