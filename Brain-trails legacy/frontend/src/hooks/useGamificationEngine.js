import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { gamificationApi } from '../api';
import { roomThemes, defaultRoomKey } from '../theme/rooms';

const LOCAL_STORAGE_KEY = 'braintrails_gamification_local_v2';

// ============ Local-only features (UI preferences, not synced to server) ============
const defaultLocalState = () => ({
  selectedRoom: defaultRoomKey,
  spotifyPlaylist: roomThemes[defaultRoomKey].spotifyDefault,
  rituals: [
    { id: 'tea', label: 'Make tea ☕', done: false },
    { id: 'jumping-jacks', label: 'Do 5 jumping jacks', done: false },
    { id: 'breath', label: 'Take 3 deep breaths', done: false },
  ],
  moodEntries: [],
  timeCapsules: [],
  tutorialLastSeen: null,
  tutorialOpen: false,
  dailyRewardCelebration: false,
  // Boss battle UI state (damage logs, etc.)
  bossBattleLocal: {
    log: [],
    persona: 'exam-titan',
  },
  // Dungeon crawler (local game state)
  dungeon: { pathIndex: 0, totalRooms: 14 },
  // Challenges (local tracking until we add backend support)
  challenges: [
    { id: 'minutes-120', title: 'Study for 120 minutes today', type: 'minutes', target: 120, progress: 0, rewardXp: 120, badge: 'Marathon Sprout', period: 'daily', completed: false, claimed: false },
    { id: 'pomodoro-3', title: 'Complete 3 pomodoros', type: 'pomodoro', target: 3, progress: 0, rewardXp: 90, badge: 'Focus Flame', period: 'daily', completed: false, claimed: false },
    { id: 'flashcards-50', title: 'Master 50 flashcards', type: 'flashcards', target: 50, progress: 0, rewardXp: 150, badge: 'Memory Sage', period: 'weekly', completed: false, claimed: false },
    { id: 'quiz-2', title: 'Ace 2 quizzes', type: 'quiz', target: 2, progress: 0, rewardXp: 130, badge: 'Boss Slayer', period: 'weekly', completed: false, claimed: false },
  ],
});

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const loadLocalState = () => {
  if (typeof window === 'undefined') return defaultLocalState();
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return defaultLocalState();
    const parsed = JSON.parse(raw);
    // Reset daily challenges if new day
    const today = getTodayKey();
    if (parsed.lastChallengeDate !== today) {
      parsed.challenges = parsed.challenges?.map(c => 
        c.period === 'daily' ? { ...c, progress: 0, completed: false, claimed: false } : c
      ) || defaultLocalState().challenges;
      parsed.lastChallengeDate = today;
      parsed.rituals = parsed.rituals?.map(r => ({ ...r, done: false })) || defaultLocalState().rituals;
    }
    return { ...defaultLocalState(), ...parsed };
  } catch {
    return defaultLocalState();
  }
};

const saveLocalState = (state) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  }
};

