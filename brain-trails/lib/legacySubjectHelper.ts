/**
 * Utility functions for managing subjects in a HYBRID architecture
 * Supports both old syllabus system (subjects table) and new Arcane Archive (knowledge_paths)
 * 
 * OLD SYSTEM: semesters → subjects → topics (for AI generation, syllabus tracking)
 * NEW SYSTEM: knowledge_paths → knowledge_nodes (for subject-centric learning)
 * 
 * HYBRID APPROACH:
 * - subject_id column → points to subjects table (old system)
 * - knowledge_path_id column → points to knowledge_paths table (new system)
 * - Both can coexist, users can use either or both
 */

import { supabase } from "@/lib/supabase";

/**
 * Get or create a user's "General" knowledge path
 * Used for the new Arcane Archive system
 * 
 * @param userId - The user's ID
 * @returns The "General" knowledge path ID, or null if creation failed
 */
export async function getOrCreateGeneralSubject(userId: string): Promise<string | null> {
  try {
    // First, check if "General" subject already exists
    const { data: existingGeneral, error: fetchError } = await (supabase
      .from("knowledge_paths") as any)
      .select("id")
      .eq("user_id", userId)
      .eq("name", "General")
      .limit(1)
      .single();

    if (!fetchError && existingGeneral) {
      return existingGeneral.id;
    }

    // If not found, create it
    const { data: newGeneral, error: createError } = await (supabase
      .from("knowledge_paths") as any)
      .insert({
        user_id: userId,
        name: "General",
        description: "Your migrated study materials from before subject-centric learning",
        emoji: "📚",
        color: "from-slate-500 to-slate-600",
      })
      .select("id")
      .single();

    if (createError) {
      console.error("Failed to create General subject:", createError);
      return null;
    }

    return newGeneral?.id || null;
  } catch (error) {
    console.error("Error in getOrCreateGeneralSubject:", error);
    return null;
  }
}

/**
 * Get a user's notes from both old syllabus system AND new Arcane Archive
 * Shows ALL notes regardless of which system they belong to
 * Used by the legacy `/notes` route for backward compatibility
 * 
 * HYBRID BEHAVIOR:
 * - Fetches notes where subject_id IS NOT NULL (old syllabus system)
 * - UNION with notes where knowledge_path_id IS NOT NULL (new Arcane Archive)
 * - Shows everything the user has
 * 
 * @param userId - The user's ID
 * @returns Array of notes, or empty array if fetch fails
 */
export async function getLegacyNotes(userId: string) {
  try {
    // Fetch notes from BOTH systems using OR logic
    // This gets all notes regardless of which column they're linked to
    const { data, error } = await (supabase.from("notes") as any)
      .select("*")
      .eq("user_id", userId)
      .or("subject_id.not.is(null),knowledge_path_id.not.is(null)")  // Either old OR new system
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch legacy notes:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getLegacyNotes:", error);
    return [];
  }
}

/**
 * Get a user's decks from both old syllabus system AND new Arcane Archive
 * Shows ALL decks with their cards regardless of which system they belong to
 * Used by the legacy `/flashcards` route for backward compatibility
 * 
 * HYBRID BEHAVIOR:
 * - Fetches decks where subject_id IS NOT NULL (old: AI-generated from syllabus)
 * - UNION with decks where knowledge_path_id IS NOT NULL (new: Arcane Archive)
 * - Shows everything the user has
 * 
 * @param userId - The user's ID
 * @returns Array of decks with their cards, or empty array if fetch fails
 */
export async function getLegacyDecks(userId: string) {
  try {
    // Fetch decks from BOTH systems using OR logic
    const { data: decks, error: deckError } = await (supabase.from("decks") as any)
      .select("*")
      .eq("user_id", userId)
      .or("subject_id.not.is(null),knowledge_path_id.not.is(null)")  // Either old OR new system
      .order("created_at", { ascending: false });

    if (deckError) {
      console.error("Failed to fetch legacy decks:", deckError);
      return [];
    }

    // Fetch cards for each deck
    const decksWithCards = await Promise.all(
      (decks || []).map(async (deck) => {
        const { data: cards } = await (supabase.from("cards") as any)
          .select("*")
          .eq("deck_id", deck.id)
          .order("created_at");

        return {
          ...deck,
          cards: cards || [],
        };
      })
    );

    return decksWithCards;
  } catch (error) {
    console.error("Error in getLegacyDecks:", error);
    return [];
  }
}

