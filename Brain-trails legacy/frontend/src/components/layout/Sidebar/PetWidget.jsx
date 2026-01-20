/**
 * PetWidget - Study pet display in sidebar
 */
import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Tooltip,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

const moodMessages = {
  happy: 'Ready to study!',
  ecstatic: 'On fire today!',
  excited: 'Let\'s go!',
  content: 'Feeling good',
  sleepy: 'Miss you...',
  hungry: 'Feed me knowledge!',
  sad: 'Let\'s study together',
};

const moodEmojis = {
  happy: '😊',
  ecstatic: '🤩',
  excited: '⚡',
  content: '😌',
  sleepy: '😴',
  hungry: '🥺',
  sad: '😢',
};

export default function PetWidget({ pet, expanded = true }) {
  const theme = useTheme();
  
  // Fallback for when pet data is not available
  const {
    emoji = '🐱',
    name = 'Pet',
    mood = 'happy',
    level = 1,
    xp_percent = 0,
  } = pet || {};
  
  const moodMessage = moodMessages[mood] || 'Ready to study!';
  const moodEmoji = moodEmojis[mood] || '';
  
  if (!expanded) {
    // Collapsed view - just the pet emoji
    return (
      <Tooltip
        title={
          <Box textAlign="center">
            <Typography variant="body2" fontWeight={600}>{name}</Typography>
            <Typography variant="caption">{moodMessage}</Typography>
          </Box>
        }
        placement="right"
        arrow
      >
        <Box
          sx={{
            textAlign: 'center',
            py: 2,
            cursor: 'pointer',
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          }}
        >
          <Typography variant="h4" sx={{ lineHeight: 1 }}>
            {emoji}
          </Typography>
        </Box>
      </Tooltip>
    );
  }
  
  return (
    <Box
      p={2}
      borderTop={`1px solid ${alpha(theme.palette.divider, 0.08)}`}
      sx={{ textAlign: 'center' }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          fontSize: '0.65rem',
          display: 'block',
          mb: 1,
        }}
      >
        Study Pet
      </Typography>
      
      {/* Pet Emoji */}
      <Box
        sx={{
          position: 'relative',
          display: 'inline-block',
          mb: 1,
        }}
      >
        <Typography
          variant="h2"
          sx={{
            lineHeight: 1,
            filter: mood === 'sleepy' ? 'grayscale(0.3)' : 'none',
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'scale(1.1)',
            },
          }}
        >
          {emoji}
        </Typography>
        {/* Mood indicator */}
        {moodEmoji && (
          <Typography
            component="span"
            sx={{
              position: 'absolute',
              bottom: -4,
              right: -8,
              fontSize: '1rem',
            }}
          >
            {moodEmoji}
          </Typography>
        )}
      </Box>
      
      {/* Pet Name */}
      <Typography variant="body2" fontWeight={600}>
        {name}
      </Typography>
      
      {/* Mood Message */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          display: 'block',
          fontStyle: 'italic',
          mb: 1,
        }}
      >
        *{moodMessage}*
      </Typography>
      
      {/* Level and XP */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          mb: 0.5,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Level {level}
        </Typography>
      </Box>
      
      <LinearProgress
        variant="determinate"
        value={xp_percent}
        sx={{
          height: 4,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          '& .MuiLinearProgress-bar': {
            borderRadius: 2,
          },
        }}
      />
    </Box>
  );
}
