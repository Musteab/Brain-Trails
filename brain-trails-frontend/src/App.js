import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './login';
import Signup from './signup';
import InstitutionInfo from './InstitutionInfo'; // New route
import Dashboard from './Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/loginpage" element={<Login />} />
        <Route path="/signupage" element={<Signup />} />
        <Route path="/institution-info" element={<InstitutionInfo />} />
        <Route path="/Dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
