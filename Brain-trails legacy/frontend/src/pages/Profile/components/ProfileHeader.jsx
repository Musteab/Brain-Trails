import { useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Edit as EditIcon,
  Share as ShareIcon,
  EmojiEvents as TrophyIcon,
  Bolt as XPIcon,
  LocalFireDepartment as StreakIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
} from '@mui/icons-material';

export default function ProfileHeader({ 
  profile, 
  gamification, 
  isOwner = true, 
  onEdit, 
  loading 
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/@${profile?.username}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
          <Skeleton variant="circular" width={120} height={120} />
          <Box flex={1}>
            <Skeleton width="60%" height={40} />
            <Skeleton width="40%" height={24} />
            <Skeleton width="80%" height={20} sx={{ mt: 2 }} />
          </Box>
        </Stack>
      </Paper>
    );
  }

  const levelColor = gamification?.level >= 50 
    ? 'warning.main' 
    : gamification?.level >= 20 
      ? 'info.main' 
      : 'primary.main';

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      {/* Top Actions */}
      {isOwner && (
        <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mb: 2 }}>
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={onEdit}
          >
            Edit Profile
          </Button>
          {profile?.is_public && (
            <Tooltip title={copied ? 'Copied!' : 'Copy profile link'}>
              <IconButton size="small" onClick={handleShare}>
                {copied ? <CheckIcon color="success" /> : <ShareIcon />}
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      )}

      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        spacing={3} 
        alignItems={{ xs: 'center', sm: 'flex-start' }}
      >
        {/* Avatar */}
        <Box sx={{ position: 'relative' }}>
          <Avatar
            src={profile?.avatar_url}
            alt={profile?.display_name || profile?.username}
            sx={{
              width: 120,
              height: 120,
              border: 4,
              borderColor: levelColor,
              boxShadow: (theme) => `0 0 20px ${theme.palette.primary.main}40`,
            }}
          >
            {(profile?.display_name || profile?.username || '?')[0].toUpperCase()}
          </Avatar>
          <Chip
            label={`Lvl ${gamification?.level || 1}`}
            size="small"
            color="primary"
            sx={{
              position: 'absolute',
              bottom: -8,
              left: '50%',
              transform: 'translateX(-50%)',
              fontWeight: 'bold',
            }}
          />
        </Box>

        {/* Info */}
        <Box flex={1} textAlign={{ xs: 'center', sm: 'left' }}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            alignItems={{ xs: 'center', sm: 'flex-start' }}
            spacing={2}
            sx={{ mb: 1 }}
          >
            <Box>
              <Typography variant="h4" fontWeight="bold">
                {profile?.display_name || profile?.username}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                @{profile?.username}
              </Typography>
            </Box>

            {/* Key Stats */}
            <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
              <Chip
                icon={<TrophyIcon />}
                label={`Level ${gamification?.level || 1}`}
                variant="outlined"
                size="small"
              />
              <Chip
                icon={<XPIcon />}
                label={`${(gamification?.total_xp || 0).toLocaleString()} XP`}
                variant="outlined"
                size="small"
              />
              {(gamification?.current_streak || 0) > 0 && (
                <Chip
                  icon={<StreakIcon sx={{ color: 'error.main' }} />}
                  label={`${gamification.current_streak} Day Streak`}
                  variant="outlined"
                  size="small"
                  color="error"
                />
              )}
            </Stack>
          </Stack>

          {/* Bio */}
          {profile?.bio && (
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ 
                mt: 2, 
                fontStyle: 'italic',
                maxWidth: 500,
              }}
            >
              "{profile.bio}"
            </Typography>
          )}

          {/* Meta Info */}
          <Stack 
            direction="row" 
            spacing={2} 
            sx={{ mt: 2 }}
            flexWrap="wrap"
            justifyContent={{ xs: 'center', sm: 'flex-start' }}
          >
            {profile?.created_at && (
              <Typography variant="caption" color="text.secondary">
                📍 Joined {new Date(profile.created_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              🏅 {profile?.stats?.achievements_unlocked || 0} Achievements
            </Typography>
            <Typography variant="caption" color="text.secondary">
              🐾 {profile?.stats?.pet_count || 0} Pets
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}
