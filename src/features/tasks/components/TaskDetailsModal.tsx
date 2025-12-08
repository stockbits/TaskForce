// ===============================================
// TaskDetailsModal.tsx — CARD VERSION (RESTORED)
// ===============================================

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, User, Truck, ThumbsUp, Play, Wrench, Check } from "lucide-react";
import type { TaskDetails, ProgressNoteEntry } from "@/types";

export interface TaskDetailsModalProps {
  task: TaskDetails;
  expanded: string[];
  onToggleSection: (section: string) => void;
}

const statusStyles: Record<string, { icon: React.ReactNode; bg: string; text: string }> = {
  Assigned: { icon: <User size={14} />, bg: "bg-blue-100", text: "text-blue-700" },
  Dispatched: { icon: <Truck size={14} />, bg: "bg-orange-100", text: "text-orange-700" },
  Accepted: { icon: <ThumbsUp size={14} />, bg: "bg-amber-100", text: "text-amber-700" },
  "In Progress": { icon: <Play size={14} />, bg: "bg-purple-100", text: "text-purple-700" },
  Incomplete: { icon: <Wrench size={14} />, bg: "bg-green-100", text: "text-green-700" },
  Complete: { icon: <Check size={14} />, bg: "bg-emerald-100", text: "text-emerald-700" },
};

const isBrowser = typeof window !== "undefined";

const storageKeyForNotes = (taskId: string) => `task:${taskId}:progressNotes`;
const draftKeyForNotes = (taskId: string) => `taskProgressNotes:${taskId}:draft`;

const normalizeProgressNotes = (value: unknown): ProgressNoteEntry[] => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (!entry) return null;
        const text = typeof (entry as any).text === "string" ? (entry as any).text.trim() : "";
        if (!text) return null;
        const tsSource = (entry as any).ts;
        const ts = typeof tsSource === "string" && tsSource ? tsSource : new Date().toISOString();
        return {
          ts,
          status: typeof (entry as any).status === "string" ? (entry as any).status : "",
          text,
          source: typeof (entry as any).source === "string" ? (entry as any).source : undefined,
        } as ProgressNoteEntry;
      })
      .filter((entry): entry is ProgressNoteEntry => Boolean(entry));
  }

  if (typeof value === "string" && value.trim()) {
    return [
      {
        ts: new Date().toISOString(),
        status: "",
        text: value.trim(),
        source: "Imported",
      },
    ];
  }

  return [];
};

const mergeNotes = (base: ProgressNoteEntry[], extras: ProgressNoteEntry[]) => {
  const map = new Map<string, ProgressNoteEntry>();
  [...base, ...extras].forEach((entry) => {
    if (!entry?.text?.trim()) return;
    const key = `${entry.ts}-${entry.text}`;
    map.set(key, entry);
  });
  return Array.from(map.values()).sort((a, b) => {
    const aTime = new Date(a.ts).getTime();
    const bTime = new Date(b.ts).getTime();
    return bTime - aTime;
  });
};

const loadLocalNotes = (taskId: string): ProgressNoteEntry[] => {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(storageKeyForNotes(taskId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return normalizeProgressNotes(parsed);
  } catch (err) {
    console.warn("Failed to read local progress notes", err);
    return [];
  }
};

const persistLocalNotes = (taskId: string, notes: ProgressNoteEntry[]) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(storageKeyForNotes(taskId), JSON.stringify(notes));
  } catch (err) {
    console.warn("Unable to persist progress notes", err);
  }
};

interface ProgressNotesEditorProps {
  taskId: string;
  taskStatus?: string;
  onAdd: (entry: ProgressNoteEntry) => void;
}

function ProgressNotesEditor({ taskId, taskStatus, onAdd }: ProgressNotesEditorProps) {
  const draftKey = draftKeyForNotes(taskId);
  const [text, setText] = useState<string>(() => {
    if (!isBrowser) return "";
    try {
      return window.localStorage.getItem(draftKey) || "";
    } catch {
      return "";
    }
  });
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serverReachable, setServerReachable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isBrowser) return;
    let mounted = true;
    fetch("http://localhost:5179/health")
      .then(() => mounted && setServerReachable(true))
      .catch(() => mounted && setServerReachable(false));
    return () => {
      mounted = false;
    };
  }, [taskId]);

  useEffect(() => {
    if (!isBrowser || !statusMessage) return;
    const timeout = window.setTimeout(() => setStatusMessage(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [statusMessage]);

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const entry: ProgressNoteEntry = {
      ts: new Date().toISOString(),
      status: taskStatus || "",
      text: trimmed,
      source: "Agent",
    };

    setSaving(true);
    setError(null);
    onAdd(entry);

    try {
      const resp = await fetch("http://localhost:5179/progress-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, text: trimmed, taskStatus }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setStatusMessage("Saved & synced");
    } catch (err: any) {
      console.warn("Progress notes sync failed", err);
      setStatusMessage("Saved locally (offline)");
      setError(serverReachable === false ? null : err?.message || "Sync failed");
    } finally {
      setSaving(false);
      setText("");
      if (isBrowser) {
        try {
          window.localStorage.removeItem(draftKey);
        } catch {
          /* ignore */
        }
      }
    }
  };

  const handleChange = (value: string) => {
    setText(value);
    if (!isBrowser) return;
    try {
      if (value.trim()) {
        window.localStorage.setItem(draftKey, value);
      } else {
        window.localStorage.removeItem(draftKey);
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
        Add Progress Note
      </label>
      <textarea
        value={text}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="Summarise field actions, blockers, or next steps…"
        className="w-full h-24 text-sm p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
      />
      <div className="flex items-center gap-3 text-xs">
        <button
          type="button"
          onClick={handleSave}
          disabled={!text.trim() || saving}
          className={`px-3 py-1.5 rounded-md text-white flex items-center gap-2 ${
            text.trim() && !saving
              ? "bg-[#0A4A7A] hover:bg-[#083B61]"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          {saving ? "Saving…" : "Save Note"}
        </button>
        {statusMessage && (
          <span className="text-green-700">{statusMessage}</span>
        )}
        {error && !statusMessage && (
          <span className="text-red-600">{error}</span>
        )}
        {serverReachable === false && (
          <span className="text-gray-500">Offline mode</span>
        )}
      </div>
    </div>
  );
}

const FieldNotesView = ({ text }: { text?: string }) => {
  if (!text || !text.trim()) {
    return <p className="text-sm text-gray-500">No field notes recorded.</p>;
  }
  return (
    <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
      {text}
    </div>
  );
};

const ProgressNotesList = ({ notes }: { notes: ProgressNoteEntry[] }) => {
  if (!notes.length) {
    return <p className="text-sm text-gray-500">No progress notes captured yet.</p>;
  }

  return (
    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
      {notes.map((note, index) => {
        const style = note.status && statusStyles[note.status]
          ? statusStyles[note.status]
          : { icon: <User size={14} />, bg: "bg-gray-200", text: "text-gray-700" };

        const formatted = (() => {
          try {
            return new Date(note.ts).toLocaleString("en-GB", {
              year: "numeric",
              month: "short",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            });
          } catch {
            return note.ts;
          }
        })();

        return (
          <div
            key={`${note.ts}-${index}`}
            className="border border-gray-200 rounded-md bg-white p-3 text-sm text-gray-700 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3 text-xs text-gray-600">
              <span className="font-medium text-gray-800">{formatted}</span>
              <span className={`px-2 py-0.5 rounded flex items-center gap-1 ${style.bg} ${style.text}`}>
                {style.icon}
                {note.status || "Logged"}
              </span>
            </div>
            {note.source && (
              <div className="mt-1 text-[11px] text-gray-500 uppercase tracking-wide">
                Source: {note.source}
              </div>
            )}
            <div className="whitespace-pre-wrap mt-2 text-sm">{note.text}</div>
          </div>
        );
      })}
    </div>
  );
};

export default function TaskDetailsModal({
  task,
  expanded,
  onToggleSection,
}: TaskDetailsModalProps) {
  const baseProgressNotes = useMemo(() => normalizeProgressNotes(task.progressNotes), [task]);
  const [customNotes, setCustomNotes] = useState<ProgressNoteEntry[]>([]);

  useEffect(() => {
    setCustomNotes(loadLocalNotes(task.taskId));
  }, [task.taskId]);

  const allNotes = useMemo(
    () => mergeNotes(baseProgressNotes, customNotes),
    [baseProgressNotes, customNotes]
  );

  const handleAddNote = useCallback(
    (entry: ProgressNoteEntry) => {
      setCustomNotes((prev) => {
        const next = [...prev, entry];
        persistLocalNotes(task.taskId, next);
        return next;
      });
    },
    [task.taskId]
  );

  const sections = [
    {
      name: "Work Details",
      content: (
        <div className="grid grid-cols-2 gap-y-1 text-sm">
          <p>
            <b>Task ID:</b> {task.taskId}
          </p>
          <p>
            <b>Type:</b> {task.taskType}
          </p>
          <p>
            <b>Primary Skill:</b> {task.primarySkill}
          </p>
          <p>
            <b>Description:</b> {task.description}
          </p>
          <p>
            <b>Importance Score:</b> {task.importanceScore}
          </p>
          <p>
            <b>MSC:</b> {task.msc}
          </p>
          <p>
            <b>Category:</b> {task.category}
          </p>
        </div>
      ),
    },
    {
      name: "Commitments / Customer / Location",
      content: (
        <div className="grid grid-cols-2 gap-y-1 text-sm">
          <p>
            <b>Commitment Type:</b> {task.commitmentType}
          </p>
          <p>
            <b>Commitment Date:</b> {task.commitmentDate}
          </p>
          <p>
            <b>Appointment Start:</b> {task.appointmentStartDate}
          </p>
          <p>
            <b>Customer Address:</b> {task.customerAddress || "—"}
          </p>
          <p>
            <b>Postcode:</b> {task.postCode || "—"}
          </p>
        </div>
      ),
    },
    {
      name: "Scheduling / Resources",
      content: (
        <div className="grid grid-cols-2 gap-y-1 text-sm">
          <p>
            <b>Employee ID:</b> {task.employeeId || "—"}
          </p>
          <p>
            <b>Resource Name:</b> {task.resourceName || "—"}
          </p>
          <p>
            <b>Estimated Duration:</b> {task.estimatedDuration || "—"}
          </p>
          <p>
            <b>Domain:</b> {task.domain || "—"}
          </p>
        </div>
      ),
    },
    {
      name: "Access Restrictions",
      content: <p className="text-sm">No access restrictions detected.</p>,
    },
    {
      name: "Job Notes",
      content: <FieldNotesView text={task.fieldNotes} />,
    },
    {
      name: "Progress Notes",
      content: (
        <div className="space-y-4">
          <ProgressNotesEditor
            taskId={task.taskId}
            taskStatus={task.taskStatus}
            onAdd={handleAddNote}
          />
          <ProgressNotesList notes={allNotes} />
        </div>
      ),
    },
    {
      name: "Closure",
      content: (
        <div className="grid grid-cols-2 gap-y-1 text-sm">
          <p>
            <b>Last Progression:</b> {task.lastProgression || "—"}
          </p>
          <p>
            <b>Expected Finish:</b> {task.expectedFinishDate || "—"}
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="p-1">
      <div className="space-y-3">
        {sections.map((section) => {
          const open = expanded.includes(section.name);

          return (
            <div
              key={section.name}
              className={`border border-gray-200 rounded-lg transition-all ${
                open ? "shadow-md" : "shadow-sm"
              }`}
            >
              {/* Section Header */}
              <button
                onClick={() => onToggleSection(section.name)}
                className="w-full flex justify-between items-center px-4 py-3 font-medium text-gray-900 hover:bg-gray-100"
              >
                {section.name}
                {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {/* Section Content */}
              {open && (
                <div className="px-4 py-3 bg-gray-50 text-sm">
                  {section.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
