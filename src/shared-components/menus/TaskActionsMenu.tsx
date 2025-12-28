//TaskActionsMenu.tsx - Main menu component (handles dropdown and positioned menus)
import React from "react";
import { createPortal } from "react-dom";
import { Paper, List, ListItem, ListItemIcon, ListItemText, Menu, MenuItem, Typography } from "@mui/material";
import ListAlt from '@mui/icons-material/ListAlt';
import StickyNote2 from '@mui/icons-material/StickyNote2';
import Visibility from '@mui/icons-material/Visibility';
import ContentCopy from '@mui/icons-material/ContentCopy';
import WarningAmber from '@mui/icons-material/WarningAmber';

export interface TaskActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

interface TaskActionsMenuProps {
  // For dropdown menu (button-triggered)
  anchorEl?: HTMLElement | null;
  open?: boolean;
  onClose?: () => void;

  // For positioned menu (context menu)
  position?: { x: number; y: number };

  // Menu items
  items: TaskActionItem[];

  // Menu type
  type: 'dropdown' | 'positioned';
}

export default function TaskActionsMenu({
  anchorEl,
  open = false,
  onClose,
  position,
  items,
  type,
}: TaskActionsMenuProps) {
  const menuContent = (
    <List sx={{ py: type === 'dropdown' ? 0 : 1 }}>
      {items.map((item) => (
        <ListItem
          key={item.id}
          onClick={item.onClick}
          onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
          sx={{
            cursor: item.disabled ? "not-allowed" : "pointer",
            opacity: item.disabled ? 0.4 : 1,
            '&:hover': item.disabled ? {} : {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <ListItemIcon sx={type === 'positioned' ? { minWidth: 36 } : {}}>
            {item.icon}
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography variant="body2" color="text.primary" fontWeight={500}>
                {item.label}
              </Typography>
            }
          />
        </ListItem>
      ))}
    </List>
  );

  if (type === 'dropdown') {
    return (
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            minWidth: 200,
          }
        }}
      >
        {items.map((item) => (
          <MenuItem
            key={item.id}
            onMouseDown={(e) => { e.stopPropagation(); item.onClick(); }}
            sx={{
              cursor: item.disabled ? "not-allowed" : "pointer",
              opacity: item.disabled ? 0.4 : 1,
              '&:hover': item.disabled ? {} : {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body2" color="text.primary" fontWeight={500}>
                  {item.label}
                </Typography>
              }
            />
          </MenuItem>
        ))}
      </Menu>
    );
  }

  // Positioned menu (context menu)
  if (type === 'positioned' && position) {
    const menu = open ? (
      <Paper
        sx={{
          position: "fixed",
          top: position.y,
          left: position.x,
          minWidth: `min(90vw, 340px)`,
          zIndex: 99999,
          pointerEvents: "auto",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          borderRadius: 2,
        }}
        onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {menuContent}
      </Paper>
    ) : null;

    return createPortal(menu, document.body);
  }

  return null;
}

// Helper function to create menu items
export function createTaskActionItems(
  actionableCount: number,
  onProgressTasks?: () => void,
  onProgressNotes?: () => void,
  onOpenPopout?: () => void,
  onOpenCalloutIncident?: () => void
): TaskActionItem[] {
  const items: TaskActionItem[] = [];

  if (onOpenPopout) {
    items.push({
      id: 'open-viewer',
      label: actionableCount > 1 ? `Open Viewer (${actionableCount})` : "Open Viewer",
      icon: <Visibility sx={{ fontSize: 18, color: 'primary.main' }} />,
      onClick: onOpenPopout,
    });
  }

  if (onProgressTasks) {
    items.push({
      id: 'progress-tasks',
      label: actionableCount > 1 ? `Progress Tasks (${actionableCount})` : "Progress Task",
      icon: <ListAlt sx={{ fontSize: 18, color: 'primary.main' }} />,
      onClick: onProgressTasks,
    });
  }

  if (onProgressNotes) {
    items.push({
      id: 'progress-notes',
      label: actionableCount > 1 ? `Progress Notes (${actionableCount})` : "Progress Notes",
      icon: <StickyNote2 sx={{ fontSize: 18, color: 'primary.main' }} />,
      onClick: onProgressNotes,
    });
  }

  if (onOpenCalloutIncident && actionableCount === 1) {
    items.push({
      id: 'callout-incident',
      label: "Callout Incident",
      icon: <WarningAmber sx={{ fontSize: 18, color: 'error.main' }} />,
      onClick: onOpenCalloutIncident,
    });
  }

  return items;
}

// Helper function to create all context menu items
export function createContextMenuItems(
  actionableRows: any[],
  clickedRow: any,
  clickedColumnKey: string | null,
  onCopyValue: () => void,
  onOpenViewer: () => void,
  onProgressTasks?: () => void,
  onProgressNotes?: () => void,
  onCalloutIncident?: () => void
): TaskActionItem[] {
  const items: TaskActionItem[] = [];

  // Copy value (only if clicked on a cell)
  if (clickedColumnKey && clickedRow) {
    const previewValue = clickedRow && clickedColumnKey
      ? String(clickedRow[clickedColumnKey] ?? "")
      : "";

    items.push({
      id: 'copy-value',
      label: `Copy value: ${previewValue}`,
      icon: <ContentCopy sx={{ fontSize: 18, color: 'text.secondary' }} />,
      onClick: onCopyValue,
    });
  }

  // Progress Tasks
  if (actionableRows.length > 0 && onProgressTasks) {
    items.push({
      id: 'progress-tasks',
      label: actionableRows.length > 1 ? `Progress Tasks (${actionableRows.length})` : "Progress Task",
      icon: <ListAlt sx={{ fontSize: 18, color: 'primary.main' }} />,
      onClick: onProgressTasks,
    });
  }

  // Progress Notes
  if (actionableRows.length > 0 && onProgressNotes) {
    items.push({
      id: 'progress-notes',
      label: actionableRows.length > 1 ? `Progress Notes (${actionableRows.length})` : "Progress Notes",
      icon: <StickyNote2 sx={{ fontSize: 18, color: 'primary.main' }} />,
      onClick: onProgressNotes,
    });
  }

  // Open Viewer
  items.push({
    id: 'open-viewer',
    label: actionableRows.length > 1 ? `Open Viewer (${actionableRows.length})` : "Open Viewer",
    icon: <Visibility sx={{ fontSize: 18, color: 'text.secondary' }} />,
    onClick: onOpenViewer,
  });

  // Callout Incident (only for single task)
  if (actionableRows.length === 1 && onCalloutIncident && clickedRow) {
    const taskId = clickedRow?.taskId ?? clickedRow?.TaskID ?? clickedRow?.TaskId ?? clickedRow?.id ?? null;
    const incidentLabel = taskId ? `Callout Incident: ${taskId}` : "Callout Incident";

    items.push({
      id: 'callout-incident',
      label: incidentLabel,
      icon: <WarningAmber sx={{ fontSize: 18, color: 'error.main' }} />,
      onClick: onCalloutIncident,
    });
  }

  return items;
}