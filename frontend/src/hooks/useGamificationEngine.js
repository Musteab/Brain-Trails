import { useCallback, useEffect, useMemo, useState } from 'react';

import { roomThemes, defaultRoomKey } from '../theme/rooms';

const STORAGE_KEY = 'braintrails_gamification_v1';

const bossPersonaIds = [
  'exam-titan',
  'deadline-hydra',
  'syllabus-serpent',
  'anxiety-wraith',
  'assignment-leviathan',
  'presentation-phoenix',
];

const randomBossPersona = () => bossPersonaIds[Math.floor(Math.random() * bossPersonaIds.length)];

const gachaRewards = [
  { label: 'Fern Sprite Companion', type: 'pet', xp: 60 },
  { label: 'Aurora Timer Theme', type: 'theme', xp: 40 },
  { label: 'Nebula Study Room', type: 'room', xp: 55 },
  { label: 'Coffee Shop Ambience', type: 'sound', xp: 35 },
  { label: 'Cozy Cabin Wallpaper', type: 'theme', xp: 35 },
  { label: 'Starry Night Lofi Pack', type: 'sound', xp: 45 },
  { label: 'Mystic Owl Badge', type: 'badge', xp: 30 },
  { label: 'Solar Sprout Avatar', type: 'avatar', xp: 50 },
];

const levelRewards = [
  'Willow Spirit',
  'Aurora Glow',
  'Sunrise Timer',
  'Forest Companion',
  'Meteor Trail Cursor',
  'Zen Garden Theme',
  'Nebula Notes Pack',
];

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const defaultBoss = () => ({
  name: 'Final Exam',
  hp: 1000,
  maxHp: 1000,
  status: 'idle',
  startedAt: null,
  defeatedAt: null,
  persona: randomBossPersona(),
  phase: 1,
  log: [
    {
      id: 'boss-intro',
      text: 'A new challenge awaits. Prepare your study arsenal.',
      timestamp: new Date().toISOString(),
    },
  ],
});

const createBaseState = () => ({
  xp: 0,
  lifetimeXp: 0,
  level: 1,
  streak: 0,
  bestStreak: 0,
  lastStudyDate: null,
  todayMinutes: 0,
  dailyGoalMinutes: 120,
  dailyGoalDate: getTodayKey(),
  selectedRoom: defaultRoomKey,
  spotifyPlaylist: roomThemes[defaultRoomKey].spotifyDefault,
  bossBattle: defaultBoss(),
  battleLog: [{ id: 'intro', text: 'A looming exam boss appears. Time to study!' }],
  unlockedRewards: [],
  rituals: [
    { id: 'tea', label: 'Make tea ☕', done: false },
    { id: 'jumping-jacks', label: 'Do 5 jumping jacks', done: false },
    { id: 'breath', label: 'Take 3 deep breaths', done: false },
  ],
  challenges: [
    {
      id: 'minutes-120',
      title: 'Study for 120 minutes today',
      type: 'minutes',
      target: 120,
      progress: 0,
      rewardXp: 120,
      badge: 'Marathon Sprout',
      period: 'daily',
      completed: false,
      claimed: false,
    },
    {
      id: 'pomodoro-3',
      title: 'Complete 3 pomodoros',
      type: 'pomodoro',
      target: 3,
      progress: 0,
      rewardXp: 90,
      badge: 'Focus Flame',
      period: 'daily',
      completed: false,
      claimed: false,
    },
    {
      id: 'flashcards-50',
      title: 'Master 50 flashcards',
      type: 'flashcards',
      target: 50,
      progress: 0,
      rewardXp: 150,
      badge: 'Memory Sage',
      period: 'weekly',
      completed: false,
      claimed: false,
    },
    {
      id: 'quiz-2',
      title: 'Ace 2 quizzes',
      type: 'quiz',
      target: 2,
      progress: 0,
      rewardXp: 130,
      badge: 'Boss Slayer',
      period: 'weekly',
      completed: false,
      claimed: false,
    },
  ],
  gachaHistory: [],
  petMood: 'chill',
  petStage: 1,
  dungeon: { pathIndex: 0, totalRooms: 14 },
  moodEntries: [],
  timeCapsules: [],
  tutorialLastSeen: null,
  tutorialOpen: false,
  dailyRewardDate: null,
  lastReward: null,
  petId: null,
  dailyRewardCelebration: false,
});

