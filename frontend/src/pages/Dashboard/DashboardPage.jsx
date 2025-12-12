import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  AutoAwesome,
  Bolt,
  Casino,
  CheckCircle,
  Close,
  EmojiEvents,
  Fullscreen,
  Flag,
  Forest,
  LocalFireDepartment,
  MilitaryTech,
  MusicNote,
  Pause,
  Pets,
  PictureInPictureAlt,
  PlayArrow,
  Quiz,
  Refresh,
  SkipNext,
  SkipPrevious,
  Spa,
  Timer as TimerIcon,
  Videocam,
  WaterDrop,
  Whatshot,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Fade,
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  useTheme,
} from '@mui/material';
import { alpha, keyframes } from '@mui/system';
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import { statsApi } from '../../api';
import { useGamification } from '../../context/GamificationContext';
import { roomThemes } from '../../theme';
import { studyPets } from '../../data/pets';
import PetSelectionModal from '../../components/common/PetSelectionModal';
import { useTimer } from '../../context/TimerContext';
import { buildYouTubeEmbedUrl, getYouTubePlaylistId } from '../../utils/youtube';
import useSpotifyPlayer from '../../hooks/useSpotifyPlayer';

const STUDY_ROOMS = Object.values(roomThemes);

const BRAINROT_CLIPS = [
  { id: 'subway', label: 'Subway Surfers', videoId: 'AqZ8Twh9NU4' },
  { id: 'parkour', label: 'Minecraft Parkour', videoId: '3HQyAoso2nY' },
  { id: 'sand', label: 'Oddly Satisfying Sand', videoId: '3clqk2U3T9Y' },
];

const BOSS_ATTACKS = [
  { id: 'pomodoro', label: 'Pomodoro session', damage: 50, description: 'Complete a Pomodoro timer block.', icon: <TimerIcon fontSize="small" /> },
  {
    id: 'flashcards',
    label: 'Finish flashcard deck',
    damage: 100,
    description: 'Master an entire deck.',
    icon: <AutoAwesome fontSize="small" />,
  },
  { id: 'quiz', label: 'Practice quiz', damage: 150, description: 'Finish a quiz attempt.', icon: <Quiz fontSize="small" /> },
  {
    id: 'study30',
    label: '30-min focus streak',
    damage: 75,
    description: 'Study for 30 consecutive minutes.',
    icon: <Bolt fontSize="small" />,
  },
];

const MOOD_OPTIONS = [
  { value: 'focused', label: '🔥 Focused' },
  { value: 'chill', label: '🌿 Chill' },
  { value: 'stressed', label: '😵‍💫 Stressed' },
  { value: 'proud', label: '💪 Proud' },
];


const GHOST_NAMES = ['Nova', 'Ember', 'Kai', 'Sol', 'Rue', 'Mika', 'Ash', 'Luna'];
const GHOST_PETS = ['🦊', '🐱', '🐻', '🐧', '🐢', '🐰', '🐙', '🐉'];
const GHOST_ACTIVITIES = [
  'Reviewing flashcards',
  'Grinding past papers',
  'Deep work sprint',
  'Writing summaries',
  'Quiz boss battle',
  'Brainrot focus',
  'Planning deadlines',
  'Annotating slides',
];

const plantPulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.04); }
  100% { transform: scale(1); }
`;

const bossAuraPulse = keyframes`
  0% { transform: scale(0.95); opacity: 0.4; }
  50% { transform: scale(1.05); opacity: 0.7; }
  100% { transform: scale(0.95); opacity: 0.4; }
`;

const burstParticles = keyframes`
  0% { opacity: 0.9; transform: scale(0.4); }
  100% { opacity: 0; transform: scale(1.4); }
`;

const rewardSpin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const rewardGlow = keyframes`
  0% { box-shadow: 0 0 0 rgba(255,255,255,0.2); }
  50% { box-shadow: 0 0 32px rgba(255,255,255,0.45); }
  100% { box-shadow: 0 0 0 rgba(255,255,255,0.2); }
`;

const confettiFall = keyframes`
  0% { transform: translateY(-10%) rotate(0deg); opacity: 0.8; }
  100% { transform: translateY(110%) rotate(360deg); opacity: 0; }
`;

const BOSS_PERSONAS = {
  'exam-titan': {
    label: 'Exam Titan',
    emoji: '🗿',
    background: 'linear-gradient(135deg, #2f3540, #0b0f1a)',
    foreground: '#f6f6f5',
    aura: 'rgba(116,173,209,0.35)',
  },
  'deadline-hydra': {
    label: 'Deadline Hydra',
    emoji: '🐉',
    background: 'linear-gradient(135deg, #3a1f5d, #12061f)',
    foreground: '#fddffb',
    aura: 'rgba(242,153,255,0.3)',
  },
  'syllabus-serpent': {
    label: 'Syllabus Serpent',
    emoji: '🐍',
    background: 'linear-gradient(135deg, #143329, #02130c)',
    foreground: '#e5fff4',
    aura: 'rgba(122, 219, 164, 0.35)',
  },
  'anxiety-wraith': {
    label: 'Anxiety Wraith',
    emoji: '👻',
    background: 'linear-gradient(135deg, #2c0c1d, #040006)',
    foreground: '#ffe7f0',
    aura: 'rgba(255, 118, 163, 0.35)',
  },
  'assignment-leviathan': {
    label: 'Assignment Leviathan',
    emoji: '🐙',
    background: 'linear-gradient(135deg, #0c1f3f, #01070f)',
    foreground: '#d6efff',
    aura: 'rgba(91, 160, 255, 0.35)',
  },
  'presentation-phoenix': {
    label: 'Presentation Phoenix',
    emoji: '🔥',
    background: 'linear-gradient(135deg, #411509, #120201)',
    foreground: '#ffe7d6',
    aura: 'rgba(255, 145, 89, 0.35)',
  },
  default: {
    label: 'Arcane Adversary',
    emoji: '🎯',
    background: 'linear-gradient(135deg, #1f1f1f, #050505)',
    foreground: '#f2f2f2',
    aura: 'rgba(255,255,255,0.25)',
  },
};

const PHASE_BADGES = {
  1: { label: 'Phase 1 · scouting', chipBg: 'rgba(95,141,78,0.25)', chipColor: '#1f2718' },
  2: { label: 'Phase 2 · pressure rising', chipBg: 'rgba(247,178,103,0.25)', chipColor: '#5d2d07' },
  3: { label: 'Phase 3 · critical', chipBg: 'rgba(242,95,92,0.18)', chipColor: '#4b0808' },
  4: { label: 'Final stand', chipBg: 'rgba(215,38,61,0.35)', chipColor: '#fff' },
};

const petFloat = keyframes`
  0% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-8px) scale(1.02); }
  100% { transform: translateY(0px) scale(1); }
