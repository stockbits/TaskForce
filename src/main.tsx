import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline } from "@mui/material";
import App from "./App";
import { AppThemeProvider } from "./System Settings/System Settings/Dark Mode Handler - Component";
import { SettingsProvider } from "./System Settings/System Settings/Settings Manager - Component";
import "./index.css";
import { AppSnackbarProvider } from '@/shared-components/SnackbarProvider';

ReactDOM.createRoot(document.getElementById("root")!).render(
	<SettingsProvider>
		<AppThemeProvider>
			<CssBaseline />
			<AppSnackbarProvider>
				<App />
			</AppSnackbarProvider>
		</AppThemeProvider>
	</SettingsProvider>
);