const hydrateState = () => {
  const base = createBaseState();
  if (typeof window === 'undefined') {
    return base;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return base;
    }
    const parsed = JSON.parse(raw);
    const parsedBoss = parsed.bossBattle || base.bossBattle;
    return {
      ...base,
      ...parsed,
      spotifyPlaylist: parsed.spotifyPlaylist || base.spotifyPlaylist,
      petId: parsed.petId !== undefined ? parsed.petId : base.petId,
      rituals: parsed.rituals || base.rituals,
      challenges: parsed.challenges || base.challenges,
      battleLog: parsed.battleLog || base.battleLog,
      bossBattle: {
        ...base.bossBattle,
        ...parsedBoss,
        phase: parsedBoss.phase || 1,
        persona: parsedBoss.persona || base.bossBattle.persona,
        log: parsedBoss.log || base.bossBattle.log,
      },
      dailyRewardCelebration: false,
    };
  } catch {
    // Silently fail - localStorage may be corrupted or unavailable
    return base;
  }
};

const xpForLevel = (level) => 200 + (level - 1) * 110;

const derivePetStage = (level) => {
  if (level >= 12) return 4;
  if (level >= 8) return 3;
  if (level >= 4) return 2;
  return 1;
};

const derivePetMood = (streak, todayMinutes) => {
  if (streak >= 14) return 'mythic';
  if (streak >= 7) return 'radiant';
  if (todayMinutes >= 150) return 'energized';
  if (todayMinutes >= 60) return 'proud';
  return 'chill';
};

const isYesterdayKey = (lastKey, todayKey) => {
  if (!lastKey) return false;
  const last = new Date(lastKey);
  const today = new Date(todayKey);
  const diff = today.getTime() - last.getTime();
  return diff > 0 && diff <= 24 * 60 * 60 * 1000;
};

const resetDailyFields = (state, todayKey) => {
  if (state.dailyGoalDate === todayKey) {
    return state;
  }
  return {
    ...state,
    dailyGoalDate: todayKey,
    todayMinutes: 0,
    rituals: state.rituals.map((ritual) => ({ ...ritual, done: false })),
    challenges: state.challenges.map((challenge) =>
      challenge.period === 'daily'
        ? { ...challenge, progress: 0, completed: false, claimed: false }
        : challenge,
    ),
  };
};

const applyXp = (state, amount, reason = 'session') => {
  if (!amount) return state;
  let xp = state.xp + amount;
  let level = state.level;
  const lifetimeXp = state.lifetimeXp + amount;
  let rewards = state.unlockedRewards;
  let xpTarget = xpForLevel(level);
  const levelRewardsUnlocked = [];

  while (xp >= xpTarget) {
    xp -= xpTarget;
    level += 1;
    xpTarget = xpForLevel(level);
    const reward = {
      id: `reward-${level}-${Date.now()}`,
      label: levelRewards[(level - 1) % levelRewards.length],
      level,
      reason: 'level-up',
      timestamp: new Date().toISOString(),
    };
    levelRewardsUnlocked.push(reward);
  }

  if (levelRewardsUnlocked.length) {
    rewards = [...state.unlockedRewards, ...levelRewardsUnlocked];
  }

  return {
    ...state,
    xp,
    level,
    lifetimeXp,
    unlockedRewards: rewards,
    petStage: derivePetStage(level),
    lastXpReason: reason,
  };
};

const advanceDungeon = (state, steps = 1) => {
  const nextIndex = state.dungeon.pathIndex + steps;
  if (nextIndex < state.dungeon.totalRooms) {
    return {
      ...state,
      dungeon: { ...state.dungeon, pathIndex: nextIndex },
    };
  }
  const overflow = nextIndex - state.dungeon.totalRooms;
  const nextRooms = state.dungeon.totalRooms + 4;
  let nextState = {
    ...state,
    dungeon: { totalRooms: nextRooms, pathIndex: overflow },
    battleLog: [
      ...state.battleLog.slice(-3),
      { id: `dungeon-${Date.now()}`, text: 'Cleared a dungeon wing! +XP' },
    ].slice(-4),
  };
  nextState = applyXp(nextState, 90 + state.dungeon.totalRooms * 2, 'dungeon');
  return nextState;
};

const streakMultiplierFor = (streak = 0) => {
  if (streak >= 30) return 2;
  if (streak >= 21) return 1.8;
  if (streak >= 14) return 1.6;
  if (streak >= 7) return 1.4;
  if (streak >= 3) return 1.2;
  return 1;
};

