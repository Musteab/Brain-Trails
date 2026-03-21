# Architecture

## System Overview

```mermaid
graph TD
    subgraph Client["🖥️ Browser"]
        A[Next.js App Router] --> B[React Client Components]
        B --> C[Zustand Stores]
        B --> D[Custom Hooks]
        B --> E[Framer Motion Animations]
    end

    subgraph Edge["⚡ Edge / Server"]
        F[middleware.ts] -->|getUser| G[Supabase Auth]
        H[auth/callback/route.ts] -->|exchangeCode| G
    end

    subgraph Backend["☁️ Supabase"]
        G --> I[(PostgreSQL)]
        I -->|RLS Policies| J[Row Level Security]
        I -->|pg_changes| K[Realtime Subscriptions]
        I -->|RPC| L[Server Functions]
    end

    A -->|Every Request| F
    C <-->|CRUD + Realtime| I
    D <-->|Auth State| G
    K -->|Live Updates| C
```

## App Router Structure

```
app/
├── (auth)
│   ├── login/           → Email + Google sign-in
│   ├── register/        → Account creation with username
│   ├── forgot-password/ → Password recovery request
│   ├── reset-password/  → New password form
│   ├── confirm-email/   → "Check your inbox" screen
│   ├── email-confirmed/ → Success landing page
│   └── auth/callback/   → OAuth + email code exchange (server route)
│
├── (dashboard)
│   ├── page.tsx          → Main dashboard (TopStatsBar, QuestLog, ActivityFeed, etc.)
│   └── focus/            → Pomodoro focus timer with ambient sounds
│
├── (features)
│   ├── flashcards/       → Spaced repetition flashcard decks
│   ├── quiz/             → Auto-generated quizzes from syllabus
│   ├── notes/            → Rich text note editor with persistence
│   ├── knowledge/        → AI Syllabus parser — upload PDFs, generate topics
│   ├── battle/           → Co-op Boss Raid system
│   ├── guild/            → Join/create guilds, group leaderboards
│   ├── shop/             → Cosmetics store (titles, frames, backgrounds)
│   ├── achievements/     → Trophy case with rarity tiers
│   └── report/           → Study analytics and progress reports
│
├── (meta)
│   ├── settings/         → User preferences, theme, sound, password
│   ├── about/            → Interactive MagicBook "About" page
│   ├── onboarding/       → First-time user walkthrough
│   ├── admin/            → Admin dashboard (role-gated)
│   ├── privacy/          → Privacy policy (public)
│   ├── terms/            → Terms of service (public)
│   └── support/          → Help and feedback
│
├── robots.ts             → SEO crawl rules
├── sitemap.ts            → Dynamic sitemap generation
└── loading.tsx           → Global loading skeleton
```

## Component Architecture

```mermaid
graph LR
    subgraph Layout["Layout Layer"]
        TH[TravelerHotbar] --> BG[BackgroundLayer]
        FT[Footer]
    end

    subgraph Dashboard["Dashboard Components"]
        DB[Dashboard] --> TSB[TopStatsBar]
        DB --> QL[QuestLog]
        DB --> AF[ActivityFeed]
        DB --> LP[LeaderboardPodium]
        DB --> SW[SyllabusWidget]
        DB --> SR[StudyRoom]
        DB --> CBR[CoopBossRaid]
        DB --> AL[AdventureLog]
        DB --> DT[DashboardTour]
    end

    subgraph State["State Management"]
        GS[useGameStore] -->|XP, Gold, Level, Streak| DB
        US[useUIStore] -->|Modals, Toasts, Theme| Layout
    end

    subgraph Hooks["Custom Hooks"]
        H1[useAchievements]
        H2[useQuests]
        H3[useAmbientSound]
        H4[usePWA]
        H5[useStudyReminders]
        H6[usePresence]
        H7[useSoundEffects]
        H8[useSettings]
        H9[usePerformanceTier]
        H10[useKonamiCode]
    end
```

## Key Technology Choices

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 16 (App Router) | SSR, routing, middleware |
| Styling | Tailwind CSS v4 | Utility-first CSS with `@theme inline` |
| Animations | Framer Motion | Physics-based UI animations |
| State | Zustand | Selective re-renders for game stats |
| Auth | Supabase Auth + `@supabase/ssr` | JWT cookies, OAuth, PKCE |
| Database | Supabase PostgreSQL | RLS, Realtime, RPCs |
| Sound | Howler.js | Ambient music + sound effects |
| PWA | Service Worker + Manifest | Installable, offline-capable |
| Icons | Lucide React | Consistent icon system |
| Fonts | Nunito + Quicksand | Playful headings + clean body text |
