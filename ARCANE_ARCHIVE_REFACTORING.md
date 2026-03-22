# Arcane Archive Refactoring - Subject-Centric Learning Hub

## 📋 Overview

This refactoring restructures Brain Trails to be **subject-centric** rather than having separate top-level pages for notes, flashcards, and quizzes. All learning materials are now organized under specific subjects within the "Arcane Archive" (Skill Tree).

## 🗺️ New Routing Structure

### Before (Flat Structure)
```
/notes          → Global notes editor
/flashcards     → All flashcard decks
/quiz           → Quiz hub
/knowledge      → Skill tree (separate from study tools)
```

### After (Subject-Centric Structure)
```
/arcane-archive                           → Main archive hub (all subjects)
├── [subjectId]/                          → Subject overview & hub
│   ├── page.tsx                          → Subject overview (choose study mode)
│   ├── spellbook/                        → Notes for this subject
│   │   └── page.tsx                      → Subject-specific note editor
│   ├── flashcards/                       → Flashcards for this subject
│   │   └── page.tsx                      → Subject-specific card practice
│   └── quiz/                             → Quizzes for this subject
│       └── page.tsx                      → Subject-specific quiz trials
└── layout.tsx                            → Shared "Wizard's Desk" layout
```

## 🎨 UI/UX Changes

### 1. **Arcane Archive Hub** (`/arcane-archive`)
- Grid of subject cards showing:
  - Subject emoji & name
  - Description
  - Progress indicator
  - Quick action to enter subject
- "Create New Subject" card for adding new learning goals
- Animated cards with hover effects

### 2. **Wizard's Desk Layout** (`/arcane-archive/[subjectId]/layout.tsx`)
- **Shared Header** with:
  - Back button to archive
  - Subject name & emoji
  - Tab navigation (Spellbook, Spell Cards, Trials)
  - Active tab highlighting
- **Progress Bar Section** showing:
  - 📖 Spellbook completion % (notes written)
  - ✨ Spell Cards mastery % (cards reviewed)
  - 🔒 Trials lock status (quiz unlock indicator)
- **Mastery Thresholds** displayed:
  - Quiz unlocks when: Spellbook ≥ 30% + Cards ≥ 40%

### 3. **Subject Overview Page** (`/arcane-archive/[subjectId]/`)
- Three main sections (cards):
  - 📖 **Spellbook**: Take notes for this subject
  - ✨ **Spell Cards**: Practice with flashcards
  - ⚔️ **Trials**: Test knowledge with quizzes
- Thematic descriptions for each
- Click-to-navigate cards with hover animations

### 4. **Spellbook (Notes)** (`/arcane-archive/[subjectId]/spellbook/`)
- ✅ Fully functional with all existing features:
  - Rich text editor (left & right pages)
  - AI familiar for help
  - Import/export functionality
  - Save status indicator
  - Sidebar with note list
- **Scoped to subject**: Only shows notes for this subject (after DB migration)
- Auto-saves with improved debouncing (500ms)
- Force-saves on component unmount

## 🔧 Technical Implementation

### Database Changes

**Migration File**: `supabase/migrations/00015_add_subject_linking.sql`

New columns added:
- `notes.subject_id` → FK to `knowledge_paths.id`
- `decks.subject_id` → FK to `knowledge_paths.id`
- `quizzes.subject_id` → FK to `knowledge_paths.id`

Indexes created for performance:
- `idx_notes_subject_id`
- `idx_decks_subject_id`
- `idx_quizzes_subject_id`

Helper view created:
- `subject_content` - Aggregates content counts per subject

### Component Structure

```
arcane-archive/
├── page.tsx                          # Hub showing all subjects
├── [subjectId]/
│   ├── layout.tsx                    # Wizard's Desk shared layout
│   ├── page.tsx                      # Subject overview
│   ├── spellbook/
│   │   └── page.tsx                  # Spellbook editor (DONE)
│   ├── flashcards/
│   │   └── page.tsx                  # Flashcards (stub - ready for refactor)
│   └── quiz/
│       └── page.tsx                  # Quiz trials (stub - ready for refactor)
```

## 🔐 Mastery System

### Unlock Logic

Quizzes are locked until the user demonstrates sufficient mastery:

```typescript
const quizUnlocked = notesCompletion >= 30 && cardMastery >= 40;
```

