import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline } from "@mui/material";
import App from "./App";
import { AppThemeProvider } from "./ThemeContext";
import "./index.css";
import { AppSnackbarProvider } from '@/shared-ui/SnackbarProvider';

ReactDOM.createRoot(document.getElementById("root")!).render(
	<AppThemeProvider>
		<CssBaseline />
		<AppSnackbarProvider>
			<App />
		</AppSnackbarProvider>
	</AppThemeProvider>
);
