/**
 * Dashboard Page - Premium SaaS Design
 * Inspired by Linear, Notion, and Duolingo
 */
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Slider,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/system';

// Lucide React Icons
import {
  Clock,
  Flame,
  Sparkles,
  Target,
  Trophy,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Music,
  TreePine,
  PawPrint,
  Gamepad2,
  Calendar,
  TrendingUp,
  Gift,
  Users,
  Swords,
  BookOpen,
  Brain,
  Timer,
  ChevronRight,
  Plus,
  Settings,
  Volume2,
} from 'lucide-react';

import { statsApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useGamification } from '../../context/GamificationContext';
import { useTimer } from '../../context/TimerContext';
import { roomThemes } from '../../theme';
import { studyPets } from '../../data/pets';
import PetSelectionModal from '../../components/common/PetSelectionModal';

const STUDY_ROOMS = Object.values(roomThemes);

// ============================================
// UTILITY FUNCTIONS
// ============================================
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const secondsToClock = (value) => {
  const minutes = Math.floor(value / 60).toString().padStart(2, '0');
  const seconds = Math.floor(value % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

// ============================================
// PREMIUM CARD COMPONENT
// ============================================
const PremiumCard = ({ children, className = '', hover = true, ...props }) => (
  <Box
    className={`card-premium ${hover ? '' : 'hover:shadow-card hover:translate-y-0'} ${className}`}
    sx={{
      p: 3,
      borderRadius: '16px',
      bgcolor: 'rgba(255,255,255,0.9)',
      border: '1px solid rgba(0,0,0,0.06)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      transition: 'all 0.2s ease',
      '&:hover': hover ? {
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        transform: 'translateY(-2px)',
      } : {},
      ...props.sx,
    }}
    {...props}
  >
    {children}
  </Box>
);

// ============================================
// STAT BUBBLE COMPONENT
// ============================================
const StatBubble = ({ icon: Icon, value, label, color = '#8b5cf6' }) => (
  <Box
    className="stat-bubble"
    sx={{
      flex: 1,
      minWidth: 120,
      p: 2.5,
      borderRadius: '14px',
      bgcolor: 'rgba(249,250,251,0.8)',
      border: '1px solid rgba(0,0,0,0.04)',
      transition: 'all 0.2s ease',
      '&:hover': {
        bgcolor: 'white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        transform: 'translateY(-2px)',
      },
    }}
  >
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${alpha(color, 0.15)}, ${alpha(color, 0.08)})`,
        mb: 1.5,
      }}
    >
      <Icon size={20} color={color} />
    </Box>
    <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', lineHeight: 1 }}>
      {value || 0}
    </Typography>
    <Typography sx={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500, mt: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {label}
    </Typography>
  </Box>
);

// ============================================
// PROGRESS BAR WITH GLOW
// ============================================
const GlowProgress = ({ value, color = 'primary', animated = false, height = 10 }) => {
  const colors = {
    primary: { gradient: 'linear-gradient(90deg, #8b5cf6, #6366f1)', glow: 'rgba(139, 92, 246, 0.4)' },
    success: { gradient: 'linear-gradient(90deg, #22c55e, #16a34a)', glow: 'rgba(34, 197, 94, 0.4)' },
    warning: { gradient: 'linear-gradient(90deg, #f59e0b, #ea580c)', glow: 'rgba(245, 158, 11, 0.4)' },
  };
  const { gradient, glow } = colors[color] || colors.primary;

  return (
    <Box sx={{ width: '100%', height, borderRadius: height / 2, bgcolor: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      <Box
        sx={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          height: '100%',
          borderRadius: height / 2,
          background: gradient,
          boxShadow: animated ? `0 0 20px ${glow}` : 'none',
          transition: 'width 0.5s ease-out',
          animation: animated ? 'glow-pulse 2s ease-in-out infinite' : 'none',
          '@keyframes glow-pulse': {
            '0%, 100%': { boxShadow: `0 0 15px ${glow}` },
            '50%': { boxShadow: `0 0 25px ${glow}` },
          },
        }}
      />
    </Box>
  );
};

// ============================================
// MAIN DASHBOARD PAGE
// ============================================
const DashboardPage = () => {
  const { data: overview, isLoading, error } = useQuery({
    queryKey: ['stats-overview'],
    queryFn: async () => {
      const response = await statsApi.overview();
      return response.data;
    },
  });

  const { data: study } = useQuery({
    queryKey: ['stats-study'],
    queryFn: async () => {
      const response = await statsApi.study();
      return response.data;
    },
  });

  const gamification = useGamification();
  const heroRoom = STUDY_ROOMS.find((room) => room.id === gamification.selectedRoom) || STUDY_ROOMS[0];
  const activePet = studyPets.find((pet) => pet.id === gamification.petId) || studyPets[0];
  const [petSelectorOpen, setPetSelectorOpen] = useState(!gamification.petId);

  useEffect(() => {
    setPetSelectorOpen(!gamification.petId);
  }, [gamification.petId]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress size={40} sx={{ color: '#8b5cf6' }} />
          <Typography sx={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading your dashboard...</Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <PremiumCard sx={{ maxWidth: 400, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', mb: 1 }}>
            Unable to load dashboard
          </Typography>
          <Typography sx={{ color: '#6b7280', mb: 2 }}>Please refresh to try again</Typography>
          <Button
            onClick={() => window.location.reload()}
            className="btn-gradient"
            sx={{ px: 4, py: 1.5, textTransform: 'none', fontWeight: 600 }}
          >
            Refresh
          </Button>
        </PremiumCard>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', pb: 6 }}>
      {/* Hero Section */}
      <HeroSection
        heroRoom={heroRoom}
        overview={overview}
        study={study}
        pet={activePet}
        gamification={gamification}
        onChangePet={() => setPetSelectorOpen(true)}
      />

      {/* Main Grid */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Left Column */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={3}>
            <PomodoroCard completePomodoro={gamification.completePomodoro} />
            <DailyProgressCard gamification={gamification} />
            <QuickActionsCard />
          </Stack>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            <StudyPetCard pet={activePet} gamification={gamification} onChangePet={() => setPetSelectorOpen(true)} />
            <StreakCard gamification={gamification} />
            <StudyRoomsCard rooms={STUDY_ROOMS} selected={gamification.selectedRoom} onSelect={gamification.setSelectedRoom} />
          </Stack>
        </Grid>
      </Grid>

      {/* Pet Selection Modal */}
      <PetSelectionModal
        open={petSelectorOpen}
        onSelect={(petId) => {
          gamification.selectPet(petId);
          setPetSelectorOpen(false);
        }}
      />
    </Box>
  );
};

// ============================================
// HERO SECTION
// ============================================
const HeroSection = ({ heroRoom, overview, study, pet, gamification, onChangePet }) => {
  const { user } = useAuth();
  const greeting = getGreeting();
  const userName = user?.username || user?.name || 'there';

  return (
    <PremiumCard
      hover={false}
      sx={{
        p: { xs: 3, md: 4 },
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(249,250,251,0.9))',
        border: '1px solid rgba(0,0,0,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle gradient accent */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 300,
          height: 300,
          background: `radial-gradient(circle, ${alpha(heroRoom.palette?.primary || '#8b5cf6', 0.08)}, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      <Grid container spacing={4} alignItems="center">
        <Grid item xs={12} md={8}>
          <Stack spacing={3}>
            {/* Greeting */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box
                  sx={{
                    px: 2,
                    py: 0.5,
                    borderRadius: '20px',
                    bgcolor: alpha(heroRoom.palette?.primary || '#8b5cf6', 0.1),
                    border: `1px solid ${alpha(heroRoom.palette?.primary || '#8b5cf6', 0.2)}`,
                  }}
                >
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: heroRoom.palette?.primary || '#8b5cf6' }}>
                    <TreePine size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                    {heroRoom.label}
                  </Typography>
                </Box>
              </Box>
              <Typography
                sx={{
                  fontSize: { xs: '1.75rem', md: '2.5rem' },
                  fontWeight: 800,
                  color: '#111827',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                {greeting}, {userName}! 👋
              </Typography>
              <Typography sx={{ color: '#6b7280', mt: 1, fontSize: '1rem', lineHeight: 1.6 }}>
                Build habits, track progress, and grow your knowledge garden.
              </Typography>
            </Box>

            {/* Stats Row */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <StatBubble icon={Clock} value={overview?.minutes_studied || 0} label="Minutes Today" color="#8b5cf6" />
              <StatBubble icon={Sparkles} value={overview?.quizzes_completed || 0} label="Quizzes Done" color="#f59e0b" />
              <StatBubble icon={Flame} value={study?.average_focus || 0} label="Focus Score" color="#ef4444" />
            </Stack>
          </Stack>
        </Grid>

        {/* Pet Section */}
        <Grid item xs={12} md={4}>
          <Box
            sx={{
              p: 3,
              borderRadius: '20px',
              background: `linear-gradient(135deg, ${alpha(pet.colors?.[0] || '#8b5cf6', 0.1)}, ${alpha(pet.colors?.[1] || '#6366f1', 0.05)})`,
              border: '1px solid rgba(0,0,0,0.04)',
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '20px',
                background: 'rgba(255,255,255,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 48,
                mx: 'auto',
                mb: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                animation: 'float 3s ease-in-out infinite',
                '@keyframes float': {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-6px)' },
                },
              }}
            >
              {pet.emoji}
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#111827' }}>{pet.name}</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#6b7280', mb: 2 }}>{pet.description}</Typography>
            <Button
              onClick={onChangePet}
              className="btn-ghost"
              sx={{
                px: 3,
                py: 1,
                fontSize: '0.85rem',
                textTransform: 'none',
              }}
            >
              Change Pet
            </Button>
          </Box>
        </Grid>
      </Grid>
    </PremiumCard>
  );
};

// ============================================
// POMODORO TIMER CARD
// ============================================
const PomodoroCard = ({ completePomodoro }) => {
  const timer = useTimer();
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    const unregister = timer.registerCompletionHandler((mode, seconds) => {
      setCompleted((prev) => prev + 1);
      completePomodoro(Math.round(seconds / 60));
    });
    return unregister;
  }, [timer, completePomodoro]);

  const progress = timer.currentDuration ? (1 - timer.timeLeft / timer.currentDuration) * 100 : 0;

  return (
    <PremiumCard hover={false}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Timer size={20} color="white" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#111827' }}>Focus Timer</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#6b7280' }}>Stay focused, grow your streak</Typography>
          </Box>
        </Box>
        <Box
          sx={{
            px: 2,
            py: 0.75,
            borderRadius: '20px',
            bgcolor: '#f0fdf4',
            border: '1px solid #bbf7d0',
          }}
        >
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#16a34a' }}>
            {completed} sessions today
          </Typography>
        </Box>
      </Stack>

      {/* Timer Mode Tabs */}
      <Tabs
        value={timer.mode}
        onChange={(_, value) => timer.setMode(value)}
        sx={{
          mb: 3,
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
            minHeight: 40,
            borderRadius: '10px',
            mx: 0.5,
            '&.Mui-selected': {
              bgcolor: 'rgba(139, 92, 246, 0.1)',
              color: '#7c3aed',
            },
          },
          '& .MuiTabs-indicator': { display: 'none' },
        }}
      >
        <Tab value="focus" label="Focus" />
        <Tab value="short" label="Short Break" />
        <Tab value="long" label="Long Break" />
      </Tabs>

      <Grid container spacing={4} alignItems="center">
        {/* Timer Display */}
        <Grid item xs={12} md={6}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              sx={{
                fontFamily: 'monospace',
                fontSize: { xs: '3.5rem', md: '4.5rem' },
                fontWeight: 700,
                color: '#111827',
                letterSpacing: '0.05em',
                lineHeight: 1,
              }}
            >
              {secondsToClock(timer.timeLeft)}
            </Typography>

            {/* Progress Bar */}
            <Box sx={{ mt: 3, mb: 3 }}>
              <GlowProgress value={progress} color="primary" animated={timer.isRunning} height={8} />
            </Box>

            {/* Controls */}
            <Stack direction="row" spacing={2} justifyContent="center">
              <IconButton
                onClick={() => (timer.isRunning ? timer.pauseTimer() : timer.startTimer())}
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                  color: 'white',
                  boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    transform: 'scale(1.05)',
                  },
                }}
              >
                {timer.isRunning ? <Pause size={24} /> : <Play size={24} />}
              </IconButton>
              <IconButton
                onClick={timer.resetTimer}
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '14px',
                  bgcolor: '#f3f4f6',
                  color: '#6b7280',
                  '&:hover': { bgcolor: '#e5e7eb' },
                }}
              >
                <RotateCcw size={20} />
              </IconButton>
            </Stack>
          </Box>
        </Grid>

        {/* Timer Settings */}
        <Grid item xs={12} md={6}>
          <Box sx={{ bgcolor: '#f9fafb', borderRadius: '14px', p: 3 }}>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', mb: 2 }}>
              Customize Duration (minutes)
            </Typography>
            {['focus', 'short', 'long'].map((key) => (
              <Box key={key} sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'capitalize', mb: 0.5 }}>
                  {key === 'short' ? 'Short Break' : key === 'long' ? 'Long Break' : 'Focus'}
                </Typography>
                <Slider
                  value={Math.round(timer.durations[key] / 60)}
                  min={key === 'focus' ? 15 : 3}
                  max={key === 'focus' ? 60 : 25}
                  onChange={(_, value) => timer.updateDuration(key, Array.isArray(value) ? value[0] : value)}
                  sx={{
                    color: '#8b5cf6',
                    '& .MuiSlider-thumb': { width: 16, height: 16 },
                    '& .MuiSlider-track': { height: 6 },
                    '& .MuiSlider-rail': { height: 6, bgcolor: '#e5e7eb' },
                  }}
                />
              </Box>
            ))}
          </Box>
        </Grid>
      </Grid>
    </PremiumCard>
  );
};

