// =====================================================================
// popup-main.tsx — React entry point for popup.html with full logic
// =====================================================================

import React, { useState, useCallback, useEffect } from "react";
import ReactDOM from "react-dom/client";
import TaskPopoutPanel from "@/features/tasks/components/TaskPopoutPanel";
import { TaskDetails } from "@/types";

declare global {
  interface Window {
    __POPUP_DATA__?: {
      tasks: TaskDetails[];
      expanded: string[];
    };
    __POPUP_CLOSE__?: () => void;
  }
}

function PopupApp() {
  const data = window.__POPUP_DATA__;

  if (!data) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading popup…
      </div>
    );
  }

  const { tasks } = data;

  // ------------------------------
  // Local expand/collapse state
  // ------------------------------
  const [expanded, setExpanded] = useState<string[]>(data.expanded ?? []);
  const [uiScale, setUiScale] = useState(1);

  // Mirror main app compact scaling rules so the popup stays dense on
  // shorter viewports and respects mobile-safe 100vh handling.
  useEffect(() => {
    const applyViewportMetrics = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);

      const height = window.innerHeight;
      const computedScale = Math.max(0.75, Math.min(1, height / 900));
      const roundedScale = Number(computedScale.toFixed(2));
      setUiScale(roundedScale);
      document.documentElement.style.setProperty(
        "--ui-scale",
        String(computedScale)
      );

      const fontSize = Math.max(13, Math.min(16, Math.round(height / 60)));
      document.documentElement.style.fontSize = `${fontSize}px`;
    };

    // Remove default body margin for a flush canvas and align palette
    // with the primary application.
    const previousMargin = document.body.style.margin;
    const previousBg = document.body.style.backgroundColor;
    document.body.style.margin = "0";
    document.body.style.backgroundColor = "#F5F7FA";

    applyViewportMetrics();
    window.addEventListener("resize", applyViewportMetrics);

    return () => {
      window.removeEventListener("resize", applyViewportMetrics);
      document.body.style.margin = previousMargin;
      document.body.style.backgroundColor = previousBg;
    };
  }, []);

  const onToggleSection = useCallback(
    (section: string) => {
      setExpanded((prev) =>
        prev.includes(section)
          ? prev.filter((x) => x !== section)
          : [...prev, section]
      );
    },
    []
  );

  const onExpandAll = useCallback(() => {
    setExpanded([
      "Work Details",
      "Commitments / Customer / Location",
      "Scheduling / Resources",
      "Access Restrictions",
      "Job Notes",
      "Progress Notes",
      "Closure",
    ]);
  }, []);

  const onCollapseAll = useCallback(() => {
    setExpanded([]);
  }, []);

  return (
    <div
      className="min-h-screen w-screen overflow-hidden"
      style={{
        height: `calc(var(--vh, 1vh) * 100 / ${uiScale})`,
        width: `${100 / uiScale}vw`,
        transform: `scale(${uiScale})`,
        transformOrigin: "top left",
      }}
    >
      <TaskPopoutPanel
        open={true}
        tasks={tasks}
        expanded={expanded}
        onToggleSection={onToggleSection}
        onExpandAll={onExpandAll}
        onCollapseAll={onCollapseAll}
        onClose={() => window.__POPUP_CLOSE__?.()}
      />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("popup-root")!).render(<PopupApp />);
