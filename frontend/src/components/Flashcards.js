import React, { useState, useEffect } from 'react';
import { getDeckFlashcards, createDeckFlashcard, getDecks, createDeck, updateFlashcard, deleteFlashcard } from '../api';
import './Flashcards.css';

export const Flashcards = () => {
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [newFlashcard, setNewFlashcard] = useState({ question: '', answer: '', deck_id: '' });
  const [decks, setDecks] = useState([]);
  const [newDeckName, setNewDeckName] = useState('');
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingFlashcard, setEditingFlashcard] = useState(null);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    fetchDecks();
  }, []);

  useEffect(() => {
    if (newFlashcard.deck_id) {
      fetchFlashcards(newFlashcard.deck_id);
    } else {
      setFlashcards([]);
    }
  }, [newFlashcard.deck_id]);

  const fetchFlashcards = async (deckId) => {
    try {
      const response = await getDeckFlashcards(deckId);
      setFlashcards(response.data);
      setCurrentIndex(0);
    } catch (error) {
      setError('Error fetching flashcards');
    }
  };

  const fetchDecks = async () => {
    try {
      const response = await getDecks();
      setDecks(response.data);
      if (response.data.length > 0) {
        setNewFlashcard((prev) => ({ ...prev, deck_id: response.data[0].id }));
      }
    } catch (error) {
      setError('Error fetching decks');
    }
  };

  const handleCreateDeck = async (e) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;
    try {
      const response = await createDeck(newDeckName);
      setNewDeckName('');
      fetchDecks();
      setNewFlashcard((prev) => ({ ...prev, deck_id: response.data.id }));
    } catch (error) {
      setError('Error creating deck');
    }
  };

  const handleCreateFlashcard = async (e) => {
    e.preventDefault();
    try {
      await createDeckFlashcard(newFlashcard.deck_id, newFlashcard.question, newFlashcard.answer);
      setNewFlashcard({ question: '', answer: '', deck_id: newFlashcard.deck_id });
      fetchFlashcards(newFlashcard.deck_id);
    } catch (error) {
      setError('Error creating flashcard');
    }
  };

  const handleEditFlashcard = async (e) => {
    e.preventDefault();
    try {
      await updateFlashcard(editingFlashcard.id, editingFlashcard.question, editingFlashcard.answer);
      setIsEditing(false);
      setEditingFlashcard(null);
      fetchFlashcards(newFlashcard.deck_id);
    } catch (error) {
      setError('Error updating flashcard');
    }
  };

  const handleDeleteFlashcard = async (id) => {
    if (window.confirm('Are you sure you want to delete this flashcard?')) {
      try {
        await deleteFlashcard(id);
        fetchFlashcards(newFlashcard.deck_id);
      } catch (error) {
        setError('Error deleting flashcard');
      }
    }
  };

  const handleNext = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
      setShowAnswer(false);
      setIsFlipping(false);
    }, 300);
  };

  const handlePrevious = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + flashcards.length) % flashcards.length);
      setShowAnswer(false);
      setIsFlipping(false);
    }, 300);
  };

  const handleFlip = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setShowAnswer(!showAnswer);
      setIsFlipping(false);
    }, 300);
  };

  return (
    <div className="flashcards-container">
      <h2>Flashcards</h2>
      
      <div className="deck-section">
        <h3>Create New Deck</h3>
        <form onSubmit={handleCreateDeck} className="deck-form">
          <input
            type="text"
            value={newDeckName}
            onChange={(e) => setNewDeckName(e.target.value)}
            placeholder="Deck name"
            required
            className="deck-input"
          />
          <button type="submit" className="create-deck-btn">Create Deck</button>
        </form>
      </div>

      <div className="flashcard-section">
        <h3>Create New Flashcard</h3>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleCreateFlashcard} className="flashcard-form">
          <div className="form-group">
            <label>Deck:</label>
            <select
              value={newFlashcard.deck_id}
              onChange={(e) => setNewFlashcard({ ...newFlashcard, deck_id: e.target.value })}
              required
              className="deck-select"
            >
              <option value="">Select a deck</option>
              {decks.map((deck) => (
                <option key={deck.id} value={deck.id}>{deck.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Front:</label>
            <input
              type="text"
              value={newFlashcard.question}
              onChange={(e) => setNewFlashcard({ ...newFlashcard, question: e.target.value })}
              required
              className="flashcard-input"
            />
          </div>
          <div className="form-group">
            <label>Back:</label>
            <input
              type="text"
              value={newFlashcard.answer}
              onChange={(e) => setNewFlashcard({ ...newFlashcard, answer: e.target.value })}
              required
              className="flashcard-input"
            />
          </div>
          <button type="submit" className="create-flashcard-btn">Create Flashcard</button>
        </form>
      </div>

      <div className="review-section">
        <h3 className="review-title">Review Flashcards</h3>
        {flashcards.length > 0 ? (
          <div className="review-main">
            <div
              className={`review-card${showAnswer ? ' flipped' : ''}`}
              onClick={handleFlip}
              tabIndex={0}
              aria-label="Flip flashcard"
            >
              <div className="review-card-inner">
                <div className="review-card-front">
                  <span>{flashcards[currentIndex]?.question}</span>
                </div>
                <div className="review-card-back">
                  <span>{flashcards[currentIndex]?.answer}</span>
                </div>
              </div>
            </div>
            <div className="review-controls">
              <button onClick={handlePrevious} className="review-btn">Previous</button>
              <button onClick={handleFlip} className="review-btn flip-btn">
                {showAnswer ? 'Show Question' : 'Show Answer'}
              </button>
              <button onClick={handleNext} className="review-btn">Next</button>
            </div>
            <div className="review-actions">
              <button onClick={() => { setEditingFlashcard(flashcards[currentIndex]); setIsEditing(true); }} className="review-btn edit-btn">Edit</button>
              <button onClick={() => handleDeleteFlashcard(flashcards[currentIndex].id)} className="review-btn delete-btn">Delete</button>
            </div>
          </div>
        ) : (
          <p className="no-flashcards">No flashcards available. Create some to get started!</p>
        )}
      </div>

      {isEditing && editingFlashcard && (
        <div className="edit-modal">
          <div className="edit-modal-content">
            <h3>Edit Flashcard</h3>
            <form onSubmit={handleEditFlashcard}>
              <div className="form-group">
                <label>Question:</label>
                <input
                  type="text"
                  value={editingFlashcard.question}
                  onChange={(e) => setEditingFlashcard({ ...editingFlashcard, question: e.target.value })}
                  required
                  className="flashcard-input"
                />
              </div>
              <div className="form-group">
                <label>Answer:</label>
                <input
                  type="text"
                  value={editingFlashcard.answer}
                  onChange={(e) => setEditingFlashcard({ ...editingFlashcard, answer: e.target.value })}
                  required
                  className="flashcard-input"
                />
              </div>
              <div className="edit-modal-buttons">
                <button type="submit" className="save-btn">Save Changes</button>
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditing(false);
                    setEditingFlashcard(null);
                  }}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}; 