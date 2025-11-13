import { createTheme } from '@mui/material/styles';

const primary = '#6366F1';
const background = '#0F172A';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: primary },
    secondary: { main: '#F472B6' },
    background: {
      default: background,
      paper: '#111C3C',
    },
    success: { main: '#34D399' },
    error: { main: '#F87171' },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: 'Inter, "Segoe UI", sans-serif',
    h4: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.04)',
          backgroundImage: 'none',
        },
      },
    },
  },
});

export default theme;
