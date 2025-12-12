import { useEffect, useState } from 'react';
import { Box, CircularProgress, Paper, Typography } from '@mui/material';

import { exchangeCodeForToken, storeSpotifyAuth } from '../../utils/spotify';

const SpotifyCallback = () => {
  const [status, setStatus] = useState('Connecting to Spotify...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');
    const state = params.get('state');
    if (error) {
      setStatus(`Spotify error: ${error}`);
      return;
    }
    if (!code) {
      setStatus('Missing authorization code.');
      return;
    }
    const connect = async () => {
      try {
        const payload = await exchangeCodeForToken(code, state);
        storeSpotifyAuth(payload);
        setStatus('Connected! Redirecting back to BrainTrails...');
        setTimeout(() => {
          window.location.assign('/dashboard?spotify=connected');
        }, 1200);
      } catch (connectionError) {
        setStatus(connectionError.message || 'Unable to link Spotify. Please try again.');
      }
    };
    connect();
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 420 }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="h6" fontWeight={700} gutterBottom>
          {status}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          You can close this window after the connection completes.
        </Typography>
      </Paper>
    </Box>
  );
};

export default SpotifyCallback;
