/**
 * CommandPalette - Cmd+K modal for quick actions and search
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  Box,
  InputBase,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Typography,
  Divider,
  Chip,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  Timer as TimerIcon,
  Description as NotesIcon,
  Style as FlashcardsIcon,
  Quiz as QuizIcon,
  Dashboard as DashboardIcon,
  TrendingUp as ProgressIcon,
  Settings as SettingsIcon,
  Psychology as BrainIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../../api';
import { useTimer } from '../../../context/TimerContext';

const quickActions = [
  { id: 'pomodoro', label: 'Start Pomodoro', icon: '🍅', shortcut: 'P', action: 'start-pomodoro' },
  { id: 'brainrot', label: 'Brainrot Mode', icon: '🧠', shortcut: 'B', path: '/brainrot' },
  { id: 'flashcards', label: 'Review Flashcards', icon: '🎴', shortcut: 'R', path: '/flashcards' },
  { id: 'quiz', label: 'Take Quiz', icon: '📋', shortcut: 'Q', path: '/quizzes' },
];

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon, path: '/dashboard' },
  { id: 'notes', label: 'Notes', icon: NotesIcon, path: '/notes' },
  { id: 'flashcards', label: 'Flashcards', icon: FlashcardsIcon, path: '/flashcards' },
  { id: 'quizzes', label: 'Quizzes', icon: QuizIcon, path: '/quizzes' },
  { id: 'progress', label: 'Progress', icon: ProgressIcon, path: '/progress' },
  { id: 'profile', label: 'Profile', icon: PersonIcon, path: '/profile' },
  { id: 'settings', label: 'Settings', icon: SettingsIcon, path: '/settings' },
];

export default function CommandPalette({ open, onClose }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { startTimer } = useTimer();
  
  // Search query
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['command-search', query],
    queryFn: () => dashboardApi.search(query),
    enabled: open && query.length >= 2,
    staleTime: 30000,
  });
  
  const results = searchResults?.data || { notes: [], decks: [], quizzes: [] };
  const hasResults = results.notes?.length > 0 || results.decks?.length > 0 || results.quizzes?.length > 0;
  
  // Build items list
  const allItems = [];
  
  if (!query) {
    // Show quick actions and nav when no query
    quickActions.forEach(item => allItems.push({ ...item, type: 'action' }));
    navItems.forEach(item => allItems.push({ ...item, type: 'nav' }));
  } else if (hasResults) {
    // Show search results
    results.notes?.forEach(item => allItems.push({ ...item, type: 'note', icon: NotesIcon }));
    results.decks?.forEach(item => allItems.push({ ...item, type: 'deck', icon: FlashcardsIcon }));
    results.quizzes?.forEach(item => allItems.push({ ...item, type: 'quiz', icon: QuizIcon }));
  } else {
    // Show filtered nav items
    navItems
      .filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
      .forEach(item => allItems.push({ ...item, type: 'nav' }));
  }
  
  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);
  
  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
    }
  }, [open]);
  
  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = allItems[selectedIndex];
      if (item) handleSelect(item);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [allItems, selectedIndex, onClose]);
  
  const handleSelect = (item) => {
    if (item.action === 'start-pomodoro') {
      startTimer?.();
      onClose();
    } else if (item.path) {
      navigate(item.path);
      onClose();
    } else if (item.type === 'note') {
      navigate(`/notes/${item.id}`);
      onClose();
    } else if (item.type === 'deck') {
      navigate(`/flashcards?deck=${item.id}`);
      onClose();
    } else if (item.type === 'quiz') {
      navigate(`/quizzes/${item.id}`);
      onClose();
    }
  };
  
  // Global Cmd+K listener
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) {
          onClose();
        }
      }
    };
    
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [open, onClose]);
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: theme.palette.background.paper,
          backgroundImage: 'none',
          overflow: 'hidden',
          position: 'fixed',
          top: '15%',
          m: 0,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2.5,
          py: 2,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <SearchIcon sx={{ color: 'text.secondary' }} />
        <InputBase
          ref={inputRef}
          placeholder="Type a command or search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{
            flex: 1,
            fontSize: '1rem',
            '& input::placeholder': {
              color: 'text.secondary',
              opacity: 0.8,
            },
          }}
          autoFocus
        />
        {isLoading && <CircularProgress size={20} />}
        <Chip
          label="esc"
          size="small"
          sx={{
            height: 22,
            fontSize: '0.65rem',
            bgcolor: alpha(theme.palette.text.primary, 0.08),
          }}
        />
      </Box>
      
      <DialogContent sx={{ p: 0, maxHeight: 400 }}>
        <List dense disablePadding>
          {/* Quick Actions */}
          {!query && (
            <>
              <ListSubheader
                sx={{
                  bgcolor: 'transparent',
                  color: 'text.secondary',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  lineHeight: '32px',
                  px: 2.5,
                }}
              >
                Quick Actions
              </ListSubheader>
              {quickActions.map((item, index) => (
                <ListItem
                  key={item.id}
                  button
                  onClick={() => handleSelect(item)}
                  selected={selectedIndex === index}
                  sx={{
                    px: 2.5,
                    py: 1,
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                    },
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, fontSize: '1.2rem' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                  <Chip
                    label={item.shortcut}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      bgcolor: alpha(theme.palette.text.primary, 0.08),
                    }}
                  />
                </ListItem>
              ))}
              <Divider sx={{ my: 1 }} />
              <ListSubheader
                sx={{
                  bgcolor: 'transparent',
                  color: 'text.secondary',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  lineHeight: '32px',
                  px: 2.5,
                }}
              >
                Navigation
              </ListSubheader>
            </>
          )}
          
          {/* Search Results or Nav Items */}
          {query && hasResults ? (
            <>
              {results.notes?.length > 0 && (
                <>
                  <ListSubheader
                    sx={{
                      bgcolor: 'transparent',
                      color: 'text.secondary',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      lineHeight: '32px',
                      px: 2.5,
                    }}
                  >
                    Notes
                  </ListSubheader>
                  {results.notes.map((item, idx) => {
                    const itemIndex = idx;
                    return (
                      <ListItem
                        key={`note-${item.id}`}
                        button
                        onClick={() => handleSelect({ ...item, type: 'note' })}
                        selected={selectedIndex === itemIndex}
                        sx={{
                          px: 2.5,
                          py: 1,
                          '&.Mui-selected': {
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <NotesIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={item.title} />
                      </ListItem>
                    );
                  })}
                </>
              )}
              {results.decks?.length > 0 && (
                <>
                  <ListSubheader
                    sx={{
                      bgcolor: 'transparent',
                      color: 'text.secondary',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      lineHeight: '32px',
                      px: 2.5,
                    }}
                  >
                    Flashcard Decks
                  </ListSubheader>
                  {results.decks.map((item, idx) => {
                    const itemIndex = (results.notes?.length || 0) + idx;
                    return (
                      <ListItem
                        key={`deck-${item.id}`}
                        button
                        onClick={() => handleSelect({ ...item, type: 'deck' })}
                        selected={selectedIndex === itemIndex}
                        sx={{
                          px: 2.5,
                          py: 1,
                          '&.Mui-selected': {
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <FlashcardsIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={item.name}
                          secondary={`${item.card_count || 0} cards`}
                        />
                      </ListItem>
                    );
                  })}
                </>
              )}
              {results.quizzes?.length > 0 && (
                <>
                  <ListSubheader
                    sx={{
                      bgcolor: 'transparent',
                      color: 'text.secondary',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      lineHeight: '32px',
                      px: 2.5,
                    }}
                  >
                    Quizzes
                  </ListSubheader>
                  {results.quizzes.map((item, idx) => {
                    const itemIndex = (results.notes?.length || 0) + (results.decks?.length || 0) + idx;
                    return (
                      <ListItem
                        key={`quiz-${item.id}`}
                        button
                        onClick={() => handleSelect({ ...item, type: 'quiz' })}
                        selected={selectedIndex === itemIndex}
                        sx={{
                          px: 2.5,
                          py: 1,
                          '&.Mui-selected': {
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <QuizIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={item.title} />
                      </ListItem>
                    );
                  })}
                </>
              )}
            </>
          ) : (
            // Nav items (when no query or no results)
            (!query ? navItems : navItems.filter(item => 
              item.label.toLowerCase().includes(query.toLowerCase())
            )).map((item, idx) => {
              const itemIndex = !query ? quickActions.length + idx : idx;
              const Icon = item.icon;
              return (
                <ListItem
                  key={item.id}
                  button
                  onClick={() => handleSelect(item)}
                  selected={selectedIndex === itemIndex}
                  sx={{
                    px: 2.5,
                    py: 1,
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                    },
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItem>
              );
            })
          )}
          
          {/* No results message */}
          {query && !hasResults && query.length >= 2 && !isLoading && (
            <Box textAlign="center" py={4}>
              <Typography variant="body2" color="text.secondary">
                No results found for "{query}"
              </Typography>
            </Box>
          )}
        </List>
      </DialogContent>
    </Dialog>
  );
}
