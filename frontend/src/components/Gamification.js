import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Gamification.css';

const Gamification = () => {
  const [xp, setXp] = useState(0);
  const [badges, setBadges] = useState([]);
  const [streak, setStreak] = useState({ current_streak: 0, longest_streak: 0 });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchXp = async () => {
      try {
        const res = await axios.get('/api/xp');
        setXp(res.data.xp || 0);
      } catch {}
    };
    const fetchBadges = async () => {
      try {
        const res = await axios.get('/api/badges');
        setBadges(res.data);
      } catch {}
    };
    const fetchStreak = async () => {
      try {
        const res = await axios.get('/api/streak');
        setStreak(res.data);
      } catch {}
    };
    fetchXp();
    fetchBadges();
    fetchStreak();
  }, []);

  return (
    <div className="gamification-container">
      <h3>Gamification</h3>
      <div className="xp-display">XP: <b>{xp}</b></div>
      <div className="streak-display">
        <span>🔥 Current Streak: {streak.current_streak}</span>
        <span>🏆 Longest Streak: {streak.longest_streak}</span>
      </div>
      <div className="badges-display">
        <h4>Badges</h4>
        <div className="badges-list">
          {badges.length === 0 && <span>No badges yet.</span>}
          {badges.map(badge => (
            <div key={badge.id} className="badge-item">
              <img src={badge.icon} alt={badge.name} className="badge-icon" />
              <span>{badge.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Gamification; 