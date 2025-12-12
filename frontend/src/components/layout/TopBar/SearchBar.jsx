/**
 * SearchBar - Quick search input that opens command palette
 */
import React from 'react';
import {
  Box,
  InputBase,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

export default function SearchBar({ onFocus, placeholder = "Search..." }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // On mobile, just show an icon button
  if (isMobile) {
    return (
      <IconButton
        onClick={onFocus}
        sx={{
          color: 'text.secondary',
          bgcolor: alpha(theme.palette.text.primary, 0.08),
          '&:hover': {
            bgcolor: alpha(theme.palette.text.primary, 0.12),
          },
        }}
        aria-label="Search"
      >
        <SearchIcon />
      </IconButton>
    );
  }
  
  return (
    <Box
      onClick={onFocus}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 0.75,
        borderRadius: 2,
        bgcolor: alpha(theme.palette.text.primary, 0.06),
        border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
        cursor: 'pointer',
        transition: 'all 0.2s',
        minWidth: 200,
        maxWidth: 400,
        flexGrow: 1,
        '&:hover': {
          bgcolor: alpha(theme.palette.text.primary, 0.1),
          borderColor: alpha(theme.palette.primary.main, 0.3),
        },
      }}
    >
      <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ flexGrow: 1 }}
      >
        {placeholder}
      </Typography>
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            px: 0.75,
            py: 0.25,
            borderRadius: 0.5,
            bgcolor: alpha(theme.palette.text.primary, 0.1),
            fontFamily: 'monospace',
            fontSize: '0.65rem',
          }}
        >
          ⌘K
        </Typography>
      </Box>
    </Box>
  );
}
