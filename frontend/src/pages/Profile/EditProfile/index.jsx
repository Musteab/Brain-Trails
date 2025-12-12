/**
 * Edit Profile Modal
 * Allows users to update their profile info
 */
import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  PhotoCamera as CameraIcon,
} from '@mui/icons-material';

import api from '../../../api/client';

export default function EditProfileModal({ open, onClose, profile, onSave }) {
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || '');
  const fileInputRef = useRef(null);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.patch('/api/profile/me', data);
      return res.data;
    },
    onSuccess: () => {
      onSave?.();
    },
  });

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Preview the image
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result);
      };
      reader.readAsDataURL(file);
      
      // TODO: Upload to server and get URL
      // For now, we'll just use the preview
    }
  };

  const handleSave = () => {
    saveMutation.mutate({
      display_name: displayName,
      bio: bio,
      avatar_url: avatarPreview,
    });
  };

  // Reset form when profile changes
  const handleOpen = () => {
    setDisplayName(profile?.display_name || '');
    setBio(profile?.bio || '');
    setAvatarPreview(profile?.avatar_url || '');
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      TransitionProps={{ onEnter: handleOpen }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Edit Profile
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {/* Avatar Upload */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={avatarPreview}
                sx={{ width: 120, height: 120, cursor: 'pointer' }}
                onClick={handleAvatarClick}
              >
                {displayName?.[0] || profile?.username?.[0] || '?'}
              </Avatar>
              <IconButton
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: 'background.paper',
                  boxShadow: 2,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
                size="small"
                onClick={handleAvatarClick}
              >
                <CameraIcon fontSize="small" />
              </IconButton>
              <input
                type="file"
                ref={fileInputRef}
                hidden
                accept="image/*"
                onChange={handleFileChange}
              />
            </Box>
          </Box>

          {/* Display Name */}
          <TextField
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            fullWidth
            helperText="This is how your name will appear on your profile"
          />

          {/* Bio */}
          <Box>
            <TextField
              label="Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 200))}
              fullWidth
              multiline
              rows={3}
              placeholder="Tell us about yourself..."
            />
            <Typography 
              variant="caption" 
              color={bio.length >= 200 ? 'error' : 'text.secondary'}
              sx={{ float: 'right', mt: 0.5 }}
            >
              {bio.length}/200
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
