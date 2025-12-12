/**
 * useDashboardData - Centralized data fetching for dashboard
 * Single API call instead of 10+ separate queries
 */
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../api/client';

export default function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const { data } = await apiClient.get('/dashboard/summary');
      return data.data;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

// Fallback for older API structure
export function useDashboardDataLegacy() {
  const overviewQuery = useQuery({
    queryKey: ['stats-overview'],
    queryFn: async () => {
      const { data } = await apiClient.get('/stats/overview');
      return data;
    },
  });

  const studyQuery = useQuery({
    queryKey: ['stats-study'],
    queryFn: async () => {
      const { data } = await apiClient.get('/stats/study');
      return data;
    },
  });

  const notesQuery = useQuery({
    queryKey: ['notes-recent'],
    queryFn: async () => {
      const { data } = await apiClient.get('/notes?limit=5');
      return data;
    },
  });

  const isLoading = overviewQuery.isLoading || studyQuery.isLoading;
  const error = overviewQuery.error || studyQuery.error;

  // Transform legacy data to new format
  const data = {
    today: {
      minutes: studyQuery.data?.total_minutes || 0,
      goal_minutes: 120,
      xp_today: 0,
      streak: overviewQuery.data?.current_streak || 0,
    },
    level: {
      current: 1,
      xp: 0,
      xp_for_next: 100,
    },
    up_next: {
      flashcards_due: overviewQuery.data?.flashcards_due || 0,
      unfinished_quizzes: [],
      stale_notes: [],
    },
    recent_notes: notesQuery.data || [],
    weekly: {
      minutes: studyQuery.data?.total_minutes || 0,
      xp: 0,
      notes_created: 0,
      quizzes_completed: 0,
      daily_breakdown: [],
    },
    pet: {
      mood: 'happy',
      message: 'Ready to study!',
    },
  };

  return { data, isLoading, error };
}
