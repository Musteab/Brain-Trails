import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Preferences.css';

const THEMES = ['light', 'dark', 'focus'];
const MUSIC = [
  { label: 'None', value: '' },
  { label: 'Lo-fi', value: 'lofi' },
  { label: 'Ambient', value: 'ambient' },
  { label: 'Rain', value: 'rain' },
];

const Preferences = () => {
  const [theme, setTheme] = useState('light');
  const [music, setMusic] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const res = await axios.get('/api/preferences');
        setTheme(res.data.theme || 'light');
        setMusic(res.data.music || '');
      } catch {}
    };
    fetchPrefs();
  }, []);

  const handleSave = async () => {
    try {
      await axios.post('/api/preferences', { theme, music });
      setMsg('Preferences updated!');
    } catch {
      setMsg('Could not update preferences');
    }
  };

  return (
    <div className="preferences-container">
      <h3>Preferences</h3>
      <div className="preferences-group">
        <label>Theme:</label>
        <select value={theme} onChange={e => setTheme(e.target.value)}>
          {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="preferences-group">
        <label>Background Music:</label>
        <select value={music} onChange={e => setMusic(e.target.value)}>
          {MUSIC.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>
      <button onClick={handleSave}>Save Preferences</button>
      {msg && <div className="preferences-msg">{msg}</div>}
    </div>
  );
};

export default Preferences; 