import React, { useState, useMemo, useCallback } from "react";
import Close from '@mui/icons-material/Close';
import OpenInFull from '@mui/icons-material/OpenInFull';
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

/* ============================================================
   TYPES
============================================================ */
export type PanelKey = "timeline" | "map" | "resources" | "tasks";

/* ============================================================
   PANEL DOCKING HOOK
============================================================ */
export function usePanelDocking(
  initialPanels: PanelKey[] = ["timeline", "map", "resources", "tasks"]
) {
  const [visiblePanels, setVisiblePanels] = useState<PanelKey[]>(initialPanels);
  const [maximizedPanel, setMaximizedPanel] = useState<PanelKey | null>(null);

  // Individual panel sizes (as fractions of available space)
  const [panelSizes, setPanelSizes] = useState<Record<PanelKey, number>>({
    timeline: 0.5,   // Top-left panel width
    map: 0.5,        // Top-right panel width
    resources: 0.5,  // Bottom-left panel width
    tasks: 0.5,      // Bottom-right panel width
  });

  const [rowSizes, setRowSizes] = useState({
    top: 0.5,    // Top row height
    bottom: 0.5, // Bottom row height
  });

  /* ---- ACTIONS ---- */

  const togglePanel = useCallback((key: PanelKey) => {
    setVisiblePanels((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  }, []);

  const closePanel = useCallback((key: PanelKey) => {
    setVisiblePanels((prev) => prev.filter((p) => p !== key));
    if (maximizedPanel === key) setMaximizedPanel(null);
  }, [maximizedPanel]);

  const maximizePanel = useCallback((key: PanelKey) => {
    // Only allow maximize if more than 1 panel is visible
    if (visiblePanels.length <= 1) return;
    setMaximizedPanel((prev) => (prev === key ? null : key));
  }, [visiblePanels.length]);

  const updatePanelSize = useCallback((key: PanelKey, size: number) => {
    setPanelSizes(prev => ({ ...prev, [key]: Math.max(0.1, Math.min(0.9, size)) }));
  }, []);

  const updateRowSize = useCallback((row: 'top' | 'bottom', size: number) => {
    setRowSizes(prev => ({ ...prev, [row]: Math.max(0.1, Math.min(0.9, size)) }));
  }, []);

  /* ---- DERIVED ---- */

  const collapsedPanels = useMemo(
    () => initialPanels.filter((k) => !visiblePanels.includes(k)),
    [visiblePanels, initialPanels]
  );

  const isPanelMaximized = (key: PanelKey) => maximizedPanel === key;

  return {
    visiblePanels,
    maximizedPanel,
    collapsedPanels,

    panelSizes,
    rowSizes,

    isPanelMaximized,

    togglePanel,
    closePanel,
    maximizePanel,
    updatePanelSize,
    updateRowSize,
  };
}

/* ============================================================
   PANEL CONTAINER COMPONENT (Header + Max/Restore/Close)
============================================================ */
export function PanelContainer({
  title,
  icon: Icon,
  isMaximized,
  onMaximize,
  onClose,
  children,
  visibleCount,
  onMouseMove,
  onMouseDown,
}: {
  title: string;
  icon: React.ElementType;
  isMaximized: boolean;
  onMaximize: () => void;
  onClose: () => void;
  children: React.ReactNode;
  /** number of currently visible panels */
  visibleCount: number;
  onMouseMove?: (event: React.MouseEvent) => void;
  onMouseDown?: (event: React.MouseEvent) => void;
}) {
  const theme = useTheme();
  const headerBg = alpha(theme.palette.primary.main, 0.05);
  const iconTone = alpha(theme.palette.text.primary, 0.6);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        borderRadius: 1,
        overflow: "hidden",
        backgroundColor: theme.palette.background.paper,
        position: "relative",
        zIndex: isMaximized ? 10 : 1,
      }}
      onMouseMove={onMouseMove}
      onMouseDown={onMouseDown}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 2,
          py: 1,
          backgroundColor: headerBg,
          minHeight: 36,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Icon sx={{ fontSize: 18, color: iconTone as any }} />
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, color: theme.palette.text.primary }}
          >
            {title}
          </Typography>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={0.5}>
          {visibleCount > 1 && (
            <IconButton
              size="medium"
              onClick={() => {
                try { onMaximize(); } catch (e) { console.error(e); }
              }}
              title={isMaximized ? "Restore" : "Maximize"}
              sx={{
                borderRadius: '50%',
                bgcolor: isMaximized
                  ? alpha(theme.palette.primary.main, 0.12)
                  : theme.palette.mode === 'dark' ? theme.palette.background.paper : 'transparent',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.18),
                },
              }}
            >
              <OpenInFull
                style={{
                  fontSize: 18,
                  color: theme.palette.text.primary,
                  transform: isMaximized ? "rotate(180deg)" : "none",
                  transition: "transform 150ms ease",
                }}
              />
            </IconButton>
          )}

          <IconButton
            size="medium"
            onClick={() => {
              try { onClose(); } catch (e) { console.error(e); }
            }}
            title="Close"
            sx={{
              borderRadius: '50%',
              bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.paper : 'transparent',
              '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.18),
                },
              }}
            >
              <Close style={{ fontSize: 18, color: theme.palette.text.primary }} />
            </IconButton>
        </Stack>
      </Stack>

      <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        {children}
      </Box>
    </Box>
  );
}
