/**
 * ProgressSection - Today's progress display for sidebar
 */
import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

export default function ProgressSection({ minutesToday, goalMinutes, expanded = true }) {
  const theme = useTheme();
  const progress = Math.min((minutesToday / Math.max(goalMinutes, 1)) * 100, 100);
  
  if (!expanded) {
    // Collapsed view - just a small progress indicator
    return (
      <Box px={1} py={1.5}>
        <Box
          sx={{
            width: '100%',
            height: 4,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.15),
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              width: `${progress}%`,
              height: '100%',
              bgcolor: 'primary.main',
              transition: 'width 0.3s ease',
            }}
          />
        </Box>
      </Box>
    );
  }
  
  return (
    <Box p={2} borderBottom={`1px solid ${alpha(theme.palette.divider, 0.08)}`}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          fontSize: '0.65rem',
        }}
      >
        Today's Progress
      </Typography>
      
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 8,
          borderRadius: 4,
          my: 1.25,
          bgcolor: alpha(theme.palette.primary.main, 0.12),
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            bgcolor: progress >= 100 ? 'success.main' : 'primary.main',
          },
        }}
      />
      
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" fontWeight={600}>
          {minutesToday} / {goalMinutes} min
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: progress >= 100 ? 'success.main' : 'text.secondary',
            fontWeight: progress >= 100 ? 600 : 400,
          }}
        >
          {progress >= 100 ? '✓ Goal met!' : `${Math.round(progress)}%`}
        </Typography>
      </Box>
    </Box>
  );
}
