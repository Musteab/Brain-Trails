/**
 * MobileBottomNav - Bottom navigation bar for mobile devices
 * 
 * Shows key navigation items as bottom tabs on mobile
 */
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Description as NotesIcon,
  MenuBook as FlashcardsIcon,
  Quiz as QuizIcon,
  QueryStats as ProgressIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

const navItems = [
  { label: 'Dashboard', icon: DashboardIcon, path: '/dashboard' },
  { label: 'Notes', icon: NotesIcon, path: '/notes' },
  { label: 'Cards', icon: FlashcardsIcon, path: '/flashcards' },
  { label: 'Quizzes', icon: QuizIcon, path: '/quizzes' },
  { label: 'Progress', icon: ProgressIcon, path: '/progress' },
];

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  // Find current nav item index
  const currentIndex = navItems.findIndex(item => 
    location.pathname === item.path || location.pathname.startsWith(item.path + '/')
  );

  const handleChange = (event, newValue) => {
    navigate(navItems[newValue].path);
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar,
        display: { xs: 'block', md: 'none' },
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        // Safe area padding for notched phones
        pb: 'env(safe-area-inset-bottom)',
      }}
      elevation={8}
    >
      <BottomNavigation
        value={currentIndex === -1 ? 0 : currentIndex}
        onChange={handleChange}
        showLabels
        sx={{
          bgcolor: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(10px)',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            py: 1,
            color: theme.palette.text.secondary,
            '&.Mui-selected': {
              color: theme.palette.primary.main,
            },
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.65rem',
            fontWeight: 600,
            mt: 0.5,
            '&.Mui-selected': {
              fontSize: '0.65rem',
            },
          },
        }}
      >
        {navItems.map((item) => (
          <BottomNavigationAction
            key={item.path}
            label={item.label}
            icon={<item.icon />}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
