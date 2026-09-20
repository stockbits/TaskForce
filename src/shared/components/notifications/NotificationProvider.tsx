import {
  createContext,
  useCallback,
  useContext,
  useState,
  type PropsWithChildren,
} from "react";
import { Alert, Snackbar, type AlertColor } from "@mui/material";
type Notify = (message: string, severity?: AlertColor) => void;
const NotificationContext = createContext<Notify | null>(null);
export function useNotification() {
  const notify = useContext(NotificationContext);
  if (!notify)
    throw new Error(
      "useNotification must be used within NotificationProvider.",
    );
  return notify;
}
export default function NotificationProvider({ children }: PropsWithChildren) {
  const [notification, setNotification] = useState<{
    message: string;
    severity: AlertColor;
    identifier: number;
  } | null>(null);
  const notify = useCallback<Notify>((message, severity = "info") => {
    setNotification({ message, severity, identifier: Date.now() });
  }, []);
  return (
    <NotificationContext.Provider value={notify}>
      {children}
      <Snackbar
        key={notification?.identifier}
        open={Boolean(notification)}
        autoHideDuration={6000}
        onClose={(_event, reason) => {
          if (reason !== "clickaway") setNotification(null);
        }}
      >
        <Alert
          severity={notification?.severity ?? "info"}
          onClose={() => setNotification(null)}
          sx={{ width: "100%", minWidth: 0, overflowWrap: "anywhere" }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}
