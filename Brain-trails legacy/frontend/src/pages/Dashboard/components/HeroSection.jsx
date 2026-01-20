/**
 * HeroSection - Welcome banner with room theme
 */
import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Stack,
  useTheme,
} from '@mui/material';
import {
  LocalFireDepartment as FireIcon,
  TrendingUp as LevelIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

export default function HeroSection({
  userName = 'there',
  roomTheme,
  level = 1,
  xpToNext = 100,
  streak = 0,
}) {
  const theme = useTheme();
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <Box
      sx={{
        p: { xs: 3, sm: 4 },
        borderRadius: 3,
        background: roomTheme?.gradient || theme.custom?.gradient || 
          `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative element */}
      <Box
        sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: alpha(theme.palette.primary.main, 0.1),
          filter: 'blur(40px)',
        }}
      />

      <Box position="relative" zIndex={1}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          {getGreeting()}, {userName}! {roomTheme?.accentIcon || '👋'}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" mb={2}>
          {roomTheme?.label ? `You're in the ${roomTheme.label}` : 'Ready to learn something new?'}
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
          <Chip
            icon={<LevelIcon sx={{ fontSize: 16 }} />}
            label={`Level ${level} • ${xpToNext} XP to next`}
            size="small"
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.15),
              fontWeight: 600,
            }}
          />
          {streak > 0 && (
            <Chip
              icon={<FireIcon sx={{ fontSize: 16, color: 'warning.main' }} />}
              label={`${streak} day streak`}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.warning.main, 0.15),
                color: theme.palette.warning.dark,
                fontWeight: 600,
              }}
            />
          )}
        </Stack>
      </Box>
    </Box>
  );
}
