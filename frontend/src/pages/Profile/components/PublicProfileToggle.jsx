import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import {
  Public as PublicIcon,
  Lock as PrivateIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useState } from 'react';

export default function PublicProfileToggle({ 
  isPublic, 
  username, 
  onToggle, 
  loading 
}) {
  const [copied, setCopied] = useState(false);
  
  const publicUrl = `${window.location.origin}/@${username}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          {isPublic ? (
            <PublicIcon color="success" />
          ) : (
            <PrivateIcon color="action" />
          )}
          <Typography variant="h6">
            Profile Visibility
          </Typography>
        </Stack>
        <Switch
          checked={isPublic}
          onChange={(e) => onToggle(e.target.checked)}
          disabled={loading}
          color="success"
        />
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {isPublic 
          ? 'Your profile is public. Anyone with the link can see your achievements and stats.'
          : 'Your profile is private. Only you can see your profile details.'
        }
      </Typography>

      {isPublic && (
        <>
          <Alert severity="info" sx={{ mb: 2 }}>
            Your public profile is live! Share your achievements with friends.
          </Alert>
          
          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: 'action.hover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {publicUrl}
            </Typography>
            <Button
              size="small"
              variant="contained"
              startIcon={copied ? <CheckIcon /> : <CopyIcon />}
              onClick={handleCopy}
              color={copied ? 'success' : 'primary'}
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
}
