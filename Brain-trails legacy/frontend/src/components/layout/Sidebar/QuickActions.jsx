/**
 * QuickActions - Quick action buttons in sidebar
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Timer as TimerIcon,
  Psychology as BrainIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useTimer } from '../../../context/TimerContext';

export default function QuickActions({ expanded = true }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { startTimer, isRunning } = useTimer();
  
  const handleStartPomodoro = () => {
    if (!isRunning) {
      startTimer?.();
    }
  };
  
  const handleBrainrotMode = () => {
    navigate('/brainrot');
  };
  
  if (!expanded) {
    // Collapsed view - just icon buttons
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          py: 1.5,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        }}
      >
        <Tooltip title={isRunning ? 'Timer Running' : 'Start Pomodoro'} placement="right" arrow>
          <IconButton
            onClick={handleStartPomodoro}
            disabled={isRunning}
            size="small"
            sx={{
              bgcolor: isRunning
                ? alpha(theme.palette.success.main, 0.15)
                : alpha(theme.palette.error.main, 0.12),
              color: isRunning ? 'success.main' : 'error.main',
              '&:hover': {
                bgcolor: isRunning
                  ? alpha(theme.palette.success.main, 0.2)
                  : alpha(theme.palette.error.main, 0.18),
              },
            }}
          >
            <TimerIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Brainrot Mode" placement="right" arrow>
          <IconButton
            onClick={handleBrainrotMode}
            size="small"
            sx={{
              bgcolor: alpha(theme.palette.secondary.main, 0.12),
              color: 'secondary.main',
              '&:hover': {
                bgcolor: alpha(theme.palette.secondary.main, 0.18),
              },
            }}
          >
            <BrainIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }
  
  return (
    <Box p={2} borderTop={`1px solid ${alpha(theme.palette.divider, 0.08)}`}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          fontSize: '0.65rem',
          display: 'block',
          mb: 1.5,
        }}
      >
        Quick Actions
      </Typography>
      
      <Button
        fullWidth
        variant="contained"
        startIcon={<TimerIcon />}
        onClick={handleStartPomodoro}
        disabled={isRunning}
        sx={{
          mb: 1,
          bgcolor: isRunning ? 'success.main' : 'error.main',
          color: 'white',
          fontWeight: 600,
          borderRadius: 2,
          py: 1,
          '&:hover': {
            bgcolor: isRunning ? 'success.dark' : 'error.dark',
          },
          '&:disabled': {
            bgcolor: alpha(theme.palette.success.main, 0.5),
            color: 'white',
          },
        }}
      >
        {isRunning ? 'Timer Active' : 'Start Pomodoro'}
      </Button>
      
      <Button
        fullWidth
        variant="outlined"
        startIcon={<BrainIcon />}
        onClick={handleBrainrotMode}
        sx={{
          fontWeight: 600,
          borderRadius: 2,
          py: 1,
          borderColor: alpha(theme.palette.secondary.main, 0.5),
          color: 'secondary.main',
          '&:hover': {
            borderColor: 'secondary.main',
            bgcolor: alpha(theme.palette.secondary.main, 0.08),
          },
        }}
      >
        Brainrot Mode
      </Button>
    </Box>
  );
}
