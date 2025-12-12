/**
 * Settings Page - Tabbed settings interface
 * Account, Preferences, Notifications, Privacy, Integrations, Danger Zone
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  Container,
  Paper,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Person as AccountIcon,
  Tune as PreferencesIcon,
  Notifications as NotificationsIcon,
  Security as PrivacyIcon,
  Extension as IntegrationsIcon,
  Warning as DangerIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import api from '../../api/client';
import AccountTab from './tabs/AccountTab';
import PreferencesTab from './tabs/PreferencesTab';
import NotificationsTab from './tabs/NotificationsTab';
import PrivacyTab from './tabs/PrivacyTab';
import IntegrationsTab from './tabs/IntegrationsTab';
import DangerZoneTab from './tabs/DangerZoneTab';

const TABS = [
  { id: 'account', label: 'Account', icon: <AccountIcon /> },
  { id: 'preferences', label: 'Preferences', icon: <PreferencesIcon /> },
  { id: 'notifications', label: 'Notifications', icon: <NotificationsIcon /> },
  { id: 'privacy', label: 'Privacy', icon: <PrivacyIcon /> },
  { id: 'integrations', label: 'Integrations', icon: <IntegrationsIcon /> },
  { id: 'danger', label: 'Danger Zone', icon: <DangerIcon /> },
];

function TabPanel({ children, value, index }) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      sx={{ py: 3 }}
    >
      {value === index && children}
    </Box>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);

  // Fetch account info
  const { data: accountData } = useQuery({
    queryKey: ['settings', 'account'],
    queryFn: async () => {
      const res = await api.get('/api/settings/account');
      return res.data;
    },
  });

  // Fetch preferences
  const { data: preferencesData } = useQuery({
    queryKey: ['settings', 'preferences'],
    queryFn: async () => {
      const res = await api.get('/api/settings/preferences');
      return res.data;
    },
  });

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" fontWeight="bold">
          Settings
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          scrollButtons={isMobile ? 'auto' : false}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
            },
          }}
        >
          {TABS.map((tab, index) => (
            <Tab
              key={tab.id}
              icon={tab.icon}
              label={tab.label}
              iconPosition="start"
              sx={{
                color: tab.id === 'danger' ? 'error.main' : 'inherit',
              }}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={activeTab} index={0}>
        <AccountTab account={accountData} />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <PreferencesTab preferences={preferencesData?.preferences} />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <NotificationsTab preferences={preferencesData?.preferences} />
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <PrivacyTab preferences={preferencesData?.preferences} />
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        <IntegrationsTab />
      </TabPanel>

      <TabPanel value={activeTab} index={5}>
        <DangerZoneTab />
      </TabPanel>
    </Container>
  );
}
