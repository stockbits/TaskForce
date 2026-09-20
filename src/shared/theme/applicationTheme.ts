import { createTheme } from "@mui/material/styles";
import type { PaletteMode } from "@mui/material";
import { applicationSpacing } from "@shared/theme/applicationSpacing";

export function createApplicationTheme(colourMode: PaletteMode) {
  const isLight = colourMode === "light";

  return createTheme({
    palette: {
      mode: colourMode,
      primary: {
        main: isLight ? "#155eef" : "#78a9ff",
      },
      secondary: {
        main: "#00a67e",
      },
      background: {
        default: isLight ? "#f4f7fb" : "#0a1423",
        paper: isLight ? "#ffffff" : "#111e30",
      },
      divider: isLight ? "#d9e1ec" : "#26364b",
    },
    shape: {
      borderRadius: 12,
    },
    spacing: applicationSpacing.compact,
    typography: {
      h3: {
        fontSize: "1.75rem",
        lineHeight: 1.2,
        "@media (min-width:600px)": { fontSize: "2.25rem" },
        "@media (min-width:1200px)": { fontSize: "3rem" },
      },
      fontFamily: [
        "Inter",
        "ui-sans-serif",
        "system-ui",
        "-apple-system",
        "BlinkMacSystemFont",
        "Segoe UI",
        "sans-serif",
      ].join(","),
      button: {
        fontWeight: 750,
        textTransform: "none",
      },
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 10,
            minHeight: 44,
            maxWidth: "100%",
            whiteSpace: "normal",
            overflowWrap: "anywhere",
          },
        },
      },
      MuiIconButton: {
        styleOverrides: { root: { minWidth: 44, minHeight: 44 } },
      },
      MuiTextField: {
        defaultProps: { fullWidth: true },
        styleOverrides: { root: { minWidth: 0, maxWidth: "100%" } },
      },
      MuiInputBase: {
        styleOverrides: { input: { minWidth: 0, fontSize: "1rem" } },
      },
      MuiAutocomplete: {
        styleOverrides: {
          root: { minWidth: 0 },
          option: { overflowWrap: "anywhere" },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
    },
  });
}
