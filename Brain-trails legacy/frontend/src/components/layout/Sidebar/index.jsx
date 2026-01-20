/**
 * Sidebar - Main navigation sidebar with collapsible design
 * 
 * Desktop - Expanded (240px width):
 * - Today's Progress
 * - Navigation links with badges
 * - Quick actions (Pomodoro, Brainrot Mode)
 * - Study Pet widget
 * - Collapse toggle
 * 
 * Desktop - Collapsed (60px width):
 * - Icon-only navigation
 * - Mini pet display
 * 
 * Mobile - Drawer overlay
 */
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';

import ProgressSection from './ProgressSection';
import NavigationList from './NavigationList';
import PomodoroWidget from './PomodoroWidget';
import { dashboardApi } from '../../../api';
import { useGamification } from '../../../context/GamificationContext';

const EXPANDED_WIDTH = 240;
const COLLAPSED_WIDTH = 64;

const heroLogo = `${process.env.PUBLIC_URL || ''}/braintrail-hero.png`;

export default function Sidebar({ 
  open, 
  expanded, 
  onToggleExpand, 
  onClose,
  mobile = false,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { todayMinutes, dailyGoalMinutes } = useGamification();
  
  // Fetch sidebar stats from backend
  const { data: sidebarData } = useQuery({
    queryKey: ['sidebar-stats'],
    queryFn: () => dashboardApi.getSidebarStats(),
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Refresh every minute
  });
  
  const stats = sidebarData?.data || {};
  
  // Use backend data if available, fallback to gamification context
  const minutesToday = stats.minutes_today ?? todayMinutes ?? 0;
  const goalMinutes = stats.daily_goal ?? dailyGoalMinutes ?? 120;
  
  const badges = {
    noteCount: stats.note_count || 0,
    cardsDue: stats.cards_due || 0,
    unfinishedQuizzes: stats.unfinished_quizzes || 0,
  };
  
  const drawerWidth = expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH;
  
  const drawerContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Logo Section */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: expanded ? 2 : 1,
          py: 2,
          justifyContent: expanded ? 'flex-start' : 'center',
        }}
      >
        <Box
          component="img"
          src={heroLogo}
          alt="BrainTrails"
          sx={{
            width: 40,
            height: 40,
            borderRadius: '30%',
            objectFit: 'cover',
            border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
          }}
        />
        {expanded && (
          <Box>
            <Typography
              component={RouterLink}
              to="/dashboard"
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                textDecoration: 'none',
                color: 'text.primary',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              {theme.custom?.accentIcon} BrainTrails
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {theme.custom?.label || 'Forest'} trail
            </Typography>
          </Box>
        )}
      </Box>
      
      <Divider sx={{ opacity: 0.1 }} />
      
      {/* Progress Section */}
      <ProgressSection
        minutesToday={minutesToday}
        goalMinutes={goalMinutes}
        expanded={expanded}
      />
      
      {/* Pomodoro Widget (when active) */}
      <PomodoroWidget expanded={expanded} />
      
      {/* Navigation */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden', py: 1 }}>
        <NavigationList expanded={expanded} badges={badges} />
      </Box>
      
      {/* Collapse Toggle (desktop only) */}
      {!isMobile && (
        <Box
          sx={{
            p: 1,
            display: 'flex',
            justifyContent: expanded ? 'flex-end' : 'center',
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          }}
        >
          <IconButton
            size="small"
            onClick={onToggleExpand}
            sx={{
              bgcolor: alpha(theme.palette.text.primary, 0.06),
              '&:hover': {
                bgcolor: alpha(theme.palette.text.primary, 0.1),
              },
            }}
          >
            {expanded ? <ChevronLeftIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
          </IconButton>
        </Box>
      )}
    </Box>
  );
  
  // Mobile drawer
  if (mobile || isMobile) {
    return (
      <Drawer
        anchor="left"
        open={open}
        onClose={onClose}
        variant="temporary"
        ModalProps={{
          keepMounted: true, // Better performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: EXPANDED_WIDTH,
            boxSizing: 'border-box',
            bgcolor: theme.palette.background.paper,
            backgroundImage: 'none',
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          },
        }}
      >
        {/* Force expanded on mobile */}
        <Box sx={{ height: '100%' }}>
          {React.cloneElement(drawerContent, { expanded: true })}
        </Box>
      </Drawer>
    );
  }
  
  // Desktop permanent drawer
  return (
    <Drawer
      variant="permanent"
      open
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        display: { xs: 'none', md: 'block' },
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: alpha(theme.palette.background.paper, 0.95),
          backgroundImage: 'none',
          borderRight: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
