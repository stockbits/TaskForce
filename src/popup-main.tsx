// =====================================================================
// popup-main.tsx — React entry point for popup.html with full logic
// =====================================================================

import React, { useState, useCallback } from "react";
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
      "Notes",
      "Progress Notes",
      "Closure",
    ]);
  }, []);

  const onCollapseAll = useCallback(() => {
    setExpanded([]);
  }, []);

  return (
    <TaskPopoutPanel
      open={true}
      tasks={tasks}
      onClose={() => window.__POPUP_CLOSE__?.()}
    />
  );
}

ReactDOM.createRoot(document.getElementById("popup-root")!).render(<PopupApp />);
