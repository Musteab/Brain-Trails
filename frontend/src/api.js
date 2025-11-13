import axios from 'axios';

export const API_BASE_URL = 'http://localhost:5000';

// Helper to get JWT token from localStorage
export function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// User registration
export function registerUser(username, email, password) {
  return axios.post(`${API_BASE_URL}/api/register`, { username, email, password });
}

// JWT login
export async function loginUser(username, password) {
  const response = await axios.post(`${API_BASE_URL}/api/token-login`, { username, password });
  localStorage.setItem('access_token', response.data.access_token);
  return response.data;
}

// Create a deck
export function createDeck(name) {
  return axios.post(
    `${API_BASE_URL}/api/decks`,
    { name },
    { headers: getAuthHeaders() }
  );
}

// Get all decks
export function getDecks() {
  return axios.get(`${API_BASE_URL}/api/decks`, { headers: getAuthHeaders() });
}

// Create a flashcard in a deck (JWT)
export function createDeckFlashcard(deck_id, question, answer) {
  return axios.post(
    `${API_BASE_URL}/api/decks/${deck_id}/flashcards`,
    { question, answer },
    { headers: getAuthHeaders() }
  );
}

// Get all flashcards for a deck (JWT)
export function getDeckFlashcards(deck_id) {
  return axios.get(
    `${API_BASE_URL}/api/decks/${deck_id}/flashcards`,
    { headers: getAuthHeaders() }
  );
}

// Update a flashcard
export function updateFlashcard(flashcard_id, question, answer) {
  return axios.put(
    `${API_BASE_URL}/api/flashcards/${flashcard_id}`,
    { question, answer },
    { 
      headers: getAuthHeaders(),
      withCredentials: true
    }
  );
}

// Delete a flashcard
export function deleteFlashcard(flashcard_id) {
  return axios.delete(
    `${API_BASE_URL}/api/flashcards/${flashcard_id}`,
    { 
      headers: getAuthHeaders(),
      withCredentials: true
    }
  );
}

// Get user profile
export function getProfile() {
  return axios.get(`${API_BASE_URL}/api/profile`, { headers: getAuthHeaders() });
}

// Update user profile
export function updateProfile(profileData) {
  return axios.put(`${API_BASE_URL}/api/profile`, profileData, { headers: getAuthHeaders() });
}

// Quiz API functions
export function getQuizzes() {
  return axios.get(`${API_BASE_URL}/api/quizzes`, { headers: getAuthHeaders() });
}

export function createQuiz(title) {
  return axios.post(
    `${API_BASE_URL}/api/quizzes`,
    { title },
    { headers: getAuthHeaders() }
  );
}

export function getQuizQuestions(quizId) {
  return axios.get(`${API_BASE_URL}/api/quizzes/${quizId}/questions`, { headers: getAuthHeaders() });
}

export function submitQuiz(quizId, answers) {
  return axios.post(
    `${API_BASE_URL}/api/quizzes/${quizId}/submit`,
    { answers },
    { headers: getAuthHeaders() }
  );
} 