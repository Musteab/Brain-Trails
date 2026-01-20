/**
 * Notes Study Component for Brainrot Mode
 * Simple note-taking and review interface
 */
import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

export default function NotesStudy() {
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('brainrot-notes');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentNote, setCurrentNote] = useState('');
  const [editingId, setEditingId] = useState(null);

  const saveNotes = (newNotes) => {
    setNotes(newNotes);
    localStorage.setItem('brainrot-notes', JSON.stringify(newNotes));
  };

  const handleAddNote = () => {
    if (!currentNote.trim()) return;

    if (editingId) {
      const updated = notes.map((n) =>
        n.id === editingId ? { ...n, text: currentNote, updatedAt: Date.now() } : n
      );
      saveNotes(updated);
      setEditingId(null);
    } else {
      const newNote = {
        id: Date.now(),
        text: currentNote,
        createdAt: Date.now(),
      };
      saveNotes([newNote, ...notes]);
    }
    setCurrentNote('');
  };

  const handleDeleteNote = (id) => {
    saveNotes(notes.filter((n) => n.id !== id));
  };

  const handleEditNote = (note) => {
    setCurrentNote(note.text);
    setEditingId(note.id);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Typography variant="h6" gutterBottom>
        📝 Quick Notes
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Jot down quick thoughts while studying. Notes are saved locally.
      </Typography>

      {/* Note Input */}
      <Card sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="Write a note..."
          value={currentNote}
          onChange={(e) => setCurrentNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              handleAddNote();
            }
          }}
          sx={{ mb: 2 }}
        />
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            Ctrl + Enter to save
          </Typography>
          <Button
            variant="contained"
            startIcon={editingId ? <SaveIcon /> : <AddIcon />}
            onClick={handleAddNote}
            disabled={!currentNote.trim()}
          >
            {editingId ? 'Update Note' : 'Add Note'}
          </Button>
        </Stack>
      </Card>

      {/* Notes List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {notes.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No notes yet. Start taking notes while you study!
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {notes.map((note, index) => (
              <Box key={note.id}>
                <ListItem
                  sx={{
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    mb: 1,
                    alignItems: 'flex-start',
                  }}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: 'pre-wrap', cursor: 'pointer' }}
                        onClick={() => handleEditNote(note)}
                      >
                        {note.text}
                      </Typography>
                    }
                    secondary={formatTime(note.createdAt)}
                  />
                </ListItem>
              </Box>
            ))}
          </List>
        )}
      </Box>

      {/* Footer Stats */}
      <Divider sx={{ my: 2 }} />
      <Typography variant="caption" color="text.secondary" textAlign="center">
        {notes.length} note{notes.length !== 1 ? 's' : ''} saved locally
      </Typography>
    </Box>
  );
}
