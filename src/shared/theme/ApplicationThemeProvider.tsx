import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import type { PaletteMode } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { createApplicationTheme } from "@shared/theme/applicationTheme";

interface ApplicationThemeContextValue {
  colourMode: PaletteMode;
  toggleColourMode: () => void;
}

const ApplicationThemeContext =
  createContext<ApplicationThemeContextValue | null>(null);

const colourModeStorageKey = "taskforce-colour-mode";

function getInitialColourMode(): PaletteMode {
  const storedColourMode = window.localStorage.getItem(colourModeStorageKey);
  return storedColourMode === "dark" ? "dark" : "light";
}

export function useApplicationTheme() {
  const context = useContext(ApplicationThemeContext);

  if (!context) {
    throw new Error(
      "useApplicationTheme must be used within ApplicationThemeProvider."
    );
  }

  return context;
}

export default function ApplicationThemeProvider({
  children
}: PropsWithChildren) {
  const [colourMode, setColourMode] =
    useState<PaletteMode>(getInitialColourMode);

  const contextValue = useMemo<ApplicationThemeContextValue>(
    () => ({
      colourMode,
      toggleColourMode: () => {
        setColourMode((currentColourMode) => {
          const nextColourMode =
            currentColourMode === "light" ? "dark" : "light";
          window.localStorage.setItem(colourModeStorageKey, nextColourMode);
          return nextColourMode;
        });
      }
    }),
    [colourMode]
  );

  const theme = useMemo(
    () => createApplicationTheme(colourMode),
    [colourMode]
  );

  return (
    <ApplicationThemeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ApplicationThemeContext.Provider>
  );
}
