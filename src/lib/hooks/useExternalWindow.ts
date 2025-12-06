// =====================================================================
// useExternalWindow.ts — Dynamic Popup Sizing (Card-based)
// - 1 card: centred, wide layout
// - 2–3 cards: window width = cards + gap + outer padding
// - 4+ cards: same width as 3-card row, horizontal scroll inside panel
// - Popup always centred on screen (X & Y)
// =====================================================================

import { useState, useRef, useCallback } from "react";
import { TaskDetails } from "@/types";

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

  const getPopupSize = (taskCount: number) => {
    const screenW = window.screen.availWidth;
    const screenH = window.screen.availHeight;

    // ----- SINGLE TASK -----
    if (taskCount === 1) {
      const width = Math.min(
        SINGLE_CARD_WIDTH + OUTER_PADDING_X * 2,
        screenW - 40,
        MAX_WIDTH
      );
      const height = Math.min(SINGLE_HEIGHT, screenH - 80, MAX_HEIGHT);
      return { width, height };
    }

    // ----- 2–3 TASKS (ALL VISIBLE, NO SCROLL) -----
    const visibleCards = Math.min(taskCount, 3);
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
    (tasks: TaskDetails[], mouseX: number, mouseY: number) => {
      if (!tasks || tasks.length === 0) return;

      // Close any existing popup
      if (externalWindowRef.current && !externalWindowRef.current.closed) {
        externalWindowRef.current.close();
      }

      const { width, height } = getPopupSize(tasks.length);

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

      // Pass popup data
      newWin.__POPUP_DATA__ = {
        tasks,
        expanded: externalExpandedSections,
      };

      newWin.__POPUP_CLOSE__ = () => closeExternalWindow();

      newWin.onload = () => {
        try {
          newWin.__POPUP_DATA__ = {
            tasks,
            expanded: externalExpandedSections,
          };
        } catch {}
      };

      setExternalTasks(tasks);
      setExternalExpandedSections([]);
      setExternalContainer(null); // not used in popup.html mode
    },
    [externalExpandedSections, closeExternalWindow]
  );

  return {
    externalContainer,
    externalTasks,
    externalExpandedSections,
    openExternalWindow,
    closeExternalWindow,
    setExternalExpandedSections,
  };
}
