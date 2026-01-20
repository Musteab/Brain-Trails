import { useMemo, useState } from 'react';

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api';
import { useGamification } from '../../context/GamificationContext';
import { roomThemes } from '../../theme';

const ProfilePage = () => {
  const { user, refreshProfile } = useAuth();
  const gamification = useGamification();
  const [form, setForm] = useState({
    display_name: user?.display_name || '',
    bio: user?.bio || '',
    avatar_url: user?.avatar_url || '',
  });
  const [saving, setSaving] = useState(false);
  const levelStats = useMemo(
    () => [
      { label: 'Level', value: gamification.level },
      { label: 'XP to next', value: `${Math.round(gamification.levelProgress * gamification.xpToNext)}/${gamification.xpToNext}` },
      { label: 'Streak', value: `${gamification.streak} days` },
      { label: 'Best streak', value: `${gamification.bestStreak} days` },
    ],
    [gamification.level, gamification.levelProgress, gamification.xpToNext, gamification.streak, gamification.bestStreak],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await authApi.updatePreferences(form);
      await refreshProfile();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h4" fontWeight={700}>
        Profile & avatar
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card component="form" onSubmit={handleSubmit}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Customize your explorer
              </Typography>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar src={form.avatar_url || user?.avatar_url} sx={{ width: 72, height: 72 }}>
                    {form.display_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase()}
                  </Avatar>
                  <Typography variant="body2" color="text.secondary">
                    Update your avatar, name, and trail bio to personalize your experience.
                  </Typography>
                </Stack>
                <TextField
                  label="Display name"
                  value={form.display_name}
                  onChange={(event) => setForm((prev) => ({ ...prev, display_name: event.target.value }))}
                />
                <TextField
                  label="Bio"
                  multiline
                  minRows={3}
                  value={form.bio}
                  onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
                  placeholder="Nature-loving scholar conquering exams."
                />
                <TextField
                  label="Avatar URL"
                  value={form.avatar_url}
                  onChange={(event) => setForm((prev) => ({ ...prev, avatar_url: event.target.value }))}
                  placeholder="https://"
                />
                <Button variant="contained" type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save profile'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Trail stats
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {levelStats.map((stat) => (
                  <Chip key={stat.label} label={`${stat.label}: ${stat.value}`} icon={<CheckCircle fontSize="small" />} />
                ))}
              </Stack>
              <Box mt={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Favorite room
                </Typography>
                <Typography variant="body1">{roomLabel(gamification.selectedRoom)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
};

const roomLabel = (key) => {
  const room = Object.values(roomThemes).find((item) => item.id === key);
  return room ? `${room.accentIcon} ${room.label}` : key;
};

export default ProfilePage;
