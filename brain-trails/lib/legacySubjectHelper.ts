/**
 * Utility functions for managing the "General" subject
 * Used for backward compatibility with legacy routes
 * 
 * The "General" subject contains all user's legacy notes/decks/quizzes
 * that were created before the subject-centric migration
 */

import { supabase } from "@/lib/supabase";

/**
 * Get or create a user's "General" subject
 * This subject contains all their legacy study materials
 * 
 * @param userId - The user's ID
 * @returns The "General" subject ID, or null if creation failed
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
 * Get a user's notes from their "General" subject
 * Used by the legacy `/notes` route for backward compatibility
 * 
 * @param userId - The user's ID
 * @returns Array of notes, or empty array if fetch fails
 */
export async function getLegacyNotes(userId: string) {
  try {
    const generalSubjectId = await getOrCreateGeneralSubject(userId);
    if (!generalSubjectId) return [];

    const { data, error } = await (supabase.from("notes") as any)
      .select("*")
      .eq("user_id", userId)
      .eq("subject_id", generalSubjectId)
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
 * Get a user's decks from their "General" subject
 * Used by the legacy `/flashcards` route for backward compatibility
 * 
 * @param userId - The user's ID
 * @returns Array of decks with their cards, or empty array if fetch fails
 */
export async function getLegacyDecks(userId: string) {
  try {
    const generalSubjectId = await getOrCreateGeneralSubject(userId);
    if (!generalSubjectId) return [];

    // Fetch decks
    const { data: decks, error: deckError } = await (supabase.from("decks") as any)
      .select("*")
      .eq("user_id", userId)
      .eq("subject_id", generalSubjectId)
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
 * Get a user's quizzes from their "General" subject
 * Used by the legacy `/quiz` route for backward compatibility
 * 
 * @param userId - The user's ID
 * @returns Array of quizzes, or empty array if fetch fails
 */
export async function getLegacyQuizzes(userId: string) {
  try {
    const generalSubjectId = await getOrCreateGeneralSubject(userId);
    if (!generalSubjectId) return [];

    const { data, error } = await (supabase.from("quizzes") as any)
      .select("*")
      .eq("user_id", userId)
      .eq("subject_id", generalSubjectId)
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
