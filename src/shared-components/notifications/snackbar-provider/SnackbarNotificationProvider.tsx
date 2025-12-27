import React, { createContext, useCallback, useContext, useState } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

type SnackbarOptions = { variant?: AlertColor; duration?: number };

type SnackbarContextValue = {
  notify: (message: string, opts?: SnackbarOptions) => void;
  success: (message: string, opts?: Omit<SnackbarOptions, 'variant'>) => void;
  error: (message: string, opts?: Omit<SnackbarOptions, 'variant'>) => void;
  info: (message: string, opts?: Omit<SnackbarOptions, 'variant'>) => void;
};

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export const AppSnackbarProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [variant, setVariant] = useState<AlertColor>('info');
  const [duration, setDuration] = useState<number>(4000);

  const notify = useCallback((msg: string, opts?: SnackbarOptions) => {
    setMessage(msg);
    setVariant(opts?.variant ?? 'info');
    setDuration(opts?.duration ?? 4000);
    setOpen(true);
  }, []);

  const success = useCallback((msg: string, opts?: Omit<SnackbarOptions, 'variant'>) => notify(msg, { ...(opts || {}), variant: 'success' }), [notify]);
  const error = useCallback((msg: string, opts?: Omit<SnackbarOptions, 'variant'>) => notify(msg, { ...(opts || {}), variant: 'error' }), [notify]);
  const info = useCallback((msg: string, opts?: Omit<SnackbarOptions, 'variant'>) => notify(msg, { ...(opts || {}), variant: 'info' }), [notify]);

  const handleClose = () => setOpen(false);

  return (
    <SnackbarContext.Provider value={{ notify, success, error, info }}>
      {children}
      <Snackbar open={open} autoHideDuration={duration} onClose={handleClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleClose} severity={variant} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

export function useAppSnackbar(): SnackbarContextValue {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error('useAppSnackbar must be used within AppSnackbarProvider');
  return ctx;
}

export default AppSnackbarProvider;