/**
 * Get a user's quizzes from both old syllabus system AND new Arcane Archive
 * Shows ALL quizzes regardless of which system they belong to
 * Used by the legacy `/quiz` route for backward compatibility
 * 
 * HYBRID BEHAVIOR:
 * - Fetches quizzes where subject_id IS NOT NULL (old syllabus system)
 * - UNION with quizzes where knowledge_path_id IS NOT NULL (new Arcane Archive)
 * - Shows everything the user has
 * 
 * @param userId - The user's ID
 * @returns Array of quizzes, or empty array if fetch fails
 */
export async function getLegacyQuizzes(userId: string) {
  try {
    // Fetch quizzes from BOTH systems using OR logic
    const { data, error } = await (supabase.from("quizzes") as any)
      .select("*")
      .eq("user_id", userId)
      .or("subject_id.not.is(null),knowledge_path_id.not.is(null)")  // Either old OR new system
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch legacy quizzes:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getLegacyQuizzes:", error);
    return [];
  }
}

/**
 * HYBRID HELPER: Get all subjects from the old syllabus system
 * Useful for showing users their existing subjects alongside new Arcane Archive
 * 
 * @param userId - The user's ID
 * @returns Array of subjects with their topics, or empty array if fetch fails
 */
export async function getOldSystemSubjects(userId: string) {
  try {
    // Get active semester
    const { data: semData } = await (supabase.from("semesters") as any)
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (!semData) return [];

    // Get subjects in that semester
    const { data: subjects } = await (supabase.from("subjects") as any)
      .select("id, name, emoji")
      .eq("semester_id", semData.id)
      .order("name");

    if (!subjects || subjects.length === 0) return [];

    // Get topics for each subject
    const subjectIds = subjects.map((s: { id: string }) => s.id);
    const { data: topics } = await (supabase.from("topics") as any)
      .select("id, name, subject_id")
      .in("subject_id", subjectIds)
      .order("sort_order");

    // Enrich subjects with their topics
    const enrichedSubjects = subjects.map((s: { id: string; name: string; emoji: string }) => ({
      ...s,
      topics: (topics ?? [])
        .filter((t: { subject_id: string }) => t.subject_id === s.id)
        .map((t: { id: string; name: string }) => ({ id: t.id, name: t.name })),
    }));

    return enrichedSubjects;
  } catch (error) {
    console.error("Error in getOldSystemSubjects:", error);
    return [];
  }
}

/**
 * HYBRID HELPER: Get all knowledge paths (new Arcane Archive subjects)
 * Useful for showing users their new subject-centric materials
 * 
 * @param userId - The user's ID
 * @returns Array of knowledge paths, or empty array if fetch fails
 */
export async function getNewSystemSubjects(userId: string) {
  try {
    const { data, error } = await (supabase.from("knowledge_paths") as any)
      .select("id, name, description, emoji, color")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch knowledge paths:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getNewSystemSubjects:", error);
    return [];
  }
}

/**
 * HYBRID INFO: Get statistics about user's content across both systems
 * Useful for dashboards showing migration progress
 * 
 * @param userId - The user's ID
 * @returns Object with counts from both systems
 */
export async function getHybridSystemStats(userId: string) {
  try {
    // Old system stats
    const { count: oldNotes } = await (supabase.from("notes") as any)
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .not("subject_id", "is", null);

    const { count: oldDecks } = await (supabase.from("decks") as any)
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .not("subject_id", "is", null);

    // New system stats
    const { count: newNotes } = await (supabase.from("notes") as any)
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .not("knowledge_path_id", "is", null);

    const { count: newDecks } = await (supabase.from("decks") as any)
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .not("knowledge_path_id", "is", null);

    return {
      oldSystem: {
        notes: oldNotes || 0,
        decks: oldDecks || 0,
      },
      newSystem: {
        notes: newNotes || 0,
        decks: newDecks || 0,
      },
      total: {
        notes: (oldNotes || 0) + (newNotes || 0),
        decks: (oldDecks || 0) + (newDecks || 0),
      },
    };
  } catch (error) {
    console.error("Error in getHybridSystemStats:", error);
    return {
      oldSystem: { notes: 0, decks: 0 },
      newSystem: { notes: 0, decks: 0 },
      total: { notes: 0, decks: 0 },
    };
  }
}
