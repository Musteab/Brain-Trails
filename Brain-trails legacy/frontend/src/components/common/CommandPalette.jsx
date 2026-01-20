/**
 * CommandPalette - Cmd+K quick actions modal
 * 
 * Provides instant access to common actions:
 * - Create new note
 * - Start Pomodoro timer
 * - Review flashcards
 * - Search notes
 * - Navigate to pages
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Chip,
  InputAdornment,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  NoteAdd as NoteAddIcon,
  Timer as TimerIcon,
  Quiz as QuizIcon,
  Style as FlashcardIcon,
  CalendarMonth as PlannerIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  BarChart as StatsIcon,
  PersonOutline as ProfileIcon,
  Shuffle as RandomIcon,
  PlayArrow as StartIcon,
  KeyboardReturn as EnterIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { notesApi } from '../../api';

// Action definitions
const ACTIONS = [
  {
    id: 'new-note',
    label: 'New Note',
    description: 'Create a new note',
    icon: NoteAddIcon,
    shortcut: 'N',
    category: 'create',
    action: (navigate) => navigate('/notes?new=true'),
  },
  {
    id: 'start-pomodoro',
    label: 'Start Pomodoro',
    description: 'Start a focus session',
    icon: TimerIcon,
    shortcut: 'P',
    category: 'actions',
    action: (navigate, { startTimer }) => {
      if (startTimer) startTimer();
      navigate('/dashboard');
    },
  },
  {
    id: 'review-flashcards',
    label: 'Review Flashcards',
    description: 'Start reviewing due flashcards',
    icon: FlashcardIcon,
    shortcut: 'F',
    category: 'actions',
    action: (navigate) => navigate('/flashcards'),
  },
  {
    id: 'random-note',
    label: 'Random Note',
    description: 'Open a random note for review',
    icon: RandomIcon,
    shortcut: 'R',
    category: 'actions',
    action: async (navigate) => {
      try {
        const res = await notesApi.getRandom();
        if (res.data?.data?.note?.id) {
          navigate(`/notes?id=${res.data.data.note.id}`);
        }
      } catch {
        navigate('/notes');
      }
    },
  },
  {
    id: 'take-quiz',
    label: 'Take a Quiz',
    description: 'Go to quizzes page',
    icon: QuizIcon,
    shortcut: 'Q',
    category: 'navigate',
    action: (navigate) => navigate('/quizzes'),
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Go to dashboard',
    icon: DashboardIcon,
    shortcut: 'D',
    category: 'navigate',
    action: (navigate) => navigate('/dashboard'),
  },
  {
    id: 'notes',
    label: 'Notes',
    description: 'Go to notes',
    icon: NoteAddIcon,
    category: 'navigate',
    action: (navigate) => navigate('/notes'),
  },
  {
    id: 'planner',
    label: 'Planner',
    description: 'Go to study planner',
    icon: PlannerIcon,
    category: 'navigate',
    action: (navigate) => navigate('/planner'),
  },
  {
    id: 'progress',
    label: 'Progress',
    description: 'View your progress and stats',
    icon: StatsIcon,
    category: 'navigate',
    action: (navigate) => navigate('/progress'),
  },
  {
    id: 'profile',
    label: 'Profile',
    description: 'View your profile',
    icon: ProfileIcon,
    category: 'navigate',
    action: (navigate) => navigate('/profile'),
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Open settings',
    icon: SettingsIcon,
    category: 'navigate',
    action: (navigate) => navigate('/settings'),
  },
];

// Category labels
const CATEGORIES = {
  create: 'Create',
  actions: 'Quick Actions',
  navigate: 'Navigate',
  notes: 'Notes',
};

export default function CommandPalette({ open, onClose, startTimer }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [noteResults, setNoteResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  // Filter actions based on query
  const filteredActions = useMemo(() => {
    if (!query.trim()) return ACTIONS;
    const lower = query.toLowerCase();
    return ACTIONS.filter(
      (action) =>
        action.label.toLowerCase().includes(lower) ||
        action.description.toLowerCase().includes(lower)
    );
  }, [query]);

  // Combined results: actions + note search
  const allResults = useMemo(() => {
    const results = [];
    
    // Add filtered actions
    if (filteredActions.length > 0) {
      results.push(...filteredActions.map((a) => ({ ...a, type: 'action' })));
    }
    
    // Add note results
    if (noteResults.length > 0) {
      results.push(
        ...noteResults.map((note) => ({
          id: `note-${note.id}`,
          label: note.title,
          description: 'Open note',
          icon: NoteAddIcon,
          category: 'notes',
          type: 'note',
          noteId: note.id,
        }))
      );
    }
    
    return results;
  }, [filteredActions, noteResults]);

  // Search notes when query changes
  useEffect(() => {
    if (query.trim().length >= 2) {
      setIsSearching(true);
      const timer = setTimeout(async () => {
        try {
          const res = await notesApi.list(query);
          if (res.data?.ok) {
            setNoteResults(res.data.data.slice(0, 5));
          }
        } catch {
          setNoteResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setNoteResults([]);
    }
  }, [query]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setNoteResults([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Keep selected item in view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (allResults[selectedIndex]) {
            executeAction(allResults[selectedIndex]);
          }
          break;
        case 'Escape':
          onClose();
          break;
        default:
          break;
      }
    },
    [allResults, selectedIndex, onClose]
  );

  // Execute action
  const executeAction = useCallback(
    async (item) => {
      onClose();
      if (item.type === 'note') {
        navigate(`/notes?id=${item.noteId}`);
      } else if (item.action) {
        await item.action(navigate, { startTimer });
      }
    },
    [navigate, onClose, startTimer]
  );

  // Group results by category
  const groupedResults = useMemo(() => {
    const groups = {};
    let globalIndex = 0;
    
    allResults.forEach((item) => {
      const category = item.category || 'other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push({ ...item, globalIndex: globalIndex++ });
    });
    
    return groups;
  }, [allResults]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          maxHeight: '70vh',
        },
      }}
      TransitionProps={{
        onEntered: () => inputRef.current?.focus(),
      }}
    >
      <Box sx={{ p: 0 }}>
        {/* Search Input */}
        <TextField
          inputRef={inputRef}
          fullWidth
          placeholder="Type a command or search..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            sx: {
              fontSize: '1.1rem',
              py: 1,
              '& fieldset': { border: 'none' },
            },
          }}
          sx={{
            '& .MuiInputBase-root': {
              borderBottom: 1,
              borderColor: 'divider',
              borderRadius: 0,
            },
          }}
        />

        {/* Results */}
        <DialogContent sx={{ p: 0, maxHeight: 400, overflow: 'auto' }} ref={listRef}>
          {Object.keys(groupedResults).length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                {isSearching ? 'Searching...' : 'No results found'}
              </Typography>
            </Box>
          ) : (
            <List dense>
              {Object.entries(groupedResults).map(([category, items]) => (
                <React.Fragment key={category}>
                  <ListItem sx={{ py: 0.5 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
                    >
                      {CATEGORIES[category] || category}
                    </Typography>
                  </ListItem>
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isSelected = selectedIndex === item.globalIndex;
                    return (
                      <ListItem
                        key={item.id}
                        data-index={item.globalIndex}
                        onClick={() => executeAction(item)}
                        sx={{
                          cursor: 'pointer',
                          bgcolor: isSelected ? (theme) => alpha(theme.palette.primary.main, 0.12) : 'transparent',
                          '&:hover': {
                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                          },
                          borderRadius: 1,
                          mx: 1,
                          mb: 0.5,
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <Icon fontSize="small" color={isSelected ? 'primary' : 'action'} />
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          secondary={item.description}
                          primaryTypographyProps={{
                            fontWeight: isSelected ? 600 : 400,
                          }}
                        />
                        {item.shortcut && (
                          <Chip
                            label={item.shortcut}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              bgcolor: 'action.hover',
                            }}
                          />
                        )}
                        {isSelected && (
                          <EnterIcon fontSize="small" color="action" sx={{ ml: 1 }} />
                        )}
                      </ListItem>
                    );
                  })}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>

        {/* Footer hint */}
        <Box
          sx={{
            px: 2,
            py: 1,
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            gap: 2,
            justifyContent: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            <kbd style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.1)' }}>↑↓</kbd> navigate
          </Typography>
          <Typography variant="caption" color="text.secondary">
            <kbd style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.1)' }}>↵</kbd> select
          </Typography>
          <Typography variant="caption" color="text.secondary">
            <kbd style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.1)' }}>esc</kbd> close
          </Typography>
        </Box>
      </Box>
    </Dialog>
  );
}
