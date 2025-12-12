/**
 * LevelProgressModal - Shows level and XP progress details
 */
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon, Bolt as BoltIcon } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

// Circular progress with label in center
function CircularProgressWithLabel({ value, size = 120, thickness = 6, children }) {
  const theme = useTheme();
  
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      {/* Background circle */}
      <CircularProgress
        variant="determinate"
        value={100}
        size={size}
        thickness={thickness}
        sx={{
          color: alpha(theme.palette.primary.main, 0.15),
        }}
      />
      {/* Progress circle */}
      <CircularProgress
        variant="determinate"
        value={value}
        size={size}
        thickness={thickness}
        sx={{
          position: 'absolute',
          left: 0,
          color: 'primary.main',
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          },
        }}
      />
      {/* Center content */}
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default function LevelProgressModal({ 
  open, 
  onClose, 
  level, 
  xp, 
  xpForNext, 
  xpToday,
  xpBreakdown = [],
}) {
  const theme = useTheme();
  const progressPercent = Math.min((xp / Math.max(xpForNext, 1)) * 100, 100);
  const xpRemaining = Math.max(xpForNext - xp, 0);
  
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
          <BoltIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" fontWeight={600}>
            Level Progress
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box textAlign="center" py={2}>
          {/* Level Badge */}
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              mb: 1,
            }}
          >
            Level {level}
          </Typography>
          
          {/* XP Progress Circle */}
          <Box my={3}>
            <CircularProgressWithLabel value={progressPercent} size={140} thickness={6}>
              <Box textAlign="center">
                <Typography variant="h5" fontWeight={700} color="primary.main">
                  {progressPercent.toFixed(0)}%
                </Typography>
              </Box>
            </CircularProgressWithLabel>
          </Box>
          
          {/* XP Numbers */}
          <Typography variant="h6" fontWeight={600}>
            {xp.toLocaleString()} / {xpForNext.toLocaleString()} XP
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {xpRemaining.toLocaleString()} XP to level {level + 1}
          </Typography>
          
          <Divider sx={{ my: 2.5 }} />
          
          {/* Today's Stats */}
          <Box 
            sx={{ 
              p: 2, 
              borderRadius: 2, 
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              mb: 2,
            }}
          >
            <Typography variant="h4" fontWeight={700} color="primary.main">
              +{xpToday} XP
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Earned Today
            </Typography>
          </Box>
          
          {/* XP Breakdown */}
          {xpBreakdown.length > 0 && (
            <Box textAlign="left">
              <Typography variant="subtitle2" gutterBottom>
                Today's XP Breakdown
              </Typography>
              <List dense disablePadding>
                {xpBreakdown.slice(0, 5).map((item, idx) => (
                  <ListItem 
                    key={idx}
                    sx={{ 
                      px: 1.5, 
                      py: 0.5,
                      borderRadius: 1,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      },
                    }}
                  >
                    <ListItemText
                      primary={item.reason}
                      primaryTypographyProps={{
                        variant: 'body2',
                      }}
                    />
                    <Typography variant="body2" color="success.main" fontWeight={600}>
                      +{item.amount}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
