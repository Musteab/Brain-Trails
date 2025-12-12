/**
 * NavigationList - Sidebar navigation links with badges
 */
import React from 'react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Chip,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Description as NotesIcon,
  Style as FlashcardsIcon,
  Quiz as QuizIcon,
  EventNote as PlannerIcon,
  TrendingUp as ProgressIcon,
  Person as ProfileIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon, path: '/dashboard' },
  { id: 'notes', label: 'Notes', icon: NotesIcon, path: '/notes', badgeKey: 'noteCount' },
  { id: 'flashcards', label: 'Flashcards', icon: FlashcardsIcon, path: '/flashcards', badgeKey: 'cardsDue', badgeColor: 'error' },
  { id: 'quizzes', label: 'Quizzes', icon: QuizIcon, path: '/quizzes', badgeKey: 'unfinishedQuizzes' },
  { id: 'planner', label: 'Planner', icon: PlannerIcon, path: '/planner' },
  { id: 'progress', label: 'Progress', icon: ProgressIcon, path: '/progress' },
  { id: 'profile', label: 'Profile', icon: ProfileIcon, path: '/profile' },
  { id: 'settings', label: 'Settings', icon: SettingsIcon, path: '/settings' },
];

export default function NavigationList({ expanded = true, badges = {} }) {
  const theme = useTheme();
  const location = useLocation();
  
  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };
  
  return (
    <List disablePadding sx={{ px: expanded ? 1.5 : 0.75, py: 1 }}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;
        const badgeColor = item.badgeColor || 'primary';
        
        const button = (
          <ListItemButton
            component={RouterLink}
            to={item.path}
            selected={active}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              px: expanded ? 2 : 1.5,
              py: 1,
              minHeight: 44,
              justifyContent: expanded ? 'flex-start' : 'center',
              bgcolor: active ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
              borderLeft: active ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
              '&:hover': {
                bgcolor: active
                  ? alpha(theme.palette.primary.main, 0.16)
                  : alpha(theme.palette.text.primary, 0.06),
              },
              '&.Mui-selected': {
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.16),
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: expanded ? 36 : 'auto',
                mr: expanded ? 1 : 0,
                color: active ? 'primary.main' : 'text.secondary',
              }}
            >
              <Badge
                badgeContent={!expanded && badgeCount > 0 ? badgeCount : 0}
                color={badgeColor}
                max={99}
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.6rem',
                    minWidth: 16,
                    height: 16,
                    right: -4,
                    top: -4,
                  },
                }}
              >
                <Icon fontSize="small" />
              </Badge>
            </ListItemIcon>
            
            {expanded && (
              <>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: active ? 600 : 500,
                    color: active ? 'text.primary' : 'text.secondary',
                  }}
                />
                {badgeCount > 0 && (
                  <Chip
                    label={badgeCount}
                    size="small"
                    color={badgeColor}
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      '& .MuiChip-label': {
                        px: 0.75,
                      },
                    }}
                  />
                )}
              </>
            )}
          </ListItemButton>
        );
        
        // Wrap in tooltip when collapsed
        if (!expanded) {
          return (
            <Tooltip key={item.id} title={item.label} placement="right" arrow>
              <ListItem disablePadding>{button}</ListItem>
            </Tooltip>
          );
        }
        
        return <ListItem key={item.id} disablePadding>{button}</ListItem>;
      })}
    </List>
  );
}
