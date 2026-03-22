# Brain Trails Documentation 📚

Welcome to the Brain Trails developer documentation! This folder contains in-depth guides for understanding the architecture, database schema, game systems, and key decisions that power Brain Trails.

## 📖 Quick Navigation

### 🏗️ [architecture.md](./architecture.md)
**System overview, routing structure, and component hierarchy**

Start here to understand:
- How Next.js App Router is organized
- Frontend → Backend architecture (Supabase stack)
- Component hierarchy and state management
- **NEW**: Arcane Archive subject-centric structure
- New UI components (Grimoire Sidebar, ArcaneArchiveMap, ConfettiCelebration)

### 💾 [database.md](./database.md)
**Complete database schema and relationships**

Learn about:
- All 15 database tables and their purposes
- Entity relationships (ERD)
- Migration history
- Row-level security (RLS) policies
- **NEW**: Knowledge Paths table (subject-centric hub)
- How `subject_id` links notes, decks, and quizzes

### 🎮 [game-system.md](./game-system.md)
**RPG mechanics, XP, gold, quests, achievements, guilds**

Understand:
- Core game loop and progression
- XP & leveling formula
- Gold economy and cosmetics shop
- Streaks and motivational systems
- Quest completion logic
- **NEW**: Mastery System for quiz gating

### 🔐 [auth-flow.md](./auth-flow.md)
**Authentication flows, OAuth, session management**

Details on:
- Email signup/login flow
- Google OAuth setup
- JWT session cookies
- Password recovery
- Protected routes and middleware

### ✅ [decisions.md](./decisions.md)
**Key architectural and design decisions with rationale**

Why we chose:
- Next.js 16 App Router over Pages Router
- Supabase over custom backend
- Zustand over Redux
- Tailwind CSS v4 with `@theme inline`
- Canvas-based confetti over pre-rendered animations

---

## 🎨 Recent Updates (March 2026)

### UI Polish Complete! ✨

**Grimoire Sidebar** (`components/notes/GrimoireSidebar.tsx`)
- Enhanced note organization with magical folder hierarchy
- Search, pin/star system, and color-coded folders
- Real-time Supabase sync

**Ornate Flashcards UI** (`app/arcane-archive/[subjectId]/flashcards/page.tsx`)
- Card-reading stand theme with glowing effects
- Serif fonts and ornate decorations
- Performance-based animations

**Arcane Archive Map** (`components/arcane-archive/ArcaneArchiveMap.tsx`)
- Interactive canvas showing subject connections
- Glowing nodes with hover effects
- Visual subject relationship visualization

**Confetti Celebrations** (`components/quiz/ConfettiCelebration.tsx`)
- Performance-based confetti effects on quiz completion
- Higher scores = more intense celebrations
- Smooth particle animations with physics

---

## 🔄 Architecture at a Glance

```
┌─────────────────────────────────────────┐
│  🖥️ Next.js (Turbopack) Frontend        │
│  - App Router with dynamic routes       │
│  - Framer Motion animations             │
│  - Tailwind CSS (responsive)            │
└────────────┬────────────────────────────┘
             │ fetch/realtime
┌────────────▼────────────────────────────┐
│  ☁️ Supabase Backend                    │
│  - PostgreSQL database                  │
│  - Auth (JWT + OAuth)                   │
│  - Realtime subscriptions               │
│  - Row-level security (RLS)             │
└─────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│  🧠 Python Flask + Google Gemini        │
│  - AI-powered features only             │
│  - Syllabus parsing, quiz generation    │
│  - Optional deployment                  │
└─────────────────────────────────────────┘
```

---

## 🚀 Key Features by Module

| Module | Documentation | Status |
|--------|---------------|--------|
| **Arcane Archive** | Routing in `architecture.md` | ✅ Live |
| **Spellbook (Notes)** | Database schema in `database.md` | ✅ Live |
| **Spell Cards (Flashcards)** | Game system in `game-system.md` | ✅ Live |
| **Trials (Quizzes)** | Mastery System in `game-system.md` | ✅ Live |
| **XP & Leveling** | Game system in `game-system.md` | ✅ Live |
| **Quests** | Game system in `game-system.md` | ✅ Live |
| **Cosmetics Shop** | Game system in `game-system.md` | ✅ Live |
| **Guilds** | Game system in `game-system.md` | 🧪 Beta |

---

## 📚 Subject-Centric Learning (Arcane Archive)

### What Changed?

**Before**: Separate global routes for notes, flashcards, quizzes
```
/notes        → All notes
/flashcards   → All flashcards
/quiz         → All quizzes
```

**After**: Everything scoped to subjects
```
/arcane-archive/[subjectId]/spellbook     → Subject notes
/arcane-archive/[subjectId]/flashcards    → Subject flashcards
/arcane-archive/[subjectId]/quiz          → Subject quizzes (gated by mastery)
```

### Database Changes (Migration #15)

- `notes.subject_id` → FK to `knowledge_paths.id`
- `decks.subject_id` → FK to `knowledge_paths.id`
- `quizzes.subject_id` → FK to `knowledge_paths.id`
- New `knowledge_paths` table for subject metadata

See `database.md` → "Subject-Centric Architecture" section for details.

---

## 🎯 Common Tasks

### Adding a New Route
1. Create folder in `app/`
2. Add `page.tsx` (client) or `route.ts` (API)
3. Use `layout.tsx` for shared UI
4. Reference `architecture.md` for patterns

### Modifying Database
1. Create new migration in `supabase/migrations/`
2. Follow naming: `00XXX_description.sql`
3. Test locally with Supabase CLI
4. Document in `database.md`

### Adding Game System Feature
1. Update `game_system.md` with logic
2. Add Zustand store in `stores/`
3. Create hook in `hooks/`
4. Update `adventure_log` table if needed

### Styling Components
1. Use Tailwind CSS utilities (see `globals.css`)
2. Reference theme variables (`--color-primary`, etc.)
3. Support both sun ☀️ and moon 🌙 modes
4. Use Framer Motion for animations

---

## 🔗 Related Files

- **Root README**: `../../README.md` — User-facing documentation
- **Arcane Archive Refactoring**: `../../ARCANE_ARCHIVE_REFACTORING.md` — Detailed implementation guide
- **Database Migrations**: `../supabase/migrations/` — All SQL schema changes
- **Component Directory**: `../components/` — Modular React components

---

## 🤝 Contributing

When contributing to Brain Trails:

1. **Update docs** alongside code changes
2. **Follow naming conventions** (see `decisions.md`)
3. **Test migrations** before submitting PR
4. **Add comments** for non-obvious logic
5. **Update this README** if adding new modules

---

## ❓ FAQ

**Q: Where do I add a new game system feature?**  
A: Update `game-system.md` with logic, add Zustand store in `stores/`, create hook in `hooks/`.

**Q: How do I add a new study material (like "Timelines")?**  
A: Create migration, update `database.md`, add routes in `app/arcane-archive/[subjectId]/`, link to subject via `knowledge_paths`.

**Q: What's the difference between `/notes` and `/arcane-archive/[subjectId]/spellbook`?**  
A: The latter is subject-scoped and gate-locked by mastery requirements. The former is legacy and shows all user notes globally.

**Q: How do I enable a new OAuth provider?**  
A: See `auth-flow.md` and configure in Supabase Dashboard → Authentication → Providers.

---

**Last Updated**: March 23, 2026  
**Status**: Active Development  
**Maintainers**: Brain Trails Dev Team
