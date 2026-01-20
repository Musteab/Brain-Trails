/**
 * Notes Page - Notion-like note editor
 */
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
  Collapse,
  Menu,
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
  Folder,
  FolderOpen,
  CreateNewFolder,
  ExpandMore,
  ChevronRight,
  DriveFileMove,
  Summarize,
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
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false);
  const [newFolderParentId, setNewFolderParentId] = useState(null);
  const [folderContextMenu, setFolderContextMenu] = useState({ anchorEl: null, folderId: null });
  const [moveNoteModalOpen, setMoveNoteModalOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Debounced values for autosave
  const debouncedTitle = useDebounce(localTitle, 600);
  const debouncedContent = useDebounce(localContent, 800);

  // Queries
  const notesListQuery = useQuery({
    queryKey: ['notes', searchQuery, selectedFolderId],
    queryFn: async () => {
      const response = await notesApi.list(searchQuery);
      const notes = response.data.ok ? response.data.data : [];
      // Filter by folder if selected
      if (selectedFolderId === 'unfiled') {
        return notes.filter(n => !n.folder_id);
      }
      if (selectedFolderId) {
        return notes.filter(n => n.folder_id === selectedFolderId);
      }
      return notes;
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

  const foldersQuery = useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const response = await notesApi.listFolders();
      return response.data.ok ? response.data.data : [];
    },
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

  const createFolderMutation = useMutation({
    mutationFn: (payload) => notesApi.createFolder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      setNewFolderModalOpen(false);
      setSnackbar({ open: true, message: 'Folder created', severity: 'success' });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id) => notesApi.deleteFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      if (selectedFolderId === folderContextMenu.folderId) {
        setSelectedFolderId(null);
      }
      setSnackbar({ open: true, message: 'Folder deleted', severity: 'info' });
    },
  });

  const moveNoteMutation = useMutation({
    mutationFn: ({ noteId, folderId }) => notesApi.move(noteId, folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['note'] });
      setMoveNoteModalOpen(false);
      setSnackbar({ open: true, message: 'Note moved', severity: 'success' });
    },
  });

  // Autosave effect - only triggers on actual content changes
  const isSavingRef = useRef(false);
  
  useEffect(() => {
    // Skip if no note loaded, already saving, or mutation in progress
    if (!noteId || !noteQuery.data || isSavingRef.current || updateNoteMutation.isPending) return;

    // Only save if there are actual changes from server data
    const titleChanged = debouncedTitle !== noteQuery.data.title;
    const contentChanged = JSON.stringify(debouncedContent) !== JSON.stringify(noteQuery.data.content);
    
    if ((titleChanged || contentChanged) && debouncedContent) {
      isSavingRef.current = true;
      setSaveStatus('saving');
      updateNoteMutation.mutate({
        id: noteId,
        payload: {
          title: debouncedTitle,
          content: debouncedContent,
          version: localVersion,
        },
      }, {
        onSettled: () => {
          isSavingRef.current = false;
        }
      });
    }
  }, [debouncedTitle, debouncedContent, noteId]); // Removed localVersion and updateNoteMutation from deps

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
      {/* Left sidebar - Folders & Note list */}
      <Paper
        elevation={0}
        sx={{
          width: 300,
          borderRight: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: alpha(theme.palette.background.paper, 0.5),
        }}
      >
        <Box sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateNote}
              disabled={createNoteMutation.isPending}
            >
              New Note
            </Button>
            <Tooltip title="New Folder">
              <IconButton
                onClick={() => { setNewFolderParentId(null); setNewFolderModalOpen(true); }}
                sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.3)}` }}
              >
                <CreateNewFolder fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

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

        {/* Folders Section */}
        <Box sx={{ px: 1, py: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
            FOLDERS
          </Typography>
        </Box>
        <List dense sx={{ py: 0 }}>
          {/* All Notes */}
          <ListItemButton
            selected={selectedFolderId === null}
            onClick={() => setSelectedFolderId(null)}
            sx={{ py: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <Description fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="All Notes" primaryTypographyProps={{ fontSize: '0.85rem' }} />
          </ListItemButton>
          
          {/* Unfiled */}
          <ListItemButton
            selected={selectedFolderId === 'unfiled'}
            onClick={() => setSelectedFolderId('unfiled')}
            sx={{ py: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <Description fontSize="small" color="disabled" />
            </ListItemIcon>
            <ListItemText primary="Unfiled" primaryTypographyProps={{ fontSize: '0.85rem' }} />
          </ListItemButton>

          {/* Folder Tree */}
          {foldersQuery.data?.map((folder) => (
            <FolderTreeItem
              key={folder.id}
              folder={folder}
              level={0}
              selectedFolderId={selectedFolderId}
              expandedFolders={expandedFolders}
              onSelect={setSelectedFolderId}
              onToggle={(id) => setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }))}
              onContextMenu={(e, folderId) => {
                e.preventDefault();
                setFolderContextMenu({ anchorEl: e.currentTarget, folderId });
              }}
              onCreateSubfolder={(parentId) => { setNewFolderParentId(parentId); setNewFolderModalOpen(true); }}
            />
          ))}
        </List>

        <Divider sx={{ my: 1 }} />

        {/* Notes in selected folder */}
        <Box sx={{ px: 1, py: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
            {selectedFolderId === 'unfiled' ? 'UNFILED NOTES' : selectedFolderId ? 'NOTES IN FOLDER' : 'ALL NOTES'}
          </Typography>
        </Box>
        <List sx={{ flex: 1, overflow: 'auto', py: 0 }}>
          {notesListQuery.isLoading ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          ) : notesListQuery.data?.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
              No notes {selectedFolderId ? 'in this folder' : 'yet'}
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

      {/* Folder Context Menu */}
      <Menu
        anchorEl={folderContextMenu.anchorEl}
        open={Boolean(folderContextMenu.anchorEl)}
        onClose={() => setFolderContextMenu({ anchorEl: null, folderId: null })}
      >
        <MenuItem onClick={() => {
          setNewFolderParentId(folderContextMenu.folderId);
          setNewFolderModalOpen(true);
          setFolderContextMenu({ anchorEl: null, folderId: null });
        }}>
          <ListItemIcon><CreateNewFolder fontSize="small" /></ListItemIcon>
          New Subfolder
        </MenuItem>
        <MenuItem onClick={() => {
          deleteFolderMutation.mutate(folderContextMenu.folderId);
          setFolderContextMenu({ anchorEl: null, folderId: null });
        }} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
          Delete Folder
        </MenuItem>
      </Menu>

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

              <Tooltip title="Generate AI Summary">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Summarize />}
                  onClick={async () => {
                    setSummaryLoading(true);
                    setSummary(null);
                    setSummaryModalOpen(true);
                    try {
                      const res = await notesApi.generateSummary(noteId, 5);
                      if (res.data.ok) {
                        setSummary(res.data.data.summary);
                      } else {
                        setSummary('Failed to generate summary');
                      }
                    } catch (err) {
                      setSummary(err.response?.data?.error?.message || 'Failed to generate summary');
                    } finally {
                      setSummaryLoading(false);
                    }
                  }}
                >
                  Summarize
                </Button>
              </Tooltip>

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

              <Tooltip title="Move to Folder">
                <IconButton size="small" onClick={() => setMoveNoteModalOpen(true)}>
                  <DriveFileMove fontSize="small" />
                </IconButton>
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

      {/* New Folder Modal */}
      <NewFolderModal
        open={newFolderModalOpen}
        onClose={() => setNewFolderModalOpen(false)}
        parentId={newFolderParentId}
        onSubmit={(name) => {
          createFolderMutation.mutate({
            name,
            parent_id: newFolderParentId,
          });
        }}
        isLoading={createFolderMutation.isPending}
      />

      {/* Move Note Modal */}
      <MoveNoteModal
        open={moveNoteModalOpen}
        onClose={() => setMoveNoteModalOpen(false)}
        folders={foldersQuery.data || []}
        currentFolderId={noteQuery.data?.folder_id}
        onMove={(folderId) => {
          moveNoteMutation.mutate({ noteId: Number(noteId), folderId });
        }}
        isLoading={moveNoteMutation.isPending}
      />

      {/* Summary Modal */}
      <Dialog
        open={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Summarize color="primary" />
            <span>AI Summary</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {summaryLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {summary}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSummaryModalOpen(false)}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              navigator.clipboard.writeText(summary || '');
              setSnackbar({ open: true, message: 'Summary copied to clipboard', severity: 'success' });
            }}
            disabled={!summary || summaryLoading}
          >
            Copy
          </Button>
        </DialogActions>
      </Dialog>

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
  const [questionTypes, setQuestionTypes] = useState(['mcq']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const toggleQuestionType = (type) => {
    setQuestionTypes(prev => {
      if (prev.includes(type)) {
        // Don't allow removing the last type
        if (prev.length === 1) return prev;
        return prev.filter(t => t !== type);
      }
      return [...prev, type];
    });
  };

  const handleGenerate = async () => {
    if (!noteId) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await notesApi.generateQuiz(noteId, {
        num_questions: numQuestions,
        difficulty,
        question_types: questionTypes,
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

          <Box>
            <Typography gutterBottom variant="subtitle2">Question Types</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                label="Multiple Choice"
                onClick={() => toggleQuestionType('mcq')}
                color={questionTypes.includes('mcq') ? 'primary' : 'default'}
                variant={questionTypes.includes('mcq') ? 'filled' : 'outlined'}
              />
              <Chip
                label="True/False"
                onClick={() => toggleQuestionType('true_false')}
                color={questionTypes.includes('true_false') ? 'primary' : 'default'}
                variant={questionTypes.includes('true_false') ? 'filled' : 'outlined'}
              />
              <Chip
                label="Short Answer"
                onClick={() => toggleQuestionType('short_answer')}
                color={questionTypes.includes('short_answer') ? 'primary' : 'default'}
                variant={questionTypes.includes('short_answer') ? 'filled' : 'outlined'}
              />
            </Stack>
          </Box>

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

// Folder Tree Item Component
function FolderTreeItem({
  folder,
  level,
  selectedFolderId,
  expandedFolders,
  onSelect,
  onToggle,
  onContextMenu,
  onCreateSubfolder,
}) {
  const theme = useTheme();
  const hasChildren = folder.children && folder.children.length > 0;
  const isExpanded = expandedFolders[folder.id];
  const isSelected = selectedFolderId === folder.id;

  return (
    <>
      <ListItemButton
        selected={isSelected}
        onClick={() => onSelect(folder.id)}
        onContextMenu={(e) => onContextMenu(e, folder.id)}
        sx={{
          py: 0.5,
          pl: 1 + level * 2,
          '&.Mui-selected': {
            bgcolor: alpha(theme.palette.primary.main, 0.12),
          },
        }}
      >
        {hasChildren ? (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(folder.id);
            }}
            sx={{ p: 0, mr: 0.5 }}
          >
            {isExpanded ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
          </IconButton>
        ) : (
          <Box sx={{ width: 24 }} />
        )}
        <ListItemIcon sx={{ minWidth: 28 }}>
          {isExpanded ? (
            <FolderOpen fontSize="small" sx={{ color: folder.color }} />
          ) : (
            <Folder fontSize="small" sx={{ color: folder.color }} />
          )}
        </ListItemIcon>
        <ListItemText
          primary={folder.name}
          primaryTypographyProps={{
            fontSize: '0.85rem',
            noWrap: true,
          }}
        />
      </ListItemButton>

      {hasChildren && (
        <Collapse in={isExpanded} unmountOnExit>
          {folder.children.map((child) => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              level={level + 1}
              selectedFolderId={selectedFolderId}
              expandedFolders={expandedFolders}
              onSelect={onSelect}
              onToggle={onToggle}
              onContextMenu={onContextMenu}
              onCreateSubfolder={onCreateSubfolder}
            />
          ))}
        </Collapse>
      )}
    </>
  );
}

// New Folder Modal
function NewFolderModal({ open, onClose, parentId, onSubmit, isLoading }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
      setName('');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {parentId ? 'New Subfolder' : 'New Folder'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Folder Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="dense"
            inputProps={{ maxLength: 128 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!name.trim() || isLoading}
          >
            {isLoading ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// Move Note Modal
function MoveNoteModal({ open, onClose, folders, currentFolderId, onMove, isLoading }) {
  const theme = useTheme();
  const [selectedId, setSelectedId] = useState(currentFolderId);

  useEffect(() => {
    setSelectedId(currentFolderId);
  }, [currentFolderId, open]);

  const flattenFolders = (folders, level = 0) => {
    return folders.reduce((acc, folder) => {
      acc.push({ ...folder, level });
      if (folder.children) {
        acc.push(...flattenFolders(folder.children, level + 1));
      }
      return acc;
    }, []);
  };

  const flatFolders = flattenFolders(folders);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Move Note to Folder</DialogTitle>
      <DialogContent>
        <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
          <ListItemButton
            selected={selectedId === null}
            onClick={() => setSelectedId(null)}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <Description fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Unfiled (no folder)" />
          </ListItemButton>
          {flatFolders.map((folder) => (
            <ListItemButton
              key={folder.id}
              selected={selectedId === folder.id}
              onClick={() => setSelectedId(folder.id)}
              sx={{ pl: 2 + folder.level * 2 }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Folder fontSize="small" sx={{ color: folder.color }} />
              </ListItemIcon>
              <ListItemText primary={folder.name} />
            </ListItemButton>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => onMove(selectedId)}
          disabled={isLoading || selectedId === currentFolderId}
        >
          {isLoading ? 'Moving...' : 'Move'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
