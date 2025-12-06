// ===============================================================
// TaskPopoutPanel.tsx — Dynamic Compare Layout (Card-centred)
// - Single-task: 720px centre card
// - Multi-task: 520px cards, gap-4, px-6 outer padding
// - 3 tasks: one row, centred, no wrap
// - 4+ tasks: horizontal scroll (scrollbar outside cards)
// ===============================================================

import React, { useState, useEffect, useRef } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import TaskDetailsModal, { TaskDetails } from "./TaskDetailsModal";

interface TaskPopoutPanelProps {
  open: boolean;
  tasks: TaskDetails[];
  expanded: string[];
  onToggleSection: (section: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onClose: () => void;
}

export default function TaskPopoutPanel({
  open,
  tasks,
  expanded,
  onToggleSection,
  onExpandAll,
  onCollapseAll,
  onClose,
}: TaskPopoutPanelProps) {
  if (!open) return null;

  // ======================================================
  // ACTIVE PILLS (max 3 in compare mode)
  // ======================================================
  const [activePills, setActivePills] = useState<string[]>([]);

  useEffect(() => {
    if (tasks.length === 1) {
      setActivePills([tasks[0].taskId]);
    } else if (tasks.length >= 3) {
      setActivePills(tasks.slice(0, 3).map((t) => t.taskId));
    } else {
      setActivePills(tasks.map((t) => t.taskId));
    }
  }, [tasks]);

  // ======================================================
  // PILL CLICK HANDLER (max 3 active in compare mode)
  // ======================================================
  const handlePillClick = (taskId: string) => {
    const max = 3;

    if (activePills.includes(taskId)) return;

    setActivePills((prev) => {
      if (prev.length < max) return [...prev, taskId];
      return [taskId];
    });
  };

  // ======================================================
  // SELECT ALL / UNSELECT ALL
  // ======================================================
  const selectAll = () => setActivePills(tasks.map((t) => t.taskId));

  const unselectAll = () =>
    setActivePills(tasks.slice(0, 3).map((t) => t.taskId));

  const allSelected =
    tasks.length > 3 && activePills.length === tasks.length;

  // ======================================================
  // AUTO-SCROLL ACTIVE PILL
  // ======================================================
  const pillRailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const last = activePills[activePills.length - 1];
    if (!last) return;

    const el = pillRailRef.current?.querySelector(
      `[data-pill="${last}"]`
    ) as HTMLElement | null;

    el?.scrollIntoView({ behavior: "smooth", inline: "center" });
  }, [activePills]);

  // ======================================================
  // DETERMINE VISIBLE TASK CARDS
  // ======================================================
  let visibleTasks: TaskDetails[];

  if (tasks.length <= 3) {
    // For 1–3 tasks, just show all
    visibleTasks = tasks;
  } else if (allSelected) {
    visibleTasks = tasks;
  } else {
    visibleTasks = tasks.filter((t) => activePills.includes(t.taskId));
  }

  const singleTaskMode = visibleTasks.length === 1;

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="fixed inset-0 flex bg-black/30 backdrop-blur-sm z-[9999]">
      {/* MAIN SURFACE */}
      <div className="w-screen h-screen flex flex-col overflow-hidden bg-transparent">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Task Details ({tasks.length})
          </h2>

          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                expanded.length > 0 ? onCollapseAll() : onExpandAll()
              }
              className="px-3 py-1.5 bg-gray-900 text-white rounded-md text-sm flex items-center gap-1"
            >
              {expanded.length > 0 ? (
                <>
                  <ChevronUp size={14} /> Collapse All
                </>
              ) : (
                <>
                  <ChevronDown size={14} /> Expand All
                </>
              )}
            </button>

            {allSelected ? (
              <button
                onClick={unselectAll}
                className="px-3 py-1.5 bg-gray-700 text-white rounded-md text-sm"
              >
                Unselect All
              </button>
            ) : (
              <button
                onClick={selectAll}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm"
              >
                Select All
              </button>
            )}
          </div>
        </div>

        {/* PILLS */}
        <div className="px-6 py-2 bg-gray-50 border-b border-gray-200">
          <div
            ref={pillRailRef}
            className="flex flex-nowrap overflow-x-auto scrollbar-thin gap-2 pb-1"
          >
            {tasks.map((task) => {
              const isActive = activePills.includes(task.taskId);
              return (
                <div
                  key={task.taskId}
                  data-pill={task.taskId}
                  onClick={() => handlePillClick(task.taskId)}
                  className={`px-3 py-1.5 rounded-full cursor-pointer text-xs border transition whitespace-nowrap ${
                    isActive
                      ? "bg-blue-500/20 text-blue-700 border-blue-500"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
                  }`}
                >
                  {task.taskId}
                </div>
              );
            })}
          </div>
        </div>

        {/* BODY — scrollbars live on window, not inside cards */}
        <div className="flex-1 px-6 py-6 bg-gray-200/40 overflow-x-auto overflow-y-auto scrollbar-thin">
          <div
            className={`flex gap-4 ${
              singleTaskMode ? "justify-center" : "flex-nowrap"
            }`}
            style={{ paddingBottom: "1rem" }}
          >
            {visibleTasks.map((task) => (
              <div
                key={task.taskId}
                className="bg-white border border-gray-200 rounded-xl shadow-md flex-shrink-0"
                style={{
                  width: singleTaskMode ? 720 : 520,
                }}
              >
                <div className="px-5 pt-4 pb-2 text-[15px] font-semibold text-gray-800">
                  {task.taskId}
                </div>

                <div className="px-4 pb-4">
                  <TaskDetailsModal
                    task={task}
                    expanded={expanded}
                    onToggleSection={onToggleSection}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
