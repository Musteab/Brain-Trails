import React, { useState, useEffect } from 'react';
import axios from 'axios';

export const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState({ title: '', content: '' });

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await axios.get('/api/notes');
      setNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/notes', newNote);
      setNewNote({ title: '', content: '' });
      fetchNotes();
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  return (
    <div>
      <h2>Notes</h2>
      <div>
        <h3>Create New Note</h3>
        <form onSubmit={handleCreateNote}>
          <div>
            <label>Title:</label>
            <input
              type="text"
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Content:</label>
            <textarea
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              required
            />
          </div>
          <button type="submit">Create Note</button>
        </form>
      </div>
      <div>
        <h3>Your Notes</h3>
        {notes.map((note) => (
          <div key={note.id}>
            <h4>{note.title}</h4>
            <p>{note.content}</p>
            {note.summary && (
              <div>
                <h5>Summary:</h5>
                <p>{note.summary}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 