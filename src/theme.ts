import { createTheme } from "@mui/material/styles";

const trimbleBlue = "#003F87";
const trimbleYellow = "#FFC20E";
const neutralBackground = "#F5F7FA";

export const trimbleTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: trimbleBlue,
      light: "#2E68A6",
      dark: "#001E4D",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: trimbleYellow,
      light: "#FFD54A",
      dark: "#C79400",
      contrastText: trimbleBlue,
    },
    background: {
      default: neutralBackground,
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1F2933",
      secondary: "#52606D",
    },
    divider: "rgba(0, 63, 135, 0.12)",
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
    subtitle1: { color: "#394B59" },
    subtitle2: { color: "#52606D" },
  },
  shape: {
    borderRadius: 12,
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
          borderRadius: 16,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          boxShadow: "0 10px 25px rgba(0, 63, 135, 0.08)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "0 10px 24px rgba(0, 0, 0, 0.18)",
        },
      },
    },
  },
});
