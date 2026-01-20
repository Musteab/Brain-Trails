/**
 * Account Settings Tab
 * Username, email, password, security
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';

import api from '../../../api/client';
import { SettingSection, SettingRow } from '../components/SettingComponents';

export default function AccountTab({ account }) {
  const queryClient = useQueryClient();
  const [editField, setEditField] = useState(null);
  const [fieldValue, setFieldValue] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Update username mutation
  const updateUsernameMutation = useMutation({
    mutationFn: async (username) => {
      const res = await api.patch('/settings/account/username', { username });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'account'] });
      setEditField(null);
      setSuccess('Username updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to update username');
    },
  });

  // Update email mutation
  const updateEmailMutation = useMutation({
    mutationFn: async (email) => {
      const res = await api.patch('/settings/account/email', { email });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'account'] });
      setEditField(null);
      setSuccess('Email updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to update email');
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async ({ current_password, new_password }) => {
      const res = await api.patch('/settings/account/password', {
        current_password,
        new_password,
      });
      return res.data;
    },
    onSuccess: () => {
      setEditField(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to update password');
    },
  });

  const handleEditClick = (field, value) => {
    setEditField(field);
    setFieldValue(value);
    setError('');
  };

  const handleSave = () => {
    setError('');
    
    if (editField === 'username') {
      if (fieldValue.length < 3) {
        setError('Username must be at least 3 characters');
        return;
      }
      updateUsernameMutation.mutate(fieldValue);
    } else if (editField === 'email') {
      if (!fieldValue.includes('@')) {
        setError('Please enter a valid email');
        return;
      }
      updateEmailMutation.mutate(fieldValue);
    } else if (editField === 'password') {
      if (newPassword.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      updatePasswordMutation.mutate({
        current_password: currentPassword,
        new_password: newPassword,
      });
    }
  };

  const isLoading = 
    updateUsernameMutation.isPending || 
    updateEmailMutation.isPending || 
    updatePasswordMutation.isPending;

  return (
    <Box>
      {success && (
        <Alert severity="success" icon={<CheckIcon />} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <SettingSection title="Profile Information">
        <SettingRow label="Username">
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {account?.username}
            </Typography>
            <Button size="small" onClick={() => handleEditClick('username', account?.username)}>
              Change
            </Button>
          </Stack>
        </SettingRow>

        <SettingRow label="Email">
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {account?.email}
            </Typography>
            <Button size="small" onClick={() => handleEditClick('email', account?.email)}>
              Change
            </Button>
          </Stack>
        </SettingRow>
      </SettingSection>

      <SettingSection title="Security">
        <SettingRow label="Password">
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              ••••••••••
            </Typography>
            <Button size="small" onClick={() => handleEditClick('password', '')}>
              Change
            </Button>
          </Stack>
        </SettingRow>

        <SettingRow label="Two-Factor Authentication">
          <Stack direction="row" spacing={1} alignItems="center">
            <WarningIcon color="warning" fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              Not enabled
            </Typography>
            <Button size="small" disabled>
              Enable
            </Button>
          </Stack>
        </SettingRow>
      </SettingSection>

      <SettingSection title="Account Info">
        <Typography variant="body2" color="text.secondary">
          Account created: {account?.created_at 
            ? new Date(account.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'Unknown'
          }
        </Typography>
      </SettingSection>

      {/* Edit Dialog */}
      <Dialog 
        open={!!editField} 
        onClose={() => setEditField(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {editField === 'username' && 'Change Username'}
          {editField === 'email' && 'Change Email'}
          {editField === 'password' && 'Change Password'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {editField === 'username' && (
            <TextField
              label="New Username"
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
              fullWidth
              autoFocus
              sx={{ mt: 1 }}
            />
          )}

          {editField === 'email' && (
            <TextField
              label="New Email"
              type="email"
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
              fullWidth
              autoFocus
              sx={{ mt: 1 }}
            />
          )}

          {editField === 'password' && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                fullWidth
                autoFocus
              />
              <TextField
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                fullWidth
                helperText="Minimum 8 characters"
              />
              <TextField
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                fullWidth
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditField(null)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
