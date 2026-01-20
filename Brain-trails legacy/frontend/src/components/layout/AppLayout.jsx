import { useState, useEffect, useCallback } from 'react';
import { Box, Container, useTheme, useMediaQuery } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileBottomNav from './MobileBottomNav';
import TutorialSlides from '../common/TutorialSlides';
import TimerToast from '../common/TimerToast';
import BrainrotPiPPortal from '../common/BrainrotPiPPortal';
import { useGamification } from '../../context/GamificationContext';
import client from '../../api/client';

const SIDEBAR_COLLAPSED_KEY = 'braintrails_sidebar_collapsed';

const AppLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();
  const { tutorialOpen, completeTutorialForDay } = useGamification();

  // Mobile drawer state
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  
  // Sidebar collapsed state - load from localStorage first for instant UI
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      return saved !== 'true'; // expanded = !collapsed
    }
    return true;
  });

  // Fetch preferences from backend
  const { data: prefsData } = useQuery({
    queryKey: ['settings-preferences'],
    queryFn: () => client.get('/settings/preferences'),
    staleTime: 300000, // 5 minutes
  });

  // Update local state when backend data loads
  useEffect(() => {
    if (prefsData?.data?.preferences?.sidebar_collapsed !== undefined) {
      setSidebarExpanded(!prefsData.data.preferences.sidebar_collapsed);
    }
  }, [prefsData]);

  // Mutation to save sidebar state
  const savePreferences = useMutation({
    mutationFn: (data) => client.patch('/settings/preferences', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-preferences'] });
    },
  });

  const handleToggleSidebar = useCallback(() => {
    setSidebarExpanded(prev => {
      const newExpanded = !prev;
      // Save to localStorage for instant load
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, (!newExpanded).toString());
      // Save to backend
      savePreferences.mutate({ sidebar_collapsed: !newExpanded });
      return newExpanded;
    });
  }, [savePreferences]);

  const handleMobileNavClose = () => setMobileNavOpen(false);

  return (
    <Box
      display="flex"
      minHeight="100vh"
      sx={{
        bgcolor: 'background.default',
        backgroundImage: theme.custom?.gradient,
        transition: 'background 0.6s ease',
      }}
    >
      {/* Desktop Sidebar */}
      <Sidebar
        open={true}
        expanded={sidebarExpanded}
        onToggleExpand={handleToggleSidebar}
        mobile={false}
      />
      
      {/* Mobile Drawer */}
      <Sidebar
        open={mobileNavOpen}
        expanded={true}
        onClose={handleMobileNavClose}
        mobile={true}
      />

      <Box 
        flex={1} 
        display="flex" 
        flexDirection="column"
        sx={{
          // Adjust margin based on sidebar width
          ml: { xs: 0, md: 0 },
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <TopBar 
          onMenuClick={() => setMobileNavOpen(true)} 
          showMenuButton={isMobile} 
        />
        <Container
          component="main"
          maxWidth="xl"
          sx={{
            flex: 1,
            width: '100%',
            py: { xs: 3, md: 4 },
            px: { xs: 2, md: 3 },
            // Add bottom padding on mobile for the bottom nav
            pb: { xs: 10, md: 4 },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 3, md: 4 } }}>
            <Outlet />
          </Box>
        </Container>
      </Box>
      
      {/* Mobile bottom navigation */}
      <MobileBottomNav />
      
      <TutorialSlides open={tutorialOpen} onClose={completeTutorialForDay} />
      <TimerToast />
      <BrainrotPiPPortal />
    </Box>
  );
};

export default AppLayout;
