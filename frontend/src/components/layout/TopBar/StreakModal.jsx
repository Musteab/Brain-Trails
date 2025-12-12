/**
 * StreakModal - Shows streak details and calendar
 */
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Divider,
  Alert,
  IconButton,
  Grid,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon, LocalFire } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

export default function StreakModal({ open, onClose, streak, bestStreak, totalDays }) {
  const theme = useTheme();
  
  // Calculate hours remaining until streak resets (midnight)
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const hoursRemaining = Math.floor((midnight - now) / (1000 * 60 * 60));
  
  // Generate last 7 days for mini calendar
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    last7Days.push({
      date,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: date.getDate(),
      isToday: i === 0,
      // For now, assume studied if within streak
      studied: i < streak,
    });
  }
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: theme.palette.background.paper,
          backgroundImage: 'none',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <LocalFire sx={{ color: 'warning.main' }} />
          <Typography variant="h6" fontWeight={600}>
            Study Streak
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box textAlign="center" py={2}>
          {/* Current Streak */}
          <Typography
            variant="h1"
            sx={{
              fontSize: '4rem',
              fontWeight: 700,
              color: 'warning.main',
              lineHeight: 1,
            }}
          >
            {streak}
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Day{streak !== 1 ? 's' : ''} Streak!
          </Typography>
          
          <Divider sx={{ my: 2.5 }} />
          
          {/* Stats Row */}
          <Box display="flex" justifyContent="space-around" mb={3}>
            <Box textAlign="center">
              <Typography variant="h4" fontWeight={600} color="primary.main">
                {bestStreak}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Best Streak
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h4" fontWeight={600} color="success.main">
                {totalDays}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Days
              </Typography>
            </Box>
          </Box>
          
          {/* Mini Calendar - Last 7 Days */}
          <Box mb={2.5}>
            <Typography variant="caption" color="text.secondary" gutterBottom display="block">
              Last 7 Days
            </Typography>
            <Grid container spacing={0.5} justifyContent="center" sx={{ mt: 1 }}>
              {last7Days.map((day, idx) => (
                <Grid item key={idx}>
                  <Box
                    sx={{
                      width: 36,
                      height: 44,
                      borderRadius: 1.5,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: day.studied 
                        ? alpha(theme.palette.warning.main, 0.15)
                        : alpha(theme.palette.text.primary, 0.05),
                      border: day.isToday 
                        ? `2px solid ${theme.palette.primary.main}`
                        : 'none',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.6rem',
                        color: 'text.secondary',
                      }}
                    >
                      {day.dayName}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{
                        color: day.studied ? 'warning.main' : 'text.secondary',
                      }}
                    >
                      {day.dayNum}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
          
          {/* Reminder Alert */}
          {streak > 0 ? (
            <Alert 
              severity="info" 
              icon={<LocalFire />}
              sx={{ 
                borderRadius: 2,
                textAlign: 'left',
              }}
            >
              {hoursRemaining > 0 
                ? `Study today to keep your streak! ${hoursRemaining}h remaining`
                : 'Study soon to keep your streak alive!'
              }
            </Alert>
          ) : (
            <Alert 
              severity="warning" 
              sx={{ 
                borderRadius: 2,
                textAlign: 'left',
              }}
            >
              Start studying today to begin a new streak!
            </Alert>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