const buildRewardForStreak = (streak = 0) => {
  const base = gachaRewards[Math.floor(Math.random() * gachaRewards.length)];
  const multiplier = streakMultiplierFor(streak);
  return {
    ...base,
    xp: Math.round(base.xp * multiplier),
    streakBoost: multiplier,
  };
};

const grantReward = (state, options = {}) => {
  const reward =
    options.reward ||
    (options.source === 'daily-login'
      ? buildRewardForStreak(state.streak || 0)
      : gachaRewards[Math.floor(Math.random() * gachaRewards.length)]);
  const entry = {
    ...reward,
    id: `gacha-${Date.now()}`,
    timestamp: new Date().toISOString(),
    source: options.source || 'daily',
    guaranteed: Boolean(options.guaranteed),
    bonus: Boolean(options.bonus),
  };
  let next = applyXp(state, reward.xp || 30, 'reward');
  next = {
    ...next,
    gachaHistory: [entry, ...next.gachaHistory].slice(0, 16),
    lastReward: entry,
  };
  return next;
};

const addCapsule = (state, capsule) => ({
  ...state,
  timeCapsules: [capsule, ...(state.timeCapsules || [])].slice(0, 12),
});

const bossActionMap = {
  pomodoro: { damage: 50, label: 'Pomodoro burst' },
  flashcards: { damage: 100, label: 'Flashcard blitz' },
  quiz: { damage: 150, label: 'Quiz mastery' },
  study30: { damage: 75, label: '30-minute focus' },
};

const phaseFromHp = (hp, maxHp) => {
  const ratio = hp / maxHp;
  if (ratio <= 0.25) return 4;
  if (ratio <= 0.5) return 3;
  if (ratio <= 0.75) return 2;
  return 1;
};

const applyBossDamage = (state, damage, sourceLabel) => {
  if (!state.bossBattle || state.bossBattle.hp <= 0) {
    return state;
  }
  const hp = Math.max(0, state.bossBattle.hp - damage);
  const phase = phaseFromHp(hp, state.bossBattle.maxHp);
  const logEntry = {
    id: `boss-log-${Date.now()}`,
    text: `${sourceLabel} dealt ${damage} dmg. Boss at ${hp} HP`,
    hp,
    damage,
    label: sourceLabel,
    timestamp: new Date().toISOString(),
  };
  let next = {
    ...state,
    bossBattle: {
      ...state.bossBattle,
      hp,
      phase,
      status: hp === state.bossBattle.maxHp ? 'idle' : hp === 0 ? 'defeated' : 'engaged',
      startedAt: state.bossBattle.startedAt || new Date().toISOString(),
      log: [...state.bossBattle.log.slice(-6), logEntry],
    },
  };
  if (hp === 0 && !state.bossBattle.defeatedAt) {
    next = grantReward(
      {
        ...next,
        bossBattle: {
          ...next.bossBattle,
          defeatedAt: new Date().toISOString(),
        },
      },
      { source: 'boss-victory', guaranteed: true, bonus: true },
    );
  }
  return next;
};

