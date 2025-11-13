import { useEffect, useMemo, useState } from 'react';

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import { notesApi } from '../../api';

const NotesPage = () => {
  const queryClient = useQueryClient();
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', tags: '' });
  const [summary, setSummary] = useState('');

  const notesQuery = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      const { data } = await notesApi.list();
      return data;
    },
  });

  useEffect(() => {
    if (!selectedNoteId && notesQuery.data?.length) {
      loadNote(notesQuery.data[0]);
    }
  }, [notesQuery.data, selectedNoteId]);

  const createNoteMutation = useMutation({
    mutationFn: (payload) => notesApi.create(payload),
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries(['notes']);
      loadNote(data);
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: (payload) => notesApi.update(selectedNoteId, payload),
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries(['notes']);
      loadNote(data);
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: () => notesApi.remove(selectedNoteId),
    onSuccess: () => {
      queryClient.invalidateQueries(['notes']);
      setSelectedNoteId(null);
      setForm({ title: '', content: '', tags: '' });
      setSummary('');
    },
  });

  const summarizeMutation = useMutation({
    mutationFn: () => notesApi.summarize(selectedNoteId),
    onSuccess: ({ data }) => setSummary(data.summary),
  });

  const loadNote = (note) => {
    setSelectedNoteId(note?.id || null);
    if (note) {
      setForm({
        title: note.title,
        content: note.content,
        tags: note.tags?.map((tag) => tag.name).join(', ') || '',
      });
      setSummary(note.summary || '');
    } else {
      setForm({ title: '', content: '', tags: '' });
      setSummary('');
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      title: form.title,
      content: form.content,
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };
    if (selectedNoteId) {
      updateNoteMutation.mutate(payload);
    } else {
      createNoteMutation.mutate(payload);
    }
  };

  const selectedNote = useMemo(
    () => notesQuery.data?.find((note) => note.id === selectedNoteId),
    [notesQuery.data, selectedNoteId],
  );

  if (notesQuery.isLoading) {
    return <LoadingState label="Loading notes..." />;
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={600}>
                Notes
              </Typography>
              <Button size="small" onClick={() => loadNote(null)}>
                New
              </Button>
            </Stack>
            <Stack spacing={1.5}>
              {notesQuery.data?.length ? (
                notesQuery.data.map((note) => (
                  <Box
                    key={note.id}
                    onClick={() => loadNote(note)}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border:
                        note.id === selectedNoteId
                          ? '1px solid rgba(99,102,241,0.8)'
                          : '1px solid rgba(255,255,255,0.08)',
                      cursor: 'pointer',
                    }}
                  >
                    <Typography fontWeight={600}>{note.title}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {note.content}
                    </Typography>
                  </Box>
                ))
              ) : (
                <EmptyState title="No notes yet" description="Capture your first insight." />
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={9}>
        <Card>
          <CardContent>
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
              <Box flex={1}>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  {selectedNoteId ? 'Edit note' : 'New note'}
                </Typography>
                <Stack component="form" spacing={2} onSubmit={handleSubmit}>
                  <TextField
                    label="Title"
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    required
                  />
                  <TextField
                    label="Content"
                    multiline
                    minRows={6}
                    value={form.content}
                    onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                    required
                  />
                  <TextField
                    label="Tags (comma separated)"
                    value={form.tags}
                    onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
                  />
                  <Stack direction="row" spacing={2}>
                    <Button type="submit" variant="contained">
                      {selectedNoteId ? 'Save note' : 'Create note'}
                    </Button>
                    {selectedNoteId && (
                      <Button color="error" onClick={() => deleteNoteMutation.mutate()}>
                        Delete
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Box>
              <Box flex={1}>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  AI summary
                </Typography>
                <Button
                  variant="outlined"
                  disabled={!selectedNoteId || summarizeMutation.isLoading}
                  onClick={() => summarizeMutation.mutate()}
                  sx={{ mb: 2 }}
                >
                  {summarizeMutation.isLoading ? 'Summarizing...' : 'Summarize note'}
                </Button>
                {summary ? (
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      border: '1px solid rgba(255,255,255,0.12)',
                      minHeight: 200,
                    }}
                  >
                    <Typography variant="body2">{summary}</Typography>
                  </Box>
                ) : (
                  <EmptyState
                    title="No summary yet"
                    description="Generate a concise TL;DR with one tap."
                  />
                )}
                {selectedNote?.tags?.length ? (
                  <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
                    {selectedNote.tags.map((tag) => (
                      <Chip key={tag.id} label={tag.name} size="small" />
                    ))}
                  </Stack>
                ) : null}
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default NotesPage;
