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

// ============ Dashboard API ============

export const dashboardApi = {
  /** Get full dashboard summary */
  getSummary: () => client.get('/dashboard/summary'),
  
  /** Get quick sidebar stats */
  getSidebarStats: () => client.get('/dashboard/sidebar-stats'),
  
  /** Global search across notes, decks, quizzes */
  search: (query) => client.get('/dashboard/search', { params: { q: query } }),
};

// ============ Gamification API ============

export const gamificationApi = {
  /** Get all gamification stats (XP, level, streaks, rewards, pet) */
  getStats: () => client.get('/gamification/stats'),
  
  /** Award XP for an activity */
  awardXp: (payload) => client.post('/gamification/award-xp', payload),
  
  /** Get activity history */
  getActivityHistory: (limit = 50, types = null) => {
    const params = { limit };
    if (types) params.types = types.join(',');
    return client.get('/gamification/activity-history', { params });
  },
  
  /** Get unlocked rewards */
  getRewards: () => client.get('/gamification/rewards'),
  
  /** Get active pet */
  getPet: () => client.get('/gamification/pet'),
  
  /** Feed pet */
  feedPet: () => client.post('/gamification/pet/feed'),
  
  /** Play with pet */
  playWithPet: () => client.post('/gamification/pet/play'),
  
  /** Rename pet */
  renamePet: (name) => client.post('/gamification/pet/rename', { name }),
  
  /** Set pet accessory */
  setPetAccessory: (accessoryId) => client.post('/gamification/pet/accessory', { accessory_id: accessoryId }),
  
  /** Get all user's pets */
  getAllPets: () => client.get('/gamification/pets'),
  
  /** Activate a pet */
  activatePet: (petId) => client.post(`/gamification/pets/${petId}/activate`),
  
  /** Start boss challenge */
  startBoss: (bossId) => client.post('/gamification/boss/start', { boss_id: bossId }),
  
  /** Get boss status */
  getBossStatus: () => client.get('/gamification/boss'),
  
  /** Get leaderboard */
  getLeaderboard: (limit = 10) => client.get('/gamification/leaderboard', { params: { limit } }),
  
  /** Update daily goal */
  updateDailyGoal: (minutes) => client.put('/gamification/daily-goal', { minutes }),
};

// ============ Analytics API ============

export const analyticsApi = {
  /** Get overview stats (backward compatible) */
  overview: () => client.get('/analytics/overview'),
  
  /** Get session stats (backward compatible) */
  sessions: () => client.get('/analytics/sessions'),
  
  /** Get study heatmap data */
  getHeatmap: (days = 365) => client.get('/analytics/heatmap', { params: { days } }),
  
  /** Get time breakdown by tag/topic */
  getBreakdown: (days = 30) => client.get('/analytics/breakdown', { params: { days } }),
  
  /** Get quiz performance trends */
  getQuizPerformance: (days = 30) => client.get('/analytics/quizzes', { params: { days } }),
  
  /** Get flashcard mastery stats */
  getFlashcardStats: () => client.get('/analytics/flashcards'),
  
  /** Get AI-generated study insights */
  getInsights: () => client.get('/analytics/insights'),
  
  /** Get weekly summary */
  getWeeklySummary: () => client.get('/analytics/weekly-summary'),
  
  /** Get all analytics in one request */
  getAll: () => client.get('/analytics/all'),
};

/** @typedef {{ id: number, title: string, updated_at: string, tags: Array<{id: number, name: string, color: string}> }} NoteListItem */
/** @typedef {{ id: number, title: string, content: object, version: number, created_at: string, updated_at: string, tags: Array }} Note */
/** @typedef {{ ok: boolean, data?: any, error?: { code: string, message: string, details?: any } }} ApiResponse */

export const notesApi = {
  /** @returns {Promise<{data: ApiResponse & {data: NoteListItem[]}}>} */
  list: (search = '') => client.get('/notes', { params: search ? { search } : {} }),

  /** @returns {Promise<{data: ApiResponse & {data: Note}}>} */
  get: (noteId) => client.get(`/notes/${noteId}`),

  /** @returns {Promise<{data: ApiResponse & {data: Note}}>} */
  create: (payload) => client.post('/notes', payload),

  /** @returns {Promise<{data: ApiResponse & {data: Note}}>} */
  update: (noteId, payload) => client.patch(`/notes/${noteId}`, payload),

  /** @returns {Promise<{data: ApiResponse}>} */
  delete: (noteId) => client.delete(`/notes/${noteId}`),

  /** Generate quiz from note content (v2 with options) */
  generateQuiz: (noteId, payload) => client.post(`/notes/${noteId}/generate-quiz`, payload),

  /** Get quizzes generated from a note */
  getQuizzes: (noteId) => client.get(`/notes/${noteId}/quizzes`),
  
  /** Mark note as reviewed (spaced repetition) */
  markReviewed: (noteId) => client.post(`/notes/${noteId}/mark-reviewed`),
  
  /** Get notes due for review */
  getDueForReview: () => client.get('/notes/due-for-review'),
  
  /** Get unreviewed notes */
  getUnreviewed: () => client.get('/notes/unreviewed'),
  
  /** Get a random note for review */
  getRandom: () => client.get('/notes/random'),
  
  /** Get note links (outgoing and backlinks) */
  getLinks: (noteId) => client.get(`/notes/${noteId}/links`),
  
  /** Create a link to another note */
  createLink: (noteId, targetNoteId, linkType = 'reference') => 
    client.post(`/notes/${noteId}/links`, { target_note_id: targetNoteId, link_type: linkType }),
  
  /** Delete a note link */
  deleteLink: (noteId, linkId) => client.delete(`/notes/${noteId}/links/${linkId}`),
  
  /** Search notes for linking (autocomplete) */
  searchForLink: (query, excludeId = null) => {
    const params = { q: query };
    if (excludeId) params.exclude = excludeId;
    return client.get('/notes/search-for-link', { params });
  },
  
  /** Advanced search with filters */
  advancedSearch: (payload) => client.post('/notes/search', payload),

  // Tags
  listTags: () => client.get('/notes/tags'),
  createTag: (payload) => client.post('/notes/tags', payload),
  deleteTag: (tagId) => client.delete(`/notes/tags/${tagId}`),
};
