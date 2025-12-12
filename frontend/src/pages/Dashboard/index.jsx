/**
 * Dashboard - Clean & Focused Study Hub
 * 
 * Redesigned from 2150 lines to ~350 lines
 * Focus: "What do you want to study right now?"
 * 
 * Components:
 * - HeroSection: Welcome + room theme
 * - QuickActions: Start Pomodoro, New Note, Review Cards, Take Quiz
 * - TodayProgress: Daily goal, XP, streak
 * - UpNext: Smart suggestions
 * - RecentNotes: Last 5 notes
 * - WeeklySnapshot: Week summary
 * - StudyPetWidget: Minimal pet corner
 */
import React from 'react';
import { Box, Grid, Stack, Fab, useTheme, useMediaQuery, Skeleton } from '@mui/material';
import { Timer as TimerIcon } from '@mui/icons-material';

// Components
import HeroSection from './components/HeroSection';
import QuickActions from './components/QuickActions';
import TodayProgress from './components/TodayProgress';
import UpNext from './components/UpNext';
import RecentNotes from './components/RecentNotes';
import WeeklySnapshot from './components/WeeklySnapshot';
import StudyPetWidget from './components/StudyPetWidget';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';

// Hooks
import { useDashboardDataLegacy } from './hooks/useDashboardData';
import useQuickActions from './hooks/useQuickActions';
import { useGamification } from '../../context/GamificationContext';
import { useAuth } from '../../context/AuthContext';
import { roomThemes } from '../../theme';

export default function DashboardPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Data
  const { data, isLoading, error } = useDashboardDataLegacy();
  const gamification = useGamification();
  const { user } = useAuth();
  
  // Actions
  const actions = useQuickActions();
  
  // Get current room theme
  const currentRoom = Object.values(roomThemes).find(
    (room) => room.id === gamification.selectedRoom
  ) || Object.values(roomThemes)[0];

  // Loading state
  if (isLoading) {
    return <LoadingState label="Loading your study hub..." />;
  }

  // Error state
  if (error) {
    return (
      <EmptyState 
        title="Unable to load dashboard" 
        description="Please refresh to try again."
      />
    );
  }

  // Extract data with fallbacks
  const {
    today = {},
    level = {},
    up_next = {},
    recent_notes = [],
    weekly = {},
    pet = {},
  } = data || {};

  return (
    <Box sx={{ position: 'relative', pb: { xs: 10, md: 0 } }}>
      <Stack spacing={3}>
        {/* Hero Section */}
        <HeroSection
          userName={user?.name?.split(' ')[0] || 'there'}
          roomTheme={currentRoom}
          level={gamification.level || level.current || 1}
          xpToNext={gamification.xpToNext || level.xp_for_next - level.xp || 100}
          streak={gamification.streak || today.streak || 0}
        />

        {/* Quick Actions - Always visible */}
        <QuickActions
          onStartPomodoro={actions.startPomodoro}
          onCreateNote={actions.createNote}
          onReviewCards={actions.reviewFlashcards}
          onTakeQuiz={actions.takeQuiz}
          flashcardsDue={up_next.flashcards_due || 0}
        />

        {/* Main Grid */}
        <Grid container spacing={3}>
          {/* Today's Progress */}
          <Grid item xs={12} md={6}>
            <TodayProgress
              minutesToday={gamification.todayMinutes || today.minutes || 0}
              goalMinutes={gamification.dailyGoalMinutes || today.goal_minutes || 120}
              xpToday={today.xp_today || 0}
              streak={gamification.streak || today.streak || 0}
              level={gamification.level || level.current || 1}
              xp={gamification.xp || level.xp || 0}
              xpForNextLevel={gamification.xpToNext + (gamification.xp || 0) || level.xp_for_next || 100}
            />
          </Grid>

          {/* Up Next */}
          <Grid item xs={12} md={6}>
            <UpNext
              flashcardsDue={up_next.flashcards_due || 0}
              unfinishedQuizzes={up_next.unfinished_quizzes || []}
              staleNotes={up_next.stale_notes || []}
              onReviewCards={actions.reviewFlashcards}
              onStartQuiz={actions.startQuiz}
              onOpenNote={actions.openNote}
              onOpenPlanner={() => actions.viewProgress()}
            />
          </Grid>

          {/* Recent Notes */}
          <Grid item xs={12} md={6}>
            <RecentNotes
              notes={recent_notes}
              onOpenNote={actions.openNote}
              onViewAll={actions.viewAllNotes}
            />
          </Grid>

          {/* Weekly Snapshot */}
          <Grid item xs={12} md={6}>
            <WeeklySnapshot
              minutes={weekly.minutes || 0}
              xp={weekly.xp || 0}
              notesCreated={weekly.notes_created || 0}
              quizzesCompleted={weekly.quizzes_completed || 0}
              onViewAnalytics={actions.viewProgress}
            />
          </Grid>

          {/* Study Pet Widget - Smaller, corner placement */}
          <Grid item xs={12} md={4}>
            <StudyPetWidget
              mood={pet.mood || (gamification.streak > 2 ? 'excited' : 'happy')}
              petName={gamification.petName || 'Study Buddy'}
              message={pet.message}
              streak={gamification.streak || today.streak || 0}
            />
          </Grid>
        </Grid>
      </Stack>

      {/* Mobile FAB - Quick Pomodoro Start */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="Start Pomodoro"
          onClick={actions.startPomodoro}
          sx={{
            position: 'fixed',
            bottom: 80, // Above bottom nav
            right: 16,
            zIndex: theme.zIndex.fab,
          }}
        >
          <TimerIcon />
        </Fab>
      )}
    </Box>
  );
}
