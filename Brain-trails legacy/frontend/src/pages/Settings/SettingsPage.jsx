/**
 * SettingsPage - Fully functional settings with backend persistence
 */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  ExpandMore,
  Save as SaveIcon,
  Download as DownloadIcon,
  DeleteForever as DeleteIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

import { settingsApi } from '../../api';
import { useGamification } from '../../context/GamificationContext';
import { useAuth } from '../../context/AuthContext';
import { roomThemes } from '../../theme';

const SettingsPage = () => {
  const queryClient = useQueryClient();
  const { selectedRoom, setSelectedRoom, openTutorial, setDailyGoalMinutes } = useGamification();
  const { logout } = useAuth();
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Dialog states
  const [resetDialog, setResetDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  
  // Local state for form
  const [localPrefs, setLocalPrefs] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  
  // Fetch preferences from backend
  const { data: prefsData, isLoading } = useQuery({
    queryKey: ['settings-preferences'],
    queryFn: async () => {
      const { data } = await settingsApi.getPreferences();
      return data.preferences || {};
    },
    staleTime: 30000,
  });
  
  // Initialize local state when data loads
  useEffect(() => {
    if (prefsData) {
      setLocalPrefs(prefsData);
    }
  }, [prefsData]);
  
  // Update preference mutation
  const updateMutation = useMutation({
    mutationFn: (payload) => settingsApi.updatePreferences(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-preferences'] });
      setSnackbar({ open: true, message: 'Settings saved!', severity: 'success' });
      setHasChanges(false);
    },
    onError: (error) => {
      setSnackbar({ open: true, message: error.message || 'Failed to save settings', severity: 'error' });
    },
  });
  
  // Export data mutation
  const exportMutation = useMutation({
    mutationFn: () => settingsApi.exportData(),
    onSuccess: (response) => {
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `braintrails-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSnackbar({ open: true, message: 'Data exported successfully!', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to export data', severity: 'error' });
    },
  });
  
  // Reset progress mutation
  const resetMutation = useMutation({
    mutationFn: () => settingsApi.resetProgress(),
    onSuccess: () => {
      queryClient.invalidateQueries();
      setResetDialog(false);
      setSnackbar({ open: true, message: 'Progress reset successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to reset progress', severity: 'error' });
    },
  });
  
  // Delete account mutation
  const deleteMutation = useMutation({
    mutationFn: () => settingsApi.deleteAccount(),
    onSuccess: () => {
      logout();
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to delete account', severity: 'error' });
    },
  });
  
  // Merged preferences
  const prefs = { ...prefsData, ...localPrefs };
  
  // Handle preference change
  const handleChange = (key, value) => {
    setLocalPrefs(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };
  
  // Handle toggle change
  const handleToggle = (key) => (_, checked) => {
    handleChange(key, checked);
  };
  
  // Save all changes
  const handleSave = () => {
    updateMutation.mutate(localPrefs);
    
    if (localPrefs.default_room) {
      setSelectedRoom(localPrefs.default_room);
    }
    if (localPrefs.daily_goal_minutes && setDailyGoalMinutes) {
      setDailyGoalMinutes(localPrefs.daily_goal_minutes);
    }
  };
  
  // Handle room selection (save immediately)
  const handleRoomSelect = (roomId) => {
    setSelectedRoom(roomId);
    updateMutation.mutate({ default_room: roomId });
  };
  
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" fontWeight={700}>
          Settings
        </Typography>
        {hasChanges && (
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </Box>
      
      <Grid container spacing={3}>
        {/* Study Preferences */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                📚 Study Preferences
              </Typography>
              
              <Stack spacing={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Daily Study Goal: {prefs.daily_goal_minutes || 120} minutes
                  </Typography>
                  <Slider
                    value={prefs.daily_goal_minutes || 120}
                    onChange={(_, value) => handleChange('daily_goal_minutes', value)}
                    min={15}
                    max={480}
                    step={15}
                    marks={[
                      { value: 30, label: '30m' },
                      { value: 120, label: '2h' },
                      { value: 240, label: '4h' },
                      { value: 480, label: '8h' },
                    ]}
                  />
                </Box>
                
                <FormControl fullWidth size="small">
                  <InputLabel>Theme Mode</InputLabel>
                  <Select
                    value={prefs.theme_mode || 'dark'}
                    label="Theme Mode"
                    onChange={(e) => handleChange('theme_mode', e.target.value)}
                  >
                    <MenuItem value="dark">Dark</MenuItem>
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="auto">System</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl fullWidth size="small">
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={prefs.language || 'en'}
                    label="Language"
                    onChange={(e) => handleChange('language', e.target.value)}
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="es">Español</MenuItem>
                    <MenuItem value="fr">Français</MenuItem>
                    <MenuItem value="de">Deutsch</MenuItem>
                    <MenuItem value="ja">日本語</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Theme / Room Selection */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                🎨 Study Room Theme
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Pick your default study room. The entire interface adapts instantly.
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {Object.values(roomThemes).map((room) => (
                  <Button
                    key={room.id}
                    variant={room.id === selectedRoom ? 'contained' : 'outlined'}
                    onClick={() => handleRoomSelect(room.id)}
                    sx={{ mb: 1 }}
                  >
                    {room.accentIcon} {room.label}
                  </Button>
                ))}
              </Stack>
              <Button sx={{ mt: 2 }} onClick={openTutorial} variant="text">
                View tutorial
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Pomodoro Settings */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                🍅 Pomodoro Settings
              </Typography>
              
              <Stack spacing={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Focus Duration: {prefs.pomodoro_duration || 25} minutes
                  </Typography>
                  <Slider
                    value={prefs.pomodoro_duration || 25}
                    onChange={(_, value) => handleChange('pomodoro_duration', value)}
                    min={5}
                    max={90}
                    step={5}
                    marks={[
                      { value: 15, label: '15m' },
                      { value: 25, label: '25m' },
                      { value: 45, label: '45m' },
                      { value: 90, label: '90m' },
                    ]}
                  />
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Short Break: {prefs.short_break || 5} minutes
                  </Typography>
                  <Slider
                    value={prefs.short_break || 5}
                    onChange={(_, value) => handleChange('short_break', value)}
                    min={1}
                    max={15}
                    step={1}
                  />
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Long Break: {prefs.long_break || 15} minutes
                  </Typography>
                  <Slider
                    value={prefs.long_break || 15}
                    onChange={(_, value) => handleChange('long_break', value)}
                    min={5}
                    max={60}
                    step={5}
                  />
                </Box>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={prefs.auto_start_breaks ?? true}
                      onChange={handleToggle('auto_start_breaks')}
                    />
                  }
                  label="Auto-start breaks"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={prefs.play_sound_on_complete ?? true}
                      onChange={handleToggle('play_sound_on_complete')}
                    />
                  }
                  label="Play sound when timer completes"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Notifications */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                🔔 Notifications
              </Typography>
              
              <Stack spacing={1}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={prefs.notifications_enabled ?? true}
                      onChange={handleToggle('notifications_enabled')}
                    />
                  }
                  label="Enable notifications"
                />
                
                <Divider sx={{ my: 1 }} />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={prefs.study_reminders ?? true}
                      onChange={handleToggle('study_reminders')}
                      disabled={!prefs.notifications_enabled}
                    />
                  }
                  label="Study reminders"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={prefs.flashcard_reminders ?? true}
                      onChange={handleToggle('flashcard_reminders')}
                      disabled={!prefs.notifications_enabled}
                    />
                  }
                  label="Flashcard review reminders"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={prefs.daily_goal_reminders ?? true}
                      onChange={handleToggle('daily_goal_reminders')}
                      disabled={!prefs.notifications_enabled}
                    />
                  }
                  label="Daily goal reminders"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={prefs.streak_warning ?? true}
                      onChange={handleToggle('streak_warning')}
                      disabled={!prefs.notifications_enabled}
                    />
                  }
                  label="Streak at risk warnings"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={prefs.level_up_notifications ?? true}
                      onChange={handleToggle('level_up_notifications')}
                      disabled={!prefs.notifications_enabled}
                    />
                  }
                  label="Level up notifications"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Editor Settings */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                ✏️ Editor Settings
              </Typography>
              
              <Stack spacing={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Font Size: {prefs.editor_font_size || 16}px
                  </Typography>
                  <Slider
                    value={prefs.editor_font_size || 16}
                    onChange={(_, value) => handleChange('editor_font_size', value)}
                    min={12}
                    max={24}
                    step={1}
                    marks={[
                      { value: 12, label: '12' },
                      { value: 16, label: '16' },
                      { value: 20, label: '20' },
                      { value: 24, label: '24' },
                    ]}
                  />
                </Box>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={prefs.editor_autosave ?? true}
                      onChange={handleToggle('editor_autosave')}
                    />
                  }
                  label="Auto-save notes"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={prefs.spell_check ?? true}
                      onChange={handleToggle('spell_check')}
                    />
                  }
                  label="Spell check"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Flashcard & Quiz Settings */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                🃏 Flashcard & Quiz Settings
              </Typography>
              
              <Stack spacing={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Cards per session: {prefs.cards_per_session || 20}
                  </Typography>
                  <Slider
                    value={prefs.cards_per_session || 20}
                    onChange={(_, value) => handleChange('cards_per_session', value)}
                    min={5}
                    max={100}
                    step={5}
                  />
                </Box>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={prefs.card_shuffle ?? true}
                      onChange={handleToggle('card_shuffle')}
                    />
                  }
                  label="Shuffle flashcards"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={prefs.show_explanations ?? true}
                      onChange={handleToggle('show_explanations')}
                    />
                  }
                  label="Show quiz explanations"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={prefs.allow_retry ?? true}
                      onChange={handleToggle('allow_retry')}
                    />
                  }
                  label="Allow quiz retry"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Brainrot Mode Settings */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                🧠 Brainrot Mode
              </Typography>
              
              <Stack spacing={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Default Video</InputLabel>
                  <Select
                    value={prefs.brainrot_default_video || 'subway-surfers'}
                    label="Default Video"
                    onChange={(e) => handleChange('brainrot_default_video', e.target.value)}
                  >
                    <MenuItem value="subway-surfers">🚇 Subway Surfers</MenuItem>
                    <MenuItem value="minecraft-parkour">⛏️ Minecraft Parkour</MenuItem>
                    <MenuItem value="satisfying">✨ Satisfying Compilations</MenuItem>
                    <MenuItem value="asmr">🎧 ASMR</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl fullWidth size="small">
                  <InputLabel>Layout</InputLabel>
                  <Select
                    value={prefs.brainrot_layout || 'split'}
                    label="Layout"
                    onChange={(e) => handleChange('brainrot_layout', e.target.value)}
                  >
                    <MenuItem value="split">Split Screen</MenuItem>
                    <MenuItem value="pip">Picture-in-Picture</MenuItem>
                    <MenuItem value="background">Background Only</MenuItem>
                  </Select>
                </FormControl>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Video Opacity: {prefs.brainrot_opacity || 70}%
                  </Typography>
                  <Slider
                    value={prefs.brainrot_opacity || 70}
                    onChange={(_, value) => handleChange('brainrot_opacity', value)}
                    min={20}
                    max={100}
                    step={5}
                  />
                </Box>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={prefs.brainrot_mute_video ?? true}
                      onChange={handleToggle('brainrot_mute_video')}
                    />
                  }
                  label="Mute video audio"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Privacy Settings */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                🔒 Privacy
              </Typography>
              
              <Stack spacing={1}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={prefs.share_anonymous_data ?? true}
                      onChange={handleToggle('share_anonymous_data')}
                    />
                  }
                  label="Share anonymous usage data"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={prefs.personalized_suggestions ?? true}
                      onChange={handleToggle('personalized_suggestions')}
                    />
                  }
                  label="Personalized study suggestions"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={prefs.show_online_status ?? false}
                      onChange={handleToggle('show_online_status')}
                    />
                  }
                  label="Show online status"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Data & Account */}
        <Grid item xs={12}>
          <Card elevation={0} sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                💾 Data & Account
              </Typography>
              
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => exportMutation.mutate()}
                  disabled={exportMutation.isPending}
                >
                  {exportMutation.isPending ? 'Exporting...' : 'Export My Data'}
                </Button>
                
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<WarningIcon />}
                  onClick={() => setResetDialog(true)}
                >
                  Reset Progress
                </Button>
                
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteDialog(true)}
                >
                  Delete Account
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        {/* FAQ */}
        <Grid item xs={12}>
          <Card elevation={0} sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                ❓ FAQ
              </Typography>
              {faqItems.map((item) => (
                <Accordion key={item.question} elevation={0} sx={{ bgcolor: 'transparent' }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography fontWeight={600}>{item.question}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary">
                      {item.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Reset Progress Dialog */}
      <Dialog open={resetDialog} onClose={() => setResetDialog(false)}>
        <DialogTitle sx={{ color: 'warning.main' }}>
          ⚠️ Reset All Progress?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will reset your XP, level, streak, and all study statistics. 
            Your notes, flashcards, and quizzes will NOT be deleted.
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialog(false)}>Cancel</Button>
          <Button
            color="warning"
            variant="contained"
            onClick={() => resetMutation.mutate()}
            disabled={resetMutation.isPending}
          >
            {resetMutation.isPending ? 'Resetting...' : 'Reset Progress'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Account Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle sx={{ color: 'error.main' }}>
          🚨 Delete Account Permanently?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            This will permanently delete your account and ALL your data including 
            notes, flashcards, quizzes, and progress. This action CANNOT be undone.
          </DialogContentText>
          <TextField
            fullWidth
            label="Type DELETE to confirm"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            error={deleteConfirm.length > 0 && deleteConfirm !== 'DELETE'}
            helperText="Type DELETE in all caps to confirm"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteDialog(false); setDeleteConfirm(''); }}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteConfirm !== 'DELETE' || deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Account Forever'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
};

const faqItems = [
  {
    question: 'How do I change study rooms?',
    answer: 'Use the study room cards on the dashboard or the Theme section above. Each room changes the entire theme and ambient vibe.',
  },
  {
    question: 'When do I earn XP and rewards?',
    answer: 'You earn XP for completing study sessions, reviewing flashcards, taking quizzes, and maintaining your streak. Rewards drop automatically after achievements!',
  },
  {
    question: 'How does spaced repetition work?',
    answer: 'Flashcards use the SM-2 algorithm. Cards you know well appear less frequently, while difficult cards show up more often to help you learn efficiently.',
  },
  {
    question: 'What is Brainrot Mode?',
    answer: 'Brainrot Mode plays satisfying background videos (like Subway Surfers) while you study. It keeps the visual cortex occupied, helping some people focus better.',
  },
  {
    question: 'How do I replay the tutorial?',
    answer: 'Click the "View tutorial" button in the Theme section above.',
  },
  {
    question: 'Can I export my data?',
    answer: 'Yes! Click "Export My Data" in the Data & Account section to download all your notes, flashcards, and progress as a JSON file.',
  },
];

export default SettingsPage;
