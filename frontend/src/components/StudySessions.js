import React, { useState, useEffect } from 'react';
import axios from 'axios';

export const StudySessions = () => {
  const [sessions, setSessions] = useState([]);
  const [newSession, setNewSession] = useState({
    start_time: new Date().toISOString(),
    end_time: null,
    duration: 0,
    focus_score: 0,
    notes: ''
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await axios.get('/api/study-sessions');
      setSessions(response.data);
    } catch (error) {
      console.error('Error fetching study sessions:', error);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/study-sessions', newSession);
      setNewSession({
        start_time: new Date().toISOString(),
        end_time: null,
        duration: 0,
        focus_score: 0,
        notes: ''
      });
      fetchSessions();
    } catch (error) {
      console.error('Error creating study session:', error);
    }
  };

  const handleEndSession = async (sessionId) => {
    try {
      const endTime = new Date().toISOString();
      const session = sessions.find(s => s.id === sessionId);
      const startTime = new Date(session.start_time);
      const duration = Math.round((new Date(endTime) - startTime) / 60000); // Duration in minutes
      await axios.put(`/api/study-sessions/${sessionId}`, {
        end_time: endTime,
        duration: duration
      });
      fetchSessions();
    } catch (error) {
      console.error('Error ending study session:', error);
    }
  };

  return (
    <div>
      <h2>Study Sessions</h2>
      <div>
        <h3>Start New Study Session</h3>
        <form onSubmit={handleCreateSession}>
          <div>
            <label>Focus Score (1-10):</label>
            <input
              type="number"
              min="1"
              max="10"
              value={newSession.focus_score}
              onChange={(e) => setNewSession({ ...newSession, focus_score: parseInt(e.target.value) })}
              required
            />
          </div>
          <div>
            <label>Notes:</label>
            <textarea
              value={newSession.notes}
              onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
            />
          </div>
          <button type="submit">Start Session</button>
        </form>
      </div>
      <div>
        <h3>Your Study Sessions</h3>
        {sessions.map((session) => (
          <div key={session.id}>
            <h4>Session {session.id}</h4>
            <p>Start Time: {new Date(session.start_time).toLocaleString()}</p>
            {session.end_time ? (
              <p>End Time: {new Date(session.end_time).toLocaleString()}</p>
            ) : (
              <button onClick={() => handleEndSession(session.id)}>End Session</button>
            )}
            {session.duration && <p>Duration: {session.duration} minutes</p>}
            {session.focus_score && <p>Focus Score: {session.focus_score}</p>}
            {session.notes && <p>Notes: {session.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}; 