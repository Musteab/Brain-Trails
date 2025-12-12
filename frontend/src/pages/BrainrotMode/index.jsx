/**
 * Brainrot Mode - Main Page
 * Split-screen study mode with ambient video
 * "A legitimate study tool, not a gimmick"
 */
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  Chip,
  Collapse,
  Divider,
  Grid,
  IconButton,
  Paper,
  Slider,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Style as FlashcardsIcon,
  Quiz as QuizIcon,
  Book as NotesIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as ExitFullscreenIcon,
  Star as StarIcon,
  Opacity as OpacityIcon,
  VideoLibrary as VideoIcon,
} from '@mui/icons-material';
import api from '../../api/client';
import VideoPlayer from './components/VideoPlayer';
import VideoSelector from './components/VideoSelector';
import StudyTimer from './components/StudyTimer';
import { getVideoById, getYouTubeThumbnail } from './presets/videoPresets';

// Study mode content components
import FlashcardsStudy from './study/FlashcardsStudy';
import QuizStudy from './study/QuizStudy';
import NotesStudy from './study/NotesStudy';

const STUDY_MODES = [
  { id: 'flashcards', label: 'Flashcards', icon: FlashcardsIcon },
  { id: 'quiz', label: 'Quiz', icon: QuizIcon },
  { id: 'notes', label: 'Notes', icon: NotesIcon },
];