`;

const runnerSlide = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;


const SubwayLoop = () => (
  <Box
    sx={{
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 3,
      height: 240,
      background: 'linear-gradient(180deg, #2d4c6b, #0d1827)',
    }}
  >
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(120deg, rgba(255,255,255,0.08) 20%, transparent 20%), linear-gradient(-120deg, rgba(255,255,255,0.06) 20%, transparent 20%)',
        backgroundSize: '40px 40px',
        opacity: 0.7,
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        width: '200%',
        animation: `${runnerSlide} 8s linear infinite`,
      }}
    >
      {[...Array(12)].map((_, index) => (
        <Box
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            pb: 2,
          }}
        >
          <Box
            sx={{
              width: 24,
              height: 50 + (index % 3) * 10,
              background: index % 2 === 0 ? '#ffb347' : '#ffcc33',
              borderRadius: 2,
              opacity: 0.7,
              boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
            }}
          />
        </Box>
      ))}
    </Box>
    <Box
      sx={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 60,
        height: 60,
        borderRadius: '60% 60% 40% 40%',
        background: 'linear-gradient(120deg, #ffd86a, #ff9f43)',
        boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
        animation: `${plantPulse} 2s ease-in-out infinite`,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          width: 12,
          height: 12,
          borderRadius: '50% 50% 50% 0',
          background: '#fff',
          top: 12,
          left: 12,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: 12,
          height: 12,
          borderRadius: '50% 50% 0 50%',
          background: '#fff',
          top: 12,
          right: 12,
        }}
      />
    </Box>
  </Box>
);

const secondsToClock = (value) => {
  const minutes = Math.floor(value / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const buildMomentumData = (sessions) => {
  if (!sessions?.length) return [];
  const counts = sessions.reduce((acc, session) => {
    const date = new Date(session.start_time);
    const key = date.toLocaleDateString('en-US', { weekday: 'short' });
    acc[key] = (acc[key] || 0) + (session.duration || 0);
    return acc;
  }, {});
  return Object.entries(counts).map(([day, minutes]) => ({ day, minutes }));
};

const deriveSubjects = (sessions) => {
  if (!sessions?.length) return [];
  const map = sessions.reduce((acc, session) => {
    const label = session.session_type || 'Focus';
    acc[label] = (acc[label] || 0) + (session.duration || 0);
    return acc;
  }, {});
  return Object.entries(map).map(([name, value]) => ({ name, value }));
};

const generateGhosts = () =>
  Array.from({ length: 6 }).map((_, index) => ({
    name: GHOST_NAMES[Math.floor(Math.random() * GHOST_NAMES.length)],
    pet: GHOST_PETS[index % GHOST_PETS.length],
    status: GHOST_ACTIVITIES[Math.floor(Math.random() * GHOST_ACTIVITIES.length)],
    intensity: Math.floor(Math.random() * 10) + 1,
  }));

const DashboardPage = () => {
  const {
    data: overview,
    isLoading,
    error,
  } = useQuery({
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
  const [ghosts, setGhosts] = useState(() => generateGhosts());
  const heroRoom = STUDY_ROOMS.find((room) => room.id === gamification.selectedRoom) || STUDY_ROOMS[0];
  const activePet = studyPets.find((pet) => pet.id === gamification.petId) || studyPets[0];
  const [petSelectorOpen, setPetSelectorOpen] = useState(!gamification.petId);

  useEffect(() => {
    const interval = setInterval(() => setGhosts(generateGhosts()), 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setPetSelectorOpen(!gamification.petId);
  }, [gamification.petId]);

  const momentumData = useMemo(() => buildMomentumData(overview?.recent_sessions), [overview]);
  const subjectBreakdown = useMemo(() => deriveSubjects(overview?.recent_sessions), [overview]);

  if (isLoading) {
    return <LoadingState label="Cultivating your learning garden..." />;
  }

  if (error) {
    return <EmptyState title="Unable to load your dashboard" description="Please refresh to try again." />;
  }

  return (
    <Stack spacing={4}>
      <HeroSection
        heroRoom={heroRoom}
        overview={overview}
        study={study}
        pet={activePet}
        onChangePet={() => setPetSelectorOpen(true)}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <PomodoroGarden completePomodoro={gamification.completePomodoro} />
        </Grid>
        <Grid item xs={12} md={5}>
          <DailyGoalsCard
            dailyGoalMinutes={gamification.dailyGoalMinutes}
            progress={gamification.dailyGoalProgress}
            todayMinutes={gamification.todayMinutes}
            streak={gamification.streak}
            bestStreak={gamification.bestStreak}
            xpProgress={gamification.levelProgress}
            level={gamification.level}
            xpToNext={gamification.xpToNext}
            updateGoal={gamification.updateDailyGoal}
          />
          <StudyPetCompanion
            petStage={gamification.petStage}
            petMood={gamification.petMood}
            streak={gamification.streak}
            unlockedRewards={gamification.unlockedRewards}
          />
        </Grid>

        <Grid item xs={12} md={7}>
          <BrainrotLab onLogFocus={() => gamification.logStudySession(10, { reason: 'brainrot', label: 'Brainrot lab' })} />
        </Grid>
        <Grid item xs={12} md={5}>
          <SpotifyStation
            playlist={gamification.spotifyPlaylist}
            onChange={gamification.setSpotifyPlaylist}
            selectedRoom={gamification.selectedRoom}
          />
          <StudyRoomsPicker rooms={STUDY_ROOMS} selected={gamification.selectedRoom} onSelect={gamification.setSelectedRoom} />
        </Grid>

        <Grid item xs={12} md={6}>
          <BossBattleCard boss={gamification.bossBattle} onSetGoal={gamification.setBossGoal} />
        </Grid>
        <Grid item xs={12} md={6}>
          <ChallengesBoard challenges={gamification.challenges} onClaim={gamification.claimChallengeReward} />
        </Grid>

        <Grid item xs={12} md={6}>
          <MoodTrackerCard entries={gamification.moodEntries} onLog={gamification.logMood} />
        </Grid>
        <Grid item xs={12} md={6}>
          <BuddyMatchmakingCard ghosts={ghosts} />
        </Grid>

        <Grid item xs={12} md={6}>
          <DailyRewardCard reward={gamification.lastReward} streak={gamification.streak} />
        </Grid>
        <Grid item xs={12} md={6}>
          <DungeonCrawlerCard dungeon={gamification.dungeon} />
        </Grid>

        <Grid item xs={12} md={6}>
          <StatsDashboardCard momentum={momentumData} breakdown={subjectBreakdown} study={study} overview={overview} />
        </Grid>
        <Grid item xs={12} md={6}>
          <RitualBuilderCard rituals={gamification.rituals} toggleStep={gamification.toggleRitualStep} addStep={gamification.addRitualStep} />
        </Grid>

        <Grid item xs={12} md={6}>
          <TimeCapsuleCard capsules={gamification.timeCapsules} addCapsule={gamification.addTimeCapsule} openCapsule={gamification.openTimeCapsule} />
        </Grid>
      </Grid>
      <PetSelectionModal
        open={petSelectorOpen}
        onSelect={(petId) => {
          gamification.selectPet(petId);
          setPetSelectorOpen(false);
        }}
      />
      {gamification.dailyRewardCelebration && gamification.lastReward && (
        <DailyRewardCelebration
          reward={gamification.lastReward}
          streak={gamification.streak}
          onClose={gamification.acknowledgeDailyReward}
        />
      )}
    </Stack>
  );
};

const HeroSection = ({ heroRoom, overview, study, pet, onChangePet }) => {
  const theme = useTheme();
  return (
    <Card
      sx={{
        borderRadius: 4,
        p: { xs: 3, md: 5 },
        background: heroRoom.gradient,
        border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
        overflow: 'hidden',
      }}
    >
      <Grid container spacing={4} alignItems="center">
        <Grid item xs={12} md={7}>
          <Stack spacing={2.5}>
            <Chip icon={<Forest />} label={`${heroRoom.label} unlocked`} color="primary" variant="outlined" />
            <Typography variant="h4" fontWeight={700} color="text.primary">
              Build rituals, conquer quests, and let your study garden blossom.
            </Typography>
          <Typography color="text.secondary">
            Track streaks, level up for new vibes, and keep exams on their toes with every focused minute.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <StatBubble label="Minutes logged" value={overview.minutes_studied} icon={TimerIcon} accent={heroRoom.palette.primary} />
            <StatBubble label="Quizzes completed" value={overview.quizzes_completed} icon={AutoAwesome} accent="#d9843b" />
            <StatBubble label="Avg. focus" value={study?.average_focus || 0} icon={LocalFireDepartment} accent="#f05d5e" />
          </Stack>
        </Stack>
      </Grid>
      <Grid item xs={12} md={5}>
        <Box
          sx={{
            borderRadius: 4,
            p: 3,
            background: `linear-gradient(135deg, ${pet.colors?.[0] || '#ffffff'}33, ${pet.colors?.[1] || '#ffffff'}33)`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 60,
              margin: '0 auto 12px',
              animation: `${petFloat} 4s ease-in-out infinite`,
            }}
          >
            {pet.emoji}
          </Box>
          <Typography variant="h6" align="center">
            {pet.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" mb={2}>
            {pet.description}
          </Typography>
          <Button onClick={onChangePet} variant="outlined" fullWidth>
            Change pet
          </Button>
        </Box>
      </Grid>
    </Grid>
  </Card>
  );
};

const StatBubble = ({ label, value, icon: Icon, accent }) => {
  const theme = useTheme();
  return (
    <Stack
      spacing={0.5}
      sx={{
        flex: 1,
        minWidth: 140,
        p: 2,
        borderRadius: 3,
        background: alpha(theme.palette.background.paper, 0.9),
        border: `1px solid ${alpha(theme.palette.text.primary, 0.06)}`,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 24px ${alpha(accent, 0.15)}`,
        },
      }}
    >
      <Icon sx={{ color: accent }} />
      <Typography variant="h5" fontWeight={700}>
        {value || 0}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  );
};

