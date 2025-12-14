import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Copy, AlertTriangle, ListChecks, StickyNote } from "lucide-react";
import { Paper, List, ListItemButton, ListItemIcon, Typography, Divider } from "@mui/material";

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
  if (!visible) return null;

  const menuRef = React.useRef<HTMLUListElement | null>(null);

  // close on outside click
  React.useEffect(() => {
    const handler = (ev: MouseEvent) => {
      const el = menuRef.current;
      if (!el) return;
      if (ev.target && el.contains(ev.target as Node)) return;
      onClose();
    };
    document.addEventListener('mousedown', handler, true);
    return () => document.removeEventListener('mousedown', handler, true);
  }, [onClose]);

  const actionableRows = selectedRows.length
    ? selectedRows
    : clickedRow
    ? [clickedRow]
    : [];

  const multiCount = actionableRows.length;

  const viewLabel =
    multiCount > 1 ? `Open Viewer (${multiCount})` : `Open Viewer`;

  /* ---------------------------
     OPEN TASK VIEWER
  --------------------------- */
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
    if (!actionableRows.length || !onProgressNotes) return;

    try {
      onProgressNotes(actionableRows);
    } catch (err) {
      console.error("ContextMenu → onProgressNotes error:", err);
    }

    onClose();
  };


  /* ---------------------------
     COPY CELL VALUE
  --------------------------- */
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

  const previewValue =
    clickedRow && clickedColumnKey
      ? String(clickedRow[clickedColumnKey] ?? "")
      : "";

  /* ---------------------------
     CALLOUT INCIDENT
  --------------------------- */
  const handleCalloutIncident = () => {
    if (!clickedRow) return;

    try {
      onOpenCalloutIncident(clickedRow);
    } catch (err) {
      console.error("ContextMenu → onOpenCalloutIncident error:", err);
    }

    onClose();
  };

  // Derive task ID from common naming patterns
  const taskId =
    clickedRow?.taskId ??
    clickedRow?.TaskID ??
    clickedRow?.TaskId ??
    clickedRow?.id ??
    null;

  const incidentLabel = taskId
    ? `Callout Incident: ${taskId}`
    : "Callout Incident";

  const menu = (
    <AnimatePresence>
      {visible && (
        <motion.ul
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.12 }}
          // Use fixed positioning so the menu appears at the exact viewport
          // coordinates where the user clicked (clientX/clientY).
          ref={menuRef}
          style={{
            position: "fixed",
            top: y,
            left: x,
            minWidth: `min(90vw, ${24 * 14.1667}px)`, // 340px, use theme.spacing(42.5) if available
            zIndex: 99999,
          }}
          className="rounded-xl border border-gray-200 bg-white shadow-xl text-sm text-gray-800 py-1 overflow-hidden"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* ---------------------------
              COPY VALUE
          --------------------------- */}
          {clickedColumnKey && clickedRow && (
            <li
              onClick={handleCopyValue}
              className="px-4 py-2.5 flex items-center gap-3 cursor-pointer 
                         hover:bg-gray-50 transition-all"
            >
              <Copy size={15} className="text-gray-700" />
              <span className="text-gray-800">
                Copy value:{" "}
                <span className="font-semibold">{previewValue}</span>
              </span>
            </li>
          )}

          {/* ---------------------------
              PROGRESS TASKS (QUICK NOTE)
          --------------------------- */}
          {actionableRows.length > 0 && onProgressTasks && (
            <li
              onClick={handleProgressTasks}
              className="px-4 py-2.5 flex items-center gap-3 cursor-pointer 
                         hover:bg-gray-50 transition-all"
            >
              <ListChecks size={15} className="text-[#0A4A7A]" />
              <span className="font-medium text-gray-800">
                {multiCount > 1 ? `Progress Tasks (${multiCount})` : "Progress Task"}
              </span>
            </li>
          )}

          {/* ---------------------------
              PROGRESS NOTES QUICK ACTION
          --------------------------- */}
          {actionableRows.length > 0 && onProgressNotes && (
            <li
              onClick={handleProgressNotes}
              className="px-4 py-2.5 flex items-center gap-3 cursor-pointer 
                         hover:bg-gray-50 transition-all"
            >
              <StickyNote size={15} className="text-[#0A4A7A]" />
              <span className="font-medium text-gray-800">
                {multiCount > 1
                  ? `Progress Notes (${multiCount})`
                  : "Progress Notes"}
              </span>
            </li>
          )}

          {/* ---------------------------
              OPEN EXTERNAL VIEWER
          --------------------------- */}
          <li
            onClick={handleOpen}
            className="px-4 py-2.5 flex items-center gap-3 cursor-pointer 
                       hover:bg-gray-50 transition-all"
          >
            <Eye size={15} className="text-gray-700" />
            <span className="font-medium text-gray-800">{viewLabel}</span>
          </li>

          {/* ---------------------------
              CALLOUT INCIDENT
          --------------------------- */}
          {clickedRow && (
            <li
              onClick={handleCalloutIncident}
              className="px-4 py-2.5 flex items-center gap-3 cursor-pointer 
                       hover:bg-red-50 transition-all text-red-700"
            >
              <AlertTriangle size={15} className="text-red-600" />
              <span className="font-semibold">{incidentLabel}</span>
            </li>
          )}
        </motion.ul>
      )}
    </AnimatePresence>
  );

  // Render the menu into document.body to avoid being affected by transforms
  // or stacking contexts from parent layout containers.
  try {
    return createPortal(menu, document.body);
  } catch (err) {
    // Fallback to in-place render if portal fails for any reason
    return menu;
  }

}
