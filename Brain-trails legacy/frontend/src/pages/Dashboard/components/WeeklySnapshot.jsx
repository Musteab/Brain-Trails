/**
 * WeeklySnapshot - High-level weekly summary
 */
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  useTheme,
} from '@mui/material';
import {
  Timer as TimerIcon,
  TrendingUp as XPIcon,
  Description as NotesIcon,
  Quiz as QuizIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

export default function WeeklySnapshot({
  minutes = 0,
  xp = 0,
  notesCreated = 0,
  quizzesCompleted = 0,
  onViewAnalytics,
}) {
  const theme = useTheme();

  const stats = [
    {
      icon: TimerIcon,
      value: minutes,
      label: 'minutes studied',
      color: theme.palette.primary.main,
    },
    {
      icon: XPIcon,
      value: `+${xp}`,
      label: 'XP earned',
      color: theme.palette.secondary.main,
    },
    {
      icon: NotesIcon,
      value: notesCreated,
      label: 'notes created',
      color: theme.palette.info.main,
    },
    {
      icon: QuizIcon,
      value: quizzesCompleted,
      label: 'quizzes completed',
      color: theme.palette.success.main,
    },
  ];

  return (
    <Card elevation={0} sx={{ bgcolor: 'background.paper' }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={700}>
            This Week
          </Typography>
          <Button
            size="small"
            endIcon={<ArrowIcon />}
            onClick={onViewAnalytics}
            sx={{ textTransform: 'none' }}
          >
            View details
          </Button>
        </Box>

        <Grid container spacing={2}>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Grid item xs={6} sm={3} key={index}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(stat.color, 0.08),
                    textAlign: 'center',
                  }}
                >
                  <Icon sx={{ color: stat.color, fontSize: 24, mb: 0.5 }} />
                  <Typography variant="h5" fontWeight={700} color={stat.color}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
}
