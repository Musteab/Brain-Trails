/**
 * TopBar - Main application header with search, room, streak, XP, and user menu
 * 
 * Layout (Desktop):
 * [≡] BrainTrails    [Search...🔍]    🌲 Forest  🔥5  ⚡420 XP  [👤]
 * 
 * Layout (Mobile):
 * [≡] BrainTrails    [🔍]  🔥5  [👤]
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  IconButton,
  Typography,
  Chip,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  LocalFireDepartment as FireIcon,
  Bolt as BoltIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

import SearchBar from './SearchBar';
import CommandPalette from './CommandPalette';
import RoomSelector from './RoomSelector';
import StreakModal from './StreakModal';
import LevelProgressModal from './LevelProgressModal';
import UserMenu from './UserMenu';
import { useGamification } from '../../../context/GamificationContext';
import { roomThemes } from '../../../theme/rooms';

export default function TopBar({ onMenuClick, showMenuButton = false }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { 
    xp,
    level, 
    streak, 
    bestStreak,
    selectedRoom,
    setSelectedRoom,
    xpToNext,
    todayMinutes,
  } = useGamification();
  
  // Modal states
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [roomAnchorEl, setRoomAnchorEl] = useState(null);
  const [streakModalOpen, setStreakModalOpen] = useState(false);
  const [levelModalOpen, setLevelModalOpen] = useState(false);
  
  // Get room config
  const currentRoomConfig = roomThemes[selectedRoom] || roomThemes.forest;
  
  // Calculate XP for next level
  const xpForNextLevel = xpToNext || 200;
  const xpProgressPercent = Math.min((xp / xpForNextLevel) * 100, 100);
  
  // Today's XP (simplified - would come from backend)
  const xpToday = xp; // In real app, this would be daily XP
  
  // Global Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const handleRoomSelect = useCallback((roomId) => {
    setSelectedRoom(roomId);
  }, [setSelectedRoom]);
  
  return (
    <>
      <Box
        component="header"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          px: { xs: 1.5, sm: 2, md: 3 },
          py: 1.5,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: theme.zIndex.appBar,
        }}
      >
        {/* Left Section: Menu + Logo */}
        <Stack direction="row" alignItems="center" spacing={1}>
          {showMenuButton && (
            <IconButton
              onClick={onMenuClick}
              size="small"
              sx={{
                color: 'text.primary',
                bgcolor: alpha(theme.palette.text.primary, 0.06),
                '&:hover': {
                  bgcolor: alpha(theme.palette.text.primary, 0.1),
                },
              }}
              aria-label="Toggle sidebar"
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography
            component={RouterLink}
            to="/dashboard"
            variant="h6"
            sx={{
              fontWeight: 700,
              textDecoration: 'none',
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            BrainTrails
          </Typography>
        </Stack>
        
        {/* Center Section: Search */}
        {!isSmall && (
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', maxWidth: 500 }}>
            <SearchBar
              onFocus={() => setCommandPaletteOpen(true)}
              placeholder="Search notes, decks... (⌘K)"
            />
          </Box>
        )}
        
        {/* Right Section: Room, Streak, XP, User */}
        <Stack direction="row" alignItems="center" spacing={{ xs: 0.5, sm: 1 }}>
          {/* Search icon on mobile */}
          {isSmall && (
            <SearchBar onFocus={() => setCommandPaletteOpen(true)} />
          )}
          
          {/* Room Selector - Hidden on mobile */}
          {!isMobile && (
            <Chip
              icon={
                <Typography component="span" sx={{ fontSize: '1rem', ml: 0.5 }}>
                  {currentRoomConfig.accentIcon}
                </Typography>
              }
              label={currentRoomConfig.label.split(' ')[0]}
              onClick={(e) => setRoomAnchorEl(e.currentTarget)}
              size="small"
              sx={{
                fontWeight: 600,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: 'text.primary',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.18),
                },
                '& .MuiChip-icon': {
                  color: 'inherit',
                },
              }}
            />
          )}
          
          {/* Streak Badge */}
          <Chip
            icon={<FireIcon sx={{ fontSize: 16 }} />}
            label={streak}
            onClick={() => setStreakModalOpen(true)}
            size="small"
            sx={{
              fontWeight: 700,
              bgcolor: alpha(theme.palette.warning.main, 0.15),
              color: 'warning.main',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: alpha(theme.palette.warning.main, 0.25),
              },
              '& .MuiChip-icon': {
                color: 'warning.main',
              },
            }}
          />
          
          {/* XP Badge - Hidden on small mobile */}
          {!isSmall && (
            <Chip
              icon={<BoltIcon sx={{ fontSize: 16 }} />}
              label={`${xpToday} XP`}
              onClick={() => setLevelModalOpen(true)}
              size="small"
              sx={{
                fontWeight: 700,
                bgcolor: alpha(theme.palette.primary.main, 0.15),
                color: 'primary.main',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.25),
                },
                '& .MuiChip-icon': {
                  color: 'primary.main',
                },
              }}
            />
          )}
          
          {/* User Menu */}
          <UserMenu />
        </Stack>
      </Box>
      
      {/* Modals */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
      
      <RoomSelector
        anchorEl={roomAnchorEl}
        open={Boolean(roomAnchorEl)}
        onClose={() => setRoomAnchorEl(null)}
        currentRoom={selectedRoom}
        onSelectRoom={handleRoomSelect}
      />
      
      <StreakModal
        open={streakModalOpen}
        onClose={() => setStreakModalOpen(false)}
        streak={streak}
        bestStreak={bestStreak}
        totalDays={todayMinutes > 0 ? streak : 0}
      />
      
      <LevelProgressModal
        open={levelModalOpen}
        onClose={() => setLevelModalOpen(false)}
        level={level}
        xp={xp}
        xpForNext={xpForNextLevel}
        xpToday={xpToday}
        xpBreakdown={[]}
      />
    </>
  );
}
