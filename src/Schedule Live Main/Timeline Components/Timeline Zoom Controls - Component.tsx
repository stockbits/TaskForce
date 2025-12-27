import React, { useState, useEffect } from "react";
import { IconButton } from "@mui/material";
import FitScreenIcon from "@mui/icons-material/FitScreen";
import { SimpleTooltip } from "@/shared-ui";

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
    <SimpleTooltip
      title={
        isCtrlPressed
          ? `Zoom: ${currentZoomLevel}x - Use mouse wheel to zoom at cursor position`
          : isAtDefault
          ? "Hold Ctrl + mouse wheel to zoom timeline at cursor"
          : `Zoom: ${currentZoomLevel}x - Click to reset to default`
      }
    >
      <IconButton
        size="medium"
        onClick={handleResetZoom}
        sx={{
          color: isAtDefault ? 'text.primary' : 'action.active',
          '&:hover': {
            color: isAtDefault ? 'action.active' : 'action.focus',
          },
        }}
      >
        <FitScreenIcon sx={{ fontSize: 18 }} />
      </IconButton>
    </SimpleTooltip>
  );
}