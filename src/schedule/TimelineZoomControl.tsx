import React, { useState, useEffect } from "react";
import { IconButton, Tooltip } from "@mui/material";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";

interface TimelineZoomControlProps {
  onZoomChange: (zoomLevel: number) => void;
  currentZoom: number;
  totalHours: number;
  containerWidth: number;
}

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.5, 2, 3, 4]; // Zoom multipliers
const DEFAULT_ZOOM_INDEX = 2; // Index 2 = 1x (normal zoom)

export default function TimelineZoomControl({ onZoomChange, currentZoom: _currentZoom, totalHours: _totalHours, containerWidth: _containerWidth }: TimelineZoomControlProps) {
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

    const handleWheel = (event: WheelEvent) => {
      if (!isCtrlPressed) return;

      event.preventDefault();

      if (event.deltaY < 0) {
        // Scroll up - zoom in
        if (zoomIndex < ZOOM_LEVELS.length - 1) {
          const newIndex = zoomIndex + 1;
          setZoomIndex(newIndex);
          onZoomChange(ZOOM_LEVELS[newIndex]);
        }
      } else {
        // Scroll down - zoom out (prevent going below 1x to avoid wasted space)
        if (zoomIndex > 2) { // Index 2 is 1x zoom
          const newIndex = zoomIndex - 1;
          setZoomIndex(newIndex);
          onZoomChange(ZOOM_LEVELS[newIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [isCtrlPressed, zoomIndex, onZoomChange]);

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
          ? `Zoom: ${currentZoomLevel}x - Scroll to zoom in/out, click to reset`
          : isAtDefault
          ? "Hold Ctrl + scroll to zoom timeline"
          : `Zoom: ${currentZoomLevel}x - Click to reset to default`
      }
    >
      <IconButton
        size="small"
        onClick={handleResetZoom}
        sx={{
          opacity: isAtDefault ? 0.5 : 1,
          transition: 'opacity 0.2s',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        {isAtDefault ? (
          <CenterFocusStrongIcon fontSize="small" />
        ) : currentZoomLevel > 1 ? (
          <ZoomInIcon fontSize="small" />
        ) : (
          <ZoomOutIcon fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  );
}