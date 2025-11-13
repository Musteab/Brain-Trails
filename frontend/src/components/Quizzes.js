import React, { useEffect, useState } from 'react';
import { getQuizzes } from '../api';
import Quiz from './Quiz';
import QuizResult from './QuizResult';
import axios from 'axios';
import './Quizzes.css';

const Quizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [quizName, setQuizName] = useState('');
  const [notes, setNotes] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [timeLimit, setTimeLimit] = useState(60);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showStartPrompt, setShowStartPrompt] = useState(false);
  const [newQuizId, setNewQuizId] = useState(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        const res = await getQuizzes();
        setQuizzes(res.data);
        setError(null);
      } catch (err) {
        setError('Could not fetch quizzes. Please try again.');
        console.error('Error fetching quizzes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    if (!quizName.trim()) {
      setError('Please enter a quiz name.');
      return;
    }
    if (!notes.trim()) {
      setError('Please enter your notes.');
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.post(
        '/api/generate-quiz-from-notes',
        {
          name: quizName,
          notes,
          num_questions: numQuestions,
          time_limit: timeLimit
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setNewQuizId(res.data.quiz_id || null);
      setShowStartPrompt(true);
      setQuizResult(null);
      setNotes('');
      setQuizName('');
      // Optionally refresh quizzes list
      const quizRes = await getQuizzes();
      setQuizzes(quizRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not generate quiz. Please try again.');
      console.error('Error generating quiz:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleStartQuizNow = () => {
    setSelectedQuiz(newQuizId);
    setShowStartPrompt(false);
  };

  const handleSaveForLater = () => {
    setShowStartPrompt(false);
  };

  const handleDeleteQuiz = async (quizId) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`/api/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizzes(quizzes.filter(q => q.id !== quizId));
    } catch (err) {
      setError('Could not delete quiz.');
      console.error('Error deleting quiz:', err);
    }
  };

  const handleStartQuiz = quizId => {
    setSelectedQuiz(quizId);
    setQuizResult(null);
  };

  const handleQuizComplete = result => {
    setQuizResult(result);
    setSelectedQuiz(null);
  };

  if (loading) {
    return <div className="quizzes-container loading">Loading quizzes...</div>;
  }

  return (
    <div className="quizzes-container">
      <h2>Your Quizzes</h2>
      <form className="quiz-create-section" onSubmit={handleGenerateQuiz}>
        <input
          className="quiz-name-input"
          type="text"
          value={quizName}
          onChange={e => setQuizName(e.target.value)}
          placeholder="Quiz name..."
        />
        <textarea
          className="quiz-notes-input"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Paste or type your notes here..."
          rows={5}
        />
        <div className="quiz-preferences">
          <label>
            Number of Questions:
            <input
              type="number"
              min={1}
              max={20}
              value={numQuestions}
              onChange={e => setNumQuestions(Number(e.target.value))}
              className="quiz-pref-input"
            />
          </label>
          <label>
            Time Limit (seconds):
            <input
              type="number"
              min={10}
              max={3600}
              value={timeLimit}
              onChange={e => setTimeLimit(Number(e.target.value))}
              className="quiz-pref-input"
            />
          </label>
          <button type="submit" className="quiz-create-btn" disabled={generating}>
            {generating ? 'Generating...' : 'Generate Quiz from Notes'}
          </button>
        </div>
      </form>

      {showStartPrompt && (
        <div className="quiz-start-prompt">
          <p>Quiz generated! Would you like to start now or save for later?</p>
          <button className="quiz-start-btn" onClick={handleStartQuizNow}>Start Quiz Now</button>
          <button className="quiz-save-btn" onClick={handleSaveForLater}>Save for Later</button>
        </div>
      )}

      {error && <div className="quiz-error">{error}</div>}

      {quizzes.length === 0 ? (
        <div className="quiz-empty-state">
          <p>No quizzes yet. Generate your first quiz!</p>
        </div>
      ) : (
        <div className="quiz-list">
          {quizzes.map(q => (
            <div key={q.id} className="quiz-card">
              <h3>{q.title || q.name || 'Untitled Quiz'}</h3>
              <p>Created: {new Date(q.created_at).toLocaleDateString()}</p>
              <button 
                onClick={() => handleStartQuiz(q.id)}
                className="quiz-start-btn"
              >
                Take Quiz
              </button>
              <button
                onClick={() => handleDeleteQuiz(q.id)}
                className="quiz-delete-btn"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedQuiz && (
        <Quiz quizId={selectedQuiz} onComplete={handleQuizComplete} />
      )}
      
      {quizResult && <QuizResult result={quizResult} />}
    </div>
  );
};

export default Quizzes; 