/**
 * Preferences Tab
 * Study, Pomodoro, Editor, Flashcard, Quiz settings
 */
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  DarkMode,
  LightMode,
  BrightnessAuto,
} from '@mui/icons-material';

import api from '../../../api/client';
import {
  SettingSection,
  SettingSelect,
  SettingSlider,
  SettingToggle,
} from '../components/SettingComponents';

const ROOM_OPTIONS = [
  { value: 'forest', label: '🌲 Forest' },
  { value: 'cafe', label: '☕ Cafe' },
  { value: 'library', label: '📚 Library' },
  { value: 'space', label: '🚀 Space' },
  { value: 'beach', label: '🏖️ Beach' },
  { value: 'cozy', label: '🏠 Cozy Room' },
];

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ar', label: 'العربية' },
];

export default function PreferencesTab({ preferences }) {
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
      setSuccess('Preferences saved');
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

      {/* Theme */}
      <SettingSection title="Appearance">
        <Box sx={{ py: 1 }}>
          <Typography variant="body1" sx={{ mb: 1 }}>Theme Mode</Typography>
          <ToggleButtonGroup
            value={localPrefs.theme_mode || 'dark'}
            exclusive
            onChange={(_, val) => val && handleChange('theme_mode', val)}
            size="small"
          >
            <ToggleButton value="light">
              <LightMode sx={{ mr: 1 }} /> Light
            </ToggleButton>
            <ToggleButton value="dark">
              <DarkMode sx={{ mr: 1 }} /> Dark
            </ToggleButton>
            <ToggleButton value="auto">
              <BrightnessAuto sx={{ mr: 1 }} /> Auto
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <SettingSelect
          label="Default Study Room"
          value={localPrefs.default_room || 'forest'}
          onChange={(val) => handleChange('default_room', val)}
          options={ROOM_OPTIONS}
        />

        <SettingSelect
          label="Language"
          value={localPrefs.language || 'en'}
          onChange={(val) => handleChange('language', val)}
          options={LANGUAGE_OPTIONS}
        />
      </SettingSection>

      {/* Study Goals */}
      <SettingSection title="Study Goals">
        <SettingSlider
          label="Daily Goal"
          value={localPrefs.daily_goal_minutes || 120}
          onChange={(val) => handleChange('daily_goal_minutes', val)}
          min={15}
          max={480}
          step={15}
          valueLabelFormat={(v) => `${v} min`}
          marks={[
            { value: 60, label: '1h' },
            { value: 120, label: '2h' },
            { value: 240, label: '4h' },
          ]}
        />
      </SettingSection>

      {/* Pomodoro */}
      <SettingSection title="Pomodoro Timer">
        <SettingSlider
          label="Focus Duration"
          value={localPrefs.pomodoro_duration || 25}
          onChange={(val) => handleChange('pomodoro_duration', val)}
          min={15}
          max={60}
          step={5}
          valueLabelFormat={(v) => `${v} min`}
        />

        <SettingSlider
          label="Short Break"
          value={localPrefs.short_break || 5}
          onChange={(val) => handleChange('short_break', val)}
          min={3}
          max={15}
          step={1}
          valueLabelFormat={(v) => `${v} min`}
        />

        <SettingSlider
          label="Long Break"
          value={localPrefs.long_break || 15}
          onChange={(val) => handleChange('long_break', val)}
          min={10}
          max={30}
          step={5}
          valueLabelFormat={(v) => `${v} min`}
        />

        <SettingToggle
          label="Auto-start breaks"
          description="Automatically start break timer after focus session"
          checked={localPrefs.auto_start_breaks ?? true}
          onChange={(val) => handleChange('auto_start_breaks', val)}
        />

        <SettingToggle
          label="Play sound on complete"
          description="Play a sound when timer completes"
          checked={localPrefs.play_sound_on_complete ?? true}
          onChange={(val) => handleChange('play_sound_on_complete', val)}
        />
      </SettingSection>

      {/* Note Editor */}
      <SettingSection title="Note Editor">
        <SettingSlider
          label="Font Size"
          value={localPrefs.editor_font_size || 16}
          onChange={(val) => handleChange('editor_font_size', val)}
          min={12}
          max={24}
          step={1}
          valueLabelFormat={(v) => `${v}px`}
        />

        <SettingToggle
          label="Enable autosave"
          description="Automatically save notes while editing"
          checked={localPrefs.editor_autosave ?? true}
          onChange={(val) => handleChange('editor_autosave', val)}
        />

        <SettingSlider
          label="Autosave interval"
          value={localPrefs.autosave_interval || 30}
          onChange={(val) => handleChange('autosave_interval', val)}
          min={10}
          max={120}
          step={10}
          valueLabelFormat={(v) => `${v}s`}
          disabled={!localPrefs.editor_autosave}
        />

        <SettingToggle
          label="Spell check"
          description="Highlight spelling errors"
          checked={localPrefs.spell_check ?? true}
          onChange={(val) => handleChange('spell_check', val)}
        />
      </SettingSection>

      {/* Flashcards */}
      <SettingSection title="Flashcards">
        <SettingSlider
          label="Cards per session"
          value={localPrefs.cards_per_session || 20}
          onChange={(val) => handleChange('cards_per_session', val)}
          min={5}
          max={50}
          step={5}
          valueLabelFormat={(v) => `${v} cards`}
        />

        <SettingToggle
          label="Show answer timer"
          description="Display time spent on each card"
          checked={localPrefs.show_answer_timer ?? true}
          onChange={(val) => handleChange('show_answer_timer', val)}
        />

        <SettingToggle
          label="Shuffle cards"
          description="Randomize card order in reviews"
          checked={localPrefs.card_shuffle ?? true}
          onChange={(val) => handleChange('card_shuffle', val)}
        />
      </SettingSection>

      {/* Quizzes */}
      <SettingSection title="Quizzes">
        <SettingSlider
          label="Default time limit"
          value={localPrefs.default_quiz_time_limit || 30}
          onChange={(val) => handleChange('default_quiz_time_limit', val)}
          min={5}
          max={120}
          step={5}
          valueLabelFormat={(v) => `${v} min`}
        />

        <SettingToggle
          label="Show explanations"
          description="Display explanations after each question"
          checked={localPrefs.show_explanations ?? true}
          onChange={(val) => handleChange('show_explanations', val)}
        />

        <SettingToggle
          label="Allow retry"
          description="Allow retaking quizzes"
          checked={localPrefs.allow_retry ?? true}
          onChange={(val) => handleChange('allow_retry', val)}
        />
      </SettingSection>
    </Box>
  );
}
