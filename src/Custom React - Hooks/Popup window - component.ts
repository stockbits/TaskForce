// =====================================================================
// useExternalWindow.ts — Draggable Dialog Popup System (MUI-based)
// - Uses MUI DraggableDialog instead of separate browser windows
// - Maintains similar API but with dialog-based implementation
// =====================================================================

import { useState, useCallback } from "react";
import { TaskDetails } from "@/shared-types";
import type { ResourceRecord } from '@/shared-types';
import type { CalloutHistoryEntry } from "../Callout Component/useCalloutHistory";

type PopupMode = "tasks" | "resource";

type PopupData =
  | {
      mode: "tasks";
      tasks: TaskDetails[];
      expanded: string[];
    }
  | {
      mode: "resource";
      resource: ResourceRecord;
      history: CalloutHistoryEntry[];
      expanded: string[];
    };

export function useExternalWindow() {
  const [isOpen, setIsOpen] = useState(false);
  const [popupData, setPopupData] = useState<PopupData | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  // --------------------------------------------------------------------
  // CLOSE POPUP
  // --------------------------------------------------------------------
  const closeExternalWindow = useCallback(() => {
    setIsOpen(false);
    setPopupData(null);
    setExpandedSections([]);
  }, []);

  // --------------------------------------------------------------------
  // OPEN TASK POPUP (Dialog-based)
  // --------------------------------------------------------------------
  const openExternalWindow = useCallback(
    (tasks: TaskDetails[]) => {
      if (!tasks || tasks.length === 0) return;

      const payload: PopupData = {
        mode: "tasks",
        tasks,
        expanded: expandedSections,
      };

      setPopupData(payload);
      setIsOpen(true);
      setExpandedSections([]);
    },
    [expandedSections]
  );

  // --------------------------------------------------------------------
  // OPEN RESOURCE POPUP (Dialog-based)
  // --------------------------------------------------------------------
  const openResourceWindow = useCallback(
    (resource: ResourceRecord, history: CalloutHistoryEntry[]) => {
      if (!resource) return;

      const payload: PopupData = {
        mode: "resource",
        resource,
        history,
        expanded: [],
      };

      setPopupData(payload);
      setIsOpen(true);
      setExpandedSections([]);
    },
    []
  );

  return {
    isOpen,
    popupData,
    expandedSections,
    openExternalWindow,
    openResourceWindow,
    closeExternalWindow,
    setExpandedSections,
  };
}
