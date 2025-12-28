//BulkTaskActions.tsx - Bulk actions button + menu (for multi-selection actions)
import React, { useState, useCallback, useMemo } from "react";
import { Button } from "@mui/material";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TaskActionsMenu, { createTaskActionItems } from "./TaskActionsMenu";

interface BulkTaskActionsProps {
  selectedRows: Record<string, any>[];
  onProgressTasks: (tasks: Record<string, any>[]) => void;
  onProgressNotes: (tasks: Record<string, any>[]) => void;
}

export default function BulkTaskActions({
  selectedRows,
  onProgressTasks,
  onProgressNotes,
}: BulkTaskActionsProps) {
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchorEl);

  const handleMenuClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchorEl(null);
  }, []);

  const handleProgressTasksMenu = useCallback(() => {
    if (selectedRows.length === 0) return;
    onProgressTasks(selectedRows);
    handleMenuClose();
  }, [selectedRows, onProgressTasks]);

  const handleProgressNotesMenu = useCallback(() => {
    if (selectedRows.length === 0) return;
    onProgressNotes(selectedRows);
    handleMenuClose();
  }, [selectedRows, onProgressNotes]);

  const menuItems = useMemo(() => createTaskActionItems(
    selectedRows.length,
    selectedRows.length > 0 ? handleProgressTasksMenu : undefined,
    selectedRows.length > 0 ? handleProgressNotesMenu : undefined
  ), [selectedRows.length, handleProgressTasksMenu, handleProgressNotesMenu]);

  return (
    <>
      <Button
        variant="outlined"
        onClick={handleMenuClick}
        disabled={selectedRows.length === 0}
        endIcon={<MoreVertIcon />}
        sx={{ minWidth: 'auto' }}
      >
        Actions ({selectedRows.length})
      </Button>
      <TaskActionsMenu
        type="dropdown"
        anchorEl={menuAnchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        items={menuItems}
      />
    </>
  );
}