import { alpha, createTheme } from '@mui/material/styles';

import { roomThemes as themeRegistry, defaultRoomKey as fallbackRoomKey } from './rooms';
export { roomThemes, defaultRoomKey } from './rooms';

const baseTypography = {
  fontFamily: '"Space Grotesk","Kulim Park","Segoe UI",sans-serif',
  h1: { fontWeight: 600, lineHeight: 1.2 },
  h2: { fontWeight: 600, lineHeight: 1.25 },
  h3: { fontWeight: 600, lineHeight: 1.3 },
  h4: { fontWeight: 600, lineHeight: 1.3 },
  h5: { fontWeight: 600, lineHeight: 1.35 },
  body1: { lineHeight: 1.6 },
  body2: { lineHeight: 1.55 },
  button: { fontWeight: 600 },
};

const toLuminance = (hex = '#000000') => {
  const value = hex.replace('#', '');
  const rgb =
    value.length === 3
      ? value.split('').map((char) => parseInt(char + char, 16))
      : [value.slice(0, 2), value.slice(2, 4), value.slice(4, 6)].map((segment) =>
          parseInt(segment, 16),
        );
  const normalized = rgb.map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * normalized[0] + 0.7152 * normalized[1] + 0.0722 * normalized[2];
};

export const buildTheme = (roomKey = fallbackRoomKey) => {
  const room = themeRegistry[roomKey] || themeRegistry[fallbackRoomKey];
  const paletteMode = toLuminance(room.palette.background) > 0.6 ? 'light' : 'dark';
  return createTheme({
    spacing: 8,
    palette: {
      mode: paletteMode,
      primary: { main: room.palette.primary },
      secondary: { main: room.palette.secondary },
      success: { main: '#5fcb89' },
      error: { main: '#ff7b7b' },
      warning: { main: '#f2c164' },
      info: { main: '#5bb2c5' },
      background: {
        default: room.palette.background,
        paper: room.palette.surface,
      },
      text: {
        primary: room.palette.textPrimary,
        secondary: room.palette.textSecondary,
      },
    },
    shape: { borderRadius: 20 },
    typography: baseTypography,
    custom: room,
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            border: `1px solid ${alpha(room.palette.textPrimary, 0.08)}`,
            backgroundColor: room.palette.surface,
            backgroundImage: 'none',
            boxShadow: paletteMode === 'light' ? '0 12px 28px rgba(15,23,42,0.08)' : '0 18px 36px rgba(0,0,0,0.45)',
            padding: 24,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            border: `1px solid ${alpha(room.palette.textPrimary, 0.08)}`,
            backgroundColor: room.palette.surface,
            backgroundImage: 'none',
            boxShadow: paletteMode === 'light' ? '0 12px 28px rgba(15,23,42,0.08)' : '0 18px 36px rgba(0,0,0,0.45)',
            padding: 24,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 999,
            fontWeight: 600,
            padding: '10px 22px',
            boxShadow: 'none',
            transition: 'transform 0.18s ease, box-shadow 0.18s ease',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: `0 10px 24px ${alpha(room.palette.primary, 0.24)}`,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            fontWeight: 600,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            backgroundColor: alpha(room.palette.textPrimary, paletteMode === 'light' ? 0.04 : 0.12),
          },
          input: {
            padding: '12px 16px',
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: alpha(room.palette.textPrimary, 0.08),
          },
        },
      },
    },
  });
};
