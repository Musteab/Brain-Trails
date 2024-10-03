import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from './useAuth';

const Login = () => {
  const { login, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const success = await login(email, password); // Await the result of login
    if (success) {
      navigate('/create-study-group'); // Redirect to the dashboard on successful login
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button type="submit">Login</button>
      </form>
      {error && <p>{error}</p>}
      <p>Don't have an account?</p>
      <button onClick={() => navigate('/signupage')}>Sign Up</button>
    </div>
  );
};

export default Login;
