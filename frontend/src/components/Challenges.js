import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Challenges.css';

const Challenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const res = await axios.get('/api/challenges/today');
        setChallenges(res.data);
      } catch {
        setError('Could not fetch challenges');
      }
    };
    fetchChallenges();
  }, []);

  const handleComplete = async (id) => {
    try {
      await axios.post(`/api/challenges/${id}/complete`);
      setChallenges(challenges.map(c => c.id === id ? { ...c, completed: true } : c));
    } catch {
      setError('Could not complete challenge');
    }
  };

  return (
    <div className="challenges-container">
      <h3>Daily Challenges</h3>
      {error && <div className="challenges-error">{error}</div>}
      <ul className="challenges-list">
        {challenges.length === 0 && <li>No challenges for today.</li>}
        {challenges.map(challenge => (
          <li key={challenge.id} className={challenge.completed ? 'completed' : ''}>
            <span>{challenge.description}</span>
            {challenge.completed ? (
              <span className="challenge-complete">✔️</span>
            ) : (
              <button onClick={() => handleComplete(challenge.id)}>Mark as Complete</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Challenges; 