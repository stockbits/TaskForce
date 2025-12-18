import React, { useState, useRef, useCallback } from "react";
import { Box, Chip, Popover, List, ListItemButton, ListItemText, Typography, useTheme, Stack } from "@mui/material";
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
  onSelectAll?: () => void;
  onClearAll?: () => void;
  sx?: SxProps;
  // allow extra props to be forwarded to the root Box for dynamic/NUI usage
  [key: string]: any;
}

const PillGroup = React.forwardRef<HTMLDivElement, PillGroupProps>(function PillGroup({ items, activeIds = [], maxVisible = 5, onToggle, onSelectAll, onClearAll, sx, ...rest }, ref) {
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
    <Box ref={ref} sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "nowrap", overflow: "hidden", ...((sx as any) || {}) }} {...rest}>
      {visible.map((it: PillItem) => {
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
            <Box sx={{ p: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, pb: 1 }}>
                <Typography variant="caption" color="text.secondary">Overflow items</Typography>
                <Box>
                  {activeIds.length === items.length ? (
                    <Chip label="Clear" size="small" clickable onClick={() => { if (onClearAll) onClearAll(); handleClose(); }} sx={{ ml: 1 }} />
                  ) : (
                    <Chip label="Select" size="small" clickable onClick={() => { if (onSelectAll) onSelectAll(); handleClose(); }} sx={{ ml: 1 }} />
                  )}
                </Box>
              </Stack>
              <List dense>
              {overflow.map((it: PillItem) => (
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
            </Box>
          </Popover>
        </>
      )}
    </Box>
  );
});

export default PillGroup;
