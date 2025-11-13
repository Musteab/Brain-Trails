import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';

const Dashboard = ({ displayName }) => {
  const [stats, setStats] = useState({
    totalStudyTime: 0,
    flashcardsCreated: 0,
    quizzesCompleted: 0,
    notesCreated: 0
  });
  const history = useHistory();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="dashboard">
      <h1 className="dashboard-greeting">Hi{displayName ? `, ${displayName}` : ''}!</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Study Time</h3>
          <p>{Math.round(stats.totalStudyTime / 60)} minutes</p>
        </div>
        <div className="stat-card">
          <h3>Flashcards Created</h3>
          <p>{stats.flashcardsCreated}</p>
        </div>
        <div className="stat-card">
          <h3>Quizzes Completed</h3>
          <p>{stats.quizzesCompleted}</p>
        </div>
        <div className="stat-card">
          <h3>Notes Created</h3>
          <p>{stats.notesCreated}</p>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button onClick={() => history.push('/flashcards')}>Create Flashcards</button>
          <button onClick={() => history.push('/quizzes')}>Take a Quiz</button>
          <button onClick={() => history.push('/notes')}>Add Notes</button>
          <button onClick={() => history.push('/study-sessions')}>Start Study Session</button>
        </div>
      </div>

      <div className="recent-activity">
        <h2>Recent Activity</h2>
        {/* Add recent activity list here */}
      </div>
    </div>
  );
};

export default Dashboard; 