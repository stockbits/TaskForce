import React from "react";
import { createPortal } from "react-dom";
import Visibility from '@mui/icons-material/Visibility';
import ContentCopy from '@mui/icons-material/ContentCopy';
import WarningAmber from '@mui/icons-material/WarningAmber';
import ListAlt from '@mui/icons-material/ListAlt';
import StickyNote2 from '@mui/icons-material/StickyNote2';

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

  const menu = visible ? (
      <ul
        // Use fixed positioning so the menu appears at the exact viewport
        // coordinates where the user clicked (clientX/clientY).
        ref={menuRef}
        style={{
          position: "fixed",
          top: y,
          left: x,
          minWidth: `min(90vw, ${24 * 14.1667}px)`, // 340px, use theme.spacing(42.5) if available
          zIndex: 99999,
          pointerEvents: "auto",
          backgroundColor: "white",
          border: "1px solid #ccc",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          padding: "8px 0",
          listStyle: "none",
          margin: 0,
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
          {/* Debug info */}
          <li style={{ padding: "8px 16px", fontSize: "12px", color: "#666", borderBottom: "1px solid #eee" }}>
            Debug: actionableRows={actionableRows.length}, selectedRows={selectedRows.length}, clickedRow={clickedRow ? "yes" : "no"}
          </li>

          {/* ---------------------------
              COPY VALUE
          --------------------------- */}
          {clickedColumnKey && clickedRow && (
            <li
              onClick={handleCopyValue}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer",
                backgroundColor: "transparent",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <ContentCopy sx={{ fontSize: 15 }} style={{ color: "#666" }} />
              <span style={{ color: "#333", fontSize: "14px" }}>
                Copy value:{" "}
                <span style={{ fontWeight: "bold" }}>{previewValue}</span>
              </span>
            </li>
          )}

          {/* ---------------------------
              PROGRESS TASKS (QUICK NOTE)
          --------------------------- */}
          {actionableRows.length > 0 && onProgressTasks && (
            <li
              onClick={handleProgressTasks}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer",
                backgroundColor: "transparent",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <ListAlt style={{ fontSize: 15, color: "#0A4A7A" }} />
              <span style={{ color: "#333", fontSize: "14px", fontWeight: "500" }}>
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
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer",
                backgroundColor: "transparent",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <StickyNote2 style={{ fontSize: 15, color: "#0A4A7A" }} />
              <span style={{ color: "#333", fontSize: "14px", fontWeight: "500" }}>
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
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              cursor: "pointer",
              backgroundColor: "transparent",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <Visibility style={{ fontSize: 15, color: "#666" }} />
            <span style={{ color: "#333", fontSize: "14px", fontWeight: "500" }}>{viewLabel}</span>
          </li>

          {/* ---------------------------
              CALLOUT INCIDENT (only when exactly one actionable row)
          --------------------------- */}
          <li
            onClick={handleCalloutIncident}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              cursor: actionableRows.length === 1 ? "pointer" : "not-allowed",
              backgroundColor: "transparent",
              transition: "background-color 0.2s",
              opacity: actionableRows.length === 1 ? 1 : 0.4,
            }}
            onMouseEnter={(e) => {
              if (actionableRows.length === 1) e.currentTarget.style.backgroundColor = "#fef2f2";
            }}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <WarningAmber style={{ fontSize: 15, color: actionableRows.length === 1 ? "#dc2626" : "#999" }} />
            <span style={{ color: actionableRows.length === 1 ? "#dc2626" : "#999", fontSize: "14px", fontWeight: "600" }}>{incidentLabel}</span>
          </li>
      </ul>
    ) : null;

  // Render the menu into document.body to avoid being affected by transforms
  // or stacking contexts from parent layout containers.
  try {
    return createPortal(menu, document.body);
  } catch {
    // Fallback to in-place render if portal fails for any reason
    return menu;
  }

}
