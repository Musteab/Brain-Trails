/**
 * UpNext - Smart suggestions for what to do next
 * Priority #3 component - AI-powered actionable items
 */
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Style as CardsIcon,
  Quiz as QuizIcon,
  Description as NoteIcon,
  EventNote as PlannerIcon,
  CheckCircle as DoneIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export default function UpNext({
  flashcardsDue = 0,
  unfinishedQuizzes = [],
  staleNotes = [],
  upcomingSessions = [],
  onReviewCards,
  onStartQuiz,
  onOpenNote,
  onOpenPlanner,
}) {
  const theme = useTheme();

  const items = [];

  // Flashcards due
  if (flashcardsDue > 0) {
    items.push({
      id: 'flashcards',
      icon: CardsIcon,
      primary: `Review ${flashcardsDue} flashcard${flashcardsDue > 1 ? 's' : ''}`,
      secondary: 'Due today',
      color: theme.palette.warning.main,
      priority: 'high',
      onClick: onReviewCards,
    });
  }

  // Unfinished quizzes
  unfinishedQuizzes.slice(0, 2).forEach((quiz) => {
    items.push({
      id: `quiz-${quiz.id}`,
      icon: QuizIcon,
      primary: quiz.title || 'Unfinished Quiz',
      secondary: 'Continue where you left off',
      color: theme.palette.info.main,
      priority: 'medium',
      onClick: () => onStartQuiz?.(quiz.id),
    });
  });

  // Stale notes (not reviewed recently)
  staleNotes.slice(0, 2).forEach((note) => {
    const daysSince = dayjs().diff(dayjs(note.last_reviewed || note.updated_at), 'day');
    items.push({
      id: `note-${note.id}`,
      icon: NoteIcon,
      primary: note.title || 'Untitled Note',
      secondary: `Not reviewed in ${daysSince} days`,
      color: theme.palette.text.secondary,
      priority: 'low',
      onClick: () => onOpenNote?.(note.id),
    });
  });

  // Upcoming sessions
  upcomingSessions.slice(0, 1).forEach((session) => {
    items.push({
      id: `session-${session.id}`,
      icon: PlannerIcon,
      primary: session.title,
      secondary: `Scheduled for ${dayjs(session.scheduled_time).format('h:mm A')}`,
      color: theme.palette.success.main,
      priority: 'medium',
      onClick: onOpenPlanner,
    });
  });

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const isEmpty = items.length === 0;

  return (
    <Card elevation={0} sx={{ bgcolor: 'background.paper', height: '100%' }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Up Next
        </Typography>

        {isEmpty ? (
          <Box 
            sx={{ 
              py: 4, 
              textAlign: 'center',
              color: 'text.secondary',
            }}
          >
            <DoneIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
            <Typography variant="body1" fontWeight={600}>
              You're all caught up!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start a new study session to keep learning
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {items.slice(0, 5).map((item, index) => {
              const Icon = item.icon;
              return (
                <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={item.onClick}
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      '&:hover': {
                        bgcolor: alpha(item.color, 0.08),
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Icon sx={{ color: item.color }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.primary}
                      secondary={item.secondary}
                      primaryTypographyProps={{
                        fontWeight: 600,
                        fontSize: '0.9rem',
                      }}
                      secondaryTypographyProps={{
                        fontSize: '0.75rem',
                      }}
                    />
                    {item.priority === 'high' && (
                      <Chip 
                        label="Due" 
                        size="small" 
                        sx={{ 
                          height: 20,
                          bgcolor: alpha(item.color, 0.15),
                          color: item.color,
                          fontWeight: 600,
                          fontSize: '0.65rem',
                        }} 
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