// ============================================
// DAILY PROGRESS CARD
// ============================================
const DailyProgressCard = ({ gamification }) => {
  const [goalInput, setGoalInput] = useState(gamification.dailyGoalMinutes);
  const progress = gamification.dailyGoalProgress * 100;

  return (
    <PremiumCard hover={false}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Target size={20} color="white" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#111827' }}>Daily Goal</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#6b7280' }}>
              {gamification.todayMinutes} / {gamification.dailyGoalMinutes} minutes
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Flame size={18} className="streak-fire" />
          <Typography sx={{ fontWeight: 700, color: '#f97316' }}>{gamification.streak} day streak</Typography>
        </Box>
      </Stack>

      {/* Progress */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography sx={{ fontSize: '0.85rem', color: '#6b7280' }}>Today's Progress</Typography>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#22c55e' }}>{Math.round(progress)}%</Typography>
        </Box>
        <GlowProgress value={progress} color="success" animated={progress > 0 && progress < 100} height={12} />
      </Box>

      {/* XP Progress */}
      <Box sx={{ p: 2.5, bgcolor: '#f9fafb', borderRadius: '12px' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Zap size={16} color="#8b5cf6" />
            <Typography sx={{ fontWeight: 600, color: '#374151' }}>Level {gamification.level}</Typography>
          </Box>
          <Typography sx={{ fontSize: '0.8rem', color: '#6b7280' }}>
            {Math.round(gamification.levelProgress * gamification.xpToNext)} / {gamification.xpToNext} XP
          </Typography>
        </Stack>
        <GlowProgress value={gamification.levelProgress * 100} color="primary" height={8} />
      </Box>

      {/* Goal Setting */}
      <Stack direction="row" spacing={2} alignItems="center" mt={3}>
        <TextField
          size="small"
          type="number"
          label="Daily Goal (min)"
          value={goalInput}
          onChange={(e) => setGoalInput(Number(e.target.value))}
          onBlur={() => gamification.updateDailyGoal(goalInput)}
          sx={{
            width: 150,
            '& .MuiOutlinedInput-root': { borderRadius: '10px' },
          }}
        />
        <Typography sx={{ fontSize: '0.8rem', color: '#6b7280' }}>
          Best streak: {gamification.bestStreak} days
        </Typography>
      </Stack>
    </PremiumCard>
  );
};

// ============================================
// QUICK ACTIONS CARD
// ============================================
const QuickActionsCard = () => {
  const actions = [
    { icon: BookOpen, label: 'New Note', color: '#8b5cf6', href: '/notes' },
    { icon: Brain, label: 'Quiz Me', color: '#f59e0b', href: '/quizzes' },
    { icon: Sparkles, label: 'Flashcards', color: '#22c55e', href: '/flashcards' },
    { icon: Calendar, label: 'Plan Session', color: '#3b82f6', href: '/planner' },
  ];

  return (
    <PremiumCard hover={false}>
      <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#111827', mb: 2 }}>Quick Actions</Typography>
      <Grid container spacing={2}>
        {actions.map((action) => (
          <Grid item xs={6} sm={3} key={action.label}>
            <Box
              component="a"
              href={action.href}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                p: 2.5,
                borderRadius: '14px',
                bgcolor: alpha(action.color, 0.08),
                border: `1px solid ${alpha(action.color, 0.15)}`,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: alpha(action.color, 0.12),
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${alpha(action.color, 0.2)}`,
                },
              }}
            >
              <action.icon size={24} color={action.color} />
              <Typography sx={{ mt: 1, fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
                {action.label}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </PremiumCard>
  );
};

// ============================================
// STUDY PET CARD
// ============================================
const StudyPetCard = ({ pet, gamification, onChangePet }) => (
  <PremiumCard hover={false}>
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #ec4899, #f472b6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PawPrint size={20} color="white" />
        </Box>
        <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#111827' }}>Study Companion</Typography>
      </Box>
      <IconButton onClick={onChangePet} sx={{ bgcolor: '#f3f4f6', '&:hover': { bgcolor: '#e5e7eb' } }}>
        <Settings size={16} />
      </IconButton>
    </Stack>

    <Box sx={{ textAlign: 'center', py: 2 }}>
      <Box
        sx={{
          width: 100,
          height: 100,
          borderRadius: '24px',
          background: `linear-gradient(135deg, ${alpha(pet.colors?.[0] || '#8b5cf6', 0.2)}, ${alpha(pet.colors?.[1] || '#6366f1', 0.1)})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 56,
          mx: 'auto',
          mb: 2,
          animation: 'float 3s ease-in-out infinite',
        }}
      >
        {pet.emoji}
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#111827' }}>{pet.name}</Typography>
      <Typography sx={{ fontSize: '0.8rem', color: '#6b7280', mb: 2 }}>Stage {gamification.petStage}</Typography>

      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Box sx={{ px: 2, py: 0.5, borderRadius: '8px', bgcolor: '#fef3c7', border: '1px solid #fde68a' }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#b45309' }}>
            Mood: {gamification.petMood || 'Happy'}
          </Typography>
        </Box>
      </Box>
    </Box>
  </PremiumCard>
);

// ============================================
// STREAK CARD
// ============================================
const StreakCard = ({ gamification }) => (
  <PremiumCard
    hover={false}
    sx={{
      background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
      border: '1px solid #fed7aa',
    }}
  >
    <Stack direction="row" alignItems="center" spacing={2}>
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #f97316, #ea580c)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
        }}
      >
        <Flame size={28} color="white" />
      </Box>
      <Box>
        <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: '#c2410c', lineHeight: 1 }}>
          {gamification.streak}
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', color: '#ea580c', fontWeight: 600 }}>Day Streak</Typography>
      </Box>
      <Box sx={{ ml: 'auto', textAlign: 'right' }}>
        <Typography sx={{ fontSize: '0.75rem', color: '#9a3412' }}>Best: {gamification.bestStreak} days</Typography>
      </Box>
    </Stack>
  </PremiumCard>
);

// ============================================
// STUDY ROOMS CARD
// ============================================
const StudyRoomsCard = ({ rooms, selected, onSelect }) => (
  <PremiumCard hover={false}>
    <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#111827', mb: 2 }}>Study Rooms</Typography>
    <Stack spacing={1.5}>
      {rooms.slice(0, 4).map((room) => (
        <Box
          key={room.id}
          onClick={() => onSelect(room.id)}
          sx={{
            p: 2,
            borderRadius: '12px',
            cursor: 'pointer',
            border: selected === room.id ? `2px solid ${room.palette?.primary || '#8b5cf6'}` : '1px solid rgba(0,0,0,0.06)',
            background: selected === room.id ? alpha(room.palette?.primary || '#8b5cf6', 0.08) : 'transparent',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: alpha(room.palette?.primary || '#8b5cf6', 0.05),
            },
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography sx={{ fontSize: '1.25rem' }}>{room.accentIcon}</Typography>
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}>{room.label}</Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }}>{room.ambientSound}</Typography>
              </Box>
            </Box>
            {selected === room.id && (
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: room.palette?.primary || '#8b5cf6' }} />
            )}
          </Stack>
        </Box>
      ))}
    </Stack>
  </PremiumCard>
);

export default DashboardPage;
