/**
 * Notes Page - Notion-like note editor
 */
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Stack,
  Typography,
  TextField,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Alert,
  Snackbar,
  InputAdornment,
  Divider,
  CircularProgress,
  useTheme,
  alpha,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Search,
  Description,
  Delete,
  Quiz as QuizIcon,
  AutoAwesome,
  Save,
  Check,
  Error as ErrorIcon,
  Tag,
  MoreVert,
} from '@mui/icons-material';
import { notesApi } from '../../api';
import NoteEditor from './NoteEditor';
import { useGamification } from '../../context/GamificationContext';

// Debounce hook for autosave
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function NotesPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { noteId } = useParams();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { awardXp } = useGamification();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [localTitle, setLocalTitle] = useState('');
  const [localContent, setLocalContent] = useState(null);
  const [localVersion, setLocalVersion] = useState(1);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'error'
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Debounced values for autosave
  const debouncedTitle = useDebounce(localTitle, 600);
  const debouncedContent = useDebounce(localContent, 800);

  // Queries
  const notesListQuery = useQuery({
    queryKey: ['notes', searchQuery],
    queryFn: async () => {
      const response = await notesApi.list(searchQuery);
      return response.data.ok ? response.data.data : [];
    },
  });

  const noteQuery = useQuery({
    queryKey: ['note', noteId],
    queryFn: async () => {
      if (!noteId) return null;
      const response = await notesApi.get(noteId);
      return response.data.ok ? response.data.data : null;
    },
    enabled: !!noteId,
  });

  // Sync local state when note loads
  useEffect(() => {
    if (noteQuery.data) {
      setLocalTitle(noteQuery.data.title || '');
      setLocalContent(noteQuery.data.content || { type: 'doc', content: [] });
      setLocalVersion(noteQuery.data.version || 1);
      setSaveStatus('saved');
    }
  }, [noteQuery.data]);

  // Mutations
  const createNoteMutation = useMutation({
    mutationFn: (payload) => notesApi.create(payload),
    onSuccess: (response) => {
      if (response.data.ok) {
        const newNote = response.data.data;
        queryClient.invalidateQueries({ queryKey: ['notes'] });
        navigate(`/notes/${newNote.id}`);
        awardXp(15, 'note-created');
        setSnackbar({ open: true, message: 'Note created! +15 XP', severity: 'success' });
      }
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, payload }) => notesApi.update(id, payload),
    onSuccess: (response) => {
      if (response.data.ok) {
        const updated = response.data.data;
        setLocalVersion(updated.version);
        setSaveStatus('saved');
        queryClient.invalidateQueries({ queryKey: ['notes'] });
      }
    },
    onError: (error) => {
      setSaveStatus('error');
      const errorData = error.response?.data?.error;
      if (errorData?.code === 'VERSION_CONFLICT') {
        setSnackbar({
          open: true,
          message: 'Note was modified elsewhere. Please refresh.',
          severity: 'warning',
        });
      }
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id) => notesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      navigate('/notes');
      setSnackbar({ open: true, message: 'Note deleted', severity: 'info' });
    },
  });

  // Autosave effect
  useEffect(() => {
    if (!noteId || !noteQuery.data) return;
    if (debouncedTitle === noteQuery.data.title && debouncedContent === noteQuery.data.content) return;

    // Only save if there are actual changes
    const hasChanges =
      debouncedTitle !== noteQuery.data.title ||
      JSON.stringify(debouncedContent) !== JSON.stringify(noteQuery.data.content);

    if (hasChanges && debouncedContent) {
      setSaveStatus('saving');
      updateNoteMutation.mutate({
        id: noteId,
        payload: {
          title: debouncedTitle,
          content: debouncedContent,
          version: localVersion,
        },
      });
    }
  }, [debouncedTitle, debouncedContent, noteId, noteQuery.data, localVersion, updateNoteMutation]);

  // Handlers
  const handleCreateNote = useCallback(() => {
    createNoteMutation.mutate({
      title: 'Untitled',
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
    });
  }, [createNoteMutation]);

  const handleDeleteNote = useCallback(() => {
    if (noteId && window.confirm('Delete this note?')) {
      deleteNoteMutation.mutate(noteId);
    }
  }, [noteId, deleteNoteMutation]);

  const handleTitleChange = useCallback((e) => {
    setLocalTitle(e.target.value);
    setSaveStatus('saving');
  }, []);

  const handleContentChange = useCallback((newContent) => {
    setLocalContent(newContent);
    setSaveStatus('saving');
  }, []);

  // Render save status indicator
  const renderSaveStatus = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <Chip
            size="small"
            icon={<CircularProgress size={12} />}
            label="Saving..."
            sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1) }}
          />
        );
      case 'error':
        return (
          <Chip
            size="small"
            icon={<ErrorIcon fontSize="small" />}
            label="Error saving"
            color="error"
            variant="outlined"
          />
        );
      default:
        return (
          <Chip
            size="small"
            icon={<Check fontSize="small" />}
            label="Saved"
            sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}
          />
        );
    }
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* Left sidebar - Note list */}
      <Paper
        elevation={0}
        sx={{
          width: 280,
          borderRight: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: alpha(theme.palette.background.paper, 0.5),
        }}
      >
        <Box sx={{ p: 2 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateNote}
            disabled={createNoteMutation.isPending}
            sx={{ mb: 2 }}
          >
            New Note
          </Button>

          <TextField
            fullWidth
            size="small"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Divider />

        <List sx={{ flex: 1, overflow: 'auto', py: 0 }}>
          {notesListQuery.isLoading ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          ) : notesListQuery.data?.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
              No notes yet
            </Typography>
          ) : (
            notesListQuery.data?.map((note) => (
              <ListItemButton
                key={note.id}
                selected={note.id === Number(noteId)}
                onClick={() => navigate(`/notes/${note.id}`)}
                sx={{
                  borderRadius: 0,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Description fontSize="small" color="action" />
                </ListItemIcon>
                <ListItemText
                  primary={note.title || 'Untitled'}
                  secondary={new Date(note.updated_at).toLocaleDateString()}
                  primaryTypographyProps={{ noWrap: true, fontSize: '0.9rem' }}
                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                />
              </ListItemButton>
            ))
          )}
        </List>
      </Paper>

      {/* Main editor area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {noteId && noteQuery.data ? (
          <>
            {/* Editor toolbar */}
            <Paper
              elevation={0}
              sx={{
                px: 3,
                py: 1.5,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <TextField
                variant="standard"
                value={localTitle}
                onChange={handleTitleChange}
                placeholder="Untitled"
                InputProps={{
                  disableUnderline: true,
                  sx: { fontSize: '1.25rem', fontWeight: 600 },
                }}
                sx={{ flex: 1 }}
              />

              {renderSaveStatus()}

              <Tooltip title="Generate Quiz from Note">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AutoAwesome />}
                  onClick={() => setQuizModalOpen(true)}
                >
                  Generate Quiz
                </Button>
              </Tooltip>

              <Tooltip title="Delete Note">
                <IconButton size="small" color="error" onClick={handleDeleteNote}>
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </Paper>

            {/* Editor */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
              <NoteEditor content={localContent} onChange={handleContentChange} />
            </Box>
          </>
        ) : (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Description sx={{ fontSize: 64, color: 'text.disabled' }} />
            <Typography color="text.secondary">Select a note or create a new one</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={handleCreateNote}>
              New Note
            </Button>
          </Box>
        )}
      </Box>

      {/* Generate Quiz Modal */}
      <GenerateQuizModal
        open={quizModalOpen}
        onClose={() => setQuizModalOpen(false)}
        noteId={noteId}
        noteTitle={localTitle}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// Generate Quiz Modal Component
function GenerateQuizModal({ open, onClose, noteId, noteTitle }) {
  const navigate = useNavigate();
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!noteId) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await notesApi.generateQuiz(noteId, {
        num_questions: numQuestions,
        difficulty,
        scope: 'full',
        title: `Quiz on ${noteTitle}`,
      });

      if (response.data.ok) {
        const quizId = response.data.data.quiz.id;
        onClose();
        navigate(`/quizzes/${quizId}`);
      } else {
        setError(response.data.error?.message || 'Failed to generate quiz');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to generate quiz');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <AutoAwesome color="primary" />
          <span>Generate Quiz from Note</span>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box>
            <Typography gutterBottom>Number of Questions: {numQuestions}</Typography>
            <Slider
              value={numQuestions}
              onChange={(_, v) => setNumQuestions(v)}
              min={5}
              max={20}
              step={5}
              marks={[
                { value: 5, label: '5' },
                { value: 10, label: '10' },
                { value: 15, label: '15' },
                { value: 20, label: '20' },
              ]}
            />
          </Box>

          <FormControl fullWidth>
            <InputLabel>Difficulty</InputLabel>
            <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} label="Difficulty">
              <MenuItem value="easy">Easy - Basic comprehension</MenuItem>
              <MenuItem value="medium">Medium - Understanding & application</MenuItem>
              <MenuItem value="hard">Hard - Analysis & synthesis</MenuItem>
            </Select>
          </FormControl>

          <Alert severity="info" icon={<QuizIcon />}>
            Quiz will be generated from the entire note content using AI. You can start the quiz immediately after
            generation.
          </Alert>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isGenerating}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleGenerate} disabled={isGenerating} startIcon={<AutoAwesome />}>
          {isGenerating ? 'Generating...' : 'Generate Quiz'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
