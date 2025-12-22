import React, { useState, memo, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Collapse,
  IconButton,
  Box,
  Typography,
} from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";

interface ExpandableSectionCardProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  actions?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerProps?: any;
  contentProps?: any;
  contentSx?: any;
  paperProps?: any;
}

const ExpandableSectionCard: React.FC<ExpandableSectionCardProps> = memo(({
  title,
  children,
  defaultExpanded = false,
  expanded,
  onToggle,
  actions,
  subtitle,
  headerProps,
  contentProps,
  contentSx,
  paperProps,
}) => {
  // If expanded prop is provided, use controlled mode; else use internal state
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isControlled = typeof expanded === "boolean";
  const isExpanded = isControlled ? expanded : internalExpanded;
  const handleToggle = useCallback(() => {
    if (isControlled && onToggle) {
      onToggle();
    } else {
      setInternalExpanded((prev) => !prev);
    }
  }, [isControlled, onToggle]);

  return (
    <Card elevation={3} sx={{ mb: 2 }} {...paperProps}>
      <CardHeader
        title={<Typography variant="h6">{title}</Typography>}
        subheader={subtitle}
        action={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {actions}
            <IconButton
              onClick={handleToggle}
              aria-label={isExpanded ? "Collapse" : "Expand"}
              size="small"
            >
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        }
        {...headerProps}
      />
      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <CardContent {...contentProps} sx={contentSx}>{children}</CardContent>
      </Collapse>
    </Card>
  );
});

ExpandableSectionCard.displayName = "ExpandableSectionCard";

export default ExpandableSectionCard;
