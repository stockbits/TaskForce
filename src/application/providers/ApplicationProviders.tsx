import type { PropsWithChildren } from "react";
import { CssBaseline } from "@mui/material";
import ApplicationThemeProvider from "@shared/theme/ApplicationThemeProvider";
import NotificationProvider from "@shared/components/notifications/NotificationProvider";

export default function ApplicationProviders({ children }: PropsWithChildren) {
  return (
    <ApplicationThemeProvider>
      <CssBaseline />
      <NotificationProvider>{children}</NotificationProvider>
    </ApplicationThemeProvider>
  );
}
