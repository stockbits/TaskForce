import React, { useState, useMemo } from "react";
import { X, Maximize2 } from "lucide-react";
import { PanelKey } from "@/types";

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
    setVisiblePanels((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const closePanel = (key: PanelKey) => {
    setVisiblePanels((prev) => prev.filter((p) => p !== key));
    if (maximizedPanel === key) setMaximizedPanel(null);
  };

  const maximizePanel = (key: PanelKey) => {
    // Only allow maximize if more than 1 panel is visible
    if (visiblePanels.length <= 1) return;
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
  icon: any;
  isMaximized: boolean;
  onMaximize: () => void;
  onClose: () => void;
  children: React.ReactNode;
  /** number of currently visible panels */
  visibleCount: number;
}) {
  return (
    <div className="flex flex-col h-full w-full bg-white border rounded-md overflow-hidden">
      {/* HEADER */}
      <div className="flex items-center justify-between px-2 py-1 bg-gray-100 border-b">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Icon size={14} className="text-gray-500" />
          {title}
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-1">
          {/* Only show maximize/restore when more than 1 panel is visible */}
          {visibleCount > 1 && (
            <>
              {/* NORMAL MODE → SHOW MAXIMIZE */}
              {!isMaximized && (
                <button
                  onClick={onMaximize}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Maximize"
                >
                  <Maximize2 size={14} />
                </button>
              )}

              {/* MAXIMIZED MODE → SHOW RESTORE */}
              {isMaximized && (
                <button
                  onClick={onMaximize}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Restore"
                >
                  <Maximize2 size={14} className="rotate-180" />
                </button>
              )}
            </>
          )}

          {/* CLOSE ALWAYS */}
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
