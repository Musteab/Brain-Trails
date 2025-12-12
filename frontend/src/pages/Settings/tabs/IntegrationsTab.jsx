/**
 * Integrations Tab
 * Music services, calendars, productivity tools
 */
import {
  Box,
  Button,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import {
  Check as CheckIcon,
  Link as LinkIcon,
  LinkOff as UnlinkIcon,
} from '@mui/icons-material';

import { SettingSection, SettingRow } from '../components/SettingComponents';

// Integration config
const INTEGRATIONS = {
  music: [
    {
      id: 'spotify',
      name: 'Spotify',
      icon: '🎵',
      description: 'Play music while studying',
      connected: false, // TODO: Get from backend
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: '📺',
      description: 'Background videos and music',
      connected: false,
    },
    {
      id: 'apple-music',
      name: 'Apple Music',
      icon: '🍎',
      description: 'Play Apple Music playlists',
      connected: false,
      disabled: true,
    },
  ],
  calendar: [
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      icon: '📅',
      description: 'Sync study sessions to your calendar',
      connected: false,
      disabled: true,
    },
    {
      id: 'outlook',
      name: 'Outlook Calendar',
      icon: '📧',
      description: 'Sync with Microsoft Outlook',
      connected: false,
      disabled: true,
    },
  ],
  productivity: [
    {
      id: 'notion',
      name: 'Notion',
      icon: '📓',
      description: 'Import notes from Notion',
      connected: false,
      disabled: true,
    },
    {
      id: 'todoist',
      name: 'Todoist',
      icon: '✅',
      description: 'Sync tasks and to-dos',
      connected: false,
      disabled: true,
    },
  ],
  study: [
    {
      id: 'quizlet',
      name: 'Quizlet',
      icon: '🎴',
      description: 'Import flashcard decks',
      connected: false,
      disabled: true,
    },
    {
      id: 'anki',
      name: 'Anki',
      icon: '🃏',
      description: 'Import Anki decks',
      connected: false,
      disabled: true,
    },
  ],
};

function IntegrationItem({ integration, onConnect, onDisconnect }) {
  const { name, icon, description, connected, disabled } = integration;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 2,
        borderBottom: 1,
        borderColor: 'divider',
        '&:last-child': { borderBottom: 0 },
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="h5">{icon}</Typography>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body1" fontWeight="medium">
              {name}
            </Typography>
            {connected && (
              <Chip
                icon={<CheckIcon />}
                label="Connected"
                size="small"
                color="success"
              />
            )}
            {disabled && (
              <Chip label="Coming Soon" size="small" variant="outlined" />
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {description}
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" spacing={1}>
        {connected ? (
          <>
            <Button size="small" variant="outlined" disabled={disabled}>
              Configure
            </Button>
            <Button
              size="small"
              color="error"
              startIcon={<UnlinkIcon />}
              onClick={() => onDisconnect?.(integration)}
              disabled={disabled}
            >
              Disconnect
            </Button>
          </>
        ) : (
          <Button
            size="small"
            variant="contained"
            startIcon={<LinkIcon />}
            onClick={() => onConnect?.(integration)}
            disabled={disabled}
          >
            Connect
          </Button>
        )}
      </Stack>
    </Box>
  );
}

export default function IntegrationsTab() {
  const handleConnect = (integration) => {
    if (integration.id === 'spotify') {
      // TODO: Implement Spotify OAuth
      window.open('/api/auth/spotify', '_blank');
    } else if (integration.id === 'youtube') {
      // YouTube doesn't need OAuth for embedding
    }
  };

  const handleDisconnect = (integration) => {
    // TODO: Implement disconnect
    console.log('Disconnect:', integration.id);
  };

  return (
    <Box>
      {/* Music Services */}
      <SettingSection
        title="Music Services"
        description="Connect music services for study sessions"
      >
        {INTEGRATIONS.music.map((int) => (
          <IntegrationItem
            key={int.id}
            integration={int}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        ))}
      </SettingSection>

      {/* Calendar */}
      <SettingSection
        title="Calendar"
        description="Sync your study schedule"
      >
        {INTEGRATIONS.calendar.map((int) => (
          <IntegrationItem
            key={int.id}
            integration={int}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        ))}
      </SettingSection>

      {/* Productivity */}
      <SettingSection
        title="Productivity Tools"
        description="Connect your favorite productivity apps"
      >
        {INTEGRATIONS.productivity.map((int) => (
          <IntegrationItem
            key={int.id}
            integration={int}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        ))}
      </SettingSection>

      {/* Study Tools */}
      <SettingSection
        title="Study Tools"
        description="Import from other study platforms"
      >
        {INTEGRATIONS.study.map((int) => (
          <IntegrationItem
            key={int.id}
            integration={int}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        ))}
      </SettingSection>
    </Box>
  );
}
