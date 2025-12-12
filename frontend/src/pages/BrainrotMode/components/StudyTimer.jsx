/**
 * Study Timer Component for Brainrot Mode
 * Pomodoro timer overlay
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  SkipNext as SkipIcon,
  LocalFireDepartment as StreakIcon,
} from '@mui/icons-material';

const TIMER_MODES = {
  focus: { duration: 25, label: 'Focus', color: 'primary' },
  shortBreak: { duration: 5, label: 'Short Break', color: 'success' },
  longBreak: { duration: 15, label: 'Long Break', color: 'info' },
};

export default function StudyTimer({
  onSessionComplete,
  pomodoroSettings = {},
  compact = false,
}) {
  const [mode, setMode] = useState('focus');
  const [timeLeft, setTimeLeft] = useState(
    (pomodoroSettings.pomodoro_duration || 25) * 60
  );
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);

  const config = {
    focus: { 
      duration: pomodoroSettings.pomodoro_duration || 25, 
      label: 'Focus', 
      color: 'primary' 
    },
    shortBreak: { 
      duration: pomodoroSettings.short_break || 5, 
      label: 'Break', 
      color: 'success' 
    },
    longBreak: { 
      duration: pomodoroSettings.long_break || 15, 
      label: 'Long Break', 
      color: 'info' 
    },
  };

  const currentConfig = config[mode];
  const totalSeconds = currentConfig.duration * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  // Timer logic
  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    
    if (mode === 'focus') {
      const newCount = completedPomodoros + 1;
      setCompletedPomodoros(newCount);
      onSessionComplete?.(currentConfig.duration);
      
      // Every 4 pomodoros, take a long break
      if (newCount % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(config.longBreak.duration * 60);
      } else {
        setMode('shortBreak');
        setTimeLeft(config.shortBreak.duration * 60);
      }
      
      // Auto-start break if enabled
      if (pomodoroSettings.auto_start_breaks) {
        setIsRunning(true);
      }
    } else {
      // Break is over, back to focus
      setMode('focus');
      setTimeLeft(config.focus.duration * 60);
    }
    
    // Play sound
    if (pomodoroSettings.play_sound_on_complete !== false) {
      playCompletionSound();
    }
  }, [mode, completedPomodoros, pomodoroSettings, onSessionComplete]);

  const playCompletionSound = () => {
    // Simple beep using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      oscillator.start();
      setTimeout(() => oscillator.stop(), 200);
    } catch (e) {
      console.log('Audio not supported');
    }
  };

  const handlePlayPause = () => {
    setIsRunning(!isRunning);
  };

  const handleStop = () => {
    setIsRunning(false);
    setMode('focus');
    setTimeLeft(config.focus.duration * 60);
  };

  const handleSkip = () => {
    setIsRunning(false);
    if (mode === 'focus') {
      setMode('shortBreak');
      setTimeLeft(config.shortBreak.duration * 60);
    } else {
      setMode('focus');
      setTimeLeft(config.focus.duration * 60);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (compact) {
    return (
      <Paper
        sx={{
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <CircularProgress
            variant="determinate"
            value={progress}
            size={40}
            color={currentConfig.color}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" fontWeight="bold">
              {Math.floor(timeLeft / 60)}
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" fontWeight="medium">
          {formatTime(timeLeft)}
        </Typography>
        <IconButton size="small" onClick={handlePlayPause}>
          {isRunning ? <PauseIcon /> : <PlayIcon />}
        </IconButton>
        <Chip
          icon={<StreakIcon />}
          label={completedPomodoros}
          size="small"
          color="error"
        />
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        p: 3,
        textAlign: 'center',
        bgcolor: 'background.paper',
      }}
    >
      {/* Mode Indicator */}
      <Chip
        label={currentConfig.label}
        color={currentConfig.color}
        sx={{ mb: 2 }}
      />

      {/* Timer Display */}
      <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
        <CircularProgress
          variant="determinate"
          value={progress}
          size={150}
          thickness={4}
          color={currentConfig.color}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h3" fontWeight="bold">
            {formatTime(timeLeft)}
          </Typography>
        </Box>
      </Box>

      {/* Controls */}
      <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
        <IconButton onClick={handleStop} color="error">
          <StopIcon />
        </IconButton>
        <Button
          variant="contained"
          size="large"
          onClick={handlePlayPause}
          startIcon={isRunning ? <PauseIcon /> : <PlayIcon />}
          color={currentConfig.color}
          sx={{ px: 4 }}
        >
          {isRunning ? 'Pause' : 'Start'}
        </Button>
        <IconButton onClick={handleSkip}>
          <SkipIcon />
        </IconButton>
      </Stack>

      {/* Pomodoro Counter */}
      <Stack direction="row" spacing={0.5} justifyContent="center">
        {[1, 2, 3, 4].map((num) => (
          <Box
            key={num}
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: num <= completedPomodoros % 4 || (completedPomodoros % 4 === 0 && completedPomodoros > 0 && num === 4)
                ? 'primary.main'
                : 'action.disabled',
            }}
          />
        ))}
        <Typography variant="caption" sx={{ ml: 1 }}>
          {completedPomodoros} 🍅 completed
        </Typography>
      </Stack>
    </Paper>
  );
}
