/**
 * Video Selector Component
 * Browse and select background videos
 */
import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';

import VIDEO_PRESETS, { getYouTubeThumbnail } from '../presets/videoPresets';

function VideoCard({ video, category, selected, onSelect, onFavorite, isFavorite }) {
  return (
    <Card
      sx={{
        cursor: 'pointer',
        border: 2,
        borderColor: selected ? 'primary.main' : 'transparent',
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
      onClick={() => onSelect(video)}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="120"
          image={getYouTubeThumbnail(video.youtubeId)}
          alt={video.title}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0,0,0,0.3)',
            opacity: 0,
            transition: 'opacity 0.2s',
            '&:hover': { opacity: 1 },
          }}
        >
          <PlayIcon sx={{ fontSize: 48, color: 'white' }} />
        </Box>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onFavorite?.(video);
          }}
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            bgcolor: 'rgba(0,0,0,0.5)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
          }}
        >
          {isFavorite ? (
            <FavoriteIcon sx={{ color: 'error.main' }} fontSize="small" />
          ) : (
            <FavoriteBorderIcon sx={{ color: 'white' }} fontSize="small" />
          )}
        </IconButton>
        {selected && (
          <Chip
            label="Selected"
            color="primary"
            size="small"
            sx={{
              position: 'absolute',
              bottom: 4,
              left: 4,
            }}
          />
        )}
      </Box>
      <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
        <Typography variant="body2" noWrap fontWeight="medium">
          {video.title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {video.duration}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function VideoSelector({
  open,
  onClose,
  selectedVideo,
  onSelectVideo,
  favorites = [],
  onToggleFavorite,
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [customUrl, setCustomUrl] = useState('');

  const categories = Object.values(VIDEO_PRESETS);

  const handleCustomUrl = () => {
    // Extract YouTube ID from URL
    const match = customUrl.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/
    );
    if (match) {
      const youtubeId = match[1];
      onSelectVideo({
        id: `custom-${youtubeId}`,
        title: 'Custom Video',
        youtubeId,
        category: 'custom',
      });
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Choose Background Video</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        {/* Category Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          {categories.map((cat, idx) => (
            <Tab
              key={cat.id}
              label={
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <span>{cat.emoji}</span>
                  <span>{cat.name}</span>
                </Stack>
              }
            />
          ))}
          <Tab label="📌 Favorites" />
          <Tab label="🔗 Custom URL" />
        </Tabs>

        {/* Category Videos */}
        {activeTab < categories.length && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {categories[activeTab].description}
            </Typography>
            <Grid container spacing={2}>
              {categories[activeTab].videos.map((video) => (
                <Grid item xs={6} sm={4} md={3} key={video.id}>
                  <VideoCard
                    video={video}
                    category={categories[activeTab]}
                    selected={selectedVideo?.id === video.id}
                    onSelect={onSelectVideo}
                    onFavorite={onToggleFavorite}
                    isFavorite={favorites.some((f) => f.id === video.id)}
                  />
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {/* Favorites Tab */}
        {activeTab === categories.length && (
          <>
            {favorites.length > 0 ? (
              <Grid container spacing={2}>
                {favorites.map((video) => (
                  <Grid item xs={6} sm={4} md={3} key={video.id}>
                    <VideoCard
                      video={video}
                      selected={selectedVideo?.id === video.id}
                      onSelect={onSelectVideo}
                      onFavorite={onToggleFavorite}
                      isFavorite
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h5" sx={{ mb: 1 }}>❤️</Typography>
                <Typography color="text.secondary">
                  No favorites yet. Click the heart icon on any video to save it.
                </Typography>
              </Box>
            )}
          </>
        )}

        {/* Custom URL Tab */}
        {activeTab === categories.length + 1 && (
          <Box sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Paste any YouTube video URL to use as background
            </Typography>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                placeholder="https://www.youtube.com/watch?v=..."
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                size="small"
              />
              <Button
                variant="contained"
                onClick={handleCustomUrl}
                disabled={!customUrl}
              >
                Use Video
              </Button>
            </Stack>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
