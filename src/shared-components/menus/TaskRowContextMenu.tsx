//Right-click context menu (for individual row actions)
import React, { useMemo } from "react";
import TaskActionsMenu, { createContextMenuItems } from "./TaskActionsMenu";

interface TaskRowContextMenuProps {
  visible: boolean;
  x: number;
  y: number;

  selectedRows: Record<string, any>[];
  clickedColumnKey?: string | null;
  clickedRow?: Record<string, any> | null;

  onClose: () => void;

  onOpenPopout: (
    tasks: Record<string, any>[],
    mouseScreenX: number,
    mouseScreenY: number
  ) => void;

  onOpenCalloutIncident: (task: Record<string, any>) => void;
  onProgressTasks?: (tasks: Record<string, any>[]) => void;
  onProgressNotes?: (tasks: Record<string, any>[]) => void;

  mouseScreenX: number;
  mouseScreenY: number;
}

export default function TaskRowContextMenu({
  visible,
  x,
  y,
  selectedRows,
  clickedColumnKey,
  clickedRow,
  onClose,
  onOpenPopout,
  onOpenCalloutIncident,
  onProgressTasks,
  onProgressNotes,
  mouseScreenX,
  mouseScreenY,
}: TaskRowContextMenuProps) {
  const actionableRows = selectedRows.length
    ? selectedRows
    : clickedRow
    ? [clickedRow]
    : [];

  const handleCopyValue = async () => {
    if (!clickedRow || !clickedColumnKey) return;

    const raw = clickedRow[clickedColumnKey];
    const value = raw == null ? "" : String(raw);

    try {
      await navigator.clipboard.writeText(value);
    } catch (err) {
      console.error("Clipboard write error:", err);
    }

    onClose();
  };

  const handleOpen = () => {
    if (!actionableRows.length) return;

    try {
      onOpenPopout(actionableRows, mouseScreenX, mouseScreenY);
    } catch (err) {
      console.error("ContextMenu → onOpenPopout error:", err);
    }

    onClose();
  };

  const handleProgressTasks = () => {
    if (!actionableRows.length || !onProgressTasks) return;

    try {
      onProgressTasks(actionableRows);
    } catch (err) {
      console.error("ContextMenu → onProgressTasks error:", err);
    }

    onClose();
  };

  const handleProgressNotes = () => {
    if (!actionableRows.length || !onProgressNotes) {
      return;
    }

    try {
      onProgressNotes(actionableRows);
    } catch (err) {
      console.error("ContextMenu → onProgressNotes error:", err);
    }

    onClose();
  };

  const handleCalloutIncident = () => {
    if (!clickedRow) return;

    try {
      onOpenCalloutIncident(clickedRow);
    } catch (err) {
      console.error("ContextMenu → onOpenCalloutIncident error:", err);
    }

    onClose();
  };

  const menuItems = useMemo(() => createContextMenuItems(
    actionableRows,
    clickedRow,
    clickedColumnKey ?? null,
    handleCopyValue,
    handleOpen,
    actionableRows.length > 0 ? handleProgressTasks : undefined,
    actionableRows.length > 0 ? handleProgressNotes : undefined,
    actionableRows.length === 1 ? handleCalloutIncident : undefined
  ), [actionableRows, clickedRow, clickedColumnKey, handleCopyValue, handleOpen, handleProgressTasks, handleProgressNotes, handleCalloutIncident]);

  return (
    <TaskActionsMenu
      type="positioned"
      position={{ x, y }}
      open={visible}
      onClose={onClose}
      items={menuItems}
    />
  );
}
