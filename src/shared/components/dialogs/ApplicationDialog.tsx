import { useId, type ReactNode } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ApplicationIconButton from "@shared/components/buttons/ApplicationIconButton";
import { CloseIcon } from "@shared/icons/applicationIcons";
interface ApplicationDialogProperties {
  open: boolean;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  onClose: () => void;
}
export default function ApplicationDialog({
  open,
  title,
  children,
  actions,
  onClose,
}: ApplicationDialogProperties) {
  const titleIdentifier = useId();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      fullWidth
      maxWidth="sm"
      aria-labelledby={titleIdentifier}
      PaperProps={{
        sx: {
          minWidth: 0,
          maxHeight: { xs: "100dvh", sm: "calc(100dvh - 64px)" },
        },
      }}
    >
      <DialogTitle
        id={titleIdentifier}
        sx={{ display: "flex", alignItems: "start", gap: 3 }}
      >
        <Box
          component="span"
          sx={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}
        >
          {title}
        </Box>
        <ApplicationIconButton label="Close dialog" onClick={onClose}>
          <CloseIcon />
        </ApplicationIconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ overflowWrap: "anywhere" }}>
        {children}
      </DialogContent>
      {actions && (
        <DialogActions sx={{ flexWrap: "wrap", gap: 2, p: 4 }}>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
}