export default function useGamificationEngine() {
  const [state, setState] = useState(() => hydrateState());
  const todayKey = getTodayKey();

  useEffect(() => {
    setState((prev) => {
      let next = resetDailyFields(prev, todayKey);
      if (next.dailyRewardDate !== todayKey) {
        next = grantReward(next, { source: 'daily-login', guaranteed: true });
        next = { ...next, dailyRewardDate: todayKey, dailyRewardCelebration: true };
      }
      if (next.tutorialLastSeen !== todayKey) {
        next = { ...next, tutorialOpen: true };
      }
      return next;
    });
  }, [todayKey]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const incrementChallenge = useCallback((type, amount = 1) => {
    setState((prev) => {
      const challenges = prev.challenges.map((challenge) => {
        if (challenge.completed || challenge.type !== type) {
          return challenge;
        }
        const progress = Math.min(challenge.target, challenge.progress + amount);
        return { ...challenge, progress, completed: progress >= challenge.target };
      });
      return { ...prev, challenges };
    });
  }, []);

  const awardXp = useCallback((amount, reason = 'session') => {
    setState((prev) => applyXp(prev, amount, reason));
  }, []);

  const logStudySession = useCallback(
    (minutes = 25, meta = {}) => {
      setState((prev) => {
        let next = resetDailyFields(prev, todayKey);
        let streak = next.streak;
        if (!next.lastStudyDate) {
          streak = 1;
        } else if (next.lastStudyDate === todayKey) {
          streak = next.streak;
        } else if (isYesterdayKey(next.lastStudyDate, todayKey)) {
          streak = next.streak + 1;
        } else {
          streak = 1;
        }
        const bestStreak = Math.max(next.bestStreak, streak);
        const todayMinutes = next.todayMinutes + minutes;
        const battleLog = [
          ...next.battleLog.slice(-3),
          {
            id: `log-${Date.now()}`,
            text: `${meta.label || 'Focus burst'} logged ${minutes} min`,
          },
        ].slice(-4);
        next = {
          ...next,
          lastStudyDate: todayKey,
          streak,
          bestStreak,
          todayMinutes,
          battleLog,
          petMood: derivePetMood(streak, todayMinutes),
        };
        next = advanceDungeon(next, 1);
        next = applyXp(next, Math.round(minutes * 5), meta.reason || 'focus');
        if (minutes >= 30) {
          next = applyBossDamage(next, bossActionMap.study30.damage, '30-minute focus streak');
        }
        return next;
      });
      incrementChallenge('minutes', minutes);
    },
    [incrementChallenge, todayKey],
  );

  const completePomodoro = useCallback(
    (minutes) => {
      logStudySession(minutes, { reason: 'pomodoro', label: 'Pomodoro bloom' });
      incrementChallenge('pomodoro', 1);
      setState((prev) => applyBossDamage(prev, bossActionMap.pomodoro.damage, bossActionMap.pomodoro.label));
    },
    [incrementChallenge, logStudySession],
  );

  const recordFlashcardReview = useCallback(
    (count = 1, known = 0) => {
      setState((prev) => {
        let next = applyXp(prev, Math.max(10, count * 4 + known * 2), 'flashcards');
        next = advanceDungeon(next, Math.max(1, Math.floor(count / 8)));
        return next;
      });
      incrementChallenge('flashcards', count);
    },
    [incrementChallenge],
  );

  const recordQuizCompletion = useCallback(
    ({ score = 0, questionCount = 0 }) => {
      setState((prev) => {
        const bonus = Math.round(score) + questionCount * 4;
        let next = applyXp(prev, 80 + bonus, 'quiz');
        next = advanceDungeon(next, 2);
        next = applyBossDamage(next, bossActionMap.quiz.damage, bossActionMap.quiz.label);
        return next;
      });
      incrementChallenge('quiz', 1);
    },
    [incrementChallenge],
  );

  const recordPlannerVictory = useCallback((tasks = 1) => {
    setState((prev) => {
      let next = applyXp(prev, tasks * 20, 'planner');
      next = advanceDungeon(next, 1);
      return next;
    });
  }, []);

  const updateDailyGoal = useCallback((minutes) => {
    setState((prev) => ({
      ...prev,
      dailyGoalMinutes: Math.max(15, minutes),
    }));
  }, []);

  const setSelectedRoom = useCallback((roomId) => {
    setState((prev) => {
      const nextRoom = roomThemes[roomId] || roomThemes[defaultRoomKey];
      const previousDefault = roomThemes[prev.selectedRoom || defaultRoomKey]?.spotifyDefault;
      const shouldShiftPlaylist =
        !prev.spotifyPlaylist || prev.spotifyPlaylist === previousDefault;
      return {
        ...prev,
        selectedRoom: nextRoom.id,
        spotifyPlaylist: shouldShiftPlaylist ? nextRoom.spotifyDefault : prev.spotifyPlaylist,
      };
    });
  }, []);

  const setSpotifyPlaylist = useCallback((embedUrl) => {
    setState((prev) => ({
      ...prev,
      spotifyPlaylist:
        embedUrl && embedUrl.trim()
          ? embedUrl.trim()
          : roomThemes[prev.selectedRoom || defaultRoomKey].spotifyDefault,
    }));
  }, []);

  const toggleRitualStep = useCallback((stepId) => {
    setState((prev) => {
      const rituals = prev.rituals.map((ritual) =>
        ritual.id === stepId ? { ...ritual, done: !ritual.done } : ritual,
      );
      let next = { ...prev, rituals };
      const completed = rituals.every((ritual) => ritual.done);
      if (completed) {
        next = applyXp(next, 45, 'ritual');
      } else if (rituals.find((ritual) => ritual.id === stepId)?.done) {
        next = applyXp(next, 10, 'ritual-step');
      }
      return next;
    });
  }, []);

  const addRitualStep = useCallback((label) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setState((prev) => ({
      ...prev,
      rituals: [
        ...prev.rituals,
        { id: `ritual-${Date.now()}`, label: trimmed, done: false },
      ],
    }));
  }, []);

  const addTimeCapsule = useCallback((message, unlockAt) => {
    if (!message) return;
    const capsule = {
      id: `capsule-${Date.now()}`,
      message,
      unlockAt,
      opened: false,
    };
    setState((prev) => addCapsule(prev, capsule));
  }, []);

  const openTimeCapsule = useCallback((capsuleId) => {
    setState((prev) => ({
      ...prev,
      timeCapsules: prev.timeCapsules.map((capsule) =>
        capsule.id === capsuleId ? { ...capsule, opened: true } : capsule,
      ),
    }));
  }, []);

  const logMood = useCallback((entry) => {
    setState((prev) => ({
      ...prev,
      moodEntries: [...prev.moodEntries, entry].slice(-20),
    }));
  }, []);

  const completeTutorialForDay = useCallback(() => {
    setState((prev) => ({
      ...prev,
      tutorialOpen: false,
      tutorialLastSeen: todayKey,
    }));
  }, [todayKey]);

  const openTutorial = useCallback(() => {
    setState((prev) => ({
      ...prev,
      tutorialOpen: true,
    }));
  }, []);

  const acknowledgeDailyReward = useCallback(() => {
    setState((prev) => ({
      ...prev,
      dailyRewardCelebration: false,
    }));
  }, []);

  const selectPet = useCallback((petId) => {
    setState((prev) => ({
      ...prev,
      petId,
    }));
  }, []);

  const setBossGoal = useCallback(({ name, maxHp, persona }) => {
    const parsedHp = Math.max(100, Number(maxHp) || 1000);
    setState((prev) => {
      const nextPersona = persona || prev.bossBattle?.persona || randomBossPersona();
      const displayName = name || prev.bossBattle?.name || 'Exam Titan';
      return {
        ...prev,
        bossBattle: {
          name: displayName,
          hp: parsedHp,
          maxHp: parsedHp,
          status: 'idle',
          startedAt: null,
          defeatedAt: null,
          persona: nextPersona,
          phase: 1,
          log: [
            {
              id: `boss-reset-${Date.now()}`,
              text: `${displayName} approaches. It has ${parsedHp} HP.`,
              hp: parsedHp,
              timestamp: new Date().toISOString(),
            },
          ],
        },
      };
    });
  }, []);

  const registerBossAction = useCallback((actionType, meta = {}) => {
    const config = bossActionMap[actionType];
    if (!config) return;
    setState((prev) => applyBossDamage(prev, config.damage, meta.label || config.label));
  }, []);

  const claimChallengeReward = useCallback((challengeId) => {
    setState((prev) => {
      const challenge = prev.challenges.find((item) => item.id === challengeId);
      if (!challenge || !challenge.completed || challenge.claimed) {
        return prev;
      }
      let next = {
        ...prev,
        challenges: prev.challenges.map((item) =>
          item.id === challengeId ? { ...item, claimed: true } : item,
        ),
      };
      next = applyXp(next, challenge.rewardXp, 'challenge');
      return next;
    });
  }, []);

  const dailyGoalProgress = useMemo(() => {
    if (!state.dailyGoalMinutes) return 0;
    return Math.min(1, state.todayMinutes / state.dailyGoalMinutes);
  }, [state.dailyGoalMinutes, state.todayMinutes]);

  const xpToNext = useMemo(() => xpForLevel(state.level), [state.level]);
  const levelProgress = useMemo(() => Math.min(1, state.xp / xpToNext), [state.xp, xpToNext]);

  const availableCapsules = useMemo(
    () =>
      state.timeCapsules.filter(
        (capsule) => new Date(capsule.unlockAt) <= new Date(),
      ),
    [state.timeCapsules],
  );

  return {
    ...state,
    xpToNext,
    levelProgress,
    dailyGoalProgress,
    availableCapsules,
    logStudySession,
    completePomodoro,
    recordFlashcardReview,
    recordQuizCompletion,
    recordPlannerVictory,
    updateDailyGoal,
    setSelectedRoom,
    setSpotifyPlaylist,
    toggleRitualStep,
    addRitualStep,
    addTimeCapsule,
    openTimeCapsule,
    logMood,
    claimChallengeReward,
    awardXp,
    openTutorial,
    completeTutorialForDay,
    selectPet,
    setBossGoal,
    registerBossAction,
    acknowledgeDailyReward,
  };
}
