import { useEffect, useState } from 'react';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import { Close } from '@mui/icons-material';

import { buildYouTubeEmbedUrl } from '../../utils/youtube';

const STORAGE_KEY = 'braintrails_brainrot_pip';

const getInitialState = () => {
  if (typeof window === 'undefined') {
    return { active: false, videoId: null, label: '' };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { active: false, videoId: null, label: '' };
    return JSON.parse(raw);
  } catch {
    return { active: false, videoId: null, label: '' };
  }
};

const BrainrotPiPPortal = () => {
  const [pip, setPip] = useState(getInitialState);

  useEffect(() => {
    const handleOpen = (event) => {
      const detail = event.detail || {};
      if (!detail.videoId) return;
      const next = { active: true, videoId: detail.videoId, label: detail.label || 'Brainrot PiP' };
      setPip(next);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    };
    const handleClose = () => {
      setPip((prev) => {
        const next = { ...prev, active: false };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    };
    window.addEventListener('brainrot:pip', handleOpen);
    window.addEventListener('brainrot:pip-close', handleClose);
    return () => {
      window.removeEventListener('brainrot:pip', handleOpen);
      window.removeEventListener('brainrot:pip-close', handleClose);
    };
  }, []);

  if (!pip.active || !pip.videoId) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 100,
        right: 24,
        width: { xs: 260, md: 320 },
        borderRadius: 3,
        bgcolor: '#050505',
        boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
        overflow: 'hidden',
        zIndex: 1200,
        transition: 'transform 0.3s ease, opacity 0.3s ease',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" px={2} py={1}>
        <Typography variant="caption" color="#fff" fontWeight={600}>
          {pip.label || 'Brainrot PiP'}
        </Typography>
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" sx={{ color: '#fff' }} onClick={() => window.dispatchEvent(new Event('brainrot:pip-close'))}>
            <Close fontSize="inherit" />
          </IconButton>
        </Stack>
      </Stack>
      <Box
        component="iframe"
        src={buildYouTubeEmbedUrl(pip.videoId)}
        title="Brainrot PiP video"
        sx={{ width: '100%', height: 180, border: 0 }}
        allow="autoplay; encrypted-media; picture-in-picture"
      />
    </Box>
  );
};

export default BrainrotPiPPortal;
