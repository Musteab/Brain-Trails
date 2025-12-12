/**
 * WikiLinkSuggestion - UI component for wiki link autocomplete
 * 
 * Shows a list of matching notes when user types [[
 */
import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  Paper,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  CircularProgress,
  alpha,
} from '@mui/material';
import {
  Description as NoteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { notesApi } from '../../api';

const WikiLinkSuggestion = forwardRef(function WikiLinkSuggestion(
  { query, onSelect, position, onClose },
  ref
) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef(null);

  // Search notes based on query
  const { data, isLoading } = useQuery({
    queryKey: ['notes', 'search', query],
    queryFn: async () => {
      if (!query || query.length < 1) {
        const res = await notesApi.getAll();
        return res.data.slice(0, 10);
      }
      // Use advanced search with title filter
      const res = await notesApi.advancedSearch({ title: query, limit: 10 });
      return res.data.notes || res.data || [];
    },
    enabled: true,
    staleTime: 10000,
  });

  const notes = data || [];
  const showCreateOption = query && query.length > 0 && !notes.some(n => n.title?.toLowerCase() === query.toLowerCase());
  const allItems = showCreateOption
    ? [...notes, { id: 'create-new', title: `Create "${query}"`, isCreate: true }]
    : notes;

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedItem = menuRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    selectedItem?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const selectItem = useCallback(
    (index) => {
      const item = allItems[index];
      if (item) {
        if (item.isCreate) {
          onSelect({ noteId: null, noteTitle: query, create: true });
        } else {
          onSelect({ noteId: item.id, noteTitle: item.title });
        }
      }
    },
    [allItems, onSelect, query]
  );

  // Expose keyboard navigation
  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allItems.length) % allItems.length);
        return true;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % allItems.length);
        return true;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        selectItem(selectedIndex);
        return true;
      }

      if (event.key === 'Escape' || event.key === ']') {
        onClose?.();
        return true;
      }

      return false;
    },
  }));

  // Calculate style based on position
  const style = {};
  if (position) {
    style.position = 'fixed';
    style.top = position.bottom + 8;
    style.left = position.left;
    style.zIndex = 1300;
  }

  return (
    <Paper
      ref={menuRef}
      elevation={8}
      sx={{
        width: 300,
        maxHeight: 320,
        overflow: 'auto',
        ...style,
      }}
    >
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ px: 2, pt: 1, pb: 0.5, display: 'block' }}
      >
        Link to Note
      </Typography>

      {isLoading ? (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <CircularProgress size={24} />
        </Box>
      ) : allItems.length === 0 ? (
        <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No notes found
          </Typography>
        </Box>
      ) : (
        <List dense sx={{ py: 0.5 }}>
          {allItems.map((item, index) => {
            const isSelected = index === selectedIndex;

            return (
              <ListItemButton
                key={item.id}
                data-index={index}
                selected={isSelected}
                onClick={() => selectItem(index)}
                sx={{
                  py: 0.75,
                  px: 2,
                  mx: 1,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {item.isCreate ? (
                    <AddIcon
                      fontSize="small"
                      sx={{ color: isSelected ? 'primary.main' : 'text.secondary' }}
                    />
                  ) : (
                    <NoteIcon
                      fontSize="small"
                      sx={{ color: isSelected ? 'primary.main' : 'text.secondary' }}
                    />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={item.title || 'Untitled'}
                  secondary={item.isCreate ? 'Create new note' : item.subject}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isSelected ? 600 : 400,
                    noWrap: true,
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.75rem',
                    noWrap: true,
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      )}
    </Paper>
  );
});

export default WikiLinkSuggestion;
