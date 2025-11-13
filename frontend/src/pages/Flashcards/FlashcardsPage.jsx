import { useMemo, useState } from 'react';

import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
  Chip,
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import { flashcardApi } from '../../api';

const ratingOptions = [
  { label: 'Hard', quality: 2 },
  { label: 'Good', quality: 4 },
  { label: 'Easy', quality: 5 },
];

const FlashcardsPage = () => {
  const queryClient = useQueryClient();
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [deckName, setDeckName] = useState('');
  const [form, setForm] = useState({ question: '', answer: '' });
  const [editingId, setEditingId] = useState(null);

  const decksQuery = useQuery({
    queryKey: ['decks'],
    queryFn: async () => {
      const { data } = await flashcardApi.listDecks();
      return data;
    },
    onSuccess: (data) => {
      if (!selectedDeck && data.length) {
        setSelectedDeck(data[0].id);
      }
    },
  });

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

  const currentCard = useMemo(() => flashcardsQuery.data?.[0], [flashcardsQuery.data]);

  if (decksQuery.isLoading) {
    return <LoadingState label="Loading your decks..." />;
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Decks
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
                    border:
                      deck.id === selectedDeck
                        ? '1px solid rgba(99,102,241,0.8)'
                        : '1px solid rgba(255,255,255,0.08)',
                    backgroundColor:
                      deck.id === selectedDeck ? 'rgba(99,102,241,0.15)' : 'transparent',
                  }}
                >
                  <Typography fontWeight={600}>{deck.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {deck.flashcard_count} cards
                  </Typography>
                </Box>
              ))}
            </Stack>
            <Box component="form" onSubmit={handleDeckSubmit} mt={3}>
              <TextField
                size="small"
                placeholder="New deck name"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                fullWidth
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ mt: 1.5 }}
                disabled={createDeckMutation.isLoading}
              >
                Add deck
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={9}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  {editingId ? 'Edit flashcard' : 'Add flashcard'}
                </Typography>
                <Stack spacing={2} component="form" onSubmit={handleFlashcardSubmit}>
                  <TextField
                    label="Question"
                    multiline
                    minRows={2}
                    value={form.question}
                    onChange={(e) => setForm((prev) => ({ ...prev, question: e.target.value }))}
                    required
                  />
                  <TextField
                    label="Answer"
                    multiline
                    minRows={2}
                    value={form.answer}
                    onChange={(e) => setForm((prev) => ({ ...prev, answer: e.target.value }))}
                    required
                  />
                  <Stack direction="row" spacing={2}>
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
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Review spotlight
                </Typography>
                {!selectedDeck && (
                  <EmptyState title="Pick a deck" description="Select a deck to start reviewing." />
                )}
                {selectedDeck && flashcardsQuery.isLoading && (
                  <LoadingState label="Fetching cards..." />
                )}
                {selectedDeck && !flashcardsQuery.isLoading && !flashcardsQuery.data?.length && (
                  <EmptyState
                    title="No flashcards yet"
                    description="Add your first flashcard to start reviewing."
                  />
                )}
                {selectedDeck && flashcardsQuery.data?.length > 0 && (
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        borderRadius: 3,
                        p: 3,
                        border: '1px solid rgba(255,255,255,0.1)',
                        minHeight: 160,
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        Question
                      </Typography>
                      <Typography variant="body1" fontWeight={600} mb={2}>
                        {currentCard?.question}
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary">
                        Answer
                      </Typography>
                      <Typography variant="body1">{currentCard?.answer}</Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      {ratingOptions.map((option) => (
                        <Button
                          key={option.label}
                          variant="outlined"
                          onClick={() =>
                            reviewMutation.mutate({
                              cardId: currentCard.id,
                              quality: option.quality,
                            })
                          }
                        >
                          {option.label}
                        </Button>
                      ))}
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <Chip label="Edit" icon={<Edit fontSize="small" />} onClick={() => {
                        setEditingId(currentCard.id);
                        setForm({ question: currentCard.question, answer: currentCard.answer });
                      }} />
                      <Chip
                        label="Delete"
                        color="error"
                        icon={<Delete fontSize="small" />}
                        onClick={() => deleteCardMutation.mutate(currentCard.id)}
                      />
                    </Stack>
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default FlashcardsPage;
