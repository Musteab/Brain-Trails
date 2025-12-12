import { useState } from 'react';
import { Box, Container, Drawer, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { Outlet } from 'react-router-dom';

import SidebarNav from './SidebarNav';
import TopBar from './TopBar';
import TutorialSlides from '../common/TutorialSlides';
import TimerToast from '../common/TimerToast';
import BrainrotPiPPortal from '../common/BrainrotPiPPortal';
import { useGamification } from '../../context/GamificationContext';

const AppLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { tutorialOpen, completeTutorialForDay } = useGamification();

  const handleNavClose = () => setMobileNavOpen(false);

  return (
    <Box
      display="flex"
      minHeight="100vh"
      sx={{
        bgcolor: 'background.default',
        backgroundImage: theme.custom.gradient,
        transition: 'background 0.6s ease',
      }}
    >
      {/* Desktop sidebar */}
      <SidebarNav />
      
      {/* Mobile drawer */}
      <Drawer
        anchor="left"
        open={mobileNavOpen}
        onClose={handleNavClose}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: 280,
            bgcolor: theme.palette.background.paper,
            backgroundImage: 'none',
          },
        }}
      >
        <SidebarNav mobile onNavigate={handleNavClose} />
      </Drawer>

      <Box flex={1} display="flex" flexDirection="column">
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
            py: { xs: 3, md: 5 },
            px: { xs: 2, md: 4 },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 3, md: 4 } }}>
            <Outlet />
          </Box>
        </Container>
      </Box>
      <TutorialSlides open={tutorialOpen} onClose={completeTutorialForDay} />
      <TimerToast />
      <BrainrotPiPPortal />
    </Box>
  );
};

export default AppLayout;
