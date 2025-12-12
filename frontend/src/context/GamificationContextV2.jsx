/**
 * Gamification Context v2 - API-backed gamification state
 * 
 * This replaces the localStorage-based system with a database-backed one.
 * All state is synced with the server for persistence across devices.
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gamificationApi } from '../api';

// Activity types that earn XP
export const ActivityType = {
  NOTE_CREATED: 'note_created',
  NOTE_EDITED: 'note_edited',
  NOTE_REVIEWED: 'note_reviewed',
  FLASHCARD_REVIEWED: 'flashcard_reviewed',
  FLASHCARD_CORRECT: 'flashcard_correct',
  QUIZ_COMPLETED: 'quiz_completed',
  QUIZ_PERFECT: 'quiz_perfect',
  SESSION_COMPLETED: 'session_completed',
  DAILY_GOAL_MET: 'daily_goal_met',
  STREAK_MILESTONE: 'streak_milestone',
  CHALLENGE_COMPLETED: 'challenge_completed',
  BOSS_DEFEATED: 'boss_defeated',
};

// Context
const GamificationContext = createContext(null);

/**
 * Gamification Provider - wrap your app with this
 */
export function GamificationProvider({ children }) {
  const queryClient = useQueryClient();
  const [levelUpModal, setLevelUpModal] = useState(null);
  const [xpToast, setXpToast] = useState(null);

  // Fetch gamification stats
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['gamification', 'stats'],
    queryFn: async () => {
      const res = await gamificationApi.getStats();
      return res.data;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Award XP mutation
  const awardXpMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await gamificationApi.awardXp(payload);
      return res.data;
    },
    onSuccess: (data) => {
      // Invalidate stats to refetch
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
      
      // Show XP toast
      if (data.xp_earned > 0) {
        setXpToast({
          xp: data.xp_earned,
          streak: data.current_streak,
          dailyGoalMet: data.daily_goal_met,
        });
        setTimeout(() => setXpToast(null), 3000);
      }
      
      // Show level up modal
      if (data.leveled_up) {
        setLevelUpModal({
          newLevel: data.new_level,
          rewards: data.new_rewards,
        });
      }
    },
  });

  // Feed pet mutation
  const feedPetMutation = useMutation({
    mutationFn: () => gamificationApi.feedPet(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });

  // Play with pet mutation
  const playWithPetMutation = useMutation({
    mutationFn: () => gamificationApi.playWithPet(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });

  // Award XP helper function
  const awardXp = useCallback((activityType, options = {}) => {
    return awardXpMutation.mutateAsync({
      activity_type: activityType,
      ...options,
    });
  }, [awardXpMutation]);

  // Convenience functions for common activities
  const onNoteCreated = useCallback((noteId) => {
    return awardXp(ActivityType.NOTE_CREATED, { note_id: noteId });
  }, [awardXp]);

  const onNoteEdited = useCallback((noteId) => {
    return awardXp(ActivityType.NOTE_EDITED, { note_id: noteId });
  }, [awardXp]);

  const onQuizCompleted = useCallback((quizId, score, durationMinutes) => {
    const activityType = score >= 100 ? ActivityType.QUIZ_PERFECT : ActivityType.QUIZ_COMPLETED;
    return awardXp(activityType, {
      quiz_id: quizId,
      score,
      duration_minutes: durationMinutes,
    });
  }, [awardXp]);

  const onFlashcardReviewed = useCallback((deckId, correct, durationMinutes = null) => {
    const activityType = correct ? ActivityType.FLASHCARD_CORRECT : ActivityType.FLASHCARD_REVIEWED;
    return awardXp(activityType, {
      deck_id: deckId,
      correct,
      duration_minutes: durationMinutes,
    });
  }, [awardXp]);

  const onSessionCompleted = useCallback((sessionId, durationMinutes) => {
    return awardXp(ActivityType.SESSION_COMPLETED, {
      session_id: sessionId,
      duration_minutes: durationMinutes,
    });
  }, [awardXp]);

  // Close level up modal
  const closeLevelUpModal = useCallback(() => {
    setLevelUpModal(null);
  }, []);

  // Dismiss XP toast
  const dismissXpToast = useCallback(() => {
    setXpToast(null);
  }, []);

  const value = {
    // State
    stats: stats || null,
    isLoading,
    error,
    
    // Gamification data
    gamification: stats?.gamification || null,
    rewards: stats?.rewards || [],
    pet: stats?.pet || null,
    availableRewards: stats?.available_rewards || [],
    
    // Computed values
    xp: stats?.gamification?.xp || 0,
    level: stats?.gamification?.level || 1,
    lifetimeXp: stats?.gamification?.lifetime_xp || 0,
    xpToNextLevel: stats?.gamification?.xp_to_next_level || 100,
    xpProgressPercent: stats?.gamification?.xp_progress_percent || 0,
    currentStreak: stats?.gamification?.current_streak || 0,
    bestStreak: stats?.gamification?.best_streak || 0,
    dailyXpToday: stats?.gamification?.daily_xp_today || 0,
    dailyMinutesToday: stats?.gamification?.daily_minutes_today || 0,
    dailyGoalMinutes: stats?.gamification?.daily_goal_minutes || 25,
    dailyGoalMet: stats?.gamification?.daily_goal_met_today || false,
    
    // Actions
    awardXp,
    refetch,
    
    // Convenience actions
    onNoteCreated,
    onNoteEdited,
    onQuizCompleted,
    onFlashcardReviewed,
    onSessionCompleted,
    
    // Pet actions
    feedPet: feedPetMutation.mutate,
    playWithPet: playWithPetMutation.mutate,
    
    // UI state
    levelUpModal,
    closeLevelUpModal,
    xpToast,
    dismissXpToast,
    
    // Loading states
    isAwarding: awardXpMutation.isPending,
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
}

/**
 * Hook to use gamification context
 */
export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}

export default GamificationContext;