const PomodoroGarden = ({ completePomodoro }) => {
  const theme = useTheme();
  const timer = useTimer();
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    const unregister = timer.registerCompletionHandler((mode, seconds) => {
      setCompleted((prev) => prev + 1);
      completePomodoro(Math.round(seconds / 60));
    });
    return unregister;
  }, [timer, completePomodoro]);

  const progress = timer.currentDuration ? 1 - timer.timeLeft / timer.currentDuration : 0;
  const treeScale = 0.35 + progress * 0.65;

  return (
    <Card sx={{ p: 3, height: '100%' }}>
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <TimerIcon color="primary" />
        <Typography variant="h6" fontWeight={700}>
          Pomodoro grove
        </Typography>
        <Chip label={`${completed} blooms today`} color="secondary" variant="outlined" />
      </Stack>
      <Tabs value={timer.mode} onChange={(_, value) => timer.setMode(value)} sx={{ mb: 2, minHeight: 0 }}>
        <Tab value="focus" label="Focus" />
        <Tab value="short" label="Short break" />
        <Tab value="long" label="Long break" />
      </Tabs>
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} md={6}>
          <Stack spacing={2} alignItems="center">
            <Typography variant="h3" fontWeight={700}>
              {secondsToClock(timer.timeLeft)}
            </Typography>
            <Stack direction="row" spacing={2}>
              <IconButton
                color="primary"
                onClick={() => {
                  if (timer.isRunning) {
                    timer.pauseTimer();
                  } else {
                    timer.startTimer();
                  }
                }}
                sx={{ border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}` }}
              >
                {timer.isRunning ? <Pause /> : <PlayArrow />}
              </IconButton>
              <IconButton onClick={timer.resetTimer}>
                <Refresh />
              </IconButton>
            </Stack>
            <Stack spacing={1} width="100%">
              <Typography variant="caption" color="text.secondary">
                Customize intervals (minutes)
              </Typography>
              {['focus', 'short', 'long'].map((key) => (
                <Stack key={key} spacing={0.5}>
                  <Typography variant="body2" color="text.secondary" textTransform="capitalize">
                    {key}
                  </Typography>
                  <Slider
                    value={Math.round(timer.durations[key] / 60)}
                    min={key === 'focus' ? 15 : 3}
                    max={key === 'focus' ? 60 : 25}
                    step={1}
                    onChange={(_, value) => timer.updateDuration(key, Array.isArray(value) ? value[0] : value)}
                  />
                </Stack>
              ))}
            </Stack>
          </Stack>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ position: 'relative', height: 220 }}>
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 120,
                height: 50,
                background: '#d8c7a3',
                borderRadius: 50,
                boxShadow: '0 20px 30px rgba(0,0,0,0.15)',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 30,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 12,
                height: 120,
                borderRadius: 6,
                background: 'linear-gradient(180deg, #4f7d58, #2f4a33)',
                boxShadow: '0 10px 30px rgba(79,125,88,0.3)',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 40,
                left: '50%',
                transform: `translateX(-50%) scale(${treeScale})`,
                width: 200,
                height: 200,
                borderRadius: '50% 50% 40% 40%',
                background: 'linear-gradient(180deg, #79b37e, #4f7d58)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: `${plantPulse} 4s ease-in-out infinite`,
                transition: 'transform 0.4s ease',
              }}
            >
              <Typography variant="h6" color="#fff">
                {Math.round(progress * 100)}%
              </Typography>
            </Box>
          </Box>
          <FormControl fullWidth size="small" sx={{ mt: 2 }}>
            <InputLabel id="alarm-select-label">Alarm sound</InputLabel>
            <Select
              labelId="alarm-select-label"
              label="Alarm sound"
              value={timer.soundKey}
              onChange={(event) => timer.setSoundKey(event.target.value)}
            >
              <MenuItem value="chime">Chime</MenuItem>
              <MenuItem value="bell">Bell</MenuItem>
              <MenuItem value="wave">Ocean wave</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Card>
  );
};const DailyGoalsCard = ({
  dailyGoalMinutes,
  progress,
  todayMinutes,
  streak,
  bestStreak,
  xpProgress,
  level,
  xpToNext,
  updateGoal,
}) => {
  const [goalInput, setGoalInput] = useState(dailyGoalMinutes);

  return (
    <Card sx={{ p: 3, mb: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight={700}>
          Daily study goal
        </Typography>
        <Chip icon={<Whatshot />} label={`${streak}-day streak`} color="success" variant="outlined" />
      </Stack>
      <Stack direction="row" spacing={3} alignItems="center">
        <Box position="relative" display="inline-flex">
          <CircularProgress variant="determinate" value={progress * 100} size={140} thickness={5} sx={{ color: '#5f8d4e' }} />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
            }}
          >
            <Typography variant="h5" fontWeight={700}>
              {Math.round(progress * 100)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {todayMinutes}/{dailyGoalMinutes} min
            </Typography>
          </Box>
        </Box>
        <Stack spacing={2} flex={1}>
          <TextField
            label="Goal minutes"
            type="number"
            value={goalInput}
            onChange={(event) => setGoalInput(Number(event.target.value))}
            onBlur={() => updateGoal(goalInput)}
            InputProps={{ inputProps: { min: 15 } }}
          />
          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              XP to next level
            </Typography>
            <LinearProgress value={xpProgress * 100} variant="determinate" sx={{ height: 10, borderRadius: 5 }} />
            <Typography variant="caption" color="text.secondary">
              Level {level} · {Math.round(xpProgress * xpToNext)}/{xpToNext} XP
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Chip label={`Best streak: ${bestStreak}`} />
            <Chip label={`Today: ${todayMinutes} min`} />
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
};

const getStoredBrainrotClip = () => {
  if (typeof window === 'undefined') return BRAINROT_CLIPS[0];
  try {
    const raw = window.localStorage.getItem('braintrails_brainrot_clip');
    if (!raw) return BRAINROT_CLIPS[0];
    const parsed = JSON.parse(raw);
    return parsed.videoId ? parsed : BRAINROT_CLIPS[0];
  } catch {
    return BRAINROT_CLIPS[0];
  }
};

const BrainrotLab = ({ onLogFocus }) => {
  const theme = useTheme();
  const [selectedClip, setSelectedClip] = useState(getStoredBrainrotClip);
  const [split, setSplit] = useState(55);
  const [notes, setNotes] = useState([]);
  const [noteInput, setNoteInput] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const [pipActive, setPipActive] = useState(false);
  const containerRef = useRef(null);
  const draggingRef = useRef(false);

  const embedSrc = selectedClip?.videoId ? buildYouTubeEmbedUrl(selectedClip.videoId) : null;
  const showPrimaryVideo = Boolean(embedSrc && !pipActive);

  useEffect(() => {
    const handleMove = (event) => {
      if (!draggingRef.current || !containerRef.current) return;
      const bounds = containerRef.current.getBoundingClientRect();
      const clientX = event.touches ? event.touches[0].clientX : event.clientX;
      const percentage = ((clientX - bounds.left) / bounds.width) * 100;
      setSplit(Math.min(75, Math.max(25, percentage)));
    };
    const handleUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, []);

  useEffect(() => {
    if (selectedClip?.videoId && typeof window !== 'undefined') {
      window.localStorage.setItem('braintrails_brainrot_clip', JSON.stringify(selectedClip));
    }
  }, [selectedClip]);

  useEffect(() => {
    const handlePipClose = () => setPipActive(false);
    window.addEventListener('brainrot:pip-close', handlePipClose);
    return () => {
      window.removeEventListener('brainrot:pip-close', handlePipClose);
    };
  }, []);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        setFullscreen(false);
        return;
      }
      if (event.key && event.key.toLowerCase() === 'f' && embedSrc) {
        event.preventDefault();
        setFullscreen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [embedSrc]);

  useEffect(() => {
    if (pipActive && selectedClip?.videoId) {
      window.dispatchEvent(
        new CustomEvent('brainrot:pip', { detail: { videoId: selectedClip.videoId, label: selectedClip.label } }),
      );
    }
  }, [pipActive, selectedClip]);

  const addNote = () => {
    if (!noteInput.trim()) return;
    setNotes((prev) => [{ id: Date.now(), text: noteInput.trim() }, ...prev].slice(0, 6));
    setNoteInput('');
  };

  const closePip = () => {
    setPipActive(false);
    window.dispatchEvent(new Event('brainrot:pip-close'));
  };
  const togglePip = () => {
    if (!selectedClip?.videoId) return;
    if (pipActive) {
      closePip();
    } else {
      setPipActive(true);
    }
  };
  const openFullscreen = () => {
    if (!selectedClip?.videoId) return;
    if (pipActive) {
      closePip();
    }
    setFullscreen(true);
  };

  return (
    <Card sx={{ p: 0 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center" mb={2} px={3} pt={3}>
        <Videocam color="primary" />
        <Typography variant="h6" fontWeight={700}>
          Brainrot split-screen focus
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Drag the divider to resize or pop into mini-player.
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" px={3}>
        {BRAINROT_CLIPS.map((clip) => (
          <Chip
            key={clip.id}
            label={clip.label}
            color={clip.id === selectedClip.id ? 'primary' : 'default'}
            onClick={() => setSelectedClip(clip)}
          />
        ))}
      </Stack>
      <Box ref={containerRef} sx={{ display: 'flex', gap: 2, position: 'relative', px: 3, pb: 3 }}>
        <Box
          sx={{
            width: `${split}%`,
            borderRadius: 3,
            overflow: 'hidden',
            border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
            position: 'relative',
            bgcolor: '#000',
          }}
        >
          {showPrimaryVideo ? (
            <Box
              component="iframe"
              src={embedSrc}
              title="Brainrot focus video"
              sx={{ width: '100%', height: 240, border: 0 }}
              allow="autoplay; encrypted-media; picture-in-picture"
            />
          ) : pipActive ? (
            <Stack
              spacing={1}
              alignItems="center"
              justifyContent="center"
              sx={{ height: 240, color: '#fff', bgcolor: 'rgba(0,0,0,0.5)' }}
            >
              <Typography variant="body2">Mini player active</Typography>
              <Button size="small" variant="outlined" onClick={closePip}>
                Dock video back
              </Button>
            </Stack>
          ) : (
            <SubwayLoop />
          )}
          <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
            <Tooltip title={pipActive ? 'Close mini player' : 'Open picture-in-picture'}>
              <span>
                <IconButton
                  size="small"
                  onClick={togglePip}
                  disabled={!selectedClip?.videoId}
                  sx={{ bgcolor: 'rgba(0,0,0,0.35)', color: '#fff' }}
                >
                  <PictureInPictureAlt fontSize="inherit" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Fullscreen (F)">
              <span>
                <IconButton
                  size="small"
                  onClick={openFullscreen}
                  disabled={!selectedClip?.videoId}
                  sx={{ bgcolor: 'rgba(0,0,0,0.35)', color: '#fff' }}
                >
                  <Fullscreen fontSize="inherit" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
        <Box
          onMouseDown={() => {
            draggingRef.current = true;
          }}
          sx={{ width: 6, cursor: 'col-resize', borderRadius: 3, background: 'linear-gradient(180deg,#b3c49b,#89a678)' }}
        />
        <Box sx={{ flex: 1 }}>
          <Stack spacing={1.5}>
            <TextField
              label="Capture a takeaway"
              multiline
              minRows={3}
              value={noteInput}
              onChange={(event) => setNoteInput(event.target.value)}
            />
            <Stack direction="row" spacing={1}>
              <Button onClick={addNote} variant="contained">
                Save highlight
              </Button>
              <Button variant="text" onClick={onLogFocus}>
                Log 10 min focus
              </Button>
            </Stack>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {notes.map((note) => (
                <Chip
                  key={note.id}
                  label={note.text}
                  onDelete={() => setNotes((prev) => prev.filter((item) => item.id !== note.id))}
                  color="secondary"
                />
              ))}
            </Stack>
          </Stack>
        </Box>
      </Box>
      {fullscreen && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.8)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
          }}
        >
          <IconButton
            onClick={() => setFullscreen(false)}
            sx={{ position: 'absolute', top: 24, right: 24, color: '#fff' }}
          >
            <Close />
          </IconButton>
          {embedSrc ? (
            <Box
              component="iframe"
              src={embedSrc.replace('controls=0', 'controls=1')}
              title="Brainrot fullscreen video"
              sx={{ width: 'min(1200px, 90vw)', height: '80vh', borderRadius: 2, border: 0 }}
              allow="autoplay; encrypted-media; picture-in-picture"
            />
          ) : (
            <SubwayLoop />
          )}
        </Box>
      )}
    </Card>
  );
};

const SpotifyStation = ({ playlist, onChange, selectedRoom }) => {
  const theme = useTheme();
  const room = roomThemes[selectedRoom] || roomThemes.forest;
  const spotify = useSpotifyPlayer();
  const [customSpotify, setCustomSpotify] = useState('');
  const [customYoutube, setCustomYoutube] = useState(() => window.localStorage.getItem('braintrails_youtube_playlist') || '');
  const playlistId = getYouTubePlaylistId(customYoutube);
  const youtubeEmbed = playlistId ? `https://www.youtube.com/embed/videoseries?list=${playlistId}` : null;

  useEffect(() => {
    window.localStorage.setItem('braintrails_youtube_playlist', customYoutube);
  }, [customYoutube]);

  const handleSpotifySubmit = () => {
    if (!customSpotify.trim()) return;
    onChange(customSpotify.trim());
    if (spotify.isConnected && spotify.isPremium) {
      spotify.playContext(customSpotify.trim());
    }
    setCustomSpotify('');
  };

  const handlePreset = (url) => {
    onChange(url);
    if (spotify.isConnected && spotify.isPremium) {
      spotify.playContext(url);
    }
  };

  const handleYouTubeLoad = () => {
    if (!customYoutube.trim()) return;
    window.localStorage.setItem('braintrails_youtube_playlist', customYoutube.trim());
  };

  const handleVolume = (_, value) => {
    spotify.setPlayerVolume(Math.max(0, Math.min(1, value / 100)));
  };

  return (
    <Card sx={{ p: 3, mb: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
        <MusicNote color="primary" />
        <Typography variant="h6" fontWeight={700}>
          Study soundscape
        </Typography>
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mb={2}>
        <Button variant="contained" onClick={spotify.isConnected ? spotify.disconnectSpotify : spotify.connectSpotify}>
          {spotify.isConnected ? 'Disconnect Spotify' : 'Connect Spotify'}
        </Button>
        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">
            {spotify.isConnected
              ? spotify.isPremium
                ? `Logged in as ${spotify.profile?.display_name || 'Spotify user'}`
                : 'Spotify connected · Premium required for playback'
              : 'Spotify Premium required for full playback'}
          </Typography>
          {spotify.error && (
            <Typography variant="caption" color="error.main">
              {spotify.error}
            </Typography>
          )}
        </Stack>
      </Stack>
      <Typography variant="body2" color="text.secondary" mb={1}>
        Paste a Spotify link or tap a room preset to play it through the in-app player.
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mb={2}>
        <TextField
          fullWidth
          label="Spotify playlist/album/track"
          value={customSpotify}
          onChange={(event) => setCustomSpotify(event.target.value)}
        />
        <Button variant="contained" onClick={handleSpotifySubmit} disabled={!customSpotify.trim()}>
          Load
        </Button>
        <Button
          variant="outlined"
          disabled={!spotify.isConnected || !spotify.isPremium || !playlist}
          onClick={() => spotify.playContext(playlist || room.spotifyDefault)}
        >
          Play current
        </Button>
      </Stack>
      <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
        {STUDY_ROOMS.map((roomOption) => (
          <Chip
            key={roomOption.id}
            label={roomOption.label}
            onClick={() => handlePreset(roomOption.spotifyDefault)}
            variant={roomOption.id === selectedRoom ? 'filled' : 'outlined'}
          />
        ))}
      </Stack>
      {spotify.isConnected && spotify.track ? (
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{ borderRadius: 3, border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`, p: 2, mb: 2 }}
        >
          {spotify.track.artwork && (
            <Box component="img" src={spotify.track.artwork} alt={spotify.track.name} sx={{ width: 64, height: 64, borderRadius: 2 }} />
          )}
          <Stack spacing={0.2} flex={1}>
            <Typography fontWeight={700}>{spotify.track.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {spotify.track.artists}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <IconButton onClick={spotify.previousTrack} size="small">
              <SkipPrevious />
            </IconButton>
            <IconButton onClick={spotify.togglePlay} size="small">
              {spotify.paused ? <PlayArrow /> : <Pause />}
            </IconButton>
            <IconButton onClick={spotify.nextTrack} size="small">
              <SkipNext />
            </IconButton>
          </Stack>
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary" mb={2}>
          {spotify.isConnected ? 'Select a playlist to start streaming.' : 'Connect Spotify above or use the YouTube fallback below.'}
        </Typography>
      )}
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <Typography variant="body2">Volume</Typography>
        <Slider
          value={Math.round((spotify.volume || 0) * 100)}
          onChange={handleVolume}
          min={0}
          max={100}
          sx={{ flex: 1 }}
          disabled={!spotify.isConnected}
        />
      </Stack>
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" gutterBottom>
        YouTube playlist fallback
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={1}>
        No Premium? Paste a YouTube music playlist link and we will embed it here instead.
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mb={2}>
        <TextField
          fullWidth
          label="YouTube playlist URL"
          value={customYoutube}
          onChange={(event) => setCustomYoutube(event.target.value)}
        />
        <Button variant="contained" onClick={handleYouTubeLoad} disabled={!customYoutube.trim()}>
          Load playlist
        </Button>
      </Stack>
      {youtubeEmbed ? (
        <Box
          component="iframe"
          src={youtubeEmbed}
          title="YouTube fallback playlist"
          sx={{ border: 0, borderRadius: 3, width: '100%', height: 160 }}
          allow="autoplay; encrypted-media; picture-in-picture"
        />
      ) : (
        <Typography variant="body2" color="text.secondary">
          Paste a playlist link (for example from YouTube Music) to unlock the fallback player.
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary" display="block" mt={1}>
        Ambient hint: {room.ambientSound}. Spotify Premium is required for seamless playback; otherwise, use the YouTube fallback.
      </Typography>
    </Card>
  );
};

const StudyPetCompanion = ({ petStage, petMood, streak, unlockedRewards }) => {
  const moods = {
    chill: 'Calm tail wags and gentle blinks.',
    proud: 'Bright eyes and excited spins!',
    energized: 'Hyper zoomies across the desk.',
    radiant: 'Sparkling aura with dance moves.',
    mythic: 'Evolved wings and legendary glow.',
  };
  const sprites = {
    1: '🌱',
    2: '🦊',
    3: '🐉',
    4: '🌌',
  };

  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <Pets color="primary" />
        <Typography variant="h6" fontWeight={700}>
          Study companion
        </Typography>
      </Stack>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography sx={{ fontSize: 56 }}>{sprites[petStage] || '🌱'}</Typography>
        <Stack spacing={0.5}>
          <Typography fontWeight={700}>Stage {petStage}</Typography>
          <Typography variant="body2" color="text.secondary">
            {moods[petMood] || 'Chilling alongside your notes.'}
          </Typography>
          <Chip label={`Streak: ${streak} days`} />
        </Stack>
      </Stack>
      <Divider sx={{ my: 2 }} />
      <Typography variant="caption" color="text.secondary">
        Latest cosmetic unlocks
      </Typography>
      <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
        {unlockedRewards.slice(-3).map((reward) => (
          <Chip key={reward.id} size="small" icon={<CheckCircle fontSize="inherit" />} label={reward.label} />
        ))}
        {unlockedRewards.length === 0 && <Typography variant="body2">Earn XP to unlock new vibes.</Typography>}
      </Stack>
    </Card>
  );
};

const BossBattleCard = ({ boss, onSetGoal }) => {
  const theme = useTheme();
  const hpPercent = boss.maxHp ? Math.round((boss.hp / boss.maxHp) * 100) : 0;
  const persona = BOSS_PERSONAS[boss.persona] || BOSS_PERSONAS.default;
  const phaseMeta = PHASE_BADGES[boss.phase || 1] || PHASE_BADGES[1];
  const [form, setForm] = useState({ name: boss.name, hp: boss.maxHp });
  const [formOpen, setFormOpen] = useState(false);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    setForm({ name: boss.name, hp: boss.maxHp });
  }, [boss.name, boss.maxHp]);

  useEffect(() => {
    if (!boss.startedAt || boss.status === 'defeated') return undefined;
    setBurst(true);
    const timeout = setTimeout(() => setBurst(false), 600);
    return () => clearTimeout(timeout);
  }, [boss.hp, boss.status]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSetGoal({ name: form.name, maxHp: Number(form.hp) });
    setFormOpen(false);
  };

  const timeline = [...(boss.log || [])].reverse();
  const durationMinutes =
    boss.startedAt && (boss.defeatedAt || boss.status === 'defeated')
      ? Math.max(1, Math.round(dayjs(boss.defeatedAt || new Date()).diff(dayjs(boss.startedAt), 'minute', true)))
      : null;

  return (
    <Card sx={{ p: 0, overflow: 'hidden', position: 'relative' }}>
      {boss.status === 'defeated' && (
        <BossVictoryOverlay boss={boss} onReset={() => onSetGoal({ name: boss.name, maxHp: boss.maxHp })} />
      )}
      <Box
        sx={{
          p: 3,
          background: persona.background,
          color: persona.foreground,
          position: 'relative',
          minHeight: 220,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 12,
            borderRadius: 4,
            background: persona.aura,
            filter: 'blur(90px)',
            animation: `${bossAuraPulse} 7s ease-in-out infinite`,
          }}
        />
        <Stack spacing={2} position="relative" zIndex={1}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
          >
            <Typography variant="h6" fontWeight={700} display="flex" alignItems="center" gap={1}>
              <LocalFireDepartment />
              Boss battle
            </Typography>
            <Chip icon={<MilitaryTech fontSize="small" />} label={`${boss.maxHp} HP target`} />
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography sx={{ fontSize: 56 }}>{persona.emoji}</Typography>
            <div>
              <Typography variant="h5" fontWeight={800}>
                {boss.name}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {persona.label} · {phaseMeta.label}
              </Typography>
            </div>
          </Stack>
          <Box sx={{ position: 'relative', mb: 1 }}>
            <LinearProgress
              value={hpPercent}
              variant="determinate"
              sx={{ height: 18, borderRadius: 9, background: 'rgba(255,255,255,0.18)' }}
            />
            <Typography
              variant="caption"
              sx={{ position: 'absolute', inset: 0, textAlign: 'center', lineHeight: '18px', fontWeight: 600 }}
            >
              {boss.hp}/{boss.maxHp} HP
            </Typography>
            {burst && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 9,
                  border: '1px solid rgba(255,255,255,0.7)',
                  animation: `${burstParticles} 0.6s ease-out`,
                  pointerEvents: 'none',
                }}
              />
            )}
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              size="small"
              label={phaseMeta.label}
              sx={{ bgcolor: phaseMeta.chipBg, color: phaseMeta.chipColor, fontWeight: 600 }}
            />
            {durationMinutes && <Chip size="small" label={`Battle time · ${durationMinutes} min`} />}
            {boss.startedAt && <Chip size="small" label={`Started ${dayjs(boss.startedAt).format('MMM D')}`} />}
          </Stack>
        </Stack>
      </Box>
      <Divider />
      <Grid container spacing={0} sx={{ p: 3 }}>
        <Grid item xs={12} md={6} sx={{ pr: { md: 2 } }}>
          <Typography variant="subtitle2" gutterBottom>
            Study attacks
          </Typography>
          <Stack spacing={1.5}>
            {BOSS_ATTACKS.map((attack) => (
              <Box
                key={attack.id}
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                  p: 1.5,
                  display: 'flex',
                  gap: 1.5,
                  alignItems: 'center',
                  background: alpha(theme.palette.text.primary, 0.02),
                }}
              >
                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.15), width: 40, height: 40 }}>{attack.icon}</Avatar>
                <div>
                  <Typography fontWeight={600}>
                    {attack.label}{' '}
                    <Chip size="small" color="error" label={`-${attack.damage} HP`} sx={{ ml: 1 }} />
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {attack.description}
                  </Typography>
                </div>
              </Box>
            ))}
          </Stack>
        </Grid>
        <Grid item xs={12} md={6} sx={{ pl: { md: 2 }, mt: { xs: 3, md: 0 } }}>
          <Typography variant="subtitle2" gutterBottom>
            Battle log
          </Typography>
          <Stack spacing={1.2} maxHeight={220} sx={{ overflowY: 'auto' }}>
            {timeline.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Complete Pomodoros, full decks, quizzes, or 30-minute streaks to deal damage.
              </Typography>
            )}
            {timeline.map((entry) => (
              <Box
                key={entry.id}
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                  p: 1.5,
                  background: alpha(theme.palette.text.primary, 0.02),
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip size="small" color="error" label={`-${entry.damage || 0} HP`} />
                  <Typography variant="body2" fontWeight={600}>
                    {entry.label || entry.text}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ marginLeft: 'auto' }}>
                    {entry.timestamp ? dayjs(entry.timestamp).format('h:mm A') : ''}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {entry.text}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Grid>
      </Grid>
      <Divider />
      <Box sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <Button startIcon={<Flag />} variant="outlined" onClick={() => setFormOpen((prev) => !prev)}>
            {formOpen ? 'Hide goal form' : 'Set / update boss goal'}
          </Button>
          <Typography variant="body2" color="text.secondary">
            Tie your big exams or projects to a boss HP pool so study actions feel like real attacks.
          </Typography>
        </Stack>
        <Collapse in={formOpen}>
          <Stack component="form" direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={2} onSubmit={handleSubmit}>
            <TextField
              label="Boss / exam name"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="Total HP"
              type="number"
              value={form.hp}
              onChange={(event) => setForm((prev) => ({ ...prev, hp: event.target.value }))}
              required
              InputProps={{ inputProps: { min: 100 } }}
            />
            <Button type="submit" variant="contained">
              Save goal
            </Button>
          </Stack>
        </Collapse>
      </Box>
    </Card>
  );
};

const BossVictoryOverlay = ({ boss, onReset }) => {
  const persona = BOSS_PERSONAS[boss.persona] || BOSS_PERSONAS.default;
  const duration =
    boss.startedAt && boss.defeatedAt
      ? Math.max(1, Math.round(dayjs(boss.defeatedAt).diff(dayjs(boss.startedAt), 'minute', true)))
      : null;
  return (
    <Fade in>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          bgcolor: 'rgba(2,4,8,0.88)',
          color: persona.foreground,
          zIndex: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          p: 3,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: -40,
            background: persona.aura,
            filter: 'blur(140px)',
            animation: `${bossAuraPulse} 6s ease-in-out infinite`,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'repeating-linear-gradient(120deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 8px)',
            animation: `${confettiFall} 8s linear infinite`,
            opacity: 0.4,
          }}
        />
        <Stack spacing={1} position="relative" zIndex={1} alignItems="center">
          <EmojiEvents sx={{ fontSize: 56 }} />
          <Typography variant="h4" fontWeight={800}>
            Boss defeated!
          </Typography>
          <Typography variant="body2" color="inherit" sx={{ maxWidth: 420, opacity: 0.85 }}>
            {boss.name} is out of HP. Claim your victory rewards and set a new challenge to keep the streak alive.
          </Typography>
          <Stack direction="row" spacing={2} mt={2}>
            <Box sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(255,255,255,0.18)' }}>
              <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
                Time to defeat
              </Typography>
              <Typography fontWeight={700}>{duration ? `${duration} min` : '—'}</Typography>
            </Box>
            <Box sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(255,255,255,0.18)' }}>
              <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
                Total damage dealt
              </Typography>
              <Typography fontWeight={700}>{boss.maxHp}</Typography>
            </Box>
          </Stack>
          <Button variant="contained" color="primary" onClick={onReset} sx={{ mt: 2 }}>
            Launch new battle
          </Button>
        </Stack>
      </Box>
    </Fade>
  );
};

const StudyRoomsPicker = ({ rooms, selected, onSelect }) => {
  const theme = useTheme();
  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
        <Spa color="primary" />
        <Typography variant="h6" fontWeight={700}>
          Study rooms
        </Typography>
      </Stack>
      <Grid container spacing={2}>
        {rooms.map((room) => (
          <Grid item xs={6} key={room.id}>
            <Box
              onClick={() => onSelect(room.id)}
              sx={{
                borderRadius: 3,
                p: 2,
                cursor: 'pointer',
                border:
                  selected === room.id
                    ? `2px solid ${room.palette.primary}`
                    : `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                background: room.gradient,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                transform: selected === room.id ? 'translateY(-4px)' : 'none',
                boxShadow: selected === room.id ? `0 8px 20px ${alpha(room.palette.primary, 0.25)}` : 'none',
              }}
            >
              <Typography fontWeight={700} display="flex" gap={0.5}>
                {room.accentIcon} {room.label}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                {room.description}
              </Typography>
              <Chip size="small" label={room.ambientSound} />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Card>
  );
};

const ChallengesBoard = ({ challenges, onClaim }) => {
  const theme = useTheme();
  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
        <AutoAwesome color="primary" />
        <Typography variant="h6" fontWeight={700}>
          Focus challenges
        </Typography>
      </Stack>
      <Stack spacing={2}>
        {challenges.map((challenge) => (
          <Box key={challenge.id} sx={{ borderRadius: 3, border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`, p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography fontWeight={600}>{challenge.title}</Typography>
            <Chip label={challenge.badge} color={challenge.completed ? 'success' : 'default'} />
          </Stack>
          <LinearProgress value={(challenge.progress / challenge.target) * 100} variant="determinate" sx={{ mt: 1, mb: 1 }} />
          <Typography variant="caption" color="text.secondary">
            {challenge.progress}/{challenge.target} · {challenge.period}
          </Typography>
          <Button
            disabled={!challenge.completed || challenge.claimed}
            sx={{ mt: 1 }}
            variant="contained"
            onClick={() => onClaim(challenge.id)}
          >
            {challenge.claimed ? 'Claimed' : `Claim +${challenge.rewardXp} XP`}
          </Button>
        </Box>
      ))}
    </Stack>
  </Card>
  );
};

const MoodTrackerCard = ({ entries, onLog }) => {
  const theme = useTheme();
  const [mood, setMood] = useState(MOOD_OPTIONS[0].value);
  const [note, setNote] = useState('');
  const [phase, setPhase] = useState('pre');

  const handleSubmit = () => {
    if (!note.trim()) return;
    onLog({ id: `mood-${Date.now()}`, mood, note: note.trim(), phase, timestamp: new Date().toISOString() });
    setNote('');
  };

  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
        <Whatshot color="primary" />
        <Typography variant="h6" fontWeight={700}>
          Mood tracker
        </Typography>
      </Stack>
      <Stack spacing={1.5}>
        <Tabs value={phase} onChange={(_, value) => setPhase(value)}>
          <Tab value="pre" label="Pre-study" />
          <Tab value="post" label="Post-study" />
        </Tabs>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {MOOD_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              color={mood === option.value ? 'primary' : 'default'}
              onClick={() => setMood(option.value)}
            />
          ))}
        </Stack>
        <TextField label="Add a note" value={note} onChange={(event) => setNote(event.target.value)} multiline minRows={2} />
        <Button variant="contained" onClick={handleSubmit}>
          Log mood
        </Button>
        <Divider />
        <Stack spacing={1} maxHeight={160} sx={{ overflowY: 'auto' }}>
          {entries
            .slice()
            .reverse()
            .map((entry) => (
              <Box key={entry.id} sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`, p: 1.5 }}>
                <Typography variant="body2" fontWeight={600}>
                  {MOOD_OPTIONS.find((item) => item.value === entry.mood)?.label || entry.mood}
                </Typography>
                <Typography variant="body2">{entry.note}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {entry.phase} · {dayjs(entry.timestamp).format('MMM D, h:mm A')}
                </Typography>
              </Box>
            ))}
          {entries.length === 0 && <Typography variant="body2">Log your first mood to spot patterns.</Typography>}
        </Stack>
      </Stack>
    </Card>
  );
};

const BuddyMatchmakingCard = ({ ghosts }) => {
  const theme = useTheme();
  return (
  <Card sx={{ p: 3 }}>
    <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
      <Spa color="primary" />
      <Typography variant="h6" fontWeight={700}>
        Study buddy matchmaking
      </Typography>
      <Chip label={`${ghosts.length * 8 + 24} ghosts online`} />
    </Stack>
    <Stack spacing={1.5}>
      {ghosts.map((ghost, index) => (
        <Stack
          key={`${ghost.name}-${index}`}
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{ borderRadius: 3, border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`, p: 1.5 }}
        >
          <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.15) }}>{ghost.pet}</Avatar>
          <Stack spacing={0.3}>
            <Typography fontWeight={600}>{ghost.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {ghost.status}
            </Typography>
          </Stack>
          <Chip label={`🔥 ${ghost.intensity}/10`} sx={{ marginLeft: 'auto' }} />
        </Stack>
      ))}
    </Stack>
  </Card>
  );
};

const DailyRewardCard = ({ reward, streak }) => {
  const todayKey = dayjs().format('YYYY-MM-DD');
  const rewardDate = reward ? dayjs(reward.timestamp).format('YYYY-MM-DD') : null;
  const unlockedToday = reward && rewardDate === todayKey;
  return (
    <Card sx={{ p: 3, position: 'relative', overflow: 'hidden' }}>
      <Box
        sx={{
          position: 'absolute',
          inset: 12,
          borderRadius: 4,
          background: 'linear-gradient(135deg, rgba(95,141,78,0.2), rgba(192,140,93,0.18))',
          filter: 'blur(60px)',
        }}
      />
      <Stack direction="row" spacing={1.5} alignItems="center" mb={2} position="relative" zIndex={1}>
        <Casino color="primary" />
        <Typography variant="h6" fontWeight={700}>
          Daily reward chest
        </Typography>
        <Chip label={`${streak || 0}-day streak`} />
      </Stack>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={3}
        alignItems="center"
        position="relative"
        zIndex={1}
      >
        <Box
          sx={{
            position: 'relative',
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, #fdf4dd, #f1c173)',
            animation: `${rewardGlow} 3s ease-in-out infinite`,
            display: 'grid',
            placeItems: 'center',
            textAlign: 'center',
            px: 2,
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 12,
              borderRadius: '50%',
              border: '1px dashed rgba(0,0,0,0.2)',
              animation: unlockedToday ? `${rewardSpin} 10s linear infinite` : 'none',
              opacity: unlockedToday ? 1 : 0.3,
            }}
          />
          <Typography fontWeight={700}>{unlockedToday ? reward.label : 'Chest locked'}</Typography>
          {unlockedToday && (
            <Typography variant="caption" color="text.secondary">
              +{reward.xp} XP
            </Typography>
          )}
        </Box>
        <Stack spacing={1} flex={1}>
          {unlockedToday ? (
            <>
              <Typography fontWeight={600}>Trail reward ready</Typography>
              <Typography variant="body2" color="text.secondary">
                +{reward.xp} XP · {reward.type}
                {reward.streakBoost ? ` · x${reward.streakBoost.toFixed(1)} streak bonus` : ''}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Unlocked at {dayjs(reward.timestamp).format('h:mm A')}. Come back tomorrow for another chest.
              </Typography>
            </>
          ) : (
            <>
              <Typography fontWeight={600}>Log in tomorrow to open a new reward chest.</Typography>
              <Typography variant="body2" color="text.secondary">
                Keep your streak alive for rarer cosmetics, pet skins, and environment unlocks. Rewards drop at first login each day.
              </Typography>
              {reward && (
                <Typography variant="caption" color="text.secondary">
                  Last reward: {reward.label} (+{reward.xp} XP) on {dayjs(reward.timestamp).format('MMM D')}
                </Typography>
              )}
            </>
          )}
        </Stack>
      </Stack>
    </Card>
  );
};

const DailyRewardCelebration = ({ reward, streak, onClose }) => (
  <Fade in>
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        bgcolor: 'rgba(4,6,8,0.92)',
        zIndex: 1300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(140deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 2px, transparent 2px, transparent 8px)',
          animation: `${confettiFall} 10s linear infinite`,
          opacity: 0.35,
        }}
      />
      <Card
        sx={{
          position: 'relative',
          zIndex: 2,
          p: 4,
          maxWidth: 420,
          textAlign: 'center',
          borderRadius: 4,
        }}
      >
        <EmojiEvents color="warning" sx={{ fontSize: 54, mb: 1 }} />
        <Typography variant="h5" fontWeight={800}>
          Daily Trail Reward
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          {`You're on a ${streak}-day streak. Today's drop:`}
        </Typography>
        <Box
          sx={{
            width: 180,
            height: 180,
            borderRadius: '50%',
            mx: 'auto',
            mb: 2,
            background: 'radial-gradient(circle at 30% 30%, #fff6d9, #f1b862)',
            animation: `${rewardSpin} 12s linear infinite`,
            boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
            display: 'grid',
            placeItems: 'center',
            px: 2,
          }}
        >
          <Typography fontWeight={700}>{reward?.label || 'Mystery reward'}</Typography>
        </Box>
        {reward && (
          <Typography variant="body2" color="text.secondary" mb={3}>
            +{reward.xp} XP · {reward.type}
            {reward.streakBoost ? ` · x${reward.streakBoost.toFixed(1)} streak bonus` : ''}
          </Typography>
        )}
        <Button variant="contained" onClick={onClose}>
          Collect reward
        </Button>
      </Card>
    </Box>
  </Fade>
);

const DungeonCrawlerCard = ({ dungeon }) => {
  const theme = useTheme();
  const cells = Array.from({ length: dungeon.totalRooms }).map((_, index) => index < dungeon.pathIndex);
  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
        <Forest color="primary" />
        <Typography variant="h6" fontWeight={700}>
          Dungeon crawler
        </Typography>
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gap: 0.7,
        }}
      >
        {cells.map((visited, index) => (
          <Tooltip key={`cell-${index}`} title={visited ? 'Cleared room' : 'Next objective'}>
            <Box
              sx={{
                height: 20,
                borderRadius: 1,
                background: visited ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.1),
              }}
            />
          </Tooltip>
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary">
        {dungeon.totalRooms - dungeon.pathIndex} rooms until next treasure chest
      </Typography>
    </Card>
  );
};

const StatsDashboardCard = ({ momentum, breakdown, study, overview }) => (
  <Card sx={{ p: 3 }}>
    <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
      <TimerIcon color="primary" />
      <Typography variant="h6" fontWeight={700}>
        Study stats dashboard
      </Typography>
    </Stack>
    <Grid container spacing={2}>
      <Grid item xs={12} md={7}>
        <Typography variant="subtitle2" color="text.secondary">
          Momentum this week
        </Typography>
        {momentum.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={momentum} margin={{ top: 10, left: 0, right: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="momentum" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#5f8d4e" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#5f8d4e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <RechartsTooltip />
              <Area type="monotone" dataKey="minutes" stroke="#5f8d4e" fillOpacity={1} fill="url(#momentum)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <Typography variant="body2">Log your first session to unlock insights.</Typography>
        )}
      </Grid>
      <Grid item xs={12} md={5}>
        <Typography variant="subtitle2" color="text.secondary">
          Favorite session types
        </Typography>
        {breakdown.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={breakdown} dataKey="value" nameKey="name" outerRadius={70}>
                {breakdown.map((entry, index) => (
                  <Cell key={`cell-${entry.name}`} fill={['#5f8d4e', '#c08c5d', '#8bb8c1', '#f4c095'][index % 4]} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <Typography variant="body2">Recent sessions will color this pie.</Typography>
        )}
      </Grid>
    </Grid>
    <Divider sx={{ my: 2 }} />
    <Stack direction="row" spacing={2} flexWrap="wrap">
      <Chip label={`Weekly sessions: ${study?.weekly_sessions || 0}`} />
      <Chip label={`Total sessions: ${study?.total_sessions || 0}`} />
      <Chip label={`Flashcards created: ${overview.flashcards_created}`} />
    </Stack>
  </Card>
);

const RitualBuilderCard = ({ rituals, toggleStep, addStep }) => {
  const [input, setInput] = useState('');
  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
        <Spa color="primary" />
        <Typography variant="h6" fontWeight={700}>
          Ritual builder
        </Typography>
      </Stack>
      <Stack spacing={1.5}>
        {rituals.map((ritual) => (
          <Chip
            key={ritual.id}
            icon={<CheckCircle color={ritual.done ? 'success' : 'disabled'} />}
            label={ritual.label}
            color={ritual.done ? 'success' : 'default'}
            onClick={() => toggleStep(ritual.id)}
          />
        ))}
        <Stack direction="row" spacing={1}>
          <TextField value={input} onChange={(event) => setInput(event.target.value)} label="Add ritual step" fullWidth />
          <Button
            variant="contained"
            onClick={() => {
              addStep(input);
              setInput('');
            }}
          >
            Add
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
};

const TimeCapsuleCard = ({ capsules, addCapsule, openCapsule }) => {
  const theme = useTheme();
  const [message, setMessage] = useState('');
  const [unlockAt, setUnlockAt] = useState(dayjs().add(1, 'day').format('YYYY-MM-DDTHH:mm'));

  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
        <WaterDrop color="primary" />
        <Typography variant="h6" fontWeight={700}>
          Time capsule
        </Typography>
      </Stack>
      <Stack spacing={1.5}>
        <TextField label="Message to future you" value={message} onChange={(event) => setMessage(event.target.value)} multiline minRows={2} />
        <TextField
          label="Unlocks at"
          type="datetime-local"
          value={unlockAt}
          onChange={(event) => setUnlockAt(event.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <Button
          variant="contained"
          onClick={() => {
            addCapsule(message, unlockAt);
            setMessage('');
          }}
        >
          Plant capsule
        </Button>
        <Divider />
        <Stack spacing={1} maxHeight={160} sx={{ overflowY: 'auto' }}>
          {capsules.map((capsule) => {
            const unlocked = new Date(capsule.unlockAt) <= new Date();
            return (
              <Box key={capsule.id} sx={{ borderRadius: 3, border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`, p: 1.5 }}>
                <Typography variant="body2">{capsule.message}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Unlocks {dayjs(capsule.unlockAt).format('MMM D, h:mm A')}
                </Typography>
                {unlocked && !capsule.opened && (
                  <Button size="small" sx={{ mt: 1 }} onClick={() => openCapsule(capsule.id)}>
                    Open capsule
                  </Button>
                )}
              </Box>
            );
          })}
          {capsules.length === 0 && <Typography variant="body2">Write to your future self to unlock later.</Typography>}
        </Stack>
      </Stack>
    </Card>
  );
};

export default DashboardPage;
