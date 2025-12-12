/**
 * Event-based Gamification Engine
 *
 * A simplified, event-driven approach to gamification.
 * UI surfaces emit events, rules consume them and produce rewards.
 */

// Event types
export const GameEvent = {
  POMODORO_COMPLETED: 'POMODORO_COMPLETED',
  FLASHCARD_REVIEWED: 'FLASHCARD_REVIEWED',
  QUIZ_COMPLETED: 'QUIZ_COMPLETED',
  STUDY_SESSION_LOGGED: 'STUDY_SESSION_LOGGED',
  NOTE_CREATED: 'NOTE_CREATED',
  NOTE_UPDATED: 'NOTE_UPDATED',
  DAILY_LOGIN: 'DAILY_LOGIN',
  STREAK_MILESTONE: 'STREAK_MILESTONE',
};

// Core reward configuration (5-7 core loops)
const CORE_RULES = {
  // 1. XP + Level system
  xp: {
    [GameEvent.POMODORO_COMPLETED]: ({ minutes }) => Math.round(minutes * 2),
    [GameEvent.FLASHCARD_REVIEWED]: ({ correct }) => (correct ? 5 : 2),
    [GameEvent.QUIZ_COMPLETED]: ({ score, total }) => Math.round((score / total) * 50),
    [GameEvent.STUDY_SESSION_LOGGED]: ({ minutes }) => Math.round(minutes * 1.5),
    [GameEvent.NOTE_CREATED]: () => 10,
    [GameEvent.NOTE_UPDATED]: () => 3,
    [GameEvent.DAILY_LOGIN]: () => 15,
  },

  // 2. Daily streak
  streakEvents: [GameEvent.POMODORO_COMPLETED, GameEvent.STUDY_SESSION_LOGGED, GameEvent.QUIZ_COMPLETED],

  // 3. Daily goals (simple 3 goals)
  dailyGoals: [
    { id: 'study-30', label: 'Study for 30 minutes', target: 30, type: 'minutes', xp: 30 },
    { id: 'review-10', label: 'Review 10 flashcards', target: 10, type: 'flashcards', xp: 25 },
    { id: 'complete-pomodoro', label: 'Complete 1 Pomodoro', target: 1, type: 'pomodoro', xp: 20 },
  ],

  // 4. Pet mood thresholds
  petMood: {
    mythic: { streak: 14 },
    radiant: { streak: 7 },
    energized: { todayMinutes: 150 },
    proud: { todayMinutes: 60 },
    chill: { default: true },
  },

  // 5. Pet evolution stages
  petStage: {
    4: { level: 12 },
    3: { level: 8 },
    2: { level: 4 },
    1: { default: true },
  },

  // 6. Daily reward chest
  dailyRewards: [
    { label: 'Bronze Seed', type: 'item', xp: 20 },
    { label: 'Silver Sprout', type: 'item', xp: 35 },
    { label: 'Golden Bloom', type: 'item', xp: 50 },
    { label: 'Study Boost', type: 'boost', xp: 25 },
    { label: 'Focus Aura', type: 'cosmetic', xp: 30 },
  ],

  // 7. Focus session bonuses
  focusBonuses: {
    25: 1.0, // Standard Pomodoro
    50: 1.5, // Long focus
    90: 2.0, // Deep work
  },
};

// Level calculation
export const xpForLevel = (level) => 200 + (level - 1) * 110;

export const calculateLevel = (totalXp) => {
  let level = 1;
  let xpNeeded = xpForLevel(level);
  let remaining = totalXp;

  while (remaining >= xpNeeded) {
    remaining -= xpNeeded;
    level++;
    xpNeeded = xpForLevel(level);
  }

  return { level, xpInLevel: remaining, xpToNext: xpNeeded };
};

// Get XP reward for an event
export const getXpReward = (eventType, payload = {}) => {
  const calculator = CORE_RULES.xp[eventType];
  if (!calculator) return 0;
  return calculator(payload);
};

// Check if event contributes to streak
export const isStreakEvent = (eventType) => {
  return CORE_RULES.streakEvents.includes(eventType);
};

// Calculate pet mood
export const calculatePetMood = (streak, todayMinutes) => {
  const moods = CORE_RULES.petMood;
  if (streak >= moods.mythic.streak) return 'mythic';
  if (streak >= moods.radiant.streak) return 'radiant';
  if (todayMinutes >= moods.energized.todayMinutes) return 'energized';
  if (todayMinutes >= moods.proud.todayMinutes) return 'proud';
  return 'chill';
};

// Calculate pet stage from level
export const calculatePetStage = (level) => {
  const stages = CORE_RULES.petStage;
  if (level >= stages[4].level) return 4;
  if (level >= stages[3].level) return 3;
  if (level >= stages[2].level) return 2;
  return 1;
};

// Get daily goals template
export const getDailyGoals = () => {
  return CORE_RULES.dailyGoals.map((goal) => ({
    ...goal,
    progress: 0,
    completed: false,
    claimed: false,
  }));
};

// Get random daily reward
export const rollDailyReward = (streak = 0) => {
  const rewards = CORE_RULES.dailyRewards;
  const reward = rewards[Math.floor(Math.random() * rewards.length)];
  const streakBonus = 1 + Math.min(streak * 0.1, 1); // Up to 2x at 10 streak
  return {
    ...reward,
    xp: Math.round(reward.xp * streakBonus),
    streakBonus,
    timestamp: new Date().toISOString(),
  };
};

// Get focus bonus multiplier
export const getFocusBonus = (minutes) => {
  const bonuses = CORE_RULES.focusBonuses;
  if (minutes >= 90) return bonuses[90];
  if (minutes >= 50) return bonuses[50];
  return bonuses[25];
};

// Update daily goal progress
export const updateGoalProgress = (goals, eventType, payload) => {
  return goals.map((goal) => {
    if (goal.completed) return goal;

    let increment = 0;
    switch (goal.type) {
      case 'minutes':
        if (eventType === GameEvent.POMODORO_COMPLETED || eventType === GameEvent.STUDY_SESSION_LOGGED) {
          increment = payload.minutes || 0;
        }
        break;
      case 'flashcards':
        if (eventType === GameEvent.FLASHCARD_REVIEWED) {
          increment = 1;
        }
        break;
      case 'pomodoro':
        if (eventType === GameEvent.POMODORO_COMPLETED) {
          increment = 1;
        }
        break;
      default:
        break;
    }

    const newProgress = Math.min(goal.progress + increment, goal.target);
    return {
      ...goal,
      progress: newProgress,
      completed: newProgress >= goal.target,
    };
  });
};

// Export core rules for labs/extensions
export const getCoreRules = () => CORE_RULES;
