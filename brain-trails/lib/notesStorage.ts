/**
 * 📝 Notes Storage Utility
 * 
 * Provides localStorage-based persistence for notes content and folder structure.
 * Includes debounced auto-save to prevent excessive writes.
 */

const NOTES_PREFIX = "braintrails_note_";
const TREE_KEY = "braintrails_note_tree";

/**
 * Save note content to localStorage
 */
export function saveNote(noteId: string, html: string): void {
  try {
    localStorage.setItem(`${NOTES_PREFIX}${noteId}`, html);
  } catch (error) {
    console.error("Failed to save note:", error);
  }
}

/**
 * Load note content from localStorage
 */
export function loadNote(noteId: string): string | null {
  try {
    return localStorage.getItem(`${NOTES_PREFIX}${noteId}`);
  } catch (error) {
    console.error("Failed to load note:", error);
    return null;
  }
}

/**
 * Delete a note from localStorage
 */
export function deleteNote(noteId: string): void {
  try {
    localStorage.removeItem(`${NOTES_PREFIX}${noteId}`);
  } catch (error) {
    console.error("Failed to delete note:", error);
  }
}

/**
 * Save the folder/note tree structure to localStorage
 */
export function saveNoteTree(tree: unknown): void {
  try {
    localStorage.setItem(TREE_KEY, JSON.stringify(tree));
  } catch (error) {
    console.error("Failed to save note tree:", error);
  }
}

/**
 * Load the folder/note tree structure from localStorage
 */
export function loadNoteTree<T>(): T | null {
  try {
    const data = localStorage.getItem(TREE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Failed to load note tree:", error);
    return null;
  }
}

/**
 * Get all saved note IDs
 */
export function getAllNoteIds(): string[] {
  const ids: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(NOTES_PREFIX)) {
        ids.push(key.replace(NOTES_PREFIX, ""));
      }
    }
  } catch (error) {
    console.error("Failed to get note IDs:", error);
  }
  return ids;
}

/**
 * Create a debounced version of a function
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
