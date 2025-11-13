import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, NavLink, Redirect, useHistory } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import { Flashcards } from './components/Flashcards';
import Quizzes from './components/Quizzes';
import { Notes } from './components/Notes';
import { StudySessions } from './components/StudySessions';
import Pomodoro from './components/Pomodoro';
import Logo from './components/Logo';
import Profile from './components/Profile';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('access_token'));
  const [displayName, setDisplayName] = useState(localStorage.getItem('display_name') || localStorage.getItem('username') || '');

  useEffect(() => {
    const handleStorage = () => {
      setIsLoggedIn(!!localStorage.getItem('access_token'));
      setDisplayName(localStorage.getItem('display_name') || localStorage.getItem('username') || '');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('display_name');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    window.location.href = '/login';
  };

  return (
    <Router>
      <div className="app">
        <nav className="nav">
          <div className="nav-brand">
            <Logo size="medium" />
          </div>
          <div className="nav-links">
            {!isLoggedIn && <NavLink to="/login" activeClassName="active">Login</NavLink>}
            {!isLoggedIn && <NavLink to="/register" activeClassName="active">Register</NavLink>}
            {isLoggedIn && <NavLink to="/dashboard" activeClassName="active">Dashboard</NavLink>}
            {isLoggedIn && <NavLink to="/flashcards" activeClassName="active">Flashcards</NavLink>}
            {isLoggedIn && <NavLink to="/quizzes" activeClassName="active">Quizzes</NavLink>}
            {isLoggedIn && <NavLink to="/notes" activeClassName="active">Notes</NavLink>}
            {isLoggedIn && <NavLink to="/study-sessions" activeClassName="active">Study Sessions</NavLink>}
            {isLoggedIn && <NavLink to="/pomodoro" activeClassName="active">Pomodoro</NavLink>}
            {isLoggedIn && <NavLink to="/profile" activeClassName="active">Profile</NavLink>}
            {isLoggedIn && <button className="nav-logout-btn" onClick={handleLogout}>Logout</button>}
          </div>
        </nav>
        <main className="main-content">
          <Switch>
            <Route exact path="/">
              {isLoggedIn ? <Redirect to="/dashboard" /> : <Redirect to="/login" />}
            </Route>
            <Route path="/login">
              {isLoggedIn ? <Redirect to="/dashboard" /> : <Login onLogin={() => setIsLoggedIn(true)} />}
            </Route>
            <Route path="/register">
              {isLoggedIn ? <Redirect to="/dashboard" /> : <Register onRegister={() => setIsLoggedIn(true)} />}
            </Route>
            <Route path="/dashboard">
              {isLoggedIn ? <Dashboard displayName={displayName} /> : <Redirect to="/login" />}
            </Route>
            <Route path="/flashcards">
              {isLoggedIn ? <Flashcards /> : <Redirect to="/login" />}
            </Route>
            <Route path="/quizzes">
              {isLoggedIn ? <Quizzes /> : <Redirect to="/login" />}
            </Route>
            <Route path="/notes">
              {isLoggedIn ? <Notes /> : <Redirect to="/login" />}
            </Route>
            <Route path="/study-sessions">
              {isLoggedIn ? <StudySessions /> : <Redirect to="/login" />}
            </Route>
            <Route path="/pomodoro">
              {isLoggedIn ? <Pomodoro /> : <Redirect to="/login" />}
            </Route>
            <Route path="/profile">
              {isLoggedIn ? <Profile /> : <Redirect to="/login" />}
            </Route>
          </Switch>
        </main>
      </div>
    </Router>
  );
}

export default App; 