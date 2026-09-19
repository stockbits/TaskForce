import type { PropsWithChildren } from "react";
import { CssBaseline } from "@mui/material";
import ApplicationThemeProvider from "@shared/theme/ApplicationThemeProvider";

export default function ApplicationProviders({ children }: PropsWithChildren) {
  return (
    <ApplicationThemeProvider>
      <CssBaseline />
      {children}
    </ApplicationThemeProvider>
  );
}
