import {
  Box,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  Description as NotesIcon,
  Style as FlashcardsIcon,
  Quiz as QuizIcon,
  MeetingRoom as RoomIcon,
  WbSunny as TimeOfDayIcon,
} from '@mui/icons-material';

function StatCard({ icon, label, value, subtext, color = 'primary.main' }) {
  return (
    <Paper
      sx={{
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: `${color}20`,
          color: color,
          mb: 1,
        }}
      >
        {icon}
      </Box>
      <Typography variant="h5" fontWeight="bold">
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      {subtext && (
        <Typography variant="caption" color="text.secondary">
          {subtext}
        </Typography>
      )}
    </Paper>
  );
}

const ROOM_ICONS = {
  forest: '🌲',
  cafe: '☕',
  library: '📚',
  space: '🚀',
  beach: '🏖️',
  cozy: '🏠',
};

function formatHour(hour) {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:00 ${ampm}`;
}

export default function StudyStats({ stats, loading }) {
  if (loading) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Skeleton width="40%" height={32} sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Grid item xs={6} sm={4} md={2} key={i}>
              <Skeleton variant="rounded" height={120} />
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  }

  const roomIcon = ROOM_ICONS[stats?.favorite_room] || '🏠';

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        📊 Study Statistics
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            icon={<TimeIcon />}
            label="Study Time"
            value={`${stats?.total_study_hours || 0}h`}
            subtext="Total hours"
            color="primary.main"
          />
        </Grid>

        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            icon={<NotesIcon />}
            label="Notes Created"
            value={stats?.total_notes || 0}
            color="success.main"
          />
        </Grid>

        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            icon={<FlashcardsIcon />}
            label="Cards Mastered"
            value={stats?.flashcards_mastered || 0}
            subtext={`of ${stats?.flashcards_reviewed || 0} reviewed`}
            color="info.main"
          />
        </Grid>

        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            icon={<QuizIcon />}
            label="Quiz Average"
            value={`${stats?.quiz_average_score || 0}%`}
            subtext={`${stats?.quizzes_completed || 0} quizzes`}
            color="warning.main"
          />
        </Grid>

        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            icon={<RoomIcon />}
            label="Favorite Room"
            value={roomIcon}
            subtext={stats?.favorite_room || 'Forest'}
            color="secondary.main"
          />
        </Grid>

        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            icon={<TimeOfDayIcon />}
            label="Best Time"
            value={formatHour(stats?.productive_hour || 14)}
            subtext="Most productive"
            color="error.main"
          />
        </Grid>
      </Grid>

      {/* Study Breakdown */}
      {stats?.study_breakdown && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Study Breakdown
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Box 
              sx={{ 
                px: 2, 
                py: 1, 
                borderRadius: 1, 
                bgcolor: 'success.main',
                color: 'success.contrastText',
              }}
            >
              📝 Notes: {stats.study_breakdown.notes}%
            </Box>
            <Box 
              sx={{ 
                px: 2, 
                py: 1, 
                borderRadius: 1, 
                bgcolor: 'info.main',
                color: 'info.contrastText',
              }}
            >
              🎴 Flashcards: {stats.study_breakdown.flashcards}%
            </Box>
            <Box 
              sx={{ 
                px: 2, 
                py: 1, 
                borderRadius: 1, 
                bgcolor: 'warning.main',
                color: 'warning.contrastText',
              }}
            >
              📋 Quizzes: {stats.study_breakdown.quizzes}%
            </Box>
          </Stack>
        </Box>
      )}
    </Paper>
  );
}
