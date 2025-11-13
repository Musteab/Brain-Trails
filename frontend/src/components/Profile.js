import React, { useEffect, useState } from 'react';
import { getProfile, updateProfile } from '../api';
import './Profile.css';

const themes = [
  { value: 'default', label: 'Default', color: '#60a5fa' },
  { value: 'purple', label: 'Purple', color: '#a78bfa' },
  { value: 'green', label: 'Green', color: '#34d399' },
  { value: 'rose', label: 'Rose', color: '#fb7185' },
];

export default function Profile() {
  const [profile, setProfile] = useState({
    display_name: '',
    bio: '',
    theme: 'default',
    avatar_url: '',
    username: '',
    email: '',
  });
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const res = await getProfile();
        setProfile(res.data);
      } catch (e) {
        setMessage('Failed to load profile.');
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleThemeChange = (theme) => {
    setProfile({ ...profile, theme });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await updateProfile(profile);
      setMessage('Profile updated!');
      setEditing(false);
    } catch (e) {
      setMessage('Failed to update profile.');
    }
  };

  if (loading) return <div className="profile-section"><div className="profile-loading">Loading...</div></div>;

  return (
    <div className="profile-section">
      <div className="profile-card">
        <h2 className="profile-title">My Profile</h2>
        <div className="profile-avatar-row">
          <div className="profile-avatar-wrapper">
            <img
              src={profile.avatar_url || 'https://api.dicebear.com/7.x/thumbs/svg?seed=' + profile.username}
              alt="avatar"
              className="profile-avatar"
            />
          </div>
          <div className="profile-info">
            <div className="profile-username">{profile.username}</div>
            <div className="profile-email">{profile.email}</div>
          </div>
        </div>
        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="profile-form-group">
            <label>Display Name</label>
            <input
              type="text"
              name="display_name"
              value={profile.display_name}
              onChange={handleChange}
              className="profile-input"
              maxLength={32}
              placeholder="Enter your display name"
            />
          </div>
          <div className="profile-form-group">
            <label>Bio</label>
            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              className="profile-input"
              maxLength={160}
              rows={4}
              placeholder="Tell us about yourself..."
            />
          </div>
          <div className="profile-form-group">
            <label>Avatar URL</label>
            <input
              type="text"
              name="avatar_url"
              value={profile.avatar_url}
              onChange={handleChange}
              className="profile-input"
              placeholder="Paste image URL or leave blank for default"
            />
          </div>
          <div className="profile-form-group">
            <label>Theme</label>
            <div className="profile-theme-row">
              {themes.map((t) => (
                <button
                  type="button"
                  key={t.value}
                  className={`profile-theme-btn${profile.theme === t.value ? ' selected' : ''}`}
                  style={{ background: t.color }}
                  onClick={() => handleThemeChange(t.value)}
                  aria-label={t.label}
                >
                  {profile.theme === t.value ? '✓' : ''}
                </button>
              ))}
            </div>
          </div>
          <button className="profile-save-btn" type="submit">Save Changes</button>
          {message && <div className="profile-message">{message}</div>}
        </form>
      </div>
    </div>
  );
} 