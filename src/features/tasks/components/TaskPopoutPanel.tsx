// ===============================================================
// TaskPopoutPanel.tsx — Dynamic Compare Layout (Card-centred)
// - Single-task: 720px centre card
// - Multi-task: 520px cards, gap-4, px-6 outer padding
// - 3 tasks: one row, centred, no wrap
// - 4+ tasks: horizontal scroll (scrollbar outside cards)
// ===============================================================

import React, { useState, useEffect, useRef } from "react";
import { X, Pin } from "lucide-react";
import TaskDetailsModal, { TaskDetails } from "./TaskDetailsModal";
 
function ProgressNotesEditor({ taskId, taskStatus, onSaved }: { taskId: string; taskStatus?: string; onSaved?: (entry: { ts: string; status: string; text: string }) => void }) {
  const draftKey = `taskProgressNotes:${taskId}:draft`;
  const listKey = `task:${taskId}:progressNotes`;
  const [text, setText] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "saved">("idle");
  const [serverOk, setServerOk] = useState<boolean>(false);

  useEffect(() => {
    fetch("http://localhost:5179/health").then(() => setServerOk(true)).catch(() => setServerOk(false));
    const existing = localStorage.getItem(draftKey);
    if (existing) setText(existing);
    setStatus("idle");
  }, [draftKey]);

  const onSave = () => {
    const tryServer = async () => {
      try {
        const resp = await fetch("http://localhost:5179/progress-notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId, text, taskStatus }),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return true;
      } catch {
        return false;
      }
    };

    (async () => {
      const ts = new Date().toISOString();
      const entry = { ts, status: taskStatus || "", text };
      const savedServer = serverOk ? await tryServer() : false;
      // Persist locally as an append to the entries list
      try {
        const cur = JSON.parse(localStorage.getItem(listKey) || "[]");
        const next = Array.isArray(cur) ? [...cur, entry] : [entry];
        localStorage.setItem(listKey, JSON.stringify(next));
      } catch {
        localStorage.setItem(listKey, JSON.stringify([entry]));
      }
      // Also keep the latest draft text for convenience
      localStorage.setItem(draftKey, text);
      // Update UI immediately
      onSaved?.(entry);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1200);
    })();
  };

  return (
    <div className="space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add progress notes..."
        className="w-full h-20 text-[12px] p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={onSave}
          className="px-2.5 py-1 text-xs rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          Save Notes
        </button>
        {status === "saved" && (
          <span className="text-[11px] text-green-700">Saved</span>
        )}
      </div>
    </div>
  );
}

interface TaskPopoutPanelProps {
  open: boolean;
  tasks: TaskDetails[];
  onClose: () => void;
  initialX?: number;
  initialY?: number;
}

export default function TaskPopoutPanel({
  open,
  tasks,
  onClose,
  initialX = 120,
  initialY = 120,
}: TaskPopoutPanelProps) {

  function ProgressNotesSection({ task }: { task: any }) {
    const [notes, setNotes] = React.useState<any[]>(() => {
      const base = Array.isArray(task?.progressNotes) ? task.progressNotes : [];
      try {
        const lsKey = `task:${task?.taskId}:progressNotes`;
        const fromLs = JSON.parse(localStorage.getItem(lsKey) || "[]");
        if (Array.isArray(fromLs) && fromLs.length) {
          return [...base, ...fromLs];
        }
      } catch {}
      return base;
    });

    React.useEffect(() => {
      const base = Array.isArray(task?.progressNotes) ? task.progressNotes : [];
      try {
        const lsKey = `task:${task?.taskId}:progressNotes`;
        const fromLs = JSON.parse(localStorage.getItem(lsKey) || "[]");
        if (Array.isArray(fromLs) && fromLs.length) {
          setNotes([...base, ...fromLs]);
          return;
        }
      } catch {}
      setNotes(base);
    }, [task]);

    return (
      <div className="space-y-3">
        {notes.length > 0 && (
          <div className="space-y-1">
            <div className="text-[11px] text-gray-500">Saved entries</div>
            <div className="space-y-1 max-h-32 overflow-auto pr-1">
              {notes.slice().reverse().map((entry: any, i: number) => {
                const formatted = (() => {
                  try {
                    return new Date(entry.ts).toLocaleString("en-GB", {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                  } catch {
                    return entry.ts;
                  }
                })();
                return (
                  <div key={i} className="text-[12px] text-gray-700 border border-gray-200 rounded-md p-2">
                    <div className="text-[11px] text-gray-500 flex items-center justify-between">
                      <span>{formatted}</span>
                      <span className="text-gray-600">{entry.status || ""}</span>
                    </div>
                    <div className="whitespace-pre-wrap mt-1">{entry.text}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <ProgressNotesEditor
          taskId={task?.taskId}
          taskStatus={task?.taskStatus}
          onSaved={(entry) => setNotes((prev) => [...prev, entry])}
        />
      </div>
    );
  }
  if (!open) return null;

  // Active tab for single-task panel
  const [activeTab, setActiveTab] = useState<"Overview" | "FieldNotes" | "ProgressNotes">("Overview");

  // Reset tab on task change only when not pinned; must be placed after 'pinned' is declared

  // ======================================================
  // TAB CLICK HANDLER (max 3 active in compare mode)
  // ======================================================
  // No pill click handler in single-task mode

  // ======================================================
  // Note: No select-all/unselect-all in compact mode
  // No select-all in single-task mode

  // ======================================================
  // AUTO-SCROLL ACTIVE PILL
  // ======================================================
  const pillRailRef = useRef<HTMLDivElement>(null);

  // No auto-scroll needed

  // Outside click closes when not pinned
  const rootRef = useRef<HTMLDivElement>(null);

  // ======================================================
  // DETERMINE VISIBLE TASK CARD (single-task inline)
  // ======================================================
  const visibleTasks: TaskDetails[] = tasks && tasks.length ? [tasks[0]] : [];
  const singleTaskMode = true;
  // Draggable position state with pin persistence
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: initialX, y: initialY });
  const [pinned, setPinned] = useState<boolean>(false);
  const draggingRef = useRef(false);
  const dragStartRef = useRef<{ mx: number; my: number; x: number; y: number }>({ mx: 0, my: 0, x: initialX, y: initialY });

  useEffect(() => {
    const stored = localStorage.getItem("taskPopout.pos");
    const storedPin = localStorage.getItem("taskPopout.pinned");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { x: number; y: number };
        setPos(parsed);
      } catch {}
    }
    if (storedPin) setPinned(storedPin === "true");
  }, []);

  // Outside click closes when not pinned (after pinned exists)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (pinned) return;
      const target = e.target as Node;
      if (!rootRef.current.contains(target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick, true);
    return () => document.removeEventListener("mousedown", handleClick, true);
  }, [pinned, onClose]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const dx = e.clientX - dragStartRef.current.mx;
      const dy = e.clientY - dragStartRef.current.my;
      setPos({ x: dragStartRef.current.x + dx, y: dragStartRef.current.y + dy });
    };
    const onUp = () => {
      draggingRef.current = false;
      document.body.style.cursor = "default";
      if (pinned) {
        localStorage.setItem("taskPopout.pos", JSON.stringify(pos));
      }
    };
    window.addEventListener("mousemove", onMove as EventListener);
    window.addEventListener("mouseup", onUp as EventListener);
    return () => {
      window.removeEventListener("mousemove", onMove as EventListener);
      window.removeEventListener("mouseup", onUp as EventListener);
    };
  }, []);

  const onDragStart = (e: React.MouseEvent) => {
    if (pinned) return; // disable drag when pinned
    draggingRef.current = true;
    dragStartRef.current = { mx: e.clientX, my: e.clientY, x: pos.x, y: pos.y };
    document.body.style.cursor = "grabbing";
  };

  // Reset tab on task change only when not pinned
  useEffect(() => {
    if (!pinned) {
      setActiveTab("Overview");
    }
  }, [tasks, pinned]);

  return (
    <div className="fixed z-[9999]" style={{ left: pos.x, top: pos.y, maxWidth: "min(96vw, 600px)" }}>
      {/* MAIN SURFACE */}
      <div ref={rootRef} className="flex flex-col overflow-hidden bg-white rounded-lg border border-gray-200 shadow-none ring-1 ring-gray-200/70" id="task-popout-root">
        {/* HEADER (draggable) */}
        <div
          className="flex items-center justify-between px-3 py-2 bg-gray-800 text-white cursor-move select-none rounded-t-lg"
          onMouseDown={onDragStart}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Tasks: {tasks.length}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${pinned ? "bg-blue-600" : "bg-gray-700"}`}>
              {pinned ? "Pinned" : "Draggable"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = !pinned;
                setPinned(next);
                localStorage.setItem("taskPopout.pinned", String(next));
                if (next) localStorage.setItem("taskPopout.pos", JSON.stringify(pos));
              }}
              className="px-2 py-1 bg-white/15 text-white rounded-md text-xs flex items-center gap-1"
            >
              <Pin size={14} /> {pinned ? "Unpin" : "Pin"}
            </button>
            <button
              onClick={onClose}
              className="px-2 py-1 bg-white/15 text-white rounded-md text-xs flex items-center gap-1"
            >
              <X size={14} /> Close
            </button>
          </div>
        </div>

        {/* COMPACT HEADER SUMMARY + TABS */}
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {visibleTasks[0] && (
                <div className="flex flex-col min-w-0">
                  <div className="text-sm font-semibold text-gray-800 truncate">{(visibleTasks[0] as any).title ?? visibleTasks[0].taskId}</div>
                  <div className="text-xs text-gray-600 truncate">
                    {(visibleTasks[0] as any).location ?? (visibleTasks[0] as any).postCode ?? ""}
                    {" · "}
                    {(visibleTasks[0] as any).primarySkill ?? (visibleTasks[0] as any).taskType ?? ""}
                    {" · "}
                    {(visibleTasks[0] as any).status ?? (visibleTasks[0] as any).responseCode ?? ""}
                  </div>
                </div>
              )}
            </div>
            <div className="hidden" />
          </div>
          {/* Section tabs */}
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {[
              { key: "Overview", label: "Overview" },
              { key: "FieldNotes", label: "Field Notes" },
              { key: "ProgressNotes", label: "Progress Notes" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-2.5 py-1 rounded-md border ${
                  activeTab === tab.key ? "bg-gray-200 border-gray-300" : "bg-white border-gray-300 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* BODY — scrollbars live on window, not inside cards */}
        <div className="flex-1 px-2.5 py-2.5 bg-gray-100 overflow-x-auto overflow-y-auto scrollbar-thin">
          <div
            className={`flex gap-4 ${
              singleTaskMode ? "justify-center" : "flex-nowrap"
            }`}
            style={{ paddingBottom: "1rem" }}
          >
            {visibleTasks.map((task) => (
              <div
                key={task.taskId}
                className="bg-white border border-gray-200 rounded-md shadow-none flex-shrink-0"
                style={{
                  width: singleTaskMode ? "min(92vw,480px)" : "min(92vw,360px)",
                }}
              >
                <div className="px-2.5 pb-2.5 pt-2">
                  {activeTab === "Overview" && (
                    <div className="text-[12px] text-gray-700 space-y-0.5">
                      <div className="font-medium text-gray-900">{(task as any).title ?? task.taskId}</div>
                      <div className="text-[11px] text-gray-500">Task ID: {task.taskId}</div>
                      {(task as any).location && <div><span className="text-gray-500">Location:</span> {(task as any).location}</div>}
                      {(task as any).postCode && <div><span className="text-gray-500">Postcode:</span> {(task as any).postCode}</div>}
                      {(task as any).primarySkill && <div><span className="text-gray-500">Skill:</span> {(task as any).primarySkill}</div>}
                      {(task as any).taskType && <div><span className="text-gray-500">Type:</span> {(task as any).taskType}</div>}
                      {(task as any).status && <div><span className="text-gray-500">Status:</span> {(task as any).status}</div>}
                      {(task as any).responseCode && <div><span className="text-gray-500">Response:</span> {(task as any).responseCode}</div>}
                    </div>
                  )}
                  {activeTab === "FieldNotes" && (
                    <div className="text-[12px] text-gray-700 space-y-1 max-h-72 overflow-y-auto pr-1">
                      {(task as any).fieldNotes ? (
                        <div className="whitespace-pre-wrap">{(task as any).fieldNotes}</div>
                      ) : (
                        <div className="text-gray-500">No field notes available.</div>
                      )}
                    </div>
                  )}
                  {activeTab === "ProgressNotes" && (
                    <ProgressNotesSection task={task} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
