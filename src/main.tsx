import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider } from "@mui/material";
import App from "./App";
import { appTheme } from "./theme";
import "./index.css";
import { AppSnackbarProvider } from '@/shared-ui/SnackbarProvider';

ReactDOM.createRoot(document.getElementById("root")!).render(
	<ThemeProvider theme={appTheme}>
		<CssBaseline />
		<AppSnackbarProvider>
			<App />
		</AppSnackbarProvider>
	</ThemeProvider>
);
