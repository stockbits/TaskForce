import { createTheme } from "@mui/material/styles";

declare module '@mui/material/styles' {
  interface Theme {
    custom: {
      inputHeight: number;
      chipSize: number;
      selectionColor: string;
    };
  }
  // allow configuration when creating the theme
  interface ThemeOptions {
    custom?: {
      inputHeight?: number;
      chipSize?: number;
      selectionColor?: string;
    };
  }
}

// Palette matched to provided logo (navy + mint ring)
const primaryNavy = "#0F2740"; // logo background
const primaryNavyLight = "#304862";
const primaryNavyDark = "#0A1A2A";
const accentMint = "#3BE089"; // mint ring
const accentMintDark = "#1EA46A";
const neutralBackground = "#F3F6F8";

export const createAppTheme = (mode: 'light' | 'dark' = 'light') => createTheme({
  palette: {
    mode,
    primary: {
      main: mode === 'dark' ? primaryNavyLight : primaryNavy,
      light: primaryNavyLight,
      dark: primaryNavyDark,
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: accentMint,
      light: "#7FF2B6",
      dark: accentMintDark,
      contrastText: mode === 'dark' ? "#052035" : "#FFFFFF",
    },
    background: {
      default: mode === 'dark' ? "#121212" : neutralBackground,
      paper: mode === 'dark' ? "#1e1e1e" : "#FFFFFF",
    },
    text: {
      primary: mode === 'dark' ? "#ffffff" : "#0B2233",
      secondary: mode === 'dark' ? "#b0b0b0" : "#475569",
    },
    divider: mode === 'dark' ? "rgba(255, 255, 255, 0.12)" : "rgba(15, 39, 64, 0.08)",
    action: {
      active: mode === 'dark' ? "rgba(255, 255, 255, 0.56)" : "rgba(0, 0, 0, 0.54)",
      hover: mode === 'dark' ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
      selected: mode === 'dark' ? "rgba(255, 255, 255, 0.16)" : "rgba(0, 0, 0, 0.08)",
      disabled: mode === 'dark' ? "rgba(255, 255, 255, 0.26)" : "rgba(0, 0, 0, 0.26)",
      disabledBackground: mode === 'dark' ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)",
      focus: mode === 'dark' ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)",
    },
    error: {
      main: mode === 'dark' ? "#f85149" : "#d32f2f",
      light: mode === 'dark' ? "#da7d82" : "#ef5350",
      dark: mode === 'dark' ? "#c93c37" : "#c62828",
      contrastText: "#ffffff",
    },
    warning: {
      main: mode === 'dark' ? "#d29922" : "#ed6c02",
      light: mode === 'dark' ? "#e0a82e" : "#ff9800",
      dark: mode === 'dark' ? "#b87d1e" : "#e65100",
      contrastText: mode === 'dark' ? "#000000" : "#ffffff",
    },
    info: {
      main: mode === 'dark' ? "#79c0ff" : "#0288d1",
      light: mode === 'dark' ? "#a5d4ff" : "#03a9f4",
      dark: mode === 'dark' ? "#58a6ff" : "#01579b",
      contrastText: mode === 'dark' ? "#000000" : "#ffffff",
    },
    success: {
      main: mode === 'dark' ? "#56d364" : "#2e7d32",
      light: mode === 'dark' ? "#79e381" : "#4caf50",
      dark: mode === 'dark' ? "#46954a" : "#1b5e20",
      contrastText: mode === 'dark' ? "#000000" : "#ffffff",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    button: { fontWeight: 600 },
    subtitle1: { color: mode === 'dark' ? "#e0e0e0" : "#394B59" },
    subtitle2: { color: mode === 'dark' ? "#b8b8b8" : "#52606D" },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: mode === 'dark' ? "#121212" : neutralBackground,
        },
        // Remove default MUI focus rings that might show blue
        '.MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: mode === 'dark' ? accentMint : primaryNavy + ' !important',
        },
        // Ensure no blue focus rings appear
        '*': {
          '&:focus-visible': {
            outline: mode === 'dark' ? `2px solid ${accentMint}` : `2px solid ${primaryNavy}`,
            outlineOffset: '1px',
          },
        },
        // DataGrid header checkbox: ensure checked header checkbox uses theme's dark-mode accent
        '.MuiDataGrid-root .MuiDataGrid-columnHeader .MuiCheckbox-root.Mui-checked': {
          color: mode === 'dark' ? `${accentMint} !important` : `${primaryNavy} !important`,
        },
        '.MuiDataGrid-root .MuiDataGrid-columnHeader .MuiCheckbox-root.Mui-indeterminate': {
          color: mode === 'dark' ? `${accentMint} !important` : `${primaryNavy} !important`,
        },
        '.MuiDataGrid-root .MuiDataGrid-columnHeader .MuiCheckbox-root:hover': {
          backgroundColor: mode === 'dark' ? `rgba(255, 255, 255, 0.08) !important` : `rgba(0, 0, 0, 0.04) !important`,
        },
        // Backup selector with slightly less specificity
        '.MuiDataGrid-columnHeader .MuiCheckbox-root.Mui-checked': {
          color: mode === 'dark' ? `${accentMint} !important` : `${primaryNavy} !important`,
        },
        '.MuiDataGrid-columnHeader .MuiCheckbox-root.Mui-indeterminate': {
          color: mode === 'dark' ? `${accentMint} !important` : `${primaryNavy} !important`,
        },
        '.MuiDataGrid-columnHeader .MuiCheckbox-root:hover': {
          backgroundColor: mode === 'dark' ? `rgba(255, 255, 255, 0.08) !important` : `rgba(0, 0, 0, 0.04) !important`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
        outlined: {
          '&:hover': {
            backgroundColor: mode === 'dark' ? "rgba(255, 255, 255, 0.08)" : undefined,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: mode === 'dark' 
            ? "0 6px 18px rgba(0, 0, 0, 0.3)"
            : "0 6px 18px rgba(45, 24, 88, 0.06)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: mode === 'dark' 
            ? "0 6px 12px rgba(0, 0, 0, 0.4)"
            : "0 6px 12px rgba(0, 0, 0, 0.08)",
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          minHeight: 40,
        },
        input: {
          paddingTop: 0,
          paddingBottom: 0,
          fontSize: 13,
          lineHeight: '28px',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          minHeight: 40,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: mode === 'dark' ? "rgba(255, 255, 255, 0.4)" : undefined,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: mode === 'dark' ? accentMint : primaryNavy,
          },
        },
        notchedOutline: {
          borderColor: mode === 'dark' ? "rgba(255, 255, 255, 0.23)" : "rgba(0, 0, 0, 0.23)",
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: mode === 'dark' ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.54)",
          '&.Mui-checked': {
            color: mode === 'dark' ? accentMint : primaryNavy,
          },
          '&:hover': {
            backgroundColor: mode === 'dark' ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-input': {
            color: mode === 'dark' ? "#ffffff" : "#0B2233",
            '&::placeholder': {
              color: mode === 'dark' ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.6)",
              opacity: 1,
            },
          },
          '& .MuiInputLabel-root': {
            color: mode === 'dark' ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
            '&.Mui-focused': {
              color: mode === 'dark' ? accentMint : primaryNavy,
            },
          },
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: mode === 'dark' ? "rgba(255, 255, 255, 0.23)" : "rgba(0, 0, 0, 0.23)",
            },
            '&:hover fieldset': {
              borderColor: mode === 'dark' ? "rgba(255, 255, 255, 0.4)" : undefined,
            },
            '&.Mui-focused fieldset': {
              borderColor: mode === 'dark' ? accentMint : primaryNavy + ' !important',
            },
            '&.Mui-focused': {
              '& fieldset': {
                borderColor: mode === 'dark' ? accentMint : primaryNavy + ' !important',
              },
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          color: mode === 'dark' ? "#ffffff" : "#0B2233",
        },
        select: {
          color: mode === 'dark' ? "#ffffff" : "#0B2233",
          '&:focus': {
            backgroundColor: 'transparent',
          },
        },
        icon: {
          color: mode === 'dark' ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.54)",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: mode === 'dark' ? "#ffffff" : "#0B2233",
          '&:hover': {
            backgroundColor: mode === 'dark' ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
          },
          '&.Mui-selected': {
            backgroundColor: mode === 'dark' ? "rgba(59, 224, 137, 0.15)" : "rgba(15, 39, 64, 0.08)",
            '&:hover': {
              backgroundColor: mode === 'dark' ? "rgba(59, 224, 137, 0.25)" : "rgba(15, 39, 64, 0.12)",
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          '&:hover': {
            backgroundColor: mode === 'dark' ? "rgba(255, 255, 255, 0.08)" : undefined,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: mode === 'dark' ? "#ffffff" : "rgba(0, 0, 0, 0.54)",
          '&:hover': {
            backgroundColor: mode === 'dark' ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: mode === 'dark' ? "#ffffff" : "rgba(0, 0, 0, 0.54)",
          '&.Mui-selected': {
            color: mode === 'dark' ? "#ffffff" : primaryNavy,
          },
          '&:hover': {
            color: mode === 'dark' ? "#ffffff" : primaryNavy,
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: mode === 'dark' ? "#1e1e1e" : "#ffffff",
          border: mode === 'dark' ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.08)",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: mode === 'dark' ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
          },
          '&.Mui-selected': {
            backgroundColor: mode === 'dark' ? "rgba(255, 255, 255, 0.16)" : "rgba(0, 0, 0, 0.08)",
            '&:hover': {
              backgroundColor: mode === 'dark' ? "rgba(255, 255, 255, 0.24)" : "rgba(0, 0, 0, 0.12)",
            },
          },
        },
      },
    },
  },
  custom: {
    inputHeight: 40,
    chipSize: 28,
    selectionColor: mode === 'dark' ? "rgba(59, 224, 137, 0.2)" : "rgba(15, 39, 64, 0.1)",
  },
});

export const lightTheme = createAppTheme('light');
export const darkTheme = createAppTheme('dark');

// Default export for backward compatibility
export const appTheme = lightTheme;
