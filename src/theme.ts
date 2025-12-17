import { createTheme } from "@mui/material/styles";

declare module '@mui/material/styles' {
  interface Theme {
    custom: {
      inputHeight: number;
      chipSize: number;
    };
  }
  // allow configuration when creating the theme
  interface ThemeOptions {
    custom?: {
      inputHeight?: number;
      chipSize?: number;
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

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: primaryNavy,
      light: primaryNavyLight,
      dark: primaryNavyDark,
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: accentMint,
      light: "#7FF2B6",
      dark: accentMintDark,
      contrastText: "#052035",
    },
    background: {
      default: neutralBackground,
      paper: "#FFFFFF",
    },
    text: {
      primary: "#0B2233",
      secondary: "#475569",
    },
    divider: "rgba(15, 39, 64, 0.08)",
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    button: { fontWeight: 600 },
    subtitle1: { color: "#394B59" },
    subtitle2: { color: "#52606D" },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: neutralBackground,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "0 6px 18px rgba(45, 24, 88, 0.06)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "0 6px 12px rgba(0, 0, 0, 0.08)",
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
        notchedOutline: {
          // keep default outline styling
        },
        root: {
          minHeight: 40,
        },
      },
    },
  },
  custom: {
    inputHeight: 40,
    chipSize: 28,
  },
});
