import { createTheme, alpha } from "@mui/material/styles";
import { PaletteColor } from "@mui/material/styles";

// Extend MUI theme types to include custom colors
declare module "@mui/material/styles" {
  interface TimelinePalette {
    strip: string;
    hover: string;
    selected: string;
    shiftBg: string;
    shiftBorder: string;
    lunchBg: string;
    ecbtShadow: string;
    lunchOpacity: number;
    taskBlockBorder: string;
  }

  interface Palette {
    taskBlock: PaletteColor;
    timelineText: PaletteColor;
    travel: PaletteColor;
    timeline?: TimelinePalette;
  }
  interface PaletteOptions {
    taskBlock?: PaletteColor;
    timelineText?: PaletteColor;
    travel?: PaletteColor;
    timeline?: Partial<TimelinePalette>;
  }
}

// Palette matched to provided logo (navy + mint ring)
const primaryNavy = "#0F2740"; // logo background
const primaryNavyLight = "#304862";
const primaryNavyDark = "#0A1A2A";
const accentMint = "#3BE089"; // mint ring
const accentMintDark = "#1EA46A";
const accentTeal = "#4FD1C5"; // replacement accent for dark-mode (cool teal)
const neutralBackground = "#F3F6F8";
const taskBlockColor = "#D97706"; // task block background
const timelineTextColor = "#666"; // timeline text color

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
      main: mode === 'dark' ? accentTeal : accentMint,
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
    // Travel color palette (used for travel lines/segments)
    travel: {
      main: mode === 'dark' ? '#FFEE58' : '#ffee58',
      light: mode === 'dark' ? '#fff58d' : '#fff59d',
      dark: mode === 'dark' ? '#c8b800' : '#b08900',
      contrastText: mode === 'dark' ? '#000000' : '#000000',
    },
    // Custom application colors
    taskBlock: {
      main: taskBlockColor,
      light: taskBlockColor,
      dark: taskBlockColor,
      contrastText: "#ffffff",
    },
    timeline: {
      // Enterprise Slate (option A): modern professional greys for light mode;
      // dark mode keeps existing mint/navy accents.
      strip: mode === 'dark' ? alpha('#ffffff', 0.02) : '#F3F4F6',
      hover: mode === 'dark' ? alpha('#ffffff', 0.04) : alpha('#374151', 0.06),
      selected: mode === 'dark' ? alpha(accentTeal, 0.16) : alpha('#374151', 0.08),
      // Make light-mode working-hours accessible: higher contrast against background.paper
      shiftBg: mode === 'dark' ? alpha(accentTeal, 0.6) : '#607d8b',
      // explicit lunch background token so we can swap color without changing warning palette
      lunchBg: mode === 'dark' ? alpha(accentTeal, 0.5) : '#8d6e63',
      // keep a clear, but not overpowering border
      shiftBorder: mode === 'dark' ? accentTeal : '#1F2937',
      ecbtShadow: mode === 'dark' ? '0 2px 6px rgba(0,0,0,0.30)' : '0 2px 6px rgba(0,0,0,0.15)',
      lunchOpacity: mode === 'dark' ? 0.25 : 0.25,
      taskBlockBorder: mode === 'dark' ? alpha('#ffffff', 0.08) : 'rgba(0,0,0,0.18)',
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
  shadows: [
    'none',
    '0 1px 3px rgba(0, 0, 0, 0.12)', // 1
    '0 2px 8px rgba(0, 0, 0, 0.15)', // 2
    '0 4px 16px rgba(0, 0, 0, 0.2)', // 3
    '0 8px 24px rgba(8, 58, 97, 0.15)', // 4 - Brand shadow
    '0 12px 32px rgba(8, 58, 97, 0.18)', // 5 - Brand shadow medium
    '0 16px 40px rgba(8, 58, 97, 0.2)', // 6 - Brand shadow large
    '0 20px 48px rgba(8, 58, 97, 0.22)', // 7 - Brand shadow extra large
    '0 24px 54px rgba(8, 58, 97, 0.22)', // 8 - Brand shadow popup
    '0 6px 18px rgba(8, 58, 97, 0.08)', // 9 - Brand shadow subtle
    '0 10px 24px rgba(8, 58, 97, 0.08)', // 10 - Brand shadow card
    '0 18px 38px rgba(8, 58, 97, 0.04)', // 11 - Brand shadow minimal
    '0 18px 38px rgba(8, 58, 97, 0.24)', // 12 - Brand shadow strong
    '0 18px 40px rgba(8, 58, 97, 0.16)', // 13 - Brand shadow medium
    '0 6px 18px rgba(8, 58, 97, 0.08)', // 14 - Brand shadow light
    '0 8px 20px rgba(8, 58, 97, 0.35)', // 15 - Brand shadow button
    '0 18px 46px rgba(8, 58, 97, 0.22)', // 16 - Brand shadow legend
    '0 24px 48px rgba(8, 58, 97, 0.18)', // 17 - Brand shadow popup card
    '0 4px 16px rgba(0, 0, 0, 0.2)', // 18
    '0 8px 20px rgba(0, 0, 0, 0.2)', // 19
    '0 12px 24px rgba(0, 0, 0, 0.2)', // 20
    '0 16px 28px rgba(0, 0, 0, 0.2)', // 21
    '0 20px 32px rgba(0, 0, 0, 0.2)', // 22
    '0 24px 36px rgba(0, 0, 0, 0.2)', // 23
    '0 28px 40px rgba(0, 0, 0, 0.2)', // 24
    '0 32px 44px rgba(0, 0, 0, 0.2)', // 25
  ] as any,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: mode === 'dark' ? "#121212" : neutralBackground,
        },
        // Remove default MUI focus rings that might show blue
        '.MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: mode === 'dark' ? primaryNavyLight : primaryNavy + ' !important',
        },
        // Ensure no blue focus rings appear
        '*': {
          '&:focus-visible': {
            outline: mode === 'dark' ? `2px solid ${accentTeal}` : `2px solid ${primaryNavy}`,
            outlineOffset: '1px',
          },
        },
        // DataGrid header checkbox: ensure checked header checkbox uses theme's dark-mode accent
        '.MuiDataGrid-root .MuiDataGrid-columnHeader .MuiCheckbox-root.Mui-checked': {
          color: mode === 'dark' ? `${accentTeal} !important` : `${primaryNavy} !important`,
        },
        '.MuiDataGrid-root .MuiDataGrid-columnHeader .MuiCheckbox-root.Mui-indeterminate': {
          color: mode === 'dark' ? `${accentTeal} !important` : `${primaryNavy} !important`,
        },
        '.MuiDataGrid-root .MuiDataGrid-columnHeader .MuiCheckbox-root:hover': {
          backgroundColor: mode === 'dark' ? `rgba(255, 255, 255, 0.08) !important` : `rgba(0, 0, 0, 0.04) !important`,
        },
        // Backup selector with slightly less specificity
        '.MuiDataGrid-columnHeader .MuiCheckbox-root.Mui-checked': {
          color: mode === 'dark' ? `${accentTeal} !important` : `${primaryNavy} !important`,
        },
        '.MuiDataGrid-columnHeader .MuiCheckbox-root.Mui-indeterminate': {
          color: mode === 'dark' ? `${accentTeal} !important` : `${primaryNavy} !important`,
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
    MuiCardActions: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'dark' ? "#1e1e1e" : neutralBackground,
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
            borderColor: mode === 'dark' ? accentTeal : primaryNavy,
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
            color: mode === 'dark' ? accentTeal : primaryNavy,
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
                color: mode === 'dark' ? accentTeal : primaryNavy,
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
              borderColor: mode === 'dark' ? accentTeal : primaryNavy + ' !important',
            },
            '&.Mui-focused': {
              '& fieldset': {
                borderColor: mode === 'dark' ? accentTeal : primaryNavy + ' !important',
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
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: mode === 'dark' ? primaryNavyLight : primaryNavy,
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
});

export const lightTheme = createAppTheme('light');
export const darkTheme = createAppTheme('dark');

// Default export for backward compatibility
export const appTheme = lightTheme;
