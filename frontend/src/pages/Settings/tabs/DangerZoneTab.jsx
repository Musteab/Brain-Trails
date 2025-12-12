/**
 * Danger Zone Tab
 * Reset progress, delete data, delete account
 */
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
  DeleteForever as DeleteIcon,
  RestartAlt as ResetIcon,
} from '@mui/icons-material';

import api from '../../../api/client';
import { useAuth } from '../../../context/AuthContext';

export default function DangerZoneTab() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reset progress mutation
  const resetMutation = useMutation({
    mutationFn: async (type) => {
      const res = await api.post('/api/settings/reset-progress', { type });
      return res.data;
    },
    onSuccess: (data) => {
      setConfirmDialog(null);
      setSuccess(data.message);
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Reset failed');
    },
  });

  // Delete study sessions mutation
  const deleteSessionsMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete('/api/settings/delete-study-sessions');
      return res.data;
    },
    onSuccess: (data) => {
      setConfirmDialog(null);
      setSuccess(data.message);
      setTimeout(() => setSuccess(''), 3000);
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async (password) => {
      const res = await api.delete('/api/settings/account', { 
        data: { password } 
      });
      return res.data;
    },
    onSuccess: () => {
      logout();
      navigate('/login');
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to delete account');
    },
  });

  const handleConfirm = () => {
    setError('');
    
    switch (confirmDialog) {
      case 'reset-streak':
        resetMutation.mutate('streak');
        break;
      case 'reset-xp':
        resetMutation.mutate('xp');
        break;
      case 'reset-all':
        resetMutation.mutate('all');
        break;
      case 'delete-sessions':
        deleteSessionsMutation.mutate();
        break;
      case 'delete-account':
        if (!password) {
          setError('Password is required');
          return;
        }
        deleteAccountMutation.mutate(password);
        break;
      default:
        break;
    }
  };

  const isLoading = 
    resetMutation.isPending || 
    deleteSessionsMutation.isPending || 
    deleteAccountMutation.isPending;

  return (
    <Box>
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
        <Typography variant="subtitle2">Danger Zone</Typography>
        <Typography variant="body2">
          Actions in this section cannot be undone. Please proceed with caution.
        </Typography>
      </Alert>

      {/* Reset Progress */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Reset Progress
        </Typography>

        <Stack spacing={2}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              borderRadius: 1,
              bgcolor: 'action.hover',
            }}
          >
            <Box>
              <Typography variant="body1">Reset daily streak</Typography>
              <Typography variant="caption" color="text.secondary">
                Set your current streak back to 0
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<ResetIcon />}
              onClick={() => setConfirmDialog('reset-streak')}
            >
              Reset
            </Button>
          </Box>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              borderRadius: 1,
              bgcolor: 'action.hover',
            }}
          >
            <Box>
              <Typography variant="body1">Reset XP & Level</Typography>
              <Typography variant="caption" color="text.secondary">
                Set your XP to 0 and level back to 1
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<ResetIcon />}
              onClick={() => setConfirmDialog('reset-xp')}
            >
              Reset
            </Button>
          </Box>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              borderRadius: 1,
              bgcolor: 'action.hover',
            }}
          >
            <Box>
              <Typography variant="body1">Reset all gamification</Typography>
              <Typography variant="caption" color="text.secondary">
                Reset XP, level, streak, and all achievements
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="error"
              startIcon={<ResetIcon />}
              onClick={() => setConfirmDialog('reset-all')}
            >
              Reset All
            </Button>
          </Box>
        </Stack>
      </Box>

      {/* Data Management */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Data Management
        </Typography>

        <Stack spacing={2}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              borderRadius: 1,
              bgcolor: 'action.hover',
            }}
          >
            <Box>
              <Typography variant="body1">Delete all study sessions</Typography>
              <Typography variant="caption" color="text.secondary">
                Remove all recorded study session data
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setConfirmDialog('delete-sessions')}
            >
              Delete
            </Button>
          </Box>
        </Stack>
      </Box>

      {/* Account Deletion */}
      <Box
        sx={{
          p: 3,
          borderRadius: 2,
          border: 2,
          borderColor: 'error.main',
          bgcolor: 'error.main',
          bgcolor: (theme) => 
            theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.1)' : 'rgba(211, 47, 47, 0.05)',
        }}
      >
        <Typography variant="h6" color="error" sx={{ mb: 1 }}>
          Delete Account
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Permanently delete your account and all associated data. This action cannot be undone.
          All your notes, flashcards, quizzes, and progress will be permanently deleted.
        </Typography>
        <Button
          variant="contained"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => setConfirmDialog('delete-account')}
        >
          Delete Account
        </Button>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={!!confirmDialog}
        onClose={() => {
          setConfirmDialog(null);
          setPassword('');
          setError('');
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <WarningIcon />
            <span>Confirm Action</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Typography variant="body1" sx={{ mb: 2 }}>
            {confirmDialog === 'reset-streak' && 'Are you sure you want to reset your streak?'}
            {confirmDialog === 'reset-xp' && 'Are you sure you want to reset your XP and level?'}
            {confirmDialog === 'reset-all' && 'Are you sure you want to reset ALL gamification progress?'}
            {confirmDialog === 'delete-sessions' && 'Are you sure you want to delete all study sessions?'}
            {confirmDialog === 'delete-account' && (
              <>
                <strong>This action is permanent.</strong> All your data will be permanently deleted
                and cannot be recovered. Please enter your password to confirm.
              </>
            )}
          </Typography>

          {confirmDialog === 'delete-account' && (
            <TextField
              label="Enter your password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              autoFocus
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setConfirmDialog(null);
              setPassword('');
              setError('');
            }}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
