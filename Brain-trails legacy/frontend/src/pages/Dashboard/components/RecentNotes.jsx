/**
 * RecentNotes - Quick access to recently edited notes
 */
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Button,
  useTheme,
} from '@mui/material';
import {
  Description as NoteIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export default function RecentNotes({
  notes = [],
  onOpenNote,
  onViewAll,
}) {
  const theme = useTheme();

  return (
    <Card elevation={0} sx={{ bgcolor: 'background.paper', height: '100%' }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6" fontWeight={700}>
            Recent Notes
          </Typography>
          <Button 
            size="small" 
            endIcon={<ArrowIcon />}
            onClick={onViewAll}
            sx={{ textTransform: 'none' }}
          >
            View all
          </Button>
        </Box>

        {notes.length === 0 ? (
          <Box 
            sx={{ 
              py: 3, 
              textAlign: 'center',
              color: 'text.secondary',
            }}
          >
            <NoteIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
            <Typography variant="body2">
              No notes yet. Create your first note!
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {notes.slice(0, 5).map((note) => (
              <ListItem key={note.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => onOpenNote?.(note.id)}
                  sx={{
                    borderRadius: 2,
                    py: 1,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <NoteIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={note.title || 'Untitled'}
                    secondary={dayjs(note.updated_at).fromNow()}
                    primaryTypographyProps={{
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      noWrap: true,
                    }}
                    secondaryTypographyProps={{
                      fontSize: '0.7rem',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
