import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Copy, AlertTriangle } from "lucide-react";

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
  mouseScreenX,
  mouseScreenY,
}: TaskRowContextMenuProps) {
  if (!visible) return null;

  const multiCount = selectedRows.length;

  const viewLabel =
    multiCount > 1 ? `Open Viewer (${multiCount})` : `Open Viewer`;

  /* ---------------------------
     OPEN TASK VIEWER
  --------------------------- */
  const handleOpen = () => {
    if (!selectedRows?.length) return;

    try {
      onOpenPopout(selectedRows, mouseScreenX, mouseScreenY);
    } catch (err) {
      console.error("ContextMenu → onOpenPopout error:", err);
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
          style={{
            position: "fixed",
            top: mouseScreenY,
            left: mouseScreenX,
            minWidth: "min(90vw,340px)",
            zIndex: 99999,
          }}
          className="rounded-xl border border-gray-200 bg-white shadow-xl backdrop-blur-md text-sm text-gray-800 py-1 overflow-hidden"
          onMouseDown={(e) => e.stopPropagation()}
        >
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
