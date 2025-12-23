import React, { useState, useEffect } from "react";
import { IconButton, Tooltip } from "@mui/material";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";

interface TimelineZoomControlProps {
  onZoomChange: (zoomLevel: number) => void;
  currentZoom: number;
}

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.5, 2, 3, 4]; // Zoom multipliers
const DEFAULT_ZOOM_INDEX = 2; // Index 2 = 1x (normal zoom)

export default function TimelineZoomControl({ onZoomChange, currentZoom: _currentZoom }: TimelineZoomControlProps) {
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Control') {
        setIsCtrlPressed(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Control') {
        setIsCtrlPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleResetZoom = () => {
    setZoomIndex(DEFAULT_ZOOM_INDEX);
    onZoomChange(ZOOM_LEVELS[DEFAULT_ZOOM_INDEX]);
  };

  const currentZoomLevel = ZOOM_LEVELS[zoomIndex];
  const isAtDefault = zoomIndex === DEFAULT_ZOOM_INDEX;

  return (
    <Tooltip
      title={
        isCtrlPressed
          ? `Zoom: ${currentZoomLevel}x - Use mouse wheel to zoom at cursor position`
          : isAtDefault
          ? "Hold Ctrl + mouse wheel to zoom timeline at cursor"
          : `Zoom: ${currentZoomLevel}x - Click to reset to default`
      }
    >
      <IconButton
        size="small"
        onClick={handleResetZoom}
        sx={{
          opacity: isAtDefault ? 0.5 : 1,
          transition: 'all 0.2s',
          border: !isAtDefault ? '1px solid rgba(0, 0, 0, 0.23)' : 'none',
          bgcolor: !isAtDefault ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
          '&:hover': {
            bgcolor: !isAtDefault ? 'rgba(25, 118, 210, 0.12)' : 'action.hover',
            border: !isAtDefault ? '1px solid rgba(25, 118, 210, 0.5)' : 'none',
          },
        }}
      >
        {isAtDefault ? (
          <CenterFocusStrongIcon sx={{ fontSize: 16 }} />
        ) : currentZoomLevel > 1 ? (
          <ZoomInIcon sx={{ fontSize: 16 }} />
        ) : (
          <ZoomOutIcon sx={{ fontSize: 16 }} />
        )}
      </IconButton>
    </Tooltip>
  );
}