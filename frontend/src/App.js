import { useEffect, useMemo } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';

import AppLayout from './components/layout/AppLayout';
import RequireAuth from './components/layout/RequireAuth';
import { AuthProvider } from './context/AuthContext';
import { GamificationProvider, useGamification } from './context/GamificationContext';
import { TimerProvider } from './context/TimerContext';
import DashboardPage from './pages/Dashboard/DashboardPage';
import FlashcardsPage from './pages/Flashcards/FlashcardsPage';
import QuizzesPage from './pages/Quizzes/QuizzesPage';
import PlannerPage from './pages/Planner/PlannerPage';
import ProgressPage from './pages/Progress/ProgressPage';
import ProfilePage from './pages/Profile/ProfilePage';
import SettingsPage from './pages/Settings/SettingsPage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import SpotifyCallback from './pages/Spotify/SpotifyCallback';
import { buildTheme } from './theme';

const queryClient = new QueryClient();

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/flashcards" element={<FlashcardsPage />} />
          <Route path="/quizzes" element={<QuizzesPage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/spotify/callback" element={<SpotifyCallback />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </BrowserRouter>
);

const DynamicThemeHost = () => {
  const { selectedRoom } = useGamification();
  const theme = useMemo(() => buildTheme(selectedRoom), [selectedRoom]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--trail-bg', theme.custom.gradient);
    root.style.setProperty('--trail-surface', theme.palette.background.paper);
    root.style.setProperty('--trail-text', theme.palette.text.primary);
    root.style.setProperty('--trail-text-secondary', theme.palette.text.secondary);
    root.style.setProperty('--trail-texture', theme.custom.trailTexture || 'none');
  }, [theme]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TimerProvider>
        <GamificationProvider>
          <DynamicThemeHost />
        </GamificationProvider>
      </TimerProvider>
    </QueryClientProvider>
  );
}

export default App;
