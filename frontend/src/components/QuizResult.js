import React from 'react';

const QuizResult = ({ result }) => {
  if (!result) return null;
  return (
    <div className="quiz-result-card">
      <h3>Quiz Results</h3>
      <p>Score: <b>{result.score}</b></p>
      <div className="quiz-result-answers">
        <h4>Your Answers:</h4>
        <ul>
          {Object.entries(result.answers || {}).map(([qid, ans]) => (
            <li key={qid}><b>Q{qid}:</b> {ans}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default QuizResult; 