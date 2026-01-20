import {
  Box,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import {
  Description as NoteIcon,
  Quiz as QuizIcon,
  Style as FlashcardIcon,
  EmojiEvents as AchievementIcon,
  TrendingUp as LevelUpIcon,
  LocalFireDepartment as StreakIcon,
  Psychology as BrainrotIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';

const ACTIVITY_ICONS = {
  note_created: { icon: NoteIcon, color: 'success.main', label: 'Created note' },
  note_updated: { icon: NoteIcon, color: 'info.main', label: 'Updated note' },
  quiz_completed: { icon: QuizIcon, color: 'warning.main', label: 'Completed quiz' },
  flashcard_reviewed: { icon: FlashcardIcon, color: 'primary.main', label: 'Reviewed flashcards' },
  achievement_unlocked: { icon: AchievementIcon, color: 'warning.main', label: 'Unlocked achievement' },
  level_up: { icon: LevelUpIcon, color: 'success.main', label: 'Leveled up' },
  streak_milestone: { icon: StreakIcon, color: 'error.main', label: 'Streak milestone' },
  brainrot_study: { icon: BrainrotIcon, color: 'secondary.main', label: 'Brainrot study' },
};

function ActivityItem({ activity }) {
  const config = ACTIVITY_ICONS[activity.type] || {
    icon: NoteIcon,
    color: 'text.secondary',
    label: activity.type,
  };
  const Icon = config.icon;

  const getActivityText = () => {
    const data = activity.data || {};
    switch (activity.type) {
      case 'note_created':
        return `Created note "${data.title || 'Untitled'}"`;
      case 'quiz_completed':
        return `Completed "${data.quiz_title}" - ${data.score}/${data.total} correct`;
      case 'flashcard_reviewed':
        return `Reviewed ${data.count || 0} flashcards`;
      case 'achievement_unlocked':
        return `Unlocked "${data.achievement_name}"`;
      case 'level_up':
        return `Reached Level ${data.level}`;
      case 'streak_milestone':
        return `${data.streak} day streak!`;
      case 'brainrot_study':
        return `${data.duration || 0} min brainrot session`;
      default:
        return config.label;
    }
  };

  const timeAgo = activity.created_at 
    ? formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })
    : '';

  return (
    <ListItem
      sx={{
        borderRadius: 1,
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 40 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: `${config.color}20`,
          }}
        >
          <Icon sx={{ fontSize: 18, color: config.color }} />
        </Box>
      </ListItemIcon>
      <ListItemText
        primary={getActivityText()}
        secondary={timeAgo}
        primaryTypographyProps={{ variant: 'body2' }}
        secondaryTypographyProps={{ variant: 'caption' }}
      />
    </ListItem>
  );
}

export default function RecentActivity({ activities, loading, onLoadMore, hasMore }) {
  if (loading) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Skeleton width="40%" height={32} sx={{ mb: 2 }} />
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} height={60} sx={{ my: 1 }} />
        ))}
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">📋 Recent Activity</Typography>
        <Stack direction="row" spacing={1}>
          <Chip label="All" size="small" variant="filled" color="primary" />
          <Chip label="Notes" size="small" variant="outlined" clickable />
          <Chip label="Quizzes" size="small" variant="outlined" clickable />
          <Chip label="Reviews" size="small" variant="outlined" clickable />
        </Stack>
      </Stack>

      {activities?.length > 0 ? (
        <>
          <List disablePadding>
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </List>

          {hasMore && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button size="small" onClick={onLoadMore}>
                Load more...
              </Button>
            </Box>
          )}
        </>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          No recent activity yet. Start studying to see your progress here!
        </Typography>
      )}
    </Paper>
  );
}
