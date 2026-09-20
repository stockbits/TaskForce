import { useId, type ReactNode } from "react";
import { Box, Popover, Typography } from "@mui/material";
import ApplicationIconButton from "@shared/components/buttons/ApplicationIconButton";
import { CloseIcon } from "@shared/icons/applicationIcons";
interface ApplicationPopoverProperties {
  anchorElement: HTMLElement | null;
  title: string;
  children: ReactNode;
  onClose: () => void;
}
export default function ApplicationPopover({
  anchorElement,
  title,
  children,
  onClose,
}: ApplicationPopoverProperties) {
  const titleIdentifier = useId();
  return (
    <Popover
      open={Boolean(anchorElement)}
      anchorEl={anchorElement}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      marginThreshold={16}
      PaperProps={{
        role: "dialog",
        "aria-labelledby": titleIdentifier,
        sx: {
          p: 4,
          width: 360,
          maxWidth: "calc(100vw - 32px)",
          maxHeight: "calc(100dvh - 32px)",
          overflowWrap: "anywhere",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "start", gap: 2, mb: 2 }}>
        <Typography
          id={titleIdentifier}
          component="h2"
          variant="h6"
          sx={{ flex: 1, minWidth: 0 }}
        >
          {title}
        </Typography>
        <ApplicationIconButton label="Close popover" onClick={onClose}>
          <CloseIcon />
        </ApplicationIconButton>
      </Box>
      {children}
    </Popover>
  );
}