// ============ Main Hook ============
export default function useGamificationEngine() {
  const queryClient = useQueryClient();
  const [localState, setLocalState] = useState(loadLocalState);
  const lastXpResult = useRef(null);

  // Persist local state changes
  useEffect(() => {
    saveLocalState(localState);
  }, [localState]);

  // ============ Backend Queries ============
  
  // Main stats query (XP, level, streaks, daily progress)
  const statsQuery = useQuery({
    queryKey: ['gamification', 'stats'],
    queryFn: async () => {
      const response = await gamificationApi.getStats();
      return response.data;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Active pet query
  const petQuery = useQuery({
    queryKey: ['gamification', 'pet'],
    queryFn: async () => {
      try {
        const response = await gamificationApi.getPet();
        return response.data?.pet || null;
      } catch (err) {
        if (err.response?.status === 404) return null;
        throw err;
      }
    },
    staleTime: 60000,
  });

  // All pets query
  const allPetsQuery = useQuery({
    queryKey: ['gamification', 'pets'],
    queryFn: async () => {
      const response = await gamificationApi.getAllPets();
      return response.data?.pets || [];
    },
    staleTime: 60000,
  });

  // Rewards query
  const rewardsQuery = useQuery({
    queryKey: ['gamification', 'rewards'],
    queryFn: async () => {
      const response = await gamificationApi.getRewards();
      return response.data?.rewards || [];
    },
    staleTime: 60000,
  });

  // Boss status query
  const bossQuery = useQuery({
    queryKey: ['gamification', 'boss'],
    queryFn: async () => {
      const response = await gamificationApi.getBossStatus();
      return response.data?.boss || null;
    },
    staleTime: 30000,
  });

  // ============ Backend Mutations ============

  const awardXpMutation = useMutation({
    mutationFn: (payload) => gamificationApi.awardXp(payload),
    onSuccess: (response) => {
      lastXpResult.current = response.data;
      queryClient.invalidateQueries({ queryKey: ['gamification', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['gamification', 'pet'] });
      if (response.data?.new_rewards?.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['gamification', 'rewards'] });
      }
      if (response.data?.boss_damage) {
        queryClient.invalidateQueries({ queryKey: ['gamification', 'boss'] });
      }
    },
  });

  const feedPetMutation = useMutation({
    mutationFn: () => gamificationApi.feedPet(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification', 'pet'] });
    },
  });

  const playWithPetMutation = useMutation({
    mutationFn: () => gamificationApi.playWithPet(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification', 'pet'] });
    },
  });

  const renamePetMutation = useMutation({
    mutationFn: (name) => gamificationApi.renamePet(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification', 'pet'] });
      queryClient.invalidateQueries({ queryKey: ['gamification', 'pets'] });
    },
  });

  const activatePetMutation = useMutation({
    mutationFn: (petId) => gamificationApi.activatePet(petId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification', 'pet'] });
      queryClient.invalidateQueries({ queryKey: ['gamification', 'pets'] });
    },
  });

  const updateDailyGoalMutation = useMutation({
    mutationFn: (minutes) => gamificationApi.updateDailyGoal(minutes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification', 'stats'] });
    },
  });

  const startBossMutation = useMutation({
    mutationFn: (bossId) => gamificationApi.startBoss(bossId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification', 'boss'] });
    },
  });

  // ============ Derived State from Backend ============

  const gamification = statsQuery.data?.gamification || {};
  const pet = petQuery.data;
  const rewards = rewardsQuery.data || [];
  const boss = bossQuery.data;

  // XP and level
  const xp = gamification.xp || 0;
  const level = gamification.level || 1;
  const lifetimeXp = gamification.lifetime_xp || 0;
  const xpToNext = gamification.xp_to_next_level || 100;
  const levelProgress = (gamification.xp_progress_percent || 0) / 100;

  // Streaks
  const streak = gamification.current_streak || 0;
  const bestStreak = gamification.best_streak || 0;
  const lastStudyDate = gamification.last_study_date;

  // Daily progress
  const todayMinutes = gamification.daily_minutes_today || 0;
  const dailyGoalMinutes = gamification.daily_goal_minutes || 120;
  const dailyGoalProgress = dailyGoalMinutes > 0 ? Math.min(1, todayMinutes / dailyGoalMinutes) : 0;
  const dailyGoalMet = gamification.daily_goal_met_today || false;
  const dailyXpToday = gamification.daily_xp_today || 0;

  // Pet state
  const petId = pet?.pet_id || null;
  const petMood = pet?.mood || 'neutral';
  const petStage = pet?.level ? Math.min(4, Math.ceil(pet.level / 3)) : 1;

  // Boss battle
  const bossBattle = useMemo(() => {
    if (!boss) {
      return {
        name: 'No Active Boss',
        hp: 0,
        maxHp: 1000,
        status: 'idle',
        phase: 1,
        persona: localState.bossBattleLocal.persona,
        log: localState.bossBattleLocal.log,
      };
    }
    return {
      name: boss.name,
      hp: boss.health,
      maxHp: boss.max_health,
      status: boss.health <= 0 ? 'defeated' : 'engaged',
      phase: Math.ceil((1 - boss.health / boss.max_health) * 4) || 1,
      persona: localState.bossBattleLocal.persona,
      log: localState.bossBattleLocal.log,
    };
  }, [boss, localState.bossBattleLocal]);

  // Unlocked rewards
  const unlockedRewards = useMemo(() => {
    return rewards.map(r => ({
      id: r.reward_id,
      label: r.reward_data?.name || r.reward_id,
      type: r.reward_type,
      timestamp: r.unlocked_at,
    }));
  }, [rewards]);

  // ============ Action Handlers ============

  // Award XP for activities (calls backend)
  const awardXp = useCallback((amount, reason = 'session') => {
    // Map reason to activity type
    const activityTypeMap = {
      'note-created': 'note_created',
      'note-edited': 'note_edited',
      'note-reviewed': 'note_reviewed',
      'flashcards': 'flashcard_reviewed',
      'quiz': 'quiz_completed',
      'pomodoro': 'session_completed',
      'session': 'session_completed',
      'focus': 'session_completed',
    };
    
    const activityType = activityTypeMap[reason] || 'session_completed';
    
    awardXpMutation.mutate({
      activity_type: activityType,
      duration_minutes: reason === 'pomodoro' || reason === 'focus' ? Math.ceil(amount / 5) : undefined,
    });
  }, [awardXpMutation]);

  // Log study session (calls backend award-xp)
  const logStudySession = useCallback((minutes = 25, meta = {}) => {
    awardXpMutation.mutate({
      activity_type: 'session_completed',
      duration_minutes: minutes,
      metadata: meta,
    });

    // Update local challenges
    setLocalState(prev => {
      const challenges = prev.challenges.map(c => {
        if (c.type === 'minutes' && !c.completed) {
          const progress = Math.min(c.target, c.progress + minutes);
          return { ...c, progress, completed: progress >= c.target };
        }
        return c;
      });
      // Advance dungeon
      const dungeon = { 
        ...prev.dungeon, 
        pathIndex: (prev.dungeon.pathIndex + 1) % prev.dungeon.totalRooms 
      };
      return { ...prev, challenges, dungeon, lastChallengeDate: getTodayKey() };
    });
  }, [awardXpMutation]);

  // Complete Pomodoro
  const completePomodoro = useCallback((minutes) => {
    awardXpMutation.mutate({
      activity_type: 'session_completed',
      duration_minutes: minutes,
      metadata: { type: 'pomodoro' },
    });

    setLocalState(prev => {
      const challenges = prev.challenges.map(c => {
        if (c.type === 'pomodoro' && !c.completed) {
          const progress = Math.min(c.target, c.progress + 1);
          return { ...c, progress, completed: progress >= c.target };
        }
        if (c.type === 'minutes' && !c.completed) {
          const progress = Math.min(c.target, c.progress + minutes);
          return { ...c, progress, completed: progress >= c.target };
        }
        return c;
      });
      return { ...prev, challenges, lastChallengeDate: getTodayKey() };
    });
  }, [awardXpMutation]);

  // Record flashcard review
  const recordFlashcardReview = useCallback((count = 1, correct = 0) => {
    awardXpMutation.mutate({
      activity_type: correct > 0 ? 'flashcard_correct' : 'flashcard_reviewed',
      metadata: { count, correct },
    });

    setLocalState(prev => {
      const challenges = prev.challenges.map(c => {
        if (c.type === 'flashcards' && !c.completed) {
          const progress = Math.min(c.target, c.progress + count);
          return { ...c, progress, completed: progress >= c.target };
        }
        return c;
      });
      return { ...prev, challenges };
    });
  }, [awardXpMutation]);

  // Record quiz completion
  const recordQuizCompletion = useCallback(({ score = 0, questionCount = 0, quizId = null }) => {
    const isPerfect = score >= 100;
    awardXpMutation.mutate({
      activity_type: isPerfect ? 'quiz_perfect' : 'quiz_completed',
      quiz_id: quizId,
      score,
      metadata: { questionCount },
    });

    setLocalState(prev => {
      const challenges = prev.challenges.map(c => {
        if (c.type === 'quiz' && !c.completed) {
          const progress = Math.min(c.target, c.progress + 1);
          return { ...c, progress, completed: progress >= c.target };
        }
        return c;
      });
      return { ...prev, challenges };
    });
  }, [awardXpMutation]);

  // Record planner task completion
  const recordPlannerVictory = useCallback((tasks = 1) => {
    awardXpMutation.mutate({
      activity_type: 'challenge_completed',
      metadata: { tasks },
    });
  }, [awardXpMutation]);

  // Update daily goal
  const updateDailyGoal = useCallback((minutes) => {
    updateDailyGoalMutation.mutate(Math.max(15, Math.min(480, minutes)));
  }, [updateDailyGoalMutation]);

  // ============ Pet Actions ============

  const feedPet = useCallback(() => {
    feedPetMutation.mutate();
  }, [feedPetMutation]);

  const playWithPet = useCallback(() => {
    playWithPetMutation.mutate();
  }, [playWithPetMutation]);

  const renamePet = useCallback((name) => {
    renamePetMutation.mutate(name);
  }, [renamePetMutation]);

  const selectPet = useCallback((petId) => {
    activatePetMutation.mutate(petId);
  }, [activatePetMutation]);

  // ============ Boss Actions ============

  const setBossGoal = useCallback(({ name, maxHp, persona }) => {
    // Start a boss challenge on the backend
    // For now, we use a generic boss ID and store name locally
    startBossMutation.mutate('boss_procrastination');
    setLocalState(prev => ({
      ...prev,
      bossBattleLocal: {
        ...prev.bossBattleLocal,
        persona: persona || prev.bossBattleLocal.persona,
        log: [{
          id: `boss-reset-${Date.now()}`,
          text: `${name || 'Study Boss'} approaches. Battle begins!`,
          timestamp: new Date().toISOString(),
        }],
      },
    }));
  }, [startBossMutation]);

  const registerBossAction = useCallback((actionType, meta = {}) => {
    // Boss damage is handled automatically by backend when XP is awarded
    // Just log locally for UI
    const damageMap = { pomodoro: 50, flashcards: 100, quiz: 150, study30: 75 };
    const damage = damageMap[actionType] || 25;
    
    setLocalState(prev => ({
      ...prev,
      bossBattleLocal: {
        ...prev.bossBattleLocal,
        log: [
          ...prev.bossBattleLocal.log.slice(-6),
          {
            id: `boss-log-${Date.now()}`,
            text: `${meta.label || actionType} dealt ${damage} damage!`,
            damage,
            timestamp: new Date().toISOString(),
          },
        ],
      },
    }));
  }, []);

  // ============ Local-only Actions ============

  const setSelectedRoom = useCallback((roomId) => {
    setLocalState(prev => {
      const nextRoom = roomThemes[roomId] || roomThemes[defaultRoomKey];
      const previousDefault = roomThemes[prev.selectedRoom || defaultRoomKey]?.spotifyDefault;
      const shouldShiftPlaylist = !prev.spotifyPlaylist || prev.spotifyPlaylist === previousDefault;
      return {
        ...prev,
        selectedRoom: nextRoom.id,
        spotifyPlaylist: shouldShiftPlaylist ? nextRoom.spotifyDefault : prev.spotifyPlaylist,
      };
    });
  }, []);

  const setSpotifyPlaylist = useCallback((embedUrl) => {
    setLocalState(prev => ({
      ...prev,
      spotifyPlaylist: embedUrl?.trim() || roomThemes[prev.selectedRoom || defaultRoomKey].spotifyDefault,
    }));
  }, []);

  const toggleRitualStep = useCallback((stepId) => {
    setLocalState(prev => {
      const rituals = prev.rituals.map(r => 
        r.id === stepId ? { ...r, done: !r.done } : r
      );
      // Award XP if step completed
      const stepCompleted = rituals.find(r => r.id === stepId)?.done;
      if (stepCompleted) {
        awardXpMutation.mutate({
          activity_type: 'challenge_completed',
          metadata: { type: 'ritual_step' },
        });
      }
      return { ...prev, rituals };
    });
  }, [awardXpMutation]);

  const addRitualStep = useCallback((label) => {
    if (!label?.trim()) return;
    setLocalState(prev => ({
      ...prev,
      rituals: [...prev.rituals, { id: `ritual-${Date.now()}`, label: label.trim(), done: false }],
    }));
  }, []);

  const logMood = useCallback((entry) => {
    setLocalState(prev => ({
      ...prev,
      moodEntries: [...prev.moodEntries.slice(-19), entry],
    }));
  }, []);

  const addTimeCapsule = useCallback((message, unlockAt) => {
    if (!message) return;
    setLocalState(prev => ({
      ...prev,
      timeCapsules: [
        { id: `capsule-${Date.now()}`, message, unlockAt, opened: false },
        ...prev.timeCapsules.slice(0, 11),
      ],
    }));
  }, []);

  const openTimeCapsule = useCallback((capsuleId) => {
    setLocalState(prev => ({
      ...prev,
      timeCapsules: prev.timeCapsules.map(c => 
        c.id === capsuleId ? { ...c, opened: true } : c
      ),
    }));
  }, []);

  const claimChallengeReward = useCallback((challengeId) => {
    setLocalState(prev => {
      const challenge = prev.challenges.find(c => c.id === challengeId);
      if (!challenge || !challenge.completed || challenge.claimed) return prev;
      
      // Award XP via backend
      awardXpMutation.mutate({
        activity_type: 'challenge_completed',
        metadata: { challengeId, badge: challenge.badge },
      });

      return {
        ...prev,
        challenges: prev.challenges.map(c => 
          c.id === challengeId ? { ...c, claimed: true } : c
        ),
      };
    });
  }, [awardXpMutation]);

  const completeTutorialForDay = useCallback(() => {
    setLocalState(prev => ({
      ...prev,
      tutorialOpen: false,
      tutorialLastSeen: getTodayKey(),
    }));
  }, []);

  const openTutorial = useCallback(() => {
    setLocalState(prev => ({ ...prev, tutorialOpen: true }));
  }, []);

  const acknowledgeDailyReward = useCallback(() => {
    setLocalState(prev => ({ ...prev, dailyRewardCelebration: false }));
  }, []);

  // Daily reward check
  useEffect(() => {
    const today = getTodayKey();
    if (localState.lastDailyRewardDate !== today && statsQuery.isSuccess) {
      setLocalState(prev => ({
        ...prev,
        lastDailyRewardDate: today,
        dailyRewardCelebration: true,
        lastReward: {
          label: 'Daily Login Bonus',
          xp: 30 + (streak * 5),
          type: 'daily',
          timestamp: new Date().toISOString(),
          streakBoost: 1 + (streak * 0.1),
        },
      }));
    }
  }, [statsQuery.isSuccess, streak, localState.lastDailyRewardDate]);

  // Available time capsules
  const availableCapsules = useMemo(() => 
    localState.timeCapsules.filter(c => new Date(c.unlockAt) <= new Date() && !c.opened),
    [localState.timeCapsules]
  );

  // ============ Return Interface (preserves existing API) ============

  return {
    // Loading states
    isLoading: statsQuery.isLoading,
    isError: statsQuery.isError,

    // XP and Level
    xp,
    level,
    lifetimeXp,
    xpToNext,
    levelProgress,

    // Streaks
    streak,
    bestStreak,
    lastStudyDate,

    // Daily Progress
    todayMinutes,
    dailyGoalMinutes,
    dailyGoalProgress,
    dailyGoalMet,
    dailyXpToday,

    // Pet
    petId,
    petMood,
    petStage,
    pet,
    allPets: allPetsQuery.data || [],

    // Rewards
    unlockedRewards,
    availableRewards: statsQuery.data?.available_rewards || [],

    // Boss Battle
    bossBattle,

    // Local state
    selectedRoom: localState.selectedRoom,
    spotifyPlaylist: localState.spotifyPlaylist,
    rituals: localState.rituals,
    challenges: localState.challenges,
    moodEntries: localState.moodEntries,
    timeCapsules: localState.timeCapsules,
    availableCapsules,
    tutorialOpen: localState.tutorialOpen,
    dailyRewardCelebration: localState.dailyRewardCelebration,
    lastReward: localState.lastReward,
    dungeon: localState.dungeon,
    battleLog: localState.bossBattleLocal.log,

    // Actions - Study
    awardXp,
    logStudySession,
    completePomodoro,
    recordFlashcardReview,
    recordQuizCompletion,
    recordPlannerVictory,
    updateDailyGoal,

    // Actions - Pet
    feedPet,
    playWithPet,
    renamePet,
    selectPet,

    // Actions - Boss
    setBossGoal,
    registerBossAction,

    // Actions - Local
    setSelectedRoom,
    setSpotifyPlaylist,
    toggleRitualStep,
    addRitualStep,
    logMood,
    addTimeCapsule,
    openTimeCapsule,
    claimChallengeReward,
    completeTutorialForDay,
    openTutorial,
    acknowledgeDailyReward,
  };
}
