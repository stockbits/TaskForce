import React, { useState, useMemo } from "react";
import Close from '@mui/icons-material/Close';
import OpenInFull from '@mui/icons-material/OpenInFull';
import { Box, IconButton, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import useFieldSizes from "../shared-ui/text-fields/useFieldSizes";

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

  /* ---- ACTIONS ---- */

  const togglePanel = (key: PanelKey) => {
    console.debug('[usePanelDocking] togglePanel', key);
    setVisiblePanels((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const closePanel = (key: PanelKey) => {
    console.debug('[usePanelDocking] closePanel', key);
    setVisiblePanels((prev) => prev.filter((p) => p !== key));
    if (maximizedPanel === key) setMaximizedPanel(null);
  };

  const maximizePanel = (key: PanelKey) => {
    // Only allow maximize if more than 1 panel is visible
    if (visiblePanels.length <= 1) return;
    console.debug('[usePanelDocking] maximizePanel', key);
    setMaximizedPanel((prev) => (prev === key ? null : key));
  };

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

    isPanelMaximized,

    togglePanel,
    closePanel,
    maximizePanel,
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
}: {
  title: string;
  icon: React.ElementType;
  isMaximized: boolean;
  onMaximize: () => void;
  onClose: () => void;
  children: React.ReactNode;
  /** number of currently visible panels */
  visibleCount: number;
}) {
  const theme = useTheme();
  const { INPUT_HEIGHT } = useFieldSizes();
  const borderColor = alpha(theme.palette.primary.main, 0.12);
  const headerBg = alpha(theme.palette.primary.main, 0.05);
  const iconTone = alpha(theme.palette.text.primary, 0.6);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        borderRadius: '12px 12px 0 0',
        border: `1px solid ${borderColor}`,
        overflow: "hidden",
        backgroundColor: theme.palette.background.paper,
        position: "relative",
        zIndex: isMaximized ? 10 : 1,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 2,
          py: 1,
          borderBottom: `1px solid ${borderColor}`,
          backgroundColor: headerBg,
          minHeight: INPUT_HEIGHT,
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
              size="small"
              onClick={onMaximize}
              title={isMaximized ? "Restore" : "Maximize"}
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                bgcolor: isMaximized
                  ? alpha(theme.palette.primary.main, 0.12)
                  : theme.palette.common.white,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.18),
                },
              }}
            >
              <OpenInFull
                style={{
                  fontSize: 16,
                  color: theme.palette.text.primary,
                  transform: isMaximized ? "rotate(180deg)" : "none",
                  transition: "transform 150ms ease",
                }}
              />
            </IconButton>
          )}

          <IconButton
            size="small"
            onClick={onClose}
            title="Close"
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
              bgcolor: theme.palette.common.white,
              '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.18),
                },
              }}
            >
              <Close style={{ fontSize: 16, color: theme.palette.text.primary }} />
            </IconButton>
        </Stack>
      </Stack>

      <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        {children}
      </Box>
    </Box>
  );
}
