import client from './client';

export const authApi = {
  register: (payload) => client.post('/auth/register', payload),
  login: (payload) => client.post('/auth/login', payload),
  me: () => client.get('/auth/me'),
  updatePreferences: (payload) => client.put('/auth/preferences', payload),
};

export const flashcardApi = {
  listDecks: () => client.get('/decks'),
  createDeck: (payload) => client.post('/decks', payload),
  updateDeck: (deckId, payload) => client.put(`/decks/${deckId}`, payload),
  deleteDeck: (deckId) => client.delete(`/decks/${deckId}`),
  listFlashcards: (deckId) => client.get(`/decks/${deckId}/flashcards`),
  createFlashcard: (deckId, payload) => client.post(`/decks/${deckId}/flashcards`, payload),
  updateFlashcard: (cardId, payload) => client.put(`/flashcards/${cardId}`, payload),
  deleteFlashcard: (cardId) => client.delete(`/flashcards/${cardId}`),
  reviewFlashcard: (cardId, payload) => client.post(`/flashcards/${cardId}/review`, payload),
};

export const notesApi = {
  list: () => client.get('/notes'),
  create: (payload) => client.post('/notes', payload),
  update: (id, payload) => client.put(`/notes/${id}`, payload),
  remove: (id) => client.delete(`/notes/${id}`),
  summarize: (id) => client.post(`/notes/${id}/summaries`),
  summarizeRaw: (payload) => client.post('/notes/summarize', payload),
};

export const quizApi = {
  list: () => client.get('/quizzes'),
  createFromNotes: (payload) => client.post('/quizzes/generate', payload),
  detail: (quizId) => client.get(`/quizzes/${quizId}`),
  questions: (quizId) => client.get(`/quizzes/${quizId}/questions`),
  submit: (quizId, payload) => client.post(`/quizzes/${quizId}/attempts`, payload),
  remove: (quizId) => client.delete(`/quizzes/${quizId}`),
};

export const plannerApi = {
  list: () => client.get('/planner/sessions'),
  create: (payload) => client.post('/planner/sessions', payload),
  update: (id, payload) => client.put(`/planner/sessions/${id}`, payload),
  remove: (id) => client.delete(`/planner/sessions/${id}`),
};

export const statsApi = {
  overview: () => client.get('/stats/overview'),
  study: () => client.get('/stats/study'),
};
