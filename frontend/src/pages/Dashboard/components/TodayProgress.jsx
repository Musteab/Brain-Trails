/**
 * TodayProgress - Daily goal and current progress
 * Priority #2 component - Shows XP, streak, and goal progress
 */
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Typography,
  Stack,
  useTheme,
} from '@mui/material';
import {
  LocalFireDepartment as FireIcon,
  TrendingUp as XPIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

export default function TodayProgress({
  minutesToday = 0,
  goalMinutes = 120,
  xpToday = 0,
  streak = 0,
  level = 1,
  xp = 0,
  xpForNextLevel = 100,
}) {
  const theme = useTheme();
  const goalProgress = Math.min((minutesToday / goalMinutes) * 100, 100);
  const levelProgress = (xp / xpForNextLevel) * 100;
  const goalComplete = minutesToday >= goalMinutes;

  return (
    <Card elevation={0} sx={{ bgcolor: 'background.paper', height: '100%' }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={700}>
            Today's Progress
          </Typography>
          {streak > 0 && (
            <Chip
              icon={<FireIcon sx={{ fontSize: 16 }} />}
              label={`${streak} day streak`}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.warning.main, 0.15),
                color: theme.palette.warning.dark,
                fontWeight: 600,
              }}
            />
          )}
        </Box>

        {/* Daily Goal */}
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Typography variant="body2" color="text.secondary">
              Daily Goal
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {minutesToday} / {goalMinutes} min
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={goalProgress}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                bgcolor: goalComplete 
                  ? theme.palette.success.main 
                  : theme.palette.primary.main,
              },
            }}
          />
          {goalComplete && (
            <Typography 
              variant="caption" 
              color="success.main" 
              fontWeight={600}
              sx={{ display: 'block', mt: 0.5 }}
            >
              🎉 Goal complete!
            </Typography>
          )}
        </Box>

        {/* Level & XP */}
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <XPIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                Level {level}
              </Typography>
            </Stack>
            <Typography variant="body2" fontWeight={600}>
              {xp} / {xpForNextLevel} XP
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={levelProgress}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: alpha(theme.palette.secondary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                bgcolor: theme.palette.secondary.main,
              },
            }}
          />
        </Box>

        {/* XP Today */}
        {xpToday > 0 && (
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ display: 'block', mt: 1.5, textAlign: 'right' }}
          >
            +{xpToday} XP earned today
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
