/**
 * Notifications Tab
 * Push, email, and quiet hours settings
 */
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import api from '../../../api/client';
import { SettingSection, SettingToggle } from '../components/SettingComponents';

export default function NotificationsTab({ preferences }) {
  const queryClient = useQueryClient();
  const [localPrefs, setLocalPrefs] = useState(preferences || {});
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (preferences) {
      setLocalPrefs(preferences);
    }
  }, [preferences]);

  const updateMutation = useMutation({
    mutationFn: async (updates) => {
      const res = await api.patch('/settings/preferences', updates);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'preferences'] });
      setSuccess('Notification settings saved');
      setTimeout(() => setSuccess(''), 2000);
    },
  });

  const handleChange = (key, value) => {
    setLocalPrefs((prev) => ({ ...prev, [key]: value }));
    updateMutation.mutate({ [key]: value });
  };

  return (
    <Box>
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Push Notifications */}
      <SettingSection title="Push Notifications">
        <SettingToggle
          label="Enable notifications"
          description="Receive push notifications in your browser"
          checked={localPrefs.notifications_enabled ?? true}
          onChange={(val) => handleChange('notifications_enabled', val)}
        />

        <Divider sx={{ my: 1 }} />

        <SettingToggle
          label="Study reminders"
          description="Remind me to study at scheduled times"
          checked={localPrefs.study_reminders ?? true}
          onChange={(val) => handleChange('study_reminders', val)}
          disabled={!localPrefs.notifications_enabled}
        />

        <SettingToggle
          label="Flashcard review reminders"
          description="Notify when cards are due for review"
          checked={localPrefs.flashcard_reminders ?? true}
          onChange={(val) => handleChange('flashcard_reminders', val)}
          disabled={!localPrefs.notifications_enabled}
        />

        <SettingToggle
          label="Daily goal reminders"
          description="Remind me if I haven't met my daily goal"
          checked={localPrefs.daily_goal_reminders ?? true}
          onChange={(val) => handleChange('daily_goal_reminders', val)}
          disabled={!localPrefs.notifications_enabled}
        />

        <SettingToggle
          label="Streak warning"
          description="Alert when my streak is about to break"
          checked={localPrefs.streak_warning ?? true}
          onChange={(val) => handleChange('streak_warning', val)}
          disabled={!localPrefs.notifications_enabled}
        />

        <SettingToggle
          label="Level up celebrations"
          description="Celebrate when I reach a new level"
          checked={localPrefs.level_up_notifications ?? true}
          onChange={(val) => handleChange('level_up_notifications', val)}
          disabled={!localPrefs.notifications_enabled}
        />

        <SettingToggle
          label="Achievement unlocked"
          description="Notify when I unlock achievements"
          checked={localPrefs.achievement_notifications ?? true}
          onChange={(val) => handleChange('achievement_notifications', val)}
          disabled={!localPrefs.notifications_enabled}
        />
      </SettingSection>

      {/* Email Notifications */}
      <SettingSection title="Email Notifications">
        <SettingToggle
          label="Weekly progress report"
          description="Receive a weekly summary of your study progress"
          checked={localPrefs.email_weekly_report ?? true}
          onChange={(val) => handleChange('email_weekly_report', val)}
        />

        <SettingToggle
          label="New features & updates"
          description="Learn about new features and improvements"
          checked={localPrefs.email_feature_updates ?? true}
          onChange={(val) => handleChange('email_feature_updates', val)}
        />

        <SettingToggle
          label="Tips & study advice"
          description="Receive tips to improve your study habits"
          checked={localPrefs.email_study_tips ?? false}
          onChange={(val) => handleChange('email_study_tips', val)}
        />

        <SettingToggle
          label="Marketing emails"
          description="Promotional content and special offers"
          checked={localPrefs.email_marketing ?? false}
          onChange={(val) => handleChange('email_marketing', val)}
        />
      </SettingSection>

      {/* Quiet Hours */}
      <SettingSection 
        title="Quiet Hours"
        description="Pause notifications during specific hours"
      >
        <SettingToggle
          label="Enable quiet hours"
          description="Don't disturb me during these hours"
          checked={localPrefs.quiet_hours_enabled ?? false}
          onChange={(val) => handleChange('quiet_hours_enabled', val)}
        />

        {localPrefs.quiet_hours_enabled && (
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Start time"
              type="time"
              value={localPrefs.quiet_hours_start || '22:00'}
              onChange={(e) => handleChange('quiet_hours_start', e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End time"
              type="time"
              value={localPrefs.quiet_hours_end || '08:00'}
              onChange={(e) => handleChange('quiet_hours_end', e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        )}
      </SettingSection>
    </Box>
  );
}
