// =====================================================================
// useExternalWindow.ts — Dynamic Popup Sizing (Card-based)
// - 1 card: centred, wide layout
// - 2–3 cards: window width = cards + gap + outer padding
// - 4+ cards: same width as 3-card row, horizontal scroll inside panel
// - Popup always centred on screen (X & Y)
// =====================================================================

import { useState, useRef, useCallback } from "react";
import { TaskDetails } from "@/types";
import type { ResourceRecord } from '@/types';
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
  const externalWindowRef = useRef<Window | null>(null);

  const [externalContainer, setExternalContainer] =
    useState<HTMLElement | null>(null);
  const [externalTasks, setExternalTasks] = useState<TaskDetails[] | null>(
    null
  );
  const [externalExpandedSections, setExternalExpandedSections] = useState<
    string[]
  >([]);

  // --------------------------------------------------------------------
  // POPUP DIMENSION RULES
  // --------------------------------------------------------------------
  const CARD_WIDTH = 520; // compare card width
  const SINGLE_CARD_WIDTH = 720; // single-task width
  const CARD_GAP = 16; // gap-4
  const OUTER_PADDING_X = 24; // px-6 left + right
  const MAX_WIDTH = 1900;
  const MAX_HEIGHT = 1000;
  const SINGLE_HEIGHT = 900;
  const RESOURCE_WIDTH = 760;
  const RESOURCE_HEIGHT = 820;

  const getPopupSize = (mode: PopupMode, count: number) => {
    const screenW = window.screen.availWidth;
    const screenH = window.screen.availHeight;

    if (mode === "resource") {
      const width = Math.min(RESOURCE_WIDTH, screenW - 40, MAX_WIDTH);
      const height = Math.min(RESOURCE_HEIGHT, screenH - 80, MAX_HEIGHT);
      return { width, height };
    }

    // ----- SINGLE TASK -----
    if (count === 1) {
      const width = Math.min(
        SINGLE_CARD_WIDTH + OUTER_PADDING_X * 2,
        screenW - 40,
        MAX_WIDTH
      );
      const height = Math.min(SINGLE_HEIGHT, screenH - 80, MAX_HEIGHT);
      return { width, height };
    }

    // ----- 2–3 TASKS (ALL VISIBLE, NO SCROLL) -----
    const visibleCards = Math.min(count, 3);
    const contentWidth =
      CARD_WIDTH * visibleCards +
      CARD_GAP * (visibleCards - 1) +
      OUTER_PADDING_X * 2;

    const width = Math.min(contentWidth, screenW - 40, MAX_WIDTH);
    const height = Math.min(MAX_HEIGHT, screenH - 80);

    return { width, height };
  };

  // --------------------------------------------------------------------
  // CLOSE POPUP
  // --------------------------------------------------------------------
  const closeExternalWindow = useCallback(() => {
    const win = externalWindowRef.current;

    if (win && !win.closed) win.close();

    externalWindowRef.current = null;
    setExternalContainer(null);
    setExternalTasks(null);
    setExternalExpandedSections([]);
  }, []);

  // --------------------------------------------------------------------
  // OPEN POPUP (centered, dynamic width)
  // --------------------------------------------------------------------
  const openExternalWindow = useCallback(
    (tasks: TaskDetails[], _mouseX: number, _mouseY: number) => {
      if (!tasks || tasks.length === 0) return;

      // Close any existing popup
      if (externalWindowRef.current && !externalWindowRef.current.closed) {
        externalWindowRef.current.close();
      }

      const { width, height } = getPopupSize("tasks", tasks.length);

      const screenW = window.screen.availWidth;
      const screenH = window.screen.availHeight;

      // Centre on screen (ignore cursor)
      const left = Math.max(0, (screenW - width) / 2);
      const top = Math.max(0, (screenH - height) / 2);

      const features = `
        width=${width},
        height=${height},
        left=${left},
        top=${top},
        toolbar=0,
        menubar=0,
        location=0,
        status=0,
        scrollbars=1,
        resizable=1
      `;

      const newWin = window.open("/popup.html", "_blank", features);
      if (!newWin) return;

      externalWindowRef.current = newWin;

      const payload: PopupData = {
        mode: "tasks",
        tasks,
        expanded: externalExpandedSections,
      };

      // Pass popup data
      newWin.__POPUP_DATA__ = payload;

      newWin.__POPUP_CLOSE__ = () => closeExternalWindow();

      newWin.onload = () => {
        try {
          newWin.__POPUP_DATA__ = payload;
        } catch {}
      };

      setExternalTasks(tasks);
      setExternalExpandedSections([]);
      setExternalContainer(null); // not used in popup.html mode
    },
    [externalExpandedSections, closeExternalWindow]
  );

  const openResourceWindow = useCallback(
    (resource: ResourceRecord, history: CalloutHistoryEntry[]) => {
      if (!resource) return;

      if (externalWindowRef.current && !externalWindowRef.current.closed) {
        externalWindowRef.current.close();
      }

      const { width, height } = getPopupSize("resource", 1);
      const screenW = window.screen.availWidth;
      const screenH = window.screen.availHeight;

      const left = Math.max(0, (screenW - width) / 2);
      const top = Math.max(0, (screenH - height) / 2);

      const features = `
        width=${width},
        height=${height},
        left=${left},
        top=${top},
        toolbar=0,
        menubar=0,
        location=0,
        status=0,
        scrollbars=1,
        resizable=1
      `;

      const newWin = window.open("/popup.html", "_blank", features);
      if (!newWin) return;

      externalWindowRef.current = newWin;

      const payload: PopupData = {
        mode: "resource",
        resource,
        history,
        expanded: [],
      };

      newWin.__POPUP_DATA__ = payload;
      newWin.__POPUP_CLOSE__ = () => closeExternalWindow();
      newWin.onload = () => {
        try {
          newWin.__POPUP_DATA__ = payload;
        } catch {}
      };

      setExternalTasks(null);
      setExternalExpandedSections([]);
      setExternalContainer(null);
    },
    [closeExternalWindow]
  );

  return {
    externalContainer,
    externalTasks,
    externalExpandedSections,
    openExternalWindow,
    openResourceWindow,
    closeExternalWindow,
    setExternalExpandedSections,
  };
}
