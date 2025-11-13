import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Leaderboard.css';

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await axios.get('/api/leaderboard');
        setLeaders(res.data);
      } catch {
        setError('Could not fetch leaderboard');
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="leaderboard-container">
      <h3>Leaderboard</h3>
      {error && <div className="leaderboard-error">{error}</div>}
      <ol className="leaderboard-list">
        {leaders.map((user, idx) => (
          <li key={user.id} className="leaderboard-item">
            <span className="leaderboard-rank">#{idx + 1}</span>
            <span className="leaderboard-name">{user.username}</span>
            <span className="leaderboard-xp">{user.xp} XP</span>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default Leaderboard; 