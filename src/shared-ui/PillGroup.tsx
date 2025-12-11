import React, { useState, useRef, useCallback } from "react";
import { Box, Chip, Popover, List, ListItemButton, ListItemText, Typography, useTheme } from "@mui/material";
import type { SxProps } from "@mui/material";

export type PillItem = {
  id: string;
  label: string;
};

interface PillGroupProps {
  items: PillItem[];
  activeIds?: string[];
  maxVisible?: number; // fixed limit for visible pills
  onToggle?: (id: string) => void;
  sx?: SxProps;
}

export default function PillGroup({ items, activeIds = [], maxVisible = 5, onToggle, sx }: PillGroupProps) {
  const theme = useTheme();
  const visible = items.slice(0, maxVisible);
  const overflow = items.length > maxVisible ? items.slice(maxVisible) : [];

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const overflowRef = useRef<HTMLElement | null>(null);

  const handleOverflowClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
    overflowRef.current = e.currentTarget;
  }, []);

  const handleClose = useCallback(() => setAnchorEl(null), []);

  const open = Boolean(anchorEl);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "nowrap", overflow: "hidden", ...((sx as any) || {}) }}>
      {visible.map((it) => {
        const active = activeIds.includes(it.id);
        return (
          <Chip
            key={it.id}
            label={it.label}
            clickable={Boolean(onToggle)}
            onClick={onToggle ? () => onToggle(it.id) : undefined}
            variant={active ? "filled" : "outlined"}
            size="small"
            sx={{
              borderRadius: 999,
              fontSize: "0.75rem",
              px: 1.25,
              py: 0.4,
              mr: 0,
            }}
          />
        );
      })}

      {overflow.length > 0 && (
        <>
          <Chip
            label={`+${overflow.length}`}
            onClick={handleOverflowClick}
            ref={overflowRef as any}
            size="small"
            sx={{ borderRadius: 999, fontWeight: 700 }}
          />

          <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            PaperProps={{ sx: { minWidth: 200, maxWidth: 360 } }}
          >
            <List dense>
              {overflow.map((it) => (
                <ListItemButton
                  key={it.id}
                  onClick={() => {
                    if (onToggle) onToggle(it.id);
                    handleClose();
                  }}
                >
                  <ListItemText primary={it.label} />
                </ListItemButton>
              ))}
            </List>
          </Popover>
        </>
      )}
    </Box>
  );
}
