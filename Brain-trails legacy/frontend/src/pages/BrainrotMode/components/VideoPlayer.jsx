/**
 * Video Player Component
 * Embeds YouTube video with controls
 */
import { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Slider,
  Stack,
  Typography,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeIcon,
  VolumeOff as MuteIcon,
  Fullscreen as FullscreenIcon,
} from '@mui/icons-material';

import { getYouTubeEmbedUrl } from '../presets/videoPresets';

export default function VideoPlayer({
  youtubeId,
  muted = true,
  autoplay = true,
  onVolumeChange,
  opacity = 100,
  showControls = true,
}) {
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isMuted, setIsMuted] = useState(muted);
  const [volume, setVolume] = useState(muted ? 0 : 50);

  // Build embed URL with current settings
  const embedUrl = getYouTubeEmbedUrl(youtubeId, {
    autoplay: isPlaying,
    muted: isMuted,
    loop: true,
    controls: false,
  });

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    if (isMuted) {
      setVolume(50);
    }
    onVolumeChange?.(!isMuted);
  };

  const handleVolumeChange = (_, newValue) => {
    setVolume(newValue);
    setIsMuted(newValue === 0);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        bgcolor: 'black',
        borderRadius: 2,
        overflow: 'hidden',
        opacity: opacity / 100,
      }}
    >
      {/* Video iframe */}
      <iframe
        src={embedUrl}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Brainrot Video"
      />

      {/* Custom Controls Overlay */}
      {showControls && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 1,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
            opacity: 0,
            transition: 'opacity 0.3s',
            '&:hover': { opacity: 1 },
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton
              size="small"
              onClick={() => setIsPlaying(!isPlaying)}
              sx={{ color: 'white' }}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </IconButton>

            <IconButton
              size="small"
              onClick={handleMuteToggle}
              sx={{ color: 'white' }}
            >
              {isMuted ? <MuteIcon /> : <VolumeIcon />}
            </IconButton>

            <Slider
              value={volume}
              onChange={handleVolumeChange}
              size="small"
              sx={{
                width: 80,
                color: 'white',
                '& .MuiSlider-thumb': { width: 12, height: 12 },
              }}
            />

            <Box sx={{ flex: 1 }} />

            <Typography variant="caption" sx={{ color: 'white', opacity: 0.7 }}>
              Brainrot Mode
            </Typography>
          </Stack>
        </Box>
      )}
    </Box>
  );
}
