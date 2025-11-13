import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';

import SidebarNav from './SidebarNav';
import TopBar from './TopBar';

const AppLayout = () => (
  <Box display="flex" minHeight="100vh" bgcolor="background.default">
    <SidebarNav />
    <Box flex={1} display="flex" flexDirection="column">
      <TopBar />
      <Box component="main" flex={1} p={{ xs: 2, md: 4 }} bgcolor="background.default">
        <Outlet />
      </Box>
    </Box>
  </Box>
);

export default AppLayout;
