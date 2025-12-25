import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline } from "@mui/material";
import App from "./App";
import { AppThemeProvider } from "./ThemeContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import "./index.css";
import { AppSnackbarProvider } from '@/shared-ui/SnackbarProvider';

ReactDOM.createRoot(document.getElementById("root")!).render(
	<AppThemeProvider>
		<SettingsProvider>
			<CssBaseline />
			<AppSnackbarProvider>
				<App />
			</AppSnackbarProvider>
		</SettingsProvider>
	</AppThemeProvider>
);
