import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';

import AppLayout from './components/layout/AppLayout';
import RequireAuth from './components/layout/RequireAuth';
import { AuthProvider } from './context/AuthContext';
import DashboardPage from './pages/Dashboard/DashboardPage';
import FlashcardsPage from './pages/Flashcards/FlashcardsPage';
import NotesPage from './pages/Notes/NotesPage';
import QuizzesPage from './pages/Quizzes/QuizzesPage';
import PlannerPage from './pages/Planner/PlannerPage';
import ProgressPage from './pages/Progress/ProgressPage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import theme from './theme';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<RequireAuth />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/flashcards" element={<FlashcardsPage />} />
                  <Route path="/notes" element={<NotesPage />} />
                  <Route path="/quizzes" element={<QuizzesPage />} />
                  <Route path="/planner" element={<PlannerPage />} />
                  <Route path="/progress" element={<ProgressPage />} />
                </Route>
              </Route>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
