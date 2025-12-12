/**
 * Simplified Gamification Context
 *
 * Event-based approach: UI calls emitEvent(), rules produce rewards.
 * Core loops: XP/Level, Streak, Daily Goals, Pet, Daily Chest, Focus Sessions
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import {
  GameEvent,
  calculateLevel,
  calculatePetMood,
  calculatePetStage,
  getXpReward,
  isStreakEvent,
  getDailyGoals,
  rollDailyReward,
  getFocusBonus,
  updateGoalProgress,
} from '../hooks/gamificationRules';
import { defaultRoomKey, roomThemes } from '../theme/rooms';

const STORAGE_KEY = 'braintrails_gamification_v2';

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const isYesterday = (dateKey) => {
  if (!dateKey) return false;
  const last = new Date(dateKey);
  const today = new Date(getTodayKey());
  const diff = today.getTime() - last.getTime();
  return diff > 0 && diff <= 24 * 60 * 60 * 1000;
};

// Initial state
const createInitialState = () => ({
  // Core: XP + Level
  xp: 0,
  lifetimeXp: 0,
  level: 1,

  // Core: Streak
  streak: 0,
  bestStreak: 0,
  lastStudyDate: null,

  // Core: Daily Goals
  dailyGoals: getDailyGoals(),
  dailyGoalDate: getTodayKey(),

  // Core: Pet
  petId: null,
  petMood: 'chill',
  petStage: 1,

  // Core: Daily Chest
  dailyRewardDate: null,
  lastReward: null,
  unlockedRewards: [],

  // Core: Focus Sessions
  todayMinutes: 0,
  dailyGoalMinutes: 120,

  // UI state
  selectedRoom: defaultRoomKey,
  spotifyPlaylist: roomThemes[defaultRoomKey]?.spotifyDefault || '',

  // Labs features (hidden by default)
  labsEnabled: false,
  bossBattle: null,
  challenges: [],
  rituals: [],

  // Celebrations
  showLevelUp: false,
  showRewardChest: false,
  pendingReward: null,
});

// Reducer actions
const ActionType = {
  EMIT_EVENT: 'EMIT_EVENT',
  CLAIM_DAILY_REWARD: 'CLAIM_DAILY_REWARD',
  CLAIM_GOAL_REWARD: 'CLAIM_GOAL_REWARD',
  SET_PET: 'SET_PET',
  SET_ROOM: 'SET_ROOM',
  SET_PLAYLIST: 'SET_PLAYLIST',
  TOGGLE_LABS: 'TOGGLE_LABS',
  DISMISS_LEVEL_UP: 'DISMISS_LEVEL_UP',
  DISMISS_REWARD_CHEST: 'DISMISS_REWARD_CHEST',
  HYDRATE: 'HYDRATE',
  RESET_DAY: 'RESET_DAY',
};

function gamificationReducer(state, action) {
  switch (action.type) {
    case ActionType.HYDRATE:
      return { ...state, ...action.payload };

    case ActionType.RESET_DAY: {
      const today = getTodayKey();
      return {
        ...state,
        todayMinutes: 0,
        dailyGoals: getDailyGoals(),
        dailyGoalDate: today,
      };
    }

    case ActionType.EMIT_EVENT: {
      const { eventType, payload } = action;
      let newState = { ...state };

      // Calculate XP reward
      const baseXp = getXpReward(eventType, payload);
      const focusBonus = payload.minutes ? getFocusBonus(payload.minutes) : 1;
      const xpGain = Math.round(baseXp * focusBonus);

      if (xpGain > 0) {
        newState.xp = state.xp + xpGain;
        newState.lifetimeXp = state.lifetimeXp + xpGain;

        // Check level up
        const { level: newLevel } = calculateLevel(newState.lifetimeXp);
        if (newLevel > state.level) {
          newState.level = newLevel;
          newState.showLevelUp = true;
          newState.petStage = calculatePetStage(newLevel);
        }
      }

      // Update streak for qualifying events
      if (isStreakEvent(eventType)) {
        const today = getTodayKey();
        if (state.lastStudyDate !== today) {
          if (isYesterday(state.lastStudyDate)) {
            newState.streak = state.streak + 1;
          } else if (state.lastStudyDate !== today) {
            newState.streak = 1;
          }
          newState.lastStudyDate = today;
          newState.bestStreak = Math.max(newState.streak, state.bestStreak);
        }
      }

      // Update today's minutes for time-based events
      if (payload.minutes && (eventType === GameEvent.POMODORO_COMPLETED || eventType === GameEvent.STUDY_SESSION_LOGGED)) {
        newState.todayMinutes = state.todayMinutes + payload.minutes;
      }

      // Update pet mood
      newState.petMood = calculatePetMood(newState.streak, newState.todayMinutes);

      // Update daily goals
      newState.dailyGoals = updateGoalProgress(state.dailyGoals, eventType, payload);

      // Check for daily reward on login
      if (eventType === GameEvent.DAILY_LOGIN && state.dailyRewardDate !== getTodayKey()) {
        const reward = rollDailyReward(newState.streak);
        newState.dailyRewardDate = getTodayKey();
        newState.lastReward = reward;
        newState.showRewardChest = true;
        newState.pendingReward = reward;
      }

      return newState;
    }

    case ActionType.CLAIM_DAILY_REWARD: {
      if (!state.pendingReward) return state;
      return {
        ...state,
        xp: state.xp + state.pendingReward.xp,
        lifetimeXp: state.lifetimeXp + state.pendingReward.xp,
        unlockedRewards: [...state.unlockedRewards, { ...state.pendingReward, id: Date.now() }],
        showRewardChest: false,
        pendingReward: null,
      };
    }

    case ActionType.CLAIM_GOAL_REWARD: {
      const { goalId } = action;
      const goal = state.dailyGoals.find((g) => g.id === goalId);
      if (!goal || !goal.completed || goal.claimed) return state;

      return {
        ...state,
        xp: state.xp + goal.xp,
        lifetimeXp: state.lifetimeXp + goal.xp,
        dailyGoals: state.dailyGoals.map((g) => (g.id === goalId ? { ...g, claimed: true } : g)),
      };
    }

    case ActionType.SET_PET:
      return { ...state, petId: action.petId };

    case ActionType.SET_ROOM:
      return {
        ...state,
        selectedRoom: action.roomKey,
        spotifyPlaylist: roomThemes[action.roomKey]?.spotifyDefault || state.spotifyPlaylist,
      };

    case ActionType.SET_PLAYLIST:
      return { ...state, spotifyPlaylist: action.playlist };

    case ActionType.TOGGLE_LABS:
      return { ...state, labsEnabled: !state.labsEnabled };

    case ActionType.DISMISS_LEVEL_UP:
      return { ...state, showLevelUp: false };

    case ActionType.DISMISS_REWARD_CHEST:
      return { ...state, showRewardChest: false };

    default:
      return state;
  }
}

// Persist state to localStorage
const persistState = (state) => {
  if (typeof window === 'undefined') return;
  const toSave = { ...state, showLevelUp: false, showRewardChest: false, pendingReward: null };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // Storage full or unavailable
  }
};

// Load state from localStorage
const loadState = () => {
  if (typeof window === 'undefined') return createInitialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    return { ...createInitialState(), ...parsed };
  } catch {
    return createInitialState();
  }
};

// Context
const GamificationContext = createContext(null);

export function GamificationProvider({ children }) {
  const [state, dispatch] = useReducer(gamificationReducer, null, loadState);

  // Reset daily state if needed
  useEffect(() => {
    const today = getTodayKey();
    if (state.dailyGoalDate !== today) {
      dispatch({ type: ActionType.RESET_DAY });
    }
    // Emit daily login event
    if (state.dailyRewardDate !== today) {
      dispatch({ type: ActionType.EMIT_EVENT, eventType: GameEvent.DAILY_LOGIN, payload: {} });
    }
  }, [state.dailyGoalDate, state.dailyRewardDate]);

  // Persist on state change
  useEffect(() => {
    persistState(state);
  }, [state]);

  // Event emitter - the main API for UI to use
  const emitEvent = useCallback((eventType, payload = {}) => {
    dispatch({ type: ActionType.EMIT_EVENT, eventType, payload });
  }, []);

  // Actions
  const claimDailyReward = useCallback(() => {
    dispatch({ type: ActionType.CLAIM_DAILY_REWARD });
  }, []);

  const claimGoalReward = useCallback((goalId) => {
    dispatch({ type: ActionType.CLAIM_GOAL_REWARD, goalId });
  }, []);

  const setPet = useCallback((petId) => {
    dispatch({ type: ActionType.SET_PET, petId });
  }, []);

  const setRoom = useCallback((roomKey) => {
    dispatch({ type: ActionType.SET_ROOM, roomKey });
  }, []);

  const setPlaylist = useCallback((playlist) => {
    dispatch({ type: ActionType.SET_PLAYLIST, playlist });
  }, []);

  const toggleLabs = useCallback(() => {
    dispatch({ type: ActionType.TOGGLE_LABS });
  }, []);

  const dismissLevelUp = useCallback(() => {
    dispatch({ type: ActionType.DISMISS_LEVEL_UP });
  }, []);

  const dismissRewardChest = useCallback(() => {
    dispatch({ type: ActionType.DISMISS_REWARD_CHEST });
  }, []);

  // Derived values
  const levelInfo = useMemo(() => calculateLevel(state.lifetimeXp), [state.lifetimeXp]);

  const value = useMemo(
    () => ({
      // State
      ...state,
      levelInfo,

      // Event emitter
      emitEvent,

      // Actions
      claimDailyReward,
      claimGoalReward,
      setPet,
      setRoom,
      setPlaylist,
      toggleLabs,
      dismissLevelUp,
      dismissRewardChest,

      // Event types for convenience
      GameEvent,
    }),
    [
      state,
      levelInfo,
      emitEvent,
      claimDailyReward,
      claimGoalReward,
      setPet,
      setRoom,
      setPlaylist,
      toggleLabs,
      dismissLevelUp,
      dismissRewardChest,
    ]
  );

  return <GamificationContext.Provider value={value}>{children}</GamificationContext.Provider>;
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within GamificationProvider');
  }
  return context;
}

export { GameEvent };
