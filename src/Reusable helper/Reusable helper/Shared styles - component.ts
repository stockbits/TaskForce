import { alpha, Theme } from "@mui/material/styles";

export const sharedStyles = (theme: Theme) => ({
  dialogPaper: {
    borderRadius: 3,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
    boxShadow: 'none',
    backgroundImage: 'none',
  },
  sectionTitle: {
    fontWeight: 700,
    letterSpacing: 1.2,
    color: alpha(theme.palette.primary.main, 0.8),
  },
  iconBox: {
    height: theme.spacing(4.5),
    width: theme.spacing(4.5),
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    bgcolor: theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.primary.main,
    color: theme.palette.mode === 'dark' ? theme.palette.common.black : theme.palette.primary.contrastText,
  },
  taskDetailsPaper: {
    p: 2,
    borderRadius: 2,
  },
  confirmationBox: (isStarting: boolean) => ({
    p: 2,
    borderRadius: 2,
    bgcolor: isStarting
      ? alpha(theme.palette.warning.main, 0.04)
      : alpha(theme.palette.success.main, 0.04),
    border: `1px solid ${isStarting
      ? alpha(theme.palette.warning.main, 0.12)
      : alpha(theme.palette.success.main, 0.12)}`,
  }),
});