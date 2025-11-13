import React, { useEffect, useState } from 'react';
import { getQuizQuestions, submitQuiz } from '../api';
import './Quizzes.css';

const Quiz = ({ quizId, onComplete }) => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      const res = await getQuizQuestions(quizId);
      setQuestions(res.data);
    };
    fetchQuestions();
  }, [quizId]);

  if (!questions.length) return <div>Loading quiz...</div>;

  const q = questions[current];

  const handleAnswer = (qid, answer) => {
    // Only allow answer if not already answered
    if (answers[qid] !== undefined) return;
    setAnswers(prev => ({ ...prev, [qid]: answer }));
    if (answer === q.correct_answer) {
      setScore(prev => prev + 1);
      setFeedback('correct');
    } else {
      setFeedback('incorrect');
    }
  };

  const handleNext = () => {
    setCurrent(c => Math.min(c + 1, questions.length - 1));
    setShowAnswer(false);
    setFeedback(null);
  };
  const handlePrev = () => {
    setCurrent(c => Math.max(c - 1, 0));
    setShowAnswer(false);
    setFeedback(null);
  };

  const handleShowAnswer = () => setShowAnswer(true);

  const handleSubmit = async () => {
    setSubmitted(true);
    // Optionally, send answers to backend for stats
    if (onComplete) onComplete({ score, total: questions.length, answers });
  };

  if (submitted) {
    return (
      <div className="quiz-result">
        <h3>Quiz Complete!</h3>
        <p>Your Score: {score} / {questions.length}</p>
        <ul className="quiz-summary-list">
          {questions.map((q, idx) => (
            <li key={q.id} className={answers[q.id] === q.correct_answer ? 'correct' : 'incorrect'}>
              <b>Q{idx + 1}:</b> {q.question_text} <br />
              <span>Your answer: {answers[q.id] || <i>None</i>}</span><br />
              <span>Correct answer: {q.correct_answer}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <h3>Quiz</h3>
      <div className="quiz-question">
        <p><b>Q{current + 1}:</b> {q.question_text}</p>
        {q.options && q.options.map(opt => (
          <label key={opt} className={`quiz-option ${answers[q.id] === opt ? (opt === q.correct_answer ? 'correct' : 'incorrect') : ''}`}>
            <input
              type="radio"
              name={`q${q.id}`}
              value={opt}
              checked={answers[q.id] === opt}
              onChange={() => handleAnswer(q.id, opt)}
              disabled={answers[q.id] !== undefined}
            />
            {opt}
          </label>
        ))}
      </div>
      <div className="quiz-controls">
        <button onClick={handlePrev} disabled={current === 0}>Previous</button>
        <button onClick={handleNext} disabled={current === questions.length - 1}>Next</button>
        <button onClick={handleShowAnswer} disabled={showAnswer}>Show Answer</button>
        <button onClick={handleSubmit} disabled={Object.keys(answers).length !== questions.length}>Submit Quiz</button>
      </div>
      {feedback && (
        <div className={`quiz-feedback ${feedback}`}>{feedback === 'correct' ? 'Correct!' : 'Incorrect.'}</div>
      )}
      {showAnswer && (
        <div className="quiz-show-answer">Correct answer: <b>{q.correct_answer}</b></div>
      )}
    </div>
  );
};

export default Quiz; 