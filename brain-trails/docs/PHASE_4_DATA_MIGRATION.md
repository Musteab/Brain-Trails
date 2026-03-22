# Phase 4: Data Migration Guide 📚

## Overview
This guide walks you through the complete data migration process from legacy (subject-agnostic) to subject-centric learning in Brain Trails.

---

## What's Being Migrated?

| Item | From | To | Status |
|------|------|-----|--------|
| **Notes** | Global `/notes` | Subject-scoped `/arcane-archive/[subjectId]/spellbook` | ✅ Migrating to "General" subject |
| **Flashcard Decks** | Global `/flashcards` | Subject-scoped `/arcane-archive/[subjectId]/flashcards` | ✅ Migrating to "General" subject |
| **Quizzes** | Global `/quiz` | Subject-scoped `/arcane-archive/[subjectId]/quiz` | ✅ Migrating to "General" subject |
| **URL Compatibility** | Legacy routes removed | Legacy routes → "General" subject | ✅ Maintained via adapter routes |

---

## Migration Process

### Step 1: Fix Migration #15 (Already Done ✅)

**What it does:**
- Adds `subject_id` column to `notes`, `decks`, and `quizzes` tables
- Includes safe exception handling for already-existing columns
- Creates indexes for performance
- Adds RLS policies for subject-scoped security

**Changes made:**
- ✅ Updated to use `DO $$ BEGIN ... EXCEPTION ... END $$;` for idempotency
- ✅ Handles `duplicate_column` and `undefined_table` errors gracefully
- ✅ Uses `CREATE INDEX IF NOT EXISTS` to prevent re-creation errors

**To apply in Supabase:**
```sql
-- Run this in Supabase SQL Editor
-- Paste contents of: brain-trails/supabase/migrations/00015_add_subject_linking.sql
```

---

### Step 2: Run Migration #16 (Auto-Migration)

**What it does:**
- Ensures `subject_id` column exists on all three tables
- Auto-assigns all orphaned (null `subject_id`) items to each user's "General" subject
- Creates supporting indexes

**Key logic:**
```sql
-- For each user with orphaned notes:
-- UPDATE notes SET subject_id = user's_general_subject_id WHERE subject_id IS NULL

-- Same for decks and quizzes
```

**To apply in Supabase:**
```sql
-- Run this in Supabase SQL Editor
-- Paste contents of: brain-trails/supabase/migrations/00016_auto_migrate_to_general_subject.sql
```

**Expected outcome:**
- All existing notes/decks/quizzes now have `subject_id` pointing to a "General" subject
- Zero orphaned items remain
- Legacy routes can now safely query subject-scoped data

---

### Step 3: Create "General" Subject for Existing Users (Backend)

**What it does:**
- On first login after migration, each user gets a "General" subject automatically
- All their legacy content is already linked to it (from migration #16)

**Implementation:**
- Backend checks: `SELECT COUNT(*) FROM knowledge_paths WHERE user_id = ? AND name = 'General'`
- If count = 0, create one with:
  - `name`: "General"
  - `description`: "Your migrated study materials from before subject-centric learning"
  - `emoji`: "📚"
  - `color`: "from-slate-500 to-slate-600"

**Code location:** (To be implemented in `/app/page.tsx` or auth setup)

---

## URL Backward Compatibility

### Legacy Routes → Subject-Scoped Routes

| Old URL | New Equivalent | Behavior |
|---------|---|----------|
| `/notes` | `/arcane-archive/[generalSubjectId]/spellbook` | Query `WHERE subject_id = general_subject_id` |
| `/flashcards` | `/arcane-archive/[generalSubjectId]/flashcards` | Query `WHERE subject_id = general_subject_id` |
| `/quiz` | `/arcane-archive/[generalSubjectId]/quiz` | Query `WHERE subject_id = general_subject_id` |

### Implementation Strategy

**Option A: Keep Legacy Routes (Recommended for Phase 4)**
- Keep `/notes`, `/flashcards`, `/quiz` pages functional
- They query from the "General" subject by default
- Add deprecation banner: "✨ Try the new **Arcane Archive** for subject-scoped learning!"

**Option B: Redirect to Archive (For Phase 5+)**
- 301 redirect legacy routes to `/arcane-archive/[generalSubjectId]/...`
- Requires users to adopt new URLs
- Cleaner architecture but less forgiving for existing bookmarks

---

## Testing Checklist

### Pre-Migration
- [ ] Back up production database (Supabase → Download SQL export)
- [ ] Test migrations on staging environment first
- [ ] Verify migration #15 runs without errors
- [ ] Verify migration #16 runs without errors

### Post-Migration
- [ ] Verify all existing notes now have `subject_id` (no NULLs)
- [ ] Verify all existing decks now have `subject_id` (no NULLs)
- [ ] Verify all existing quizzes now have `subject_id` (no NULLs)
- [ ] Verify each user has exactly one "General" subject
- [ ] Test legacy route `/notes` → shows user's General subject notes
- [ ] Test legacy route `/flashcards` → shows user's General subject decks
- [ ] Test legacy route `/quiz` → shows user's General subject quizzes
- [ ] Test new route `/arcane-archive` → shows all subjects including General
- [ ] Test new route `/arcane-archive/[id]/spellbook` → works correctly
- [ ] Test sun/moon themes on all routes

### Performance
- [ ] Query times on `/notes` remain <100ms (with index)
- [ ] Query times on `/flashcards` remain <100ms (with index)
- [ ] Verify no N+1 queries in subject lookup

---

## SQL Queries for Verification

### Check migration status:
```sql
-- Show all notes with subject_id
SELECT 
  COUNT(*) as total_notes,
  COUNT(CASE WHEN subject_id IS NULL THEN 1 END) as orphaned_notes,
  COUNT(CASE WHEN subject_id IS NOT NULL THEN 1 END) as migrated_notes
FROM public.notes;

-- Show all decks with subject_id
SELECT 
  COUNT(*) as total_decks,
  COUNT(CASE WHEN subject_id IS NULL THEN 1 END) as orphaned_decks,
  COUNT(CASE WHEN subject_id IS NOT NULL THEN 1 END) as migrated_decks
FROM public.decks;

-- Show all quizzes with subject_id
SELECT 
  COUNT(*) as total_quizzes,
  COUNT(CASE WHEN subject_id IS NULL THEN 1 END) as orphaned_quizzes,
  COUNT(CASE WHEN subject_id IS NOT NULL THEN 1 END) as migrated_quizzes
FROM public.quizzes;

-- Show all "General" subjects created
SELECT 
  user_id,
  name,
  COUNT(*) as count
FROM knowledge_paths
WHERE name = 'General'
GROUP BY user_id, name;
```

### Sample data verification:
```sql
-- Get a user's General subject ID
SELECT id FROM knowledge_paths 
WHERE user_id = 'USER_UUID_HERE' 
AND name = 'General'
LIMIT 1;

-- Check that user's notes are linked
SELECT id, title, subject_id FROM public.notes 
WHERE user_id = 'USER_UUID_HERE'
LIMIT 5;

-- Verify subject_content view works
SELECT * FROM subject_content 
WHERE user_id = 'USER_UUID_HERE' 
AND subject_name = 'General';
```

---

## Rollback Plan (If Needed)

**Only if migration fails catastrophically:**

```sql
-- Option 1: Remove subject_id columns (DESTRUCTIVE - loses linking)
ALTER TABLE public.notes DROP COLUMN subject_id;
ALTER TABLE public.decks DROP COLUMN subject_id;
ALTER TABLE public.quizzes DROP COLUMN subject_id;

-- Option 2: Reset subject_id to NULL (SAFER - keeps structure)
UPDATE public.notes SET subject_id = NULL;
UPDATE public.decks SET subject_id = NULL;
UPDATE public.quizzes SET subject_id = NULL;

-- Then re-apply migration #15 and #16
```

---

## Phase 4 Deliverables

- ✅ Fixed migration #15 (idempotent, handles errors)
- ✅ Created migration #16 (auto-migration to General subject)
- ✅ This migration guide with testing procedures
- ⏳ Update legacy routes to query subject-scoped data (Next step)
- ⏳ Add "General" subject creation on first user login (Next step)
- ⏳ Add deprecation banner to legacy routes (Next step)

---

## Deployment Timeline

**Recommended for production:**
1. **Week 1**: Apply migrations #15 & #16 to staging
2. **Week 1**: Run full test suite on staging
3. **Week 2**: Apply to production during low-traffic window
4. **Week 2-4**: Monitor for issues, legacy routes remain active
5. **Week 4+**: Optional deprecation warning phase before removal (Phase 5+)

---

## Questions or Issues?

- Check the `ARCANE_ARCHIVE_REFACTORING.md` for overall Phase 3 context
- See `architecture.md` for database schema details
- Review `database.md` for table relationships

