import React, { useState, useRef } from 'react';
import axios from 'axios';
import './Pomodoro.css';

const INITIAL_MINUTES = 25;
const INITIAL_SECONDS = 0;

const TIPS = [
  '💡 Take short breaks between study sessions',
  '💧 Stay hydrated during study sessions',
  '🧘‍♂️ Use breaks to stretch and move around',
  '🗂️ Keep your study space organized',
  '🎵 Try background music for focus',
  '📵 Silence notifications for deep work',
  '🌱 Go outside for a breath of fresh air during breaks',
];

const QUOTES = [
  "Success is the sum of small efforts, repeated day in and day out.",
  "The secret of getting ahead is getting started.",
  "Stay focused and never give up!",
  "Great things are done by a series of small things brought together.",
  "You don't have to be perfect, just keep going.",
  "Every minute counts. Make it productive!",
  "Your future self will thank you for today's effort."
];

function getRandomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

const Pomodoro = () => {
  const [minutes, setMinutes] = useState(INITIAL_MINUTES);
  const [seconds, setSeconds] = useState(INITIAL_SECONDS);
  const [isActive, setIsActive] = useState(false);
  const [quote, setQuote] = useState(getRandomQuote());
  const [sessionId, setSessionId] = useState(null);
  const [sessionMsg, setSessionMsg] = useState('');
  const intervalRef = useRef(null);

  const startTimer = async () => {
    if (isActive) return;
    setIsActive(true);
    try {
      const res = await axios.post('/api/study-sessions/start', { session_type: 'pomodoro' });
      setSessionId(res.data.id);
      setSessionMsg('Pomodoro session started and tracked!');
    } catch {
      setSessionMsg('Pomodoro started (not tracked: backend error)');
    }
    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev === 0) {
          if (minutes === 0) {
            clearInterval(intervalRef.current);
            setIsActive(false);
            endSession();
            return 0;
          } else {
            setMinutes(m => m - 1);
            return 59;
          }
        } else {
          return prev - 1;
        }
      });
    }, 1000);
  };

  const endSession = async () => {
    if (!sessionId) return;
    try {
      await axios.post('/api/study-sessions/end', { id: sessionId });
      setSessionMsg('Pomodoro session ended and tracked!');
    } catch {
      setSessionMsg('Pomodoro ended (not tracked: backend error)');
    }
    setSessionId(null);
  };

  const pauseTimer = () => {
    setIsActive(false);
    clearInterval(intervalRef.current);
  };

  const resetTimer = () => {
    setIsActive(false);
    clearInterval(intervalRef.current);
    setMinutes(INITIAL_MINUTES);
    setSeconds(INITIAL_SECONDS);
    setQuote(getRandomQuote());
    setSessionMsg('');
    setSessionId(null);
  };

  React.useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="simple-pomodoro-container">
      <div className="simple-pomodoro-card fade-in">
        <div className="pomodoro-animated-icon" aria-label="Animated Brain">🧠</div>
        <h2>Pomodoro Timer</h2>
        <div className="pomodoro-quote">{quote}</div>
        <div className="simple-timer-display">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        <div className="simple-timer-controls">
          {!isActive ? (
            <button onClick={startTimer} className="simple-btn start">Start</button>
          ) : (
            <button onClick={pauseTimer} className="simple-btn pause">Pause</button>
          )}
          <button onClick={resetTimer} className="simple-btn reset">Reset</button>
        </div>
        {sessionMsg && <div className="pomodoro-session-msg">{sessionMsg}</div>}
        <div className="pomodoro-tips">
          <h3>Tips for Effective Studying:</h3>
          <ul>
            {TIPS.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Pomodoro; 