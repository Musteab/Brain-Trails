/**
 * XPToast - Shows XP earned notification
 */
import React from 'react';
import { Snackbar, Alert, Box, Typography, LinearProgress } from '@mui/material';
import { EmojiEvents as TrophyIcon, LocalFireDepartment as FireIcon } from '@mui/icons-material';

export default function XPToast({ open, xp, streak, dailyGoalMet, onClose }) {
  if (!open) return null;

  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        severity="success"
        variant="filled"
        icon={<TrophyIcon />}
        onClose={onClose}
        sx={{
          minWidth: 200,
          '& .MuiAlert-message': { width: '100%' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            +{xp} XP
          </Typography>
          {streak > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <FireIcon fontSize="small" sx={{ color: 'orange' }} />
              <Typography variant="caption">{streak} day streak</Typography>
            </Box>
          )}
        </Box>
        {dailyGoalMet && (
          <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
            🎉 Daily goal achieved!
          </Typography>
        )}
      </Alert>
    </Snackbar>
  );
}
