import { useEffect, useState } from 'react';
import { Box, Button, IconButton, Stack, Typography, useTheme } from '@mui/material';
import { Close, ArrowBack, ArrowForward } from '@mui/icons-material';

const slides = [
  {
    title: 'Welcome to BrainTrails',
    body: 'Each day starts with a guiding ritual. Pick a study room vibe and let the environment shape your focus.',
  },
  {
    title: 'Checklist of Power',
    body: 'Pomodoros, flashcards, quizzes, planner tasks, and rituals all feed your streak + XP system.',
  },
  {
    title: 'Dynamic Rooms',
    body: 'Forest, Cabin, Space, Underwater, and Cyber rooms re-style the entire workspace with matching sounds and colors.',
  },
  {
    title: 'Rewards & Companions',
    body: 'Log in daily to unlock a guaranteed reward. Bonus drops randomly appear after intense study bursts.',
  },
  {
    title: 'Need a refresher?',
    body: 'Open this tutorial from Settings & FAQ whenever you want to revisit the trail guide.',
  },
];

const TutorialSlides = ({ open, onClose }) => {
  const [index, setIndex] = useState(0);
  const theme = useTheme();

  useEffect(() => {
    if (!open) {
      setIndex(0);
    }
  }, [open]);

  if (!open) return null;

  const slide = slides[index];
  const isLast = index === slides.length - 1;

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        backdropFilter: 'blur(12px)',
        background: 'rgba(0,0,0,0.35)',
        zIndex: 1300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Box
        sx={{
          width: 'min(860px, 100%)',
          borderRadius: 32,
          background: theme.palette.background.paper,
          border: `1px solid ${theme.palette.text.primary}15`,
          boxShadow: `0 25px 55px ${theme.palette.primary.main}33`,
          position: 'relative',
          p: { xs: 3, md: 5 },
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 16, top: 16, bgcolor: `${theme.palette.primary.main}12` }}
        >
          <Close />
        </IconButton>
        <Typography variant="overline" color="text.secondary">
          Daily trail briefing
        </Typography>
        <Typography variant="h4" fontWeight={700} mb={1}>
          {slide.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          {slide.body}
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1}>
            {slides.map((_, dotIndex) => (
              <Box
                // eslint-disable-next-line react/no-array-index-key
                key={dotIndex}
                sx={{
                  width: dotIndex === index ? 24 : 12,
                  height: 12,
                  borderRadius: 999,
                  bgcolor: dotIndex === index ? theme.palette.primary.main : `${theme.palette.text.primary}25`,
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => setIndex((prev) => Math.max(prev - 1, 0))}
              disabled={index === 0}
              variant="outlined"
            >
              Back
            </Button>
            <Button
              endIcon={isLast ? <Close /> : <ArrowForward />}
              onClick={() => {
                if (isLast) {
                  onClose();
                } else {
                  setIndex((prev) => Math.min(prev + 1, slides.length - 1));
                }
              }}
              variant="contained"
            >
              {isLast ? 'Finish' : 'Next'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};

export default TutorialSlides;
