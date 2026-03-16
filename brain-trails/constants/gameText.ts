/**
 * 🎮 Brain Trails - Gamified Text Configuration
 * RPG-themed terminology for the cozy study experience
 * 
 * Maps standard UI terms to adventure/RPG equivalents
 * "Nintendo meets Notion" aesthetic language
 */

export const gameText = {
  // ============================================
  // 🧭 Navigation & Menus
  // ============================================
  navigation: {
    home: "Base Camp",
    dashboard: "Adventure Map",
    settings: "Pause Menu",
    profile: "Traveler Card",
    logout: "Rest at Inn",
    login: "Begin Journey",
    signup: "Create Traveler",
  },

  // ============================================
  // 📋 Tasks & Activities
  // ============================================
  tasks: {
    task: "Quest",
    tasks: "Quests",
    todo: "Side Quest",
    assignment: "Main Quest",
    homework: "Daily Mission",
    project: "Epic Quest",
    deadline: "Quest Timer",
    completed: "Quest Complete!",
    inProgress: "On The Trail",
    notStarted: "Uncharted",
  },

  // ============================================
  // 📚 Study & Learning
  // ============================================
  study: {
    study: "Train",
    focus: "Mana Garden",
    focusMode: "Enter Mana Garden",
    notes: "Scrolls",
    notebook: "Tome",
    flashcards: "Spell Cards",
    quiz: "Trial",
    test: "Boss Battle",
    exam: "Final Boss",
    review: "Sharpen Skills",
    practice: "Training Ground",
  },

  // ============================================
  // 🏆 Progress & Achievements
  // ============================================
  progress: {
    xp: "XP",
    level: "Level",
    levelUp: "Level Up!",
    streak: "Fire Streak 🔥",
    achievement: "Badge",
    achievements: "Trophy Room",
    milestone: "Checkpoint",
    goal: "Destination",
    reward: "Loot",
    bonus: "Bonus Loot",
    points: "Gold Coins",
  },

  // ============================================
  // 📅 Time & Planning
  // ============================================
  time: {
    today: "Today's Adventure",
    tomorrow: "Tomorrow's Trail",
    week: "Weekly Expedition",
    month: "Moon Cycle",
    calendar: "Adventure Calendar",
    schedule: "Quest Log",
    planner: "Journey Planner",
    timer: "Hourglass",
    pomodoro: "Campfire Session",
    break: "Rest Stop",
  },

  // ============================================
  // 👤 User & Social
  // ============================================
  user: {
    user: "Traveler",
    username: "Traveler Name",
    avatar: "Character",
    friend: "Fellow Traveler",
    friends: "Party Members",
    team: "Guild",
    leaderboard: "Hall of Fame",
    rank: "Rank",
  },

  // ============================================
  // 🎒 Items & Resources
  // ============================================
  items: {
    folder: "Chest",
    file: "Scroll",
    bookmark: "Map Pin",
    tag: "Rune",
    category: "Region",
    collection: "Treasure Trove",
    archive: "Ancient Library",
  },

  // ============================================
  // 💬 Actions & Feedback
  // ============================================
  actions: {
    save: "Store in Chest",
    delete: "Discard",
    edit: "Enchant",
    create: "Craft",
    add: "Collect",
    start: "Embark",
    finish: "Complete Quest",
    cancel: "Retreat",
    confirm: "Onward!",
    submit: "Send Raven",
  },

  // ============================================
  // 🎯 Status & States
  // ============================================
  status: {
    loading: "Summoning...",
    error: "Oops! A wild bug appeared!",
    success: "Victory!",
    empty: "Nothing here yet... time to explore!",
    offline: "Connection lost to the realm",
    online: "Connected to the realm",
  },

  // ============================================
  // 🏠 Hotbar / Dock Items
  // ============================================
  hotbar: {
    home: "Camp",
    quests: "Quests", 
    focus: "Mana",
    inventory: "Bag",
    battle: "Battle",
    cards: "Cards",
  },
} as const;

// Type exports for TypeScript support
export type GameTextKeys = keyof typeof gameText;
export type NavigationText = typeof gameText.navigation;
export type TasksText = typeof gameText.tasks;
export type StudyText = typeof gameText.study;
export type ProgressText = typeof gameText.progress;
export type TimeText = typeof gameText.time;
export type UserText = typeof gameText.user;
export type ItemsText = typeof gameText.items;
export type ActionsText = typeof gameText.actions;
export type StatusText = typeof gameText.status;
export type HotbarText = typeof gameText.hotbar;
