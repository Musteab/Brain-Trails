/**
 * Progress Widget - Clean gamification display
 *
 * Shows: Level, Streak, Today's Goals, Pet (core loops only)
 */
import React from 'react';
import {
  Box,
  Card,
  Chip,
  LinearProgress,
  Stack,
  Typography,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Button,
} from '@mui/material';
import {
  LocalFireDepartment,
  EmojiEvents,
  CheckCircle,
  RadioButtonUnchecked,
  Pets,
  CardGiftcard,
} from '@mui/icons-material';
import { useGamification } from '../../context/NewGamificationContext';

// Pet sprites by stage
const PET_SPRITES = {
  1: '🌱',
  2: '🌿',
  3: '🌳',
  4: '🌲',
};

// Pet mood descriptions
const MOOD_LABELS = {
  chill: 'Relaxing',
  proud: 'Happy',
  energized: 'Excited',
  radiant: 'Glowing',
  mythic: 'Legendary',
};

export function ProgressWidget() {
  const theme = useTheme();
  const {
    level,
    levelInfo,
    streak,
    bestStreak,
    todayMinutes,
    dailyGoalMinutes,
    dailyGoals,
    petStage,
    petMood,
    claimGoalReward,
  } = useGamification();

  const xpProgress = levelInfo.xpToNext > 0 ? (levelInfo.xpInLevel / levelInfo.xpToNext) * 100 : 0;
  const minuteProgress = dailyGoalMinutes > 0 ? Math.min((todayMinutes / dailyGoalMinutes) * 100, 100) : 0;

  return (
    <Card sx={{ p: 2.5 }}>
      <Stack spacing={2.5}>
        {/* Level & XP */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.primary.main, 0.15),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <EmojiEvents color="primary" />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="baseline" spacing={1}>
              <Typography variant="h6" fontWeight={700}>
                Level {level}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {levelInfo.xpInLevel} / {levelInfo.xpToNext} XP
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={xpProgress}
              sx={{ height: 6, borderRadius: 3, mt: 0.5 }}
            />
          </Box>
        </Stack>

        {/* Streak */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.warning.main, 0.15),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LocalFireDepartment color="warning" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {streak} day streak
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Best: {bestStreak} days
            </Typography>
          </Box>
        </Stack>

        {/* Today's Minutes */}
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Typography variant="body2" fontWeight={600}>
              Today's study time
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {todayMinutes} / {dailyGoalMinutes} min
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={minuteProgress}
            color={minuteProgress >= 100 ? 'success' : 'primary'}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Daily Goals */}
        <Box>
          <Typography variant="body2" fontWeight={600} mb={1}>
            Daily Goals
          </Typography>
          <Stack spacing={1}>
            {dailyGoals.map((goal) => (
              <Stack
                key={goal.id}
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.text.primary, 0.03),
                  border: `1px solid ${alpha(theme.palette.text.primary, 0.06)}`,
                }}
              >
                {goal.completed ? (
                  <CheckCircle color="success" fontSize="small" />
                ) : (
                  <RadioButtonUnchecked color="disabled" fontSize="small" />
                )}
                <Typography variant="body2" sx={{ flex: 1, textDecoration: goal.claimed ? 'line-through' : 'none' }}>
                  {goal.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {goal.progress}/{goal.target}
                </Typography>
                {goal.completed && !goal.claimed && (
                  <Button size="small" variant="outlined" onClick={() => claimGoalReward(goal.id)}>
                    +{goal.xp} XP
                  </Button>
                )}
              </Stack>
            ))}
          </Stack>
        </Box>

        {/* Pet */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.success.main, 0.08),
            border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
          }}
        >
          <Typography sx={{ fontSize: 32 }}>{PET_SPRITES[petStage] || '🌱'}</Typography>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              Study Companion
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Stage {petStage} · {MOOD_LABELS[petMood] || 'Chilling'}
            </Typography>
          </Box>
        </Stack>
      </Stack>
    </Card>
  );
}

export function DailyChestWidget() {
  const theme = useTheme();
  const { showRewardChest, pendingReward, claimDailyReward, dismissRewardChest, lastReward } = useGamification();

  if (!showRewardChest && !pendingReward) {
    return (
      <Card sx={{ p: 2, bgcolor: alpha(theme.palette.warning.main, 0.08) }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <CardGiftcard color="warning" />
          <Box>
            <Typography variant="body2" fontWeight={600}>
              Daily Chest
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {lastReward ? `Last: ${lastReward.label}` : 'Come back tomorrow!'}
            </Typography>
          </Box>
        </Stack>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        p: 2,
        background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.15)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
        border: `2px solid ${alpha(theme.palette.warning.main, 0.3)}`,
      }}
    >
      <Stack spacing={2} alignItems="center" textAlign="center">
        <Typography sx={{ fontSize: 48 }}>🎁</Typography>
        <Typography variant="h6" fontWeight={700}>
          Daily Reward!
        </Typography>
        {pendingReward && (
          <>
            <Chip label={pendingReward.label} color="warning" />
            <Typography variant="body2" color="text.secondary">
              +{pendingReward.xp} XP
              {pendingReward.streakBonus > 1 && ` (${pendingReward.streakBonus.toFixed(1)}x streak bonus)`}
            </Typography>
            <Button variant="contained" color="warning" onClick={claimDailyReward}>
              Claim Reward
            </Button>
          </>
        )}
      </Stack>
    </Card>
  );
}

export default ProgressWidget;
