/**
 * UserMenu - Dropdown menu for user actions
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Typography,
  Chip,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Person as PersonIcon,
  Settings as SettingsIcon,
  BarChart as BarChartIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../../../context/AuthContext';
import { useGamification } from '../../../context/GamificationContext';

export default function UserMenu() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { level, streak } = useGamification();
  
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  
  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleNavigate = (path) => {
    navigate(path);
    handleClose();
  };
  
  const handleLogout = () => {
    handleClose();
    logout();
  };
  
  // Get level color based on level
  const getLevelColor = () => {
    if (level >= 15) return theme.palette.warning.main; // Gold
    if (level >= 10) return theme.palette.secondary.main; // Purple
    if (level >= 5) return theme.palette.primary.main; // Blue
    return theme.palette.success.main; // Green
  };
  
  return (
    <>
      <IconButton
        onClick={handleOpen}
        size="small"
        aria-label="User menu"
        aria-controls={open ? 'user-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <Avatar
          src={user?.avatar_url}
          alt={user?.display_name || user?.username}
          sx={{
            width: 36,
            height: 36,
            bgcolor: 'primary.main',
            fontSize: '0.9rem',
            fontWeight: 600,
            border: `2px solid ${getLevelColor()}`,
          }}
        >
          {(user?.display_name || user?.username)?.[0]?.toUpperCase()}
        </Avatar>
      </IconButton>
      
      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 220,
            borderRadius: 2,
            bgcolor: theme.palette.background.paper,
            backgroundImage: 'none',
            boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.15)}`,
          },
        }}
      >
        {/* User Info Header */}
        <Box px={2} py={1.5} borderBottom={`1px solid ${alpha(theme.palette.divider, 0.1)}`}>
          <Typography variant="subtitle1" fontWeight={600}>
            {user?.display_name || user?.username}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            @{user?.username}
          </Typography>
          <Box display="flex" gap={0.75} mt={1}>
            <Chip
              label={`Level ${level}`}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 600,
                bgcolor: alpha(theme.palette.primary.main, 0.15),
                color: 'primary.main',
              }}
            />
            <Chip
              label={`🔥 ${streak}`}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 600,
                bgcolor: alpha(theme.palette.warning.main, 0.15),
                color: 'warning.main',
              }}
            />
          </Box>
        </Box>
        
        {/* Menu Items */}
        <MenuItem onClick={() => handleNavigate('/profile')} sx={{ py: 1.25 }}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleNavigate('/settings')} sx={{ py: 1.25 }}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleNavigate('/progress')} sx={{ py: 1.25 }}>
          <ListItemIcon>
            <BarChartIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Progress & Stats</ListItemText>
        </MenuItem>
        
        <Divider sx={{ my: 0.5 }} />
        
        <MenuItem onClick={handleLogout} sx={{ py: 1.25, color: 'error.main' }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
