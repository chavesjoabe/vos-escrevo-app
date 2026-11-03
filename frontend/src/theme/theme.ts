import { createTheme, Theme } from '@mui/material/styles';

export const sansFontFamily = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
export const monoFontFamily = '"JetBrains Mono", monospace';
export const scriptureFontFamily = '"Newsreader", Georgia, "Times New Roman", serif';

export const getAppTheme = (mode: 'dark' | 'light'): Theme => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#38BDF8' : '#0284C7',
        light: isDark ? '#7DD3FC' : '#38BDF8',
        dark: isDark ? '#0284C7' : '#0369A1',
        contrastText: isDark ? '#0B0F17' : '#FFFFFF',
      },
      secondary: {
        main: isDark ? '#5C82A6' : '#64748B',
        light: isDark ? '#8FAEC9' : '#94A3B8',
        dark: isDark ? '#3E5C77' : '#475569',
        contrastText: '#FFFFFF',
      },
      background: {
        default: isDark ? '#0B0F17' : '#F8FAFC',
        paper: isDark ? '#0E131F' : '#FFFFFF',
      },
      text: {
        primary: isDark ? '#F8FAFC' : '#0F172A',
        secondary: isDark ? '#64748B' : '#64748B',
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
    },
    typography: {
      fontFamily: sansFontFamily,
      h1: {
        fontFamily: sansFontFamily,
        fontWeight: 300,
        letterSpacing: '-0.035em',
        lineHeight: 1.12,
      },
      h2: {
        fontFamily: sansFontFamily,
        fontWeight: 300,
        letterSpacing: '-0.03em',
        lineHeight: 1.15,
      },
      h3: {
        fontFamily: sansFontFamily,
        fontWeight: 400,
        letterSpacing: '-0.025em',
      },
      h4: {
        fontFamily: sansFontFamily,
        fontWeight: 500,
        letterSpacing: '-0.02em',
      },
      h5: {
        fontFamily: sansFontFamily,
        fontWeight: 500,
        letterSpacing: '-0.015em',
      },
      h6: {
        fontFamily: sansFontFamily,
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      subtitle1: {
        fontFamily: sansFontFamily,
        fontSize: '1rem',
        lineHeight: 1.6,
        color: isDark ? '#64748B' : '#64748B',
      },
      subtitle2: {
        fontFamily: monoFontFamily,
        fontSize: '0.75rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
      },
      body1: {
        fontFamily: scriptureFontFamily,
        fontSize: '1.2rem',
        lineHeight: 1.9,
        letterSpacing: '0.005em',
      },
      body2: {
        fontFamily: sansFontFamily,
        fontSize: '0.88rem',
        lineHeight: 1.6,
      },
      caption: {
        fontFamily: monoFontFamily,
        fontSize: '0.72rem',
        letterSpacing: '0.08em',
      },
      button: {
        fontFamily: sansFontFamily,
        fontWeight: 600,
        textTransform: 'none',
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 6,
            userSelect: 'none',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            fontFamily: sansFontFamily,
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          select: {
            fontFamily: sansFontFamily,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontFamily: sansFontFamily,
          },
        },
      },
    },
  });
};

export const theme = getAppTheme('dark');
