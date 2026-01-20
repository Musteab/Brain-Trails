/**
 * Flashcards Study Component for Brainrot Mode
 * Simplified flashcard review interface
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import {
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  Replay as FlipIcon,
  CheckCircle as CorrectIcon,
  Cancel as WrongIcon,
  Shuffle as ShuffleIcon,
} from '@mui/icons-material';
import api from '../../../api/client';

export default function FlashcardsStudy() {
  const [selectedDeck, setSelectedDeck] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffled, setShuffled] = useState(false);

  // Fetch decks
  const { data: decks = [] } = useQuery({
    queryKey: ['flashcard-decks'],
    queryFn: () => api.get('/flashcards/decks').then((res) => res.data),
  });

  // Fetch cards for selected deck
  const { data: cards = [] } = useQuery({
    queryKey: ['flashcard-cards', selectedDeck],
    queryFn: () =>
      api.get(`/flashcards/decks/${selectedDeck}/cards`).then((res) => res.data),
    enabled: !!selectedDeck,
  });

  const displayCards = shuffled
    ? [...cards].sort(() => Math.random() - 0.5)
    : cards;
  const currentCard = displayCards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % displayCards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + displayCards.length) % displayCards.length);
  };

  const handleAnswer = (correct) => {
    // Could log to backend for spaced repetition
    handleNext();
  };

  if (!selectedDeck) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" gutterBottom>
          Select a Deck to Study
        </Typography>
        <FormControl sx={{ minWidth: 300 }}>
          <InputLabel>Flashcard Deck</InputLabel>
          <Select
            value={selectedDeck}
            label="Flashcard Deck"
            onChange={(e) => {
              setSelectedDeck(e.target.value);
              setCurrentIndex(0);
            }}
          >
            {decks.map((deck) => (
              <MenuItem key={deck.id} value={deck.id}>
                {deck.name} ({deck.card_count || 0} cards)
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {decks.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            No flashcard decks found. Create some in the Flashcards page!
          </Typography>
        )}
      </Box>
    );
  }

  if (cards.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6">No cards in this deck</Typography>
        <Button onClick={() => setSelectedDeck('')} sx={{ mt: 2 }}>
          Choose Another Deck
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select
              value={selectedDeck}
              onChange={(e) => {
                setSelectedDeck(e.target.value);
                setCurrentIndex(0);
              }}
            >
              {decks.map((deck) => (
                <MenuItem key={deck.id} value={deck.id}>
                  {deck.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Chip label={`${currentIndex + 1} / ${cards.length}`} variant="outlined" />
        </Stack>
        <IconButton onClick={() => setShuffled(!shuffled)} color={shuffled ? 'primary' : 'default'}>
          <ShuffleIcon />
        </IconButton>
      </Stack>

      {/* Card Display */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective: '1000px',
        }}
      >
        <Card
          onClick={() => setIsFlipped(!isFlipped)}
          sx={{
            width: '100%',
            maxWidth: 500,
            minHeight: 300,
            cursor: 'pointer',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.6s',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
            position: 'relative',
          }}
        >
          {/* Front */}
          <CardContent
            sx={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4,
            }}
          >
            <Typography variant="overline" color="text.secondary">
              Question
            </Typography>
            <Typography variant="h5" textAlign="center">
              {currentCard?.front}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
              Click to flip
            </Typography>
          </CardContent>

          {/* Back */}
          <CardContent
            sx={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4,
              bgcolor: 'primary.dark',
              color: 'primary.contrastText',
            }}
          >
            <Typography variant="overline">Answer</Typography>
            <Typography variant="h5" textAlign="center">
              {currentCard?.back}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Controls */}
      <Stack direction="row" justifyContent="center" alignItems="center" spacing={2} sx={{ mt: 2 }}>
        <IconButton onClick={handlePrev} size="large">
          <PrevIcon />
        </IconButton>

        {isFlipped && (
          <>
            <Button
              variant="outlined"
              color="error"
              startIcon={<WrongIcon />}
              onClick={() => handleAnswer(false)}
            >
              Again
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<CorrectIcon />}
              onClick={() => handleAnswer(true)}
            >
              Got it!
            </Button>
          </>
        )}

        {!isFlipped && (
          <Button
            variant="outlined"
            startIcon={<FlipIcon />}
            onClick={() => setIsFlipped(true)}
          >
            Show Answer
          </Button>
        )}

        <IconButton onClick={handleNext} size="large">
          <NextIcon />
        </IconButton>
      </Stack>
    </Box>
  );
}
