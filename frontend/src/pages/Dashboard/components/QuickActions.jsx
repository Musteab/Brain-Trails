/**
 * QuickActions - One-click access to main study activities
 * Priority #1 component - "What do you want to do NOW?"
 */
import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Timer as TimerIcon,
  NoteAdd as NoteIcon,
  Style as CardsIcon,
  Quiz as QuizIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

export default function QuickActions({
  onStartPomodoro,
  onCreateNote,
  onReviewCards,
  onTakeQuiz,
  flashcardsDue = 0,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const actions = [
    {
      id: 'pomodoro',
      label: 'Start Pomodoro',
      icon: TimerIcon,
      shortcut: 'P',
      color: theme.palette.error.main,
      onClick: onStartPomodoro,
      primary: true,
    },
    {
      id: 'note',
      label: 'New Note',
      icon: NoteIcon,
      shortcut: 'N',
      color: theme.palette.primary.main,
      onClick: onCreateNote,
    },
    {
      id: 'cards',
      label: 'Review Cards',
      icon: CardsIcon,
      shortcut: 'F',
      color: theme.palette.warning.main,
      onClick: onReviewCards,
      badge: flashcardsDue > 0 ? flashcardsDue : null,
    },
    {
      id: 'quiz',
      label: 'Take Quiz',
      icon: QuizIcon,
      shortcut: 'Q',
      color: theme.palette.success.main,
      onClick: onTakeQuiz,
    },
  ];

  return (
    <Card elevation={0} sx={{ bgcolor: 'background.paper' }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          What do you want to do?
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {actions.map((action) => {
            const Icon = action.icon;
            const button = (
              <Button
                key={action.id}
                variant={action.primary ? 'contained' : 'outlined'}
                fullWidth
                size="large"
                onClick={action.onClick}
                sx={{
                  py: { xs: 1.5, sm: 2 },
                  borderColor: alpha(action.color, 0.5),
                  color: action.primary ? 'white' : action.color,
                  bgcolor: action.primary ? action.color : 'transparent',
                  '&:hover': {
                    bgcolor: action.primary 
                      ? alpha(action.color, 0.85) 
                      : alpha(action.color, 0.08),
                    borderColor: action.color,
                  },
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                }}
              >
                <Icon sx={{ fontSize: 28 }} />
                <Typography variant="body2" fontWeight={600}>
                  {action.label}
                </Typography>
                {!isMobile && (
                  <Chip 
                    label={action.shortcut} 
                    size="small" 
                    sx={{ 
                      height: 20, 
                      fontSize: '0.65rem',
                      bgcolor: alpha(action.primary ? '#fff' : action.color, 0.15),
                      color: action.primary ? 'white' : action.color,
                    }} 
                  />
                )}
              </Button>
            );

            return (
              <Grid item xs={6} sm={3} key={action.id}>
                {action.badge ? (
                  <Badge 
                    badgeContent={action.badge} 
                    color="error"
                    sx={{ width: '100%', '& .MuiBadge-badge': { top: 8, right: 8 } }}
                  >
                    {button}
                  </Badge>
                ) : button}
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
}