**Requirements**:
- ✏️ **Spellbook**: ≥ 30% completion (notes written)
- 🃏 **Spell Cards**: ≥ 40% mastery (cards reviewed)

**UI Indicators**:
- Locked quiz: Shows 🔒 icon with "Locked" badge
- Unlocked quiz: Shows 🔓 icon with "Trials Unlocked!" badge
- Quiz button disabled when locked

## 📊 Data Flow

### Creating a Note for a Subject

1. User navigates to `/arcane-archive/[subjectId]`
2. Clicks "Get Started" on Spellbook card
3. Redirects to `/arcane-archive/[subjectId]/spellbook`
4. Creates/selects a note
5. Note is saved with `subject_id` = current subject
6. Note appears only in this subject's spellbook

### Calculating Progress

```
Spellbook Progress = (notes_count / target_notes) * 100
Spell Cards Progress = avg(card_mastery_scores)
```

The layout continuously calculates and displays these percentages.

## 🚀 Next Steps for Full Implementation

### Phase 1: Flashcards Refactoring (High Priority)
- [ ] Adapt flashcards page to work with `subject_id`
- [ ] Add subject selector to deck creation
- [ ] Filter cards by subject in practice view
- [ ] Design ornate "card-reading stand" UI theme

### Phase 2: Quiz Refactoring (High Priority)
- [ ] Link quizzes to `subject_id`
- [ ] Connect quizzes to subject's notes & cards
- [ ] Implement AI quiz generation from subject materials
- [ ] Add quiz unlock gate based on mastery

### Phase 3: UI Polish (Medium Priority)
- [ ] Design grimoire sidebar with folder organization
- [ ] Add page-flip animations to Spellbook
- [ ] Create glowing subject connection map in Archive
- [ ] Implement ornate card-reading stand for Flashcards
- [ ] Add enchanted visual effects throughout

### Phase 4: Data Migration (Medium Priority)
- [ ] Migrate existing notes to subjects (or allow choice)
- [ ] Migrate existing decks to subjects
- [ ] Migrate existing quizzes to subjects
- [ ] Update URLs for backward compatibility

## 🧪 Testing Checklist

- [ ] Create new subject from Archive hub
- [ ] Navigate to subject overview
- [ ] Create notes in Spellbook (auto-saves)
- [ ] Verify progress bars update
- [ ] Confirm quiz is locked initially
- [ ] Navigate between tabs without data loss
- [ ] Test rapid navigation (save on unmount)
- [ ] Verify theme (sun/moon) works in all pages
- [ ] Test AI familiar in subject's Spellbook
- [ ] Export notes from subject-specific editor

## 📁 File Changes Summary

### New Files Created (6)
- `app/arcane-archive/page.tsx` - Archive hub
- `app/arcane-archive/[subjectId]/layout.tsx` - Shared layout
- `app/arcane-archive/[subjectId]/page.tsx` - Subject overview
- `app/arcane-archive/[subjectId]/spellbook/page.tsx` - Subject notes
- `app/arcane-archive/[subjectId]/flashcards/page.tsx` - Subject flashcards (stub)
- `app/arcane-archive/[subjectId]/quiz/page.tsx` - Subject quizzes (stub)

### Modified Files (2)
- `app/notes/page.tsx` - Added auto-save on unmount (bug fix)
- `supabase/migrations/00015_add_subject_linking.sql` - New migration

### Kept Intact (For Backward Compatibility)
- `/notes`, `/flashcards`, `/quiz` - Still available as top-level routes
- Can be deprecated/removed in future version

## 🎯 Key Features Implemented

✅ Subject hub with grid layout  
✅ Subject-specific Spellbook with all existing features  
✅ Shared Wizard's Desk layout with progress bars  
✅ Mastery System UI (lock/unlock logic for quizzes)  
✅ Theme support (sun/moon) across all new pages  
✅ Better auto-save with unmount protection  
✅ Database migration structure ready  

## 📝 Notes

- The old `/notes`, `/flashcards`, `/quiz` routes still exist for backward compatibility
- Database migration should be applied before deploying to production
- Existing user data is preserved; subject_id is optional (NULL) until explicitly set
- The Mastery System UI is implemented; actual unlock logic awaits full quiz refactoring
- AI familiar works in subject Spellbook (connects to existing backend)

---

**Status**: 🚧 In Progress  
**Branch**: `polish-branch`  
**Last Updated**: March 23, 2026
