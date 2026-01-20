/**
 * Privacy Tab
 * Profile privacy, data settings, social features
 */
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Divider,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';

import api from '../../../api/client';
import { SettingSection, SettingToggle, SettingRow } from '../components/SettingComponents';

export default function PrivacyTab({ preferences }) {
  const queryClient = useQueryClient();
  const [localPrefs, setLocalPrefs] = useState(preferences || {});
  const [success, setSuccess] = useState('');
  const [exporting, setExporting] = useState(false);

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
      setSuccess('Privacy settings saved');
      setTimeout(() => setSuccess(''), 2000);
    },
  });

  const handleChange = (key, value) => {
    setLocalPrefs((prev) => ({ ...prev, [key]: value }));
    updateMutation.mutate({ [key]: value });
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await api.post('/settings/export-data');
      
      // Create download
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `braintrails-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccess('Data exported successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box>
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Profile Privacy */}
      <SettingSection 
        title="Profile Privacy"
        description="Control who can see your profile"
      >
        <SettingToggle
          label="Public profile"
          description="Allow anyone with your link to view your profile"
          checked={localPrefs.public_profile ?? false}
          onChange={(val) => handleChange('public_profile', val)}
        />

        <Divider sx={{ my: 1 }} />

        <SettingToggle
          label="Show activity"
          description="Display your recent activity on public profile"
          checked={localPrefs.show_activity ?? true}
          onChange={(val) => handleChange('show_activity', val)}
          disabled={!localPrefs.public_profile}
        />

        <SettingToggle
          label="Show achievements"
          description="Display your unlocked achievements"
          checked={localPrefs.show_achievements ?? true}
          onChange={(val) => handleChange('show_achievements', val)}
          disabled={!localPrefs.public_profile}
        />

        <SettingToggle
          label="Show study stats"
          description="Display your study statistics"
          checked={localPrefs.show_stats ?? true}
          onChange={(val) => handleChange('show_stats', val)}
          disabled={!localPrefs.public_profile}
        />
      </SettingSection>

      {/* Data & Analytics */}
      <SettingSection 
        title="Data & Analytics"
        description="Control how your data is used"
      >
        <SettingToggle
          label="Share anonymous usage data"
          description="Help improve BrainTrails by sharing anonymous usage statistics"
          checked={localPrefs.share_anonymous_data ?? true}
          onChange={(val) => handleChange('share_anonymous_data', val)}
        />

        <SettingToggle
          label="Personalized suggestions"
          description="Get study recommendations based on your patterns"
          checked={localPrefs.personalized_suggestions ?? true}
          onChange={(val) => handleChange('personalized_suggestions', val)}
        />

        <Divider sx={{ my: 2 }} />

        <SettingRow label="Export my data">
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleExportData}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Download JSON'}
          </Button>
        </SettingRow>
      </SettingSection>

      {/* Social */}
      <SettingSection 
        title="Social Features"
        description="Control social interactions"
      >
        <SettingToggle
          label="Allow study buddy requests"
          description="Let others send you buddy requests"
          checked={localPrefs.allow_buddy_requests ?? true}
          onChange={(val) => handleChange('allow_buddy_requests', val)}
        />

        <SettingToggle
          label="Show online status"
          description="Let others see when you're online"
          checked={localPrefs.show_online_status ?? false}
          onChange={(val) => handleChange('show_online_status', val)}
        />

        <SettingToggle
          label="Allow mentions"
          description="Let others mention you in comments"
          checked={localPrefs.allow_mentions ?? true}
          onChange={(val) => handleChange('allow_mentions', val)}
        />
      </SettingSection>
    </Box>
  );
}
