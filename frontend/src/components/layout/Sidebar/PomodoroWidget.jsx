/**
 * PomodoroWidget - Active timer display in sidebar
 */
import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useTimer } from '../../../context/TimerContext';

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatTimeShort(seconds) {
  const mins = Math.floor(seconds / 60);
  return `${mins}m`;
}

export default function PomodoroWidget({ expanded = true }) {
  const theme = useTheme();
  const { 
    isRunning, 
    timeLeft, 
    mode,
    currentDuration,
    pauseTimer,
    startTimer,
    resetTimer,
  } = useTimer();
  
  // Don't show if timer hasn't been started (timeLeft equals full duration and not running)
  const hasStarted = isRunning || timeLeft < currentDuration;
  if (!hasStarted) {
    return null;
  }
  
  const isPaused = !isRunning && timeLeft > 0 && timeLeft < currentDuration;
  const modeLabel = mode === 'focus' ? 'Focus Time' : mode === 'short' ? 'Short Break' : 'Long Break';
  const modeColor = mode === 'focus' ? 'error' : 'success';
  
  if (!expanded) {
    // Collapsed view - compact timer
    return (
      <Tooltip title={`${modeLabel} - ${formatTime(timeLeft)}`} placement="right" arrow>
        <Box
          sx={{
            textAlign: 'center',
            py: 1.5,
            mx: 0.75,
            borderRadius: 2,
            bgcolor: alpha(theme.palette[modeColor].main, 0.15),
          }}
        >
          <Typography
            variant="body2"
            fontWeight={700}
            sx={{ color: `${modeColor}.main` }}
          >
            {formatTimeShort(timeLeft)}
          </Typography>
        </Box>
      </Tooltip>
    );
  }
  
  return (
    <Box
      sx={{
        p: 2,
        mx: 1.5,
        mb: 1.5,
        borderRadius: 2,
        bgcolor: alpha(theme.palette[modeColor].main, 0.12),
        border: `1px solid ${alpha(theme.palette[modeColor].main, 0.25)}`,
      }}
    >
      {/* Timer Display */}
      <Typography
        variant="h4"
        fontWeight={700}
        textAlign="center"
        sx={{ color: `${modeColor}.main` }}
      >
        {formatTime(timeLeft)}
      </Typography>
      
      {/* Mode Label */}
      <Typography
        variant="caption"
        textAlign="center"
        display="block"
        color="text.secondary"
        sx={{ mb: 1.5 }}
      >
        {modeLabel}
        {isPaused && ' (Paused)'}
      </Typography>
      
      {/* Controls */}
      <Box display="flex" justifyContent="center" gap={1}>
        {isPaused ? (
          <IconButton
            size="small"
            onClick={startTimer}
            sx={{
              bgcolor: alpha(theme.palette[modeColor].main, 0.15),
              color: `${modeColor}.main`,
              '&:hover': {
                bgcolor: alpha(theme.palette[modeColor].main, 0.25),
              },
            }}
          >
            <PlayIcon fontSize="small" />
          </IconButton>
        ) : (
          <IconButton
            size="small"
            onClick={pauseTimer}
            sx={{
              bgcolor: alpha(theme.palette[modeColor].main, 0.15),
              color: `${modeColor}.main`,
              '&:hover': {
                bgcolor: alpha(theme.palette[modeColor].main, 0.25),
              },
            }}
          >
            <PauseIcon fontSize="small" />
          </IconButton>
        )}
        
        <IconButton
          size="small"
          onClick={resetTimer}
          sx={{
            bgcolor: alpha(theme.palette.text.primary, 0.08),
            color: 'text.secondary',
            '&:hover': {
              bgcolor: alpha(theme.palette.text.primary, 0.12),
            },
          }}
        >
          <StopIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
