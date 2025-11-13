import { Logout, Notifications } from '@mui/icons-material';
import { Avatar, Box, IconButton, Stack, Typography } from '@mui/material';

import { useAuth } from '../../context/AuthContext';

const TopBar = () => {
  const { user, logout } = useAuth();
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        px: 3,
        py: 2,
      }}
    >
      <Box>
        <Typography variant="subtitle2" color="text.secondary">
          Welcome back
        </Typography>
        <Typography variant="h5" fontWeight={700}>
          {user?.display_name || user?.username}
        </Typography>
      </Box>
      <Stack direction="row" spacing={2} alignItems="center">
        <IconButton color="inherit">
          <Notifications />
        </IconButton>
        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar src={user?.avatar_url}>
            {user?.display_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase()}
          </Avatar>
          <IconButton color="inherit" onClick={logout}>
            <Logout />
          </IconButton>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default TopBar;
