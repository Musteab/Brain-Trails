/**
 * Boss definitions for the Flashcard Boss Battle system.
 *
 * Each boss has a name, icon (matching a PNG in /assets/icons/),
 * HP, difficulty, and reward values. Bosses are ordered by difficulty.
 *
 * Damage per correct answer = 10 base.
 * Player has 3 hearts. Wrong answer = lose 1 heart.
 */

export interface Boss {
  id: string;
  name: string;
  icon: string;
  hp: number;
  difficulty: "easy" | "medium" | "hard";
  xpReward: number;
  goldReward: number;
  description: string;
}

export const BOSSES: Boss[] = [
  {
    id: "bat",
    name: "Shadow Bat",
    icon: "/assets/icons/batboss.png",
    hp: 50,
    difficulty: "easy",
    xpReward: 100,
    goldReward: 50,
    description: "A nocturnal menace that preys on unprepared students.",
  },
  {
    id: "spider",
    name: "Web Weaver",
    icon: "/assets/icons/spiderboss.png",
    hp: 60,
    difficulty: "easy",
    xpReward: 120,
    goldReward: 60,
    description: "Spins webs of confusion around tricky topics.",
  },
  {
    id: "ghost",
    name: "Phantom Scholar",
    icon: "/assets/icons/ghostboss.png",
    hp: 80,
    difficulty: "medium",
    xpReward: 200,
    goldReward: 100,
    description: "The restless spirit of a student who never finished studying.",
  },
  {
    id: "creeper",
    name: "Knowledge Creeper",
    icon: "/assets/icons/creeperboss.png",
    hp: 100,
    difficulty: "medium",
    xpReward: 250,
    goldReward: 125,
    description: "Sneaks up and destroys your concentration when you least expect it.",
  },
  {
    id: "frank",
    name: "Dr. Franken-Study",
    icon: "/assets/icons/frankboss.png",
    hp: 120,
    difficulty: "hard",
    xpReward: 350,
    goldReward: 175,
    description: "A monstrous amalgamation of every hard exam question.",
  },
  {
    id: "vamp",
    name: "Exam Vampire",
    icon: "/assets/icons/vampboss.png",
    hp: 150,
    difficulty: "hard",
    xpReward: 500,
    goldReward: 250,
    description: "Drains your knowledge and time. The final challenge.",
  },
];

/** Damage dealt per correct flashcard answer. */
export const DAMAGE_PER_HIT = 10;

/** Starting hearts for the player. */
export const PLAYER_MAX_HEARTS = 3;

/**
 * Difficulty badge colours (Tailwind classes).
 */
export function getDifficultyStyle(d: Boss["difficulty"]) {
  switch (d) {
    case "easy":
      return { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" };
    case "medium":
      return { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" };
    case "hard":
      return { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30" };
  }
}
