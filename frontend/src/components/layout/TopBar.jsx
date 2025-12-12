import { Logout, Menu as MenuIcon, Notifications } from '@mui/icons-material';
import { Avatar, Box, IconButton, Stack, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { useAuth } from '../../context/AuthContext';
import { useGamification } from '../../context/GamificationContext';

const TopBar = ({ onMenuClick, showMenuButton = false }) => {
  const { user, logout } = useAuth();
  const { streak } = useGamification();
  const theme = useTheme();
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{
        borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.12)}`,
        px: { xs: 2, md: 4 },
        py: 2.5,
        background: theme.palette.background.paper,
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        {showMenuButton && (
          <IconButton 
            onClick={onMenuClick}
            sx={{ 
              color: 'text.primary',
              bgcolor: alpha(theme.palette.text.primary, 0.08),
            }}
            aria-label="Open navigation menu"
          >
            <MenuIcon />
          </IconButton>
        )}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Welcome back to the {theme.custom.label} trail
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {user?.display_name || user?.username}
          </Typography>
          <Typography variant="caption" color="primary.main" display="flex" gap={0.5} alignItems="center">
            {theme.custom.accentIcon} {streak} day streak
          </Typography>
        </Box>
      </Stack>
      <Stack direction="row" spacing={{ xs: 1, md: 2 }} alignItems="center">
        <IconButton sx={{ color: 'text.secondary', bgcolor: alpha(theme.palette.primary.main, 0.16) }}>
          <Notifications />
        </IconButton>
        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar
            src={user?.avatar_url}
            sx={{ bgcolor: 'primary.main', color: '#fff', width: 40, height: 40 }}
          >
            {user?.display_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase()}
          </Avatar>
          <IconButton
            sx={{
              color: '#fff',
              bgcolor: 'primary.main',
              '&:hover': { bgcolor: 'primary.dark' },
            }}
            onClick={logout}
            aria-label="Logout"
          >
            <Logout />
          </IconButton>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default TopBar;