export default function BrainrotMode() {
  const theme = useTheme();
  const queryClient = useQueryClient();

  // Video state
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoSelectorOpen, setVideoSelectorOpen] = useState(false);
  const [videoOpacity, setVideoOpacity] = useState(0.4);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  // UI state
  const [studyMode, setStudyMode] = useState('flashcards');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [sessionActive, setSessionActive] = useState(false);

  // Fetch favorites
  const { data: favoritesData } = useQuery({
    queryKey: ['brainrot-favorites'],
    queryFn: () => api.get('/brainrot/favorites').then((res) => res.data),
  });
  
  const favorites = favoritesData?.favorites || [];

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['brainrot-stats'],
    queryFn: () => api.get('/brainrot/stats').then((res) => res.data),
  });

  // Log session mutation
  const logSession = useMutation({
    mutationFn: (data) => api.post('/brainrot/session', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['brainrot-stats']);
    },
  });

  // Handle video selection
  const handleVideoSelect = useCallback((video) => {
    setSelectedVideo(video);
    setVideoSelectorOpen(false);
    setIsPlaying(true);
  }, []);

  // Handle session completion
  const handleSessionComplete = useCallback((minutes) => {
    if (sessionActive) {
      logSession.mutate({
        duration_minutes: minutes,
        video_id: selectedVideo?.id || 'custom',
      });
    }
  }, [sessionActive, selectedVideo, logSession]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Start study session
  const startSession = () => {
    if (!selectedVideo) {
      setVideoSelectorOpen(true);
      return;
    }
    setSessionActive(true);
    setIsPlaying(true);
  };

  // Render study content based on mode
  const renderStudyContent = () => {
    switch (studyMode) {
      case 'flashcards':
        return <FlashcardsStudy />;
      case 'quiz':
        return <QuizStudy />;
      case 'notes':
        return <NotesStudy />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Video Background */}
      {selectedVideo && isPlaying && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
          }}
        >
          <VideoPlayer
            videoId={selectedVideo.youtubeId}
            opacity={videoOpacity}
            isMuted={isMuted}
            onMuteToggle={() => setIsMuted(!isMuted)}
            isPlaying={isPlaying}
            onPlayToggle={() => setIsPlaying(!isPlaying)}
          />
        </Box>
      )}

      {/* Main Content Overlay */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 2,
        }}
      >
        {/* Top Bar */}
        <Collapse in={showControls}>
          <Paper
            sx={{
              p: 1.5,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backdropFilter: 'blur(10px)',
              bgcolor: 'rgba(var(--Paper-overlay), 0.8)',
            }}
          >
            {/* Left: Video Selector */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                variant="outlined"
                startIcon={<VideoIcon />}
                onClick={() => setVideoSelectorOpen(true)}
                sx={{ minWidth: 200 }}
              >
                {selectedVideo ? selectedVideo.title : 'Select Video'}
              </Button>

              {/* Video Controls */}
              {selectedVideo && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Tooltip title="Video Opacity">
                    <OpacityIcon sx={{ color: 'text.secondary' }} />
                  </Tooltip>
                  <Slider
                    value={videoOpacity}
                    onChange={(_, v) => setVideoOpacity(v)}
                    min={0.1}
                    max={0.8}
                    step={0.1}
                    sx={{ width: 100 }}
                  />
                  <Typography variant="caption" sx={{ minWidth: 40 }}>
                    {Math.round(videoOpacity * 100)}%
                  </Typography>
                </Stack>
              )}
            </Stack>

            {/* Center: Study Mode Tabs */}
            <Tabs
              value={studyMode}
              onChange={(_, v) => setStudyMode(v)}
              sx={{
                minHeight: 36,
                '& .MuiTab-root': { minHeight: 36, py: 0.5 },
              }}
            >
              {STUDY_MODES.map((mode) => (
                <Tab
                  key={mode.id}
                  value={mode.id}
                  label={mode.label}
                  icon={<mode.icon sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                />
              ))}
            </Tabs>

            {/* Right: Controls */}
            <Stack direction="row" spacing={1} alignItems="center">
              {stats && (
                <Chip
                  icon={<StarIcon />}
                  label={`${stats.total_xp || 0} XP (1.2x)`}
                  color="warning"
                  size="small"
                />
              )}
              <IconButton onClick={toggleFullscreen}>
                {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
              </IconButton>
              <IconButton onClick={() => setShowControls(false)}>
                <CollapseIcon />
              </IconButton>
            </Stack>
          </Paper>
        </Collapse>

        {/* Hidden Controls Toggle */}
        {!showControls && (
          <Box
            sx={{
              position: 'fixed',
              top: 8,
              right: 8,
              zIndex: 10,
            }}
          >
            <IconButton
              onClick={() => setShowControls(true)}
              sx={{
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'background.paper' },
              }}
            >
              <ExpandIcon />
            </IconButton>
          </Box>
        )}

        {/* Main Split View */}
        <Grid container spacing={2} sx={{ flex: 1 }}>
          {/* Left: Timer */}
          <Grid item xs={12} md={3}>
            <StudyTimer
              onSessionComplete={handleSessionComplete}
              pomodoroSettings={{
                pomodoro_duration: 25,
                short_break: 5,
                long_break: 15,
                auto_start_breaks: false,
              }}
            />

            {/* Stats Card */}
            {stats && (
              <Card sx={{ mt: 2, p: 2, backdropFilter: 'blur(10px)' }}>
                <Typography variant="subtitle2" gutterBottom>
                  🔥 Brainrot Stats
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Sessions
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {stats.session_count || 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Time
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {Math.round((stats.total_minutes || 0) / 60)}h{' '}
                      {(stats.total_minutes || 0) % 60}m
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      XP Earned
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color="warning.main">
                      {stats.total_xp || 0} ⭐
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            )}

            {/* Quick Video Picks */}
            <Card sx={{ mt: 2, p: 2, backdropFilter: 'blur(10px)' }}>
              <Typography variant="subtitle2" gutterBottom>
                Quick Picks
              </Typography>
              <Stack spacing={1}>
                {favorites.slice(0, 3).map((fav) => {
                  const video = getVideoById(fav.video_id) || {
                    id: fav.video_id,
                    title: fav.video_title,
                    youtubeId: fav.video_id,
                  };
                  return (
                    <Box
                      key={fav.video_id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        cursor: 'pointer',
                        '&:hover': { opacity: 0.8 },
                      }}
                      onClick={() => handleVideoSelect(video)}
                    >
                      <Box
                        component="img"
                        src={getYouTubeThumbnail(video.youtubeId)}
                        sx={{ width: 48, height: 36, borderRadius: 0.5 }}
                      />
                      <Typography variant="caption" noWrap sx={{ flex: 1 }}>
                        {video.title}
                      </Typography>
                    </Box>
                  );
                })}
                {favorites.length === 0 && (
                  <Typography variant="caption" color="text.secondary">
                    No favorites yet
                  </Typography>
                )}
              </Stack>
            </Card>
          </Grid>

          {/* Right: Study Content */}
          <Grid item xs={12} md={9}>
            <Paper
              sx={{
                height: '100%',
                p: 3,
                backdropFilter: 'blur(10px)',
                bgcolor: 'rgba(var(--Paper-overlay), 0.9)',
                overflow: 'auto',
              }}
            >
              {renderStudyContent()}
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Video Selector Modal */}
      <VideoSelector
        open={videoSelectorOpen}
        onClose={() => setVideoSelectorOpen(false)}
        onSelect={handleVideoSelect}
        favorites={favorites.map((f) => f.video_id)}
        onToggleFavorite={(videoId, title) => {
          const existingFav = favorites.find((f) => f.video_id === videoId);
          if (existingFav) {
            api.delete(`/brainrot/favorites/${existingFav.id}`).then(() => {
              queryClient.invalidateQueries(['brainrot-favorites']);
            });
          } else {
            api.post('/brainrot/favorites', { video_id: videoId, title: title }).then(() => {
              queryClient.invalidateQueries(['brainrot-favorites']);
            });
          }
        }}
      />
    </Box>
  );
}
