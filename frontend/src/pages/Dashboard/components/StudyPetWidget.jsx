/**
 * StudyPetWidget - Minimal pet corner widget
 * Cute but not the focus - just a nice touch
 */
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  useTheme,
} from '@mui/material';
import { Pets as PetsIcon, Close as CloseIcon } from '@mui/icons-material';
import { alpha, keyframes } from '@mui/material/styles';

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
`;

const PET_MOODS = {
  happy: { emoji: '😊', message: 'Ready to study!', color: 'success' },
  excited: { emoji: '🤩', message: 'On fire! Keep going!', color: 'warning' },
  sleepy: { emoji: '😴', message: 'Miss you... come study!', color: 'info' },
  hungry: { emoji: '🥺', message: 'Feed me with knowledge!', color: 'error' },
};

export default function StudyPetWidget({
  mood = 'happy',
  petName = 'Study Buddy',
  message,
  streak = 0,
}) {
  const theme = useTheme();
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  const moodConfig = PET_MOODS[mood] || PET_MOODS.happy;
  const displayMessage = message || moodConfig.message;

  return (
    <>
      <Card 
        elevation={0} 
        sx={{ 
          bgcolor: alpha(theme.palette[moodConfig.color].main, 0.08),
          border: `1px solid ${alpha(theme.palette[moodConfig.color].main, 0.2)}`,
          cursor: 'pointer',
          transition: 'transform 0.2s ease',
          '&:hover': {
            transform: 'scale(1.02)',
          },
        }}
        onClick={() => setDetailsOpen(true)}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box
              sx={{
                fontSize: 40,
                animation: mood === 'excited' ? `${bounce} 0.5s ease infinite` : 'none',
              }}
            >
              {moodConfig.emoji}
            </Box>
            <Box flex={1}>
              <Typography variant="subtitle2" fontWeight={700}>
                {petName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {displayMessage}
              </Typography>
            </Box>
            {streak > 0 && (
              <Typography variant="caption" color="warning.main" fontWeight={600}>
                🔥 {streak}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Pet Details Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <PetsIcon />
            {petName}
          </Box>
          <IconButton size="small" onClick={() => setDetailsOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box textAlign="center" py={2}>
            <Typography sx={{ fontSize: 64, mb: 2 }}>
              {moodConfig.emoji}
            </Typography>
            <Typography variant="h6" gutterBottom>
              Mood: {mood.charAt(0).toUpperCase() + mood.slice(1)}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {displayMessage}
            </Typography>
            {streak > 0 && (
              <Typography variant="body1" color="warning.main" fontWeight={600}>
                🔥 {streak} day study streak!
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              Keep studying to keep your pet happy!
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
