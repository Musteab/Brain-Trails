import React, { useEffect, useState } from 'react';
import axios from 'axios';

const StudyStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/study-sessions/stats');
        setStats(res.data);
      } catch (err) {
        setError('Could not fetch stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div>Loading study stats...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="study-stats-card">
      <h3>Study Session Stats</h3>
      <p>Total Sessions: <b>{stats.total_sessions}</b></p>
      <p>Total Minutes: <b>{stats.total_minutes}</b></p>
    </div>
  );
};

export default StudyStats; 