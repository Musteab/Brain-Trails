import { Box, CircularProgress, IconButton, Stack, Typography } from '@mui/material';
import { Close, Pause, PlayArrow, Refresh } from '@mui/icons-material';

import { useTimer } from '../../context/TimerContext';

const formatClock = (seconds) => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${secs}`;
};

const TimerToast = () => {
  const {
    timeLeft,
    mode,
    isRunning,
    toastVisible,
    startTimer,
    pauseTimer,
    resetTimer,
    hideToast,
    showToast,
    timePercent,
  } = useTimer();

  if (!toastVisible) {
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          bgcolor: 'rgba(0,0,0,0.7)',
          color: '#fff',
          borderRadius: 999,
          px: 2,
          py: 1,
          fontSize: 12,
          cursor: 'pointer',
          zIndex: 1100,
          transition: 'transform 0.2s ease, opacity 0.2s ease',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        }}
        onClick={showToast}
      >
        Show timer
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        bgcolor: 'background.paper',
        borderRadius: 3,
        boxShadow: '0 20px 45px rgba(0,0,0,0.25)',
        p: 2,
        width: 240,
        zIndex: 1100,
        transition: 'transform 0.2s ease',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack spacing={0.3}>
          <Typography variant="caption" color="text.secondary">
            {mode === 'focus' ? 'Focus session' : mode === 'short' ? 'Short break' : 'Long break'}
          </Typography>
          <Typography variant="h6">{formatClock(timeLeft)}</Typography>
        </Stack>
        <IconButton size="small" onClick={hideToast}>
          <Close fontSize="small" />
        </IconButton>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center" mt={1}>
        <Box position="relative" width={48} height={48}>
          <CircularProgress
            variant="determinate"
            value={Math.min(100, Math.max(0, timePercent * 100))}
            size={48}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
            }}
          >
            {Math.round(timePercent * 100)}%
          </Box>
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton size="small" onClick={isRunning ? pauseTimer : startTimer}>
            {isRunning ? <Pause /> : <PlayArrow />}
          </IconButton>
          <IconButton size="small" onClick={resetTimer}>
            <Refresh />
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  );
};

export default TimerToast;
