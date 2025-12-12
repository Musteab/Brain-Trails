import { useEffect, useMemo, useState } from 'react';

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { AutoAwesome, Delete, Edit, Shuffle, ThumbDown, ThumbUp } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import { flashcardApi } from '../../api';
import { useGamification } from '../../context/GamificationContext';

const reviewReactions = [
  { id: 'retry', label: 'Need review', color: 'error', quality: 2, icon: <ThumbDown fontSize="small" /> },
  { id: 'almost', label: 'Almost there', color: 'warning', quality: 3, icon: <AutoAwesome fontSize="small" /> },
  { id: 'mastered', label: 'I know it', color: 'success', quality: 5, icon: <ThumbUp fontSize="small" /> },
];

const FlashcardsPage = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const gamification = useGamification();
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [deckName, setDeckName] = useState('');
  const [form, setForm] = useState({ question: '', answer: '' });
  const [editingId, setEditingId] = useState(null);
  const [sessionCards, setSessionCards] = useState([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, mastered: 0, retry: 0 });

  const decksQuery = useQuery({
    queryKey: ['decks'],
    queryFn: async () => {
      const { data } = await flashcardApi.listDecks();
      return data;
    },
  });

  // Handle initial deck selection when decks load (React Query v5 compatible)
  useEffect(() => {
    if (decksQuery.data?.length && !selectedDeck) {
      setSelectedDeck(decksQuery.data[0].id);
    }
  }, [decksQuery.data, selectedDeck]);

  const flashcardsQuery = useQuery({
    queryKey: ['flashcards', selectedDeck],
    enabled: Boolean(selectedDeck),
    queryFn: async () => {
      const { data } = await flashcardApi.listFlashcards(selectedDeck);
      return data;
    },
  });

  const createDeckMutation = useMutation({
    mutationFn: (name) => flashcardApi.createDeck({ name }),
    onSuccess: ({ data }) => {
      setDeckName('');
      setSelectedDeck(data.id);
      queryClient.invalidateQueries(['decks']);
    },
  });

  const upsertFlashcardMutation = useMutation({
    mutationFn: (payload) =>
      editingId
        ? flashcardApi.updateFlashcard(editingId, payload)
        : flashcardApi.createFlashcard(selectedDeck, payload),
    onSuccess: () => {
      setForm({ question: '', answer: '' });
      setEditingId(null);
      queryClient.invalidateQueries(['flashcards', selectedDeck]);
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: (cardId) => flashcardApi.deleteFlashcard(cardId),
    onSuccess: () => {
      setEditingId(null);
      queryClient.invalidateQueries(['flashcards', selectedDeck]);
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ cardId, quality }) => flashcardApi.reviewFlashcard(cardId, { quality }),
  });

  useEffect(() => {
    if (flashcardsQuery.data) {
      setSessionCards(flashcardsQuery.data);
      setReviewIndex(0);
      setSessionStats({ reviewed: 0, mastered: 0, retry: 0 });
      setIsFlipped(false);
    }
  }, [flashcardsQuery.data]);

  const currentCard = useMemo(() => sessionCards[reviewIndex], [sessionCards, reviewIndex]);
  const progress = sessionCards.length ? sessionStats.reviewed / sessionCards.length : 0;
  const currentDeckName = useMemo(() => {
    if (!decksQuery.data?.length) return 'Deck';
    return decksQuery.data.find((deck) => deck.id === selectedDeck)?.name || 'Deck';
  }, [decksQuery.data, selectedDeck]);

  const handleDeckSubmit = (event) => {
    event.preventDefault();
    if (!deckName.trim()) return;
    createDeckMutation.mutate(deckName.trim());
  };

  const handleFlashcardSubmit = (event) => {
    event.preventDefault();
    if (!form.question || !form.answer) return;
    upsertFlashcardMutation.mutate(form);
  };

  const handleShuffle = () => {
    if (!flashcardsQuery.data?.length) return;
    setSessionCards((prev) => [...prev].sort(() => Math.random() - 0.5));
    setReviewIndex(0);
    setSessionStats({ reviewed: 0, mastered: 0, retry: 0 });
    setIsFlipped(false);
  };

  const handleReviewAction = (reaction) => {
    if (!currentCard) return;
    setSwipeDirection(reaction.id === 'mastered' ? 'right' : 'left');
    setTimeout(() => {
      setSwipeDirection(null);
      setIsFlipped(false);
      let deckCleared = false;
      setSessionStats((prev) => {
        const next = {
          reviewed: prev.reviewed + 1,
          mastered: prev.mastered + (reaction.id === 'mastered' ? 1 : 0),
          retry: prev.retry + (reaction.id === 'retry' ? 1 : 0),
        };
        if (sessionCards.length && next.reviewed >= sessionCards.length) {
          deckCleared = true;
          return { reviewed: 0, mastered: 0, retry: 0 };
        }
        return next;
      });
      gamification.recordFlashcardReview(1, reaction.id === 'mastered' ? 1 : 0);
      reviewMutation.mutate({ cardId: currentCard.id, quality: reaction.quality });
      setReviewIndex((prev) => (sessionCards.length ? (prev + 1) % sessionCards.length : 0));
      if (deckCleared) {
        gamification.registerBossAction('flashcards', { label: `${currentDeckName} deck cleared` });
      }
    }, 220);
  };

  if (decksQuery.isLoading) {
    return <LoadingState label="Loading your decks..." />;
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
        <Typography variant="h4" fontWeight={700}>
          Flashcard playground
        </Typography>
        <Stack direction="row" spacing={1}>
          <Chip label={`Decks: ${decksQuery.data?.length || 0}`} />
          <Chip label={`Cards: ${flashcardsQuery.data?.length || 0}`} />
          <Chip label={`Session mastered: ${sessionStats.mastered}`} color="success" />
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Deck library
              </Typography>
              <Stack spacing={1.5}>
                {decksQuery.data?.map((deck) => (
                  <Box
                    key={deck.id}
                    onClick={() => setSelectedDeck(deck.id)}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      cursor: 'pointer',
                      border: deck.id === selectedDeck 
                        ? `2px solid ${theme.palette.primary.main}` 
                        : `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                      background: deck.id === selectedDeck 
                        ? alpha(theme.palette.primary.main, 0.1) 
                        : 'transparent',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: alpha(theme.palette.primary.main, 0.05),
                      },
                    }}
                  >
                    <Typography fontWeight={600}>{deck.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {deck.flashcard_count || 0} cards
                    </Typography>
                  </Box>
                ))}
                {!decksQuery.data?.length && <EmptyState title="No decks yet" description="Create your first deck." />}
              </Stack>
            </CardContent>
          </Card>
          <Card component="form" onSubmit={handleDeckSubmit}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>
                Create deck
              </Typography>
              <Stack spacing={1.5}>
                <TextField label="Deck name" value={deckName} onChange={(event) => setDeckName(event.target.value)} />
                <Button type="submit" variant="contained" disabled={createDeckMutation.isLoading}>
                  Add deck
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={9}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="flex-start" mb={2}>
                <div>
                  <Typography variant="h6" fontWeight={700}>
                    Interactive review
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tap to flip · swipe reactions to grow your streak
                  </Typography>
                </div>
                <Stack direction="row" spacing={1}>
                  <Button startIcon={<Shuffle />} variant="outlined" onClick={handleShuffle} disabled={!sessionCards.length}>
                    Shuffle
                  </Button>
                  <Chip label={`${sessionStats.reviewed}/${sessionCards.length || 0} reviewed`} />
                </Stack>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={progress * 100}
                sx={{ height: 10, borderRadius: 5, mb: 3 }}
              />
              {selectedDeck && flashcardsQuery.isLoading && <LoadingState label="Fetching cards..." />}
              {selectedDeck && !flashcardsQuery.isLoading && !sessionCards.length && (
                <EmptyState
                  title="No flashcards yet"
                  description="Add your first flashcard to start reviewing."
                />
              )}
              {currentCard && (
                <>
                  <Flashcard3D
                    card={currentCard}
                    isFlipped={isFlipped}
                    onToggle={() => setIsFlipped((prev) => !prev)}
                    swipeDirection={swipeDirection}
                  />
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} mt={3}>
                    {reviewReactions.map((reaction) => (
                      <Button
                        key={reaction.id}
                        variant="contained"
                        color={reaction.color}
                        startIcon={reaction.icon}
                        onClick={() => handleReviewAction(reaction)}
                      >
                        {reaction.label}
                      </Button>
                    ))}
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                {editingId ? 'Edit flashcard' : 'Add flashcard'}
              </Typography>
              <Stack spacing={2} component="form" onSubmit={handleFlashcardSubmit}>
                <TextField
                  label="Question"
                  multiline
                  minRows={2}
                  value={form.question}
                  onChange={(event) => setForm((prev) => ({ ...prev, question: event.target.value }))}
                  required
                />
                <TextField
                  label="Answer"
                  multiline
                  minRows={2}
                  value={form.answer}
                  onChange={(event) => setForm((prev) => ({ ...prev, answer: event.target.value }))}
                  required
                />
                <Stack direction="row" spacing={1}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={!selectedDeck || upsertFlashcardMutation.isLoading}
                  >
                    {editingId ? 'Save changes' : 'Create flashcard'}
                  </Button>
                  {editingId && (
                    <Button variant="text" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Card drawer
              </Typography>
              <Stack spacing={1.5}>
                {flashcardsQuery.data?.map((card) => (
                  <Box
                    key={card.id}
                    sx={{
                      border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                      borderRadius: 2,
                      p: 1.5,
                      transition: 'border-color 0.2s ease',
                      '&:hover': {
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                      },
                    }}
                  >
                    <Typography fontWeight={600}>{card.question}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.answer}
                    </Typography>
                    <Stack direction="row" spacing={1} mt={1}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingId(card.id);
                          setForm({ question: card.question, answer: card.answer });
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => deleteCardMutation.mutate(card.id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>
                ))}
                {!flashcardsQuery.data?.length && (
                  <EmptyState title="No flashcards yet" description="Add your first flashcard to start reviewing." />
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
};

const Flashcard3D = ({ card, isFlipped, onToggle, swipeDirection }) => (
  <Box sx={{ perspective: '1600px', height: 240 }} onClick={onToggle}>
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.6s',
        transform: `rotateY(${isFlipped ? 180 : 0}deg) translateX(${
          swipeDirection === 'left' ? '-120%' : swipeDirection === 'right' ? '120%' : '0'
        })`,
        cursor: 'pointer',
      }}
    >
      <FlashcardFace title="Question" content={card.question} back={false} />
      <FlashcardFace title="Answer" content={card.answer} back />
    </Box>
  </Box>
);

const FlashcardFace = ({ title, content, back }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        backfaceVisibility: 'hidden',
        position: 'absolute',
        inset: 0,
        borderRadius: 3,
        p: 3,
        border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
        bgcolor: back 
          ? alpha(theme.palette.success.main, 0.12) 
          : alpha(theme.palette.background.paper, 0.95),
        transform: back ? 'rotateY(180deg)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        boxShadow: theme.palette.mode === 'light' 
          ? '0 20px 40px rgba(0,0,0,0.08)' 
          : '0 20px 40px rgba(0,0,0,0.3)',
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="h6" fontWeight={700}>
        {content}
      </Typography>
    </Box>
  );
};

export default FlashcardsPage;
