// =====================================================================
// useExternalWindow.ts — Draggable Dialog Popup System (MUI-based)
// - Uses MUI DraggableDialog instead of separate browser windows
// - Maintains similar API but with dialog-based implementation
// =====================================================================

import { useState, useCallback } from "react";
import { TaskDetails } from "@/shared-types";
import type { ResourceRecord } from '@/shared-types';
import type { CalloutHistoryEntry } from "../Callout Component/useCalloutHistory";

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

      setPopupData((prev) => {
        // If popup already open and is showing tasks, update tasks in-place
        if (prev && prev.mode === 'tasks') {
          return {
            ...prev,
            tasks,
            // keep previously expanded sections so the UI/position is preserved
            expanded: prev.expanded ?? expandedSections,
          } as PopupData;
        }

        // otherwise open fresh with provided tasks and keep the current expandedSections
        return {
          mode: "tasks",
          tasks,
          expanded: expandedSections,
        } as PopupData;
      });

      setIsOpen(true);
    },
    [expandedSections]
  );

  // --------------------------------------------------------------------
  // OPEN RESOURCE POPUP (Dialog-based)
  // --------------------------------------------------------------------
  const openResourceWindow = useCallback(
    (resource: ResourceRecord, history: CalloutHistoryEntry[]) => {
      if (!resource) return;

      setPopupData((prev) => {
        if (prev && prev.mode === 'resource') {
          return {
            ...prev,
            resource,
            history,
            expanded: prev.expanded ?? [],
          } as PopupData;
        }

        return {
          mode: "resource",
          resource,
          history,
          expanded: [],
        } as PopupData;
      });

      setIsOpen(true);
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
