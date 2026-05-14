import { createTheme } from '@mui/material/styles';

export const getTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: mode === 'dark' ? '#A3E635' : '#65A30D', // Sprout Green vs Deep Olive for contrast
      light: '#BEF264',
      dark: '#4D7C0F',
      contrastText: mode === 'dark' ? '#064E3B' : '#ffffff',
    },
    secondary: {
      main: '#F59E0B', // Harvest Gold / Wheat
      light: '#FBBF24',
      dark: '#B45309',
      contrastText: '#000000',
    },
    background: {
      default: mode === 'dark' ? '#050704' : '#F9FBFA', // Earthy Deep Black vs Professional Grey-Green
      paper: mode === 'dark' ? '#0C0F0A' : '#ffffff',   // Forest Night Surface vs Clean White
    },
    text: {
      primary: mode === 'dark' ? '#F0F4F0' : '#0F172A', // Mist vs Deep Slate
      secondary: mode === 'dark' ? 'rgba(240, 244, 240, 0.65)' : '#475569',
    },
    divider: mode === 'dark' ? 'rgba(163, 230, 53, 0.12)' : 'rgba(15, 23, 42, 0.08)',
  },
  typography: {
    fontFamily: [
      '"Inter"',
      '"Outfit"',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 900,
      letterSpacing: '-0.04em',
      lineHeight: 1.1,
    },
    h2: {
      fontWeight: 800,
      letterSpacing: '-0.03em',
      lineHeight: 1.2,
    },
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    button: {
      fontWeight: 700,
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
    overline: {
      fontWeight: 900,
      letterSpacing: '0.2em',
      color: '#A3E635',
      textTransform: 'uppercase',
    }
  },
  shape: {
    borderRadius: 24,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: mode === 'dark' ? '#050704' : '#F9FBFA',
          color: mode === 'dark' ? '#F0F4F0' : '#0F172A',
          transition: 'background-color 0.4s ease, color 0.4s ease',
          scrollbarColor: mode === 'dark' ? "#A3E635 #050704" : "#65A30D #F9FBFA",
          "&::-webkit-scrollbar": {
            width: '8px',
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: mode === 'dark' ? '#A3E635' : '#65A30D',
            borderRadius: '10px',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          padding: '12px 28px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        containedPrimary: {
          backgroundColor: mode === 'dark' ? '#A3E635' : '#65A30D',
          color: mode === 'dark' ? '#064E3B' : '#ffffff',
          '&:hover': {
            backgroundColor: mode === 'dark' ? '#BEF264' : '#4D7C0F',
            boxShadow: mode === 'dark' 
              ? '0 12px 32px rgba(163, 230, 53, 0.35)' 
              : '0 12px 32px rgba(101, 163, 13, 0.25)',
            transform: 'translateY(-2px)',
          },
        },
        outlined: {
          borderColor: mode === 'dark' ? 'rgba(163, 230, 53, 0.3)' : 'rgba(101, 163, 13, 0.3)',
          color: mode === 'dark' ? '#A3E635' : '#65A30D',
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
            borderColor: mode === 'dark' ? '#A3E635' : '#65A30D',
            backgroundColor: mode === 'dark' ? 'rgba(163, 230, 53, 0.08)' : 'rgba(101, 163, 13, 0.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
          borderRadius: 28,
          border: mode === 'dark' 
            ? '1px solid rgba(163, 230, 53, 0.1)' 
            : '1px solid rgba(0, 0, 0, 0.04)',
          backdropFilter: mode === 'dark' ? 'blur(12px)' : 'none',
          boxShadow: mode === 'dark' 
            ? 'none' 
            : '0 10px 40px rgba(0, 0, 0, 0.03)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: mode === 'dark' ? 'rgba(163, 230, 53, 0.4)' : 'rgba(101, 163, 13, 0.2)',
            backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#ffffff',
            boxShadow: mode === 'dark' 
              ? '0 20px 40px rgba(0, 0, 0, 0.4)' 
              : '0 20px 50px rgba(101, 163, 13, 0.08)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 14,
            backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
            transition: 'all 0.2s ease',
            '& fieldset': {
              borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            },
            '&:hover fieldset': {
              borderColor: mode === 'dark' ? 'rgba(163, 230, 53, 0.3)' : 'rgba(101, 163, 13, 0.3)',
            },
          },
        },
      },
    },
  },
});

export default getTheme;
