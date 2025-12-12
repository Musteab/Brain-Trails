import { useEffect, useState } from 'react';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';

import { useGamification } from '../../context/GamificationContext';
import { roomThemes } from '../../theme';

const SETTINGS_KEY = 'braintrails_settings';

const defaultSettings = {
  notifications: true,
  weeklyRecap: false,
};

const SettingsPage = () => {
  const { selectedRoom, setSelectedRoom, openTutorial } = useGamification();
  const [settings, setSettings] = useState(() => {
    if (typeof window === 'undefined') return defaultSettings;
    try {
      return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
    } catch {
      return defaultSettings;
    }
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const handleToggle = (key) => (_, checked) => {
    setSettings((prev) => ({ ...prev, [key]: checked }));
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h4" fontWeight={700}>
        Settings & FAQ
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Notifications
              </Typography>
              <Stack spacing={1.5}>
                <FormControlLabel
                  control={<Switch checked={settings.notifications} onChange={handleToggle('notifications')} />}
                  label="Enable study reminders"
                />
                <FormControlLabel
                  control={<Switch checked={settings.weeklyRecap} onChange={handleToggle('weeklyRecap')} />}
                  label="Send me a weekly progress recap"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Theme preferences
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Pick your default study room. The entire interface adapts instantly.
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {Object.values(roomThemes).map((room) => (
                  <Button
                    key={room.id}
                    variant={room.id === selectedRoom ? 'contained' : 'outlined'}
                    onClick={() => setSelectedRoom(room.id)}
                  >
                    {room.accentIcon} {room.label}
                  </Button>
                ))}
              </Stack>
              <Button sx={{ mt: 3 }} onClick={openTutorial}>
                View daily tutorial
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                FAQ
              </Typography>
              {faqItems.map((item) => (
                <Accordion key={item.question}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography fontWeight={600}>{item.question}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2">{item.answer}</Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
};

const faqItems = [
  {
    question: 'How do I change study rooms?',
    answer: 'Use the study room cards on the dashboard or the selector above. Each room changes the entire theme and ambient vibe.',
  },
  {
    question: 'When do I earn rewards?',
    answer: 'Rewards drop automatically on your first login each day and randomly after intense study bursts. You can also trigger a manual pull.',
  },
  {
    question: 'How do I replay the tutorial?',
    answer: 'Use the "View daily tutorial" button on this settings page. The tutorial also appears automatically once per day.',
  },
];

export default SettingsPage;
