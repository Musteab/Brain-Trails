import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Close as CloseIcon,
  Lock as LockIcon,
} from '@mui/icons-material';

const RARITY_COLORS = {
  common: { bg: '#9e9e9e', text: '#fff' },
  rare: { bg: '#2196f3', text: '#fff' },
  epic: { bg: '#9c27b0', text: '#fff' },
  legendary: { bg: '#ff9800', text: '#000' },
};

function AchievementBadge({ achievement, onClick, locked = false }) {
  const rarityStyle = RARITY_COLORS[achievement.rarity] || RARITY_COLORS.common;

  return (
    <Tooltip title={locked ? '???' : achievement.name}>
      <Box
        onClick={() => !locked && onClick?.(achievement)}
        sx={{
          width: 80,
          height: 90,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2,
          bgcolor: locked ? 'action.disabledBackground' : 'background.paper',
          border: 2,
          borderColor: locked ? 'divider' : rarityStyle.bg,
          cursor: locked ? 'default' : 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
          opacity: locked ? 0.5 : 1,
          '&:hover': locked ? {} : {
            transform: 'translateY(-4px)',
            boxShadow: `0 4px 12px ${rarityStyle.bg}40`,
          },
        }}
      >
        <Typography variant="h4" sx={{ mb: 0.5 }}>
          {locked ? <LockIcon color="disabled" /> : achievement.icon}
        </Typography>
        <Typography 
          variant="caption" 
          align="center"
          sx={{ 
            px: 0.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {locked ? '???' : achievement.name}
        </Typography>
      </Box>
    </Tooltip>
  );
}

function AchievementDialog({ open, onClose, achievement, unlocked_at }) {
  if (!achievement) return null;
  
  const rarityStyle = RARITY_COLORS[achievement.rarity] || RARITY_COLORS.common;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Achievement Details
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack alignItems="center" spacing={2} sx={{ py: 2 }}>
          <Typography variant="h1">{achievement.icon}</Typography>
          <Typography variant="h5" fontWeight="bold" align="center">
            {achievement.name}
          </Typography>
          <Chip 
            label={achievement.rarity.toUpperCase()} 
            size="small"
            sx={{ 
              bgcolor: rarityStyle.bg, 
              color: rarityStyle.text,
              fontWeight: 'bold',
            }}
          />
          <Typography variant="body1" color="text.secondary" align="center">
            {achievement.description}
          </Typography>
          <Box 
            sx={{ 
              bgcolor: 'primary.main', 
              color: 'primary.contrastText',
              px: 2,
              py: 0.5,
              borderRadius: 2,
            }}
          >
            +{achievement.xp_reward} XP
          </Box>
          {unlocked_at && (
            <Typography variant="caption" color="text.secondary">
              Unlocked {new Date(unlocked_at).toLocaleDateString()}
            </Typography>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

export default function AchievementsShowcase({ achievements, loading, onViewAll }) {
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleBadgeClick = (achievement, unlocked_at) => {
    setSelectedAchievement({ ...achievement, unlocked_at });
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Skeleton width="40%" height={32} sx={{ mb: 2 }} />
        <Grid container spacing={1}>
          {[1, 2, 3, 4, 5].map(i => (
            <Grid item key={i}>
              <Skeleton variant="rounded" width={80} height={90} />
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  }

  const unlocked = achievements?.filter(a => a.is_unlocked) || [];
  const inProgress = achievements?.filter(a => !a.is_unlocked && a.progress > 0) || [];

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <TrophyIcon color="warning" />
          <Typography variant="h6">Achievements</Typography>
          <Chip 
            label={`${unlocked.length} Unlocked`} 
            size="small" 
            color="primary"
          />
        </Stack>
        {onViewAll && (
          <Button size="small" onClick={onViewAll}>
            View All
          </Button>
        )}
      </Stack>

      {/* Unlocked Achievements */}
      {unlocked.length > 0 ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {unlocked.slice(0, 8).map((item) => (
            <AchievementBadge
              key={item.achievement.id}
              achievement={item.achievement}
              onClick={(ach) => handleBadgeClick(ach, item.unlocked_at)}
            />
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No achievements unlocked yet. Start studying to earn your first badge!
        </Typography>
      )}

      {/* In Progress */}
      {inProgress.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            In Progress
          </Typography>
          <Stack spacing={1}>
            {inProgress.slice(0, 3).map((item) => (
              <Box 
                key={item.achievement.id}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5,
                  p: 1,
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                }}
              >
                <Typography variant="h6">{item.achievement.icon}</Typography>
                <Box flex={1}>
                  <Typography variant="body2" fontWeight="medium">
                    {item.achievement.name}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(item.progress / item.achievement.target_value) * 100}
                    sx={{ mt: 0.5, borderRadius: 1 }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {item.progress}/{item.achievement.target_value}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      <AchievementDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        achievement={selectedAchievement}
        unlocked_at={selectedAchievement?.unlocked_at}
      />
    </Paper>
  );
}
