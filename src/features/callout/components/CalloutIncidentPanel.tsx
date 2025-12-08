import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  AlertTriangle,
  ClipboardList,
  Clock,
  Loader2,
  Copy,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { type CalloutHistoryEntry } from "@/lib/hooks/useCalloutHistory";

/* -------------------------------------------------------
   CALLOUT OUTCOME MODEL
------------------------------------------------------- */

export type CalloutOutcome =
  | "AssignDispatchedAWI"
  | "CalloutDispatchedAWI"
  | "PendingACT"
  | "Disturbance"
  | "NoReply"
  | "Refusal"
  | "Unavailable";

export const CalloutOutcomeConfig: Record<
  CalloutOutcome,
  { label: string; requiresAvailabilityTime?: boolean }
> = {
  AssignDispatchedAWI: { label: "Assignment → Dispatched (AWI)" },
  CalloutDispatchedAWI: { label: "Callout → Dispatched (AWI)" },
  PendingACT: { label: "Pending Callout → Assigned (ACT)" },
  Disturbance: { label: "Disturbance" },
  NoReply: { label: "No Reply" },
  Refusal: { label: "Refusal" },
  Unavailable: { label: "Unavailable", requiresAvailabilityTime: true },
};

const AVAILABLE_CALLOUT_OUTCOMES: CalloutOutcome[] = (
  Object.keys(CalloutOutcomeConfig) as CalloutOutcome[]
).filter((key) => key !== "AssignDispatchedAWI");

/* -------------------------------------------------------
   TYPES
------------------------------------------------------- */

export interface ResourceHistoryEntry {
  previousOutcome: string | null;
  previousAvailableAgainAt: string | null;
  changedAt: string; // ISO timestamp
  taskIdUsed: string | number | null;
  outcomeApplied: CalloutOutcome;
  availableAgainAt?: string | null;
}

export interface ResourceRecord {
  resourceId: string;
  name: string;
  calloutGroup?: string; // <-- REQUIRED FIX
  status?: string | null;
  lastOutcome?: CalloutOutcome | string | null;
  availableAgainAt?: string | null;
  contactNumber?: string;
  notes?: string;
  history?: ResourceHistoryEntry[];
}

interface CalloutIncidentPanelProps {
  open: boolean;
  task: Record<string, any> | null;
  resources: ResourceRecord[];
  onClose: () => void;
  history: CalloutHistoryEntry[];
  historyLoading?: boolean;
  historyError?: string | null;
  onRefreshHistory?: () => Promise<void> | void;

  onSaveRow?: (payload: {
    taskId: string | number | null;
    resourceId: string;
    outcome: CalloutOutcome;
    availableAgainAt?: string;
  }) => Promise<void> | void;
}

/* -------------------------------------------------------
   HELPERS
------------------------------------------------------- */

// UK format dd/mm/yyyy HH:MM
function formatUkDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

function getLastChangeTime(resource: ResourceRecord): number | null {
  if (!resource.history || resource.history.length === 0) return null;
  const last = resource.history[resource.history.length - 1];
  const t = Date.parse(last.changedAt);
  return Number.isNaN(t) ? null : t;
}

/* -------------------------------------------------------
   COMPONENT
------------------------------------------------------- */

export const CalloutIncidentPanel: React.FC<CalloutIncidentPanelProps> = ({
  open,
  task,
  resources,
  onClose,
  history,
  historyLoading = false,
  historyError = null,
  onRefreshHistory,
  onSaveRow,
}) => {
  const taskId =
    task?.TaskID ?? task?.taskId ?? task?.id ?? task?.TaskId ?? null;
  const workId =
    task?.workId ?? task?.WorkID ?? task?.WorkId ?? task?.workID ?? null;

  /* ------------------------------------------------------------------
     STATE
  ------------------------------------------------------------------ */

  // ❗ORDER FROZEN FOR SESSION (no reordering while panel is open)
  const [orderedResourceIds, setOrderedResourceIds] = useState<string[]>([]);

  // Per-row draft (outcome & unavailable time)
  const [rowDrafts, setRowDrafts] = useState<
    Record<
      string,
      {
        outcome: CalloutOutcome | "";
        availableAgainAt: string;
        saving?: boolean;
      }
    >
  >({});

  // Which rows have been saved (row locking + green highlight)
  const [rowSaved, setRowSaved] = useState<Record<string, boolean>>({});

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [historyFilter, setHistoryFilter] = useState<string>("ALL");

  /* ------------------------------------------------------------------
     INITIALISE ON OPEN
     - First load generates the ordering and freezes it.
     - ❗PARENT UPDATES DO NOT RESORT during session.
  ------------------------------------------------------------------ */

  useEffect(() => {
    if (!open) return;

    // Sort ONCE when panel opens
    const sorted = [...resources].sort((a, b) => {
      const aTime = getLastChangeTime(a);
      const bTime = getLastChangeTime(b);

      if (aTime === null && bTime === null) {
        return a.resourceId.localeCompare(b.resourceId);
      }
      if (aTime === null) return -1;
      if (bTime === null) return 1;
      return aTime - bTime;
    });

    setOrderedResourceIds(sorted.map((r) => r.resourceId));

    const init: Record<
      string,
      { outcome: CalloutOutcome | ""; availableAgainAt: string }
    > = {};

    for (const r of sorted) {
      init[r.resourceId] = {
        outcome: "",
        availableAgainAt: "",
      };
    }

    setRowDrafts(init);
    setRowSaved({});

    // ❗IMPORTANT: NO dependency on "resources" to avoid reordering mid-session
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setHistoryFilter("ALL");
    if (onRefreshHistory) {
      Promise.resolve(onRefreshHistory()).catch(() => {
        /* handled upstream */
      });
    }
  }, [open, onRefreshHistory]);

  /* ------------------------------------------------------------------
     TOAST HANDLER
  ------------------------------------------------------------------ */

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 2200);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const showToast = (m: string) => setToastMsg(m);

  /* ------------------------------------------------------------------
     HANDLERS
  ------------------------------------------------------------------ */

  const handleCopyId = async (resourceId: string) => {
    try {
      await navigator.clipboard.writeText(resourceId);
      showToast(`Copied ${resourceId}`);
    } catch {
      showToast("Unable to copy");
    }
  };

  const handleDraftChange = (
    resourceId: string,
    changes: Partial<{ outcome: CalloutOutcome | ""; availableAgainAt: string }>
  ) => {
    setRowDrafts((prev) => ({
      ...prev,
      [resourceId]: {
        outcome: prev[resourceId]?.outcome ?? "",
        availableAgainAt: prev[resourceId]?.availableAgainAt ?? "",
        ...changes,
      },
    }));
  };

  const handleRowSave = async (resourceId: string) => {
    if (!onSaveRow) return;

    const draft = rowDrafts[resourceId];
    const outcomeValue = (draft?.outcome || "") as CalloutOutcome | "";

    if (!outcomeValue) {
      showToast("Select an outcome first");
      return;
    }

    if (
      outcomeValue === "Unavailable" &&
      (!draft?.availableAgainAt || draft.availableAgainAt.trim() === "")
    ) {
      showToast("Set return time");
      return;
    }

    const payload = {
      taskId,
      resourceId,
      outcome: outcomeValue as CalloutOutcome,
      availableAgainAt:
        outcomeValue === "Unavailable"
          ? draft?.availableAgainAt
          : undefined,
    };

    try {
      // Show spinner
      setRowDrafts((prev) => ({
        ...prev,
        [resourceId]: { ...prev[resourceId], saving: true },
      }));

      await onSaveRow(payload);

      /* --------------------------------------------------------
         LOCAL PATCH HISTORY
         - Updates the “Last Outcome” column immediately
         - Does NOT trigger reorder
      -------------------------------------------------------- */
      const res = resources.find((r) => r.resourceId === resourceId);
      if (res) {
        const now = new Date().toISOString();
        const availabilityTs =
          payload.outcome === "Unavailable"
            ? payload.availableAgainAt ?? null
            : null;

        res.history = [
          ...(res.history ?? []),
          {
            previousOutcome: res.lastOutcome ?? null,
            previousAvailableAgainAt: res.availableAgainAt ?? null,
            changedAt: now,
            taskIdUsed: taskId,
            outcomeApplied: payload.outcome,
            availableAgainAt: availabilityTs,
          },
        ];

        res.lastOutcome = payload.outcome;
        res.availableAgainAt =
          payload.outcome === "Unavailable"
            ? payload.availableAgainAt ?? null
            : null;
      }

      setRowSaved((prev) => ({ ...prev, [resourceId]: true }));
      const label = CalloutOutcomeConfig[payload.outcome].label;
      showToast(`Saved ${label}`);

      if (onRefreshHistory) {
        Promise.resolve(onRefreshHistory()).catch(() => {
          /* ignore */
        });
      }
    } catch (err) {
      console.error("save error", err);
      showToast("Error saving");
    } finally {
      // Remove spinner
      setRowDrafts((prev) => ({
        ...prev,
        [resourceId]: { ...prev[resourceId], saving: false },
      }));
    }
  };
  /* -----------------------------------------------------
     RENDER HELPERS
  ----------------------------------------------------- */

  const renderLastOutcomeCell = (resource: ResourceRecord) => {
    let label: string | null = null;
    let timestamp: string | null = null;
    let isReturnTime = false;

    if (resource.history && resource.history.length > 0) {
      const last = resource.history[resource.history.length - 1];
      label =
        CalloutOutcomeConfig[last.outcomeApplied]?.label ??
        last.outcomeApplied ??
        null;
      if (
        last.outcomeApplied === "Unavailable" &&
        last.availableAgainAt &&
        last.availableAgainAt.trim()
      ) {
        timestamp = last.availableAgainAt;
        isReturnTime = true;
      } else {
        timestamp = last.changedAt;
      }
    } else if (resource.lastOutcome) {
      const k = resource.lastOutcome as CalloutOutcome;
      label =
        CalloutOutcomeConfig[k]?.label ?? String(resource.lastOutcome ?? "");
      if (
        resource.lastOutcome === "Unavailable" &&
        resource.availableAgainAt &&
        resource.availableAgainAt.trim()
      ) {
        timestamp = resource.availableAgainAt;
        isReturnTime = true;
      } else {
        timestamp = null;
      }
    }

    if (!label && !timestamp)
      return (
        <span className="text-[11px] text-gray-400 italic">No history</span>
      );

    return (
      <div className="flex flex-col text-[11px] text-gray-800 leading-tight">
        {label && <span className="font-medium">{label}</span>}
        {timestamp && (
          <span className="text-gray-500">
            {isReturnTime ? "Return:" : "Updated:"} {formatUkDateTime(timestamp)}
          </span>
        )}
      </div>
    );
  };

  const overlayRef = useRef<HTMLDivElement | null>(null);

  const handleOverlayMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === overlayRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  const panelResourceIds = useMemo(() => {
    return new Set(resources.map((r) => r.resourceId));
  }, [resources]);

  const filteredHistory = useMemo(() => {
    if (!history || history.length === 0) return [] as CalloutHistoryEntry[];
    const taskMatch = taskId != null ? String(taskId) : null;
    const workMatch = workId != null ? String(workId) : null;

    const entries = history.filter((entry) => {
      const entryTask = entry.taskId != null ? String(entry.taskId) : null;
      const entryWork = entry.workId != null ? String(entry.workId) : null;

      let matchesScope = false;
      if (workMatch && entryWork) {
        matchesScope = entryWork === workMatch;
      } else if (taskMatch && entryTask) {
        matchesScope = entryTask === taskMatch;
      } else {
        matchesScope = panelResourceIds.has(entry.resourceId);
      }

      if (!matchesScope) return false;
      if (historyFilter !== "ALL" && entry.resourceId !== historyFilter) {
        return false;
      }
      return true;
    });

    return entries.slice(0, 30);
  }, [history, historyFilter, panelResourceIds, taskId, workId]);

  const historyResourceOptions = useMemo(() => {
    return Array.from(panelResourceIds.values()).sort();
  }, [panelResourceIds]);

  const formatHistoryOutcomeLabel = useCallback(
    (outcome: CalloutOutcome | string): string => {
      if (
        outcome &&
        typeof outcome === "string" &&
        outcome in CalloutOutcomeConfig
      ) {
        return CalloutOutcomeConfig[outcome as CalloutOutcome].label;
      }
      return String(outcome ?? "");
    },
    []
  );

  const handleViewProgress = useCallback(
    (entry: CalloutHistoryEntry) => {
      if (typeof window === "undefined") return;
      const detail = {
        taskId:
          entry.taskId != null
            ? String(entry.taskId)
            : taskId != null
            ? String(taskId)
            : null,
        workId:
          entry.workId != null
            ? String(entry.workId)
            : workId != null
            ? String(workId)
            : null,
        resourceId: entry.resourceId,
      };

      window.dispatchEvent(
        new CustomEvent("taskforce:view-progress-notes", { detail })
      );
      onClose();
    },
    [onClose, taskId, workId]
  );

  /* -----------------------------------------------------
     JSX
  ----------------------------------------------------- */

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={overlayRef}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/55 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={handleOverlayMouseDown}
        >
          {/* PANEL */}
          <motion.div
            className="relative 
                       w-[min(1420px,100%-40px)]   /* wider */
                       max-h-[96vh] 
                       rounded-2xl bg-white 
                       shadow-2xl border border-gray-200 
                       flex flex-col overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 24 }}
            transition={{ duration: 0.18 }}
          >
            {/* HEADER */}
            <div className="flex items-center justify-between px-7 py-4 border-b border-[#0A4A7A]/10 bg-gradient-to-r from-[#0A4A7A]/12 via-[#0C5A97]/10 to-[#1280BF]/8 relative">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 flex items-center justify-center rounded-full bg-[#0A4A7A] text-white shadow-sm">
                  <AlertTriangle size={18} />
                </div>

                <div className="flex flex-col">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {taskId
                      ? `Callout Workflow — ${taskId}`
                      : "Callout Workflow"}
                  </h2>

                  <p className="text-xs text-gray-600">
                    Set outcomes. After saving a row, it locks and stays in
                    position until panel is closed.
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-full text-gray-500 hover:bg-[#0A4A7A]/10"
              >
                <X size={18} />
              </button>

              {/* TOAST (Y-aligned with X) */}
              {toastMsg && (
                <div className="absolute right-16 top-1/2 -translate-y-1/2 z-[10100]">
                  <div className="rounded-lg bg-gray-900 text-white text-xs px-3 py-2 shadow-lg max-w-xs">
                    {toastMsg}
                  </div>
                </div>
              )}
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-auto px-7 py-4 space-y-4">
              {/* INFO BOX */}
              <div className="text-xs text-[#0A4A7A] border border-[#0A4A7A]/20 bg-[#0A4A7A]/10 rounded-lg px-3 py-2 flex items-start gap-2">
                <ClipboardList size={14} className="mt-[2px] text-[#0A4A7A]" />
                <p>
                  Choose an <b>Outcome</b> for each tech. If selecting{" "}
                  <b>Unavailable</b>, set a return time. Press <b>Save</b> to
                  lock the row. Ordering is frozen until the panel closes.
                </p>
              </div>

              <div className="flex flex-col xl:flex-row gap-4">
                {/* RESOURCE TABLE */}
                <div className="flex-1 min-w-0 border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-[#0A4A7A]/5 px-4 py-2 border-b border-[#0A4A7A]/15 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800">
                      Callout Resource List
                    </span>
                    <span className="text-xs text-gray-500">
                      {resources.length} resources
                    </span>
                  </div>

                  <div className="max-h-[68vh] overflow-auto">
                    <table className="w-full text-xs text-left text-gray-800 border-separate border-spacing-0">
                      <thead>
                        <tr className="bg-white text-gray-900 border-b border-[#0A4A7A]/10">
                          <th className="px-4 py-2 w-[150px]">Tech ID</th>
                          <th className="px-4 py-2 w-[260px]">Outcome</th>
                          <th className="px-4 py-2 w-[260px]">
                            Unavailable Until
                          </th>
                          <th className="px-4 py-2 w-[220px]">Last Outcome</th>
                          <th className="px-4 py-2 w-[120px] text-center">
                            Save
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {orderedResourceIds.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-6 text-center text-gray-500"
                            >
                              No resources loaded.
                            </td>
                          </tr>
                        ) : (
                          orderedResourceIds.map((id) => {
                            const resource =
                              resources.find((r) => r.resourceId === id) ??
                              ({
                                resourceId: id,
                                name: "",
                              } as ResourceRecord);

                            const draft = rowDrafts[id] || {
                              outcome: "",
                              availableAgainAt: "",
                            };

                            const saving = !!draft.saving;
                            const hasSaved = !!rowSaved[id];
                            const rowLocked = hasSaved;

                            const requiresUnavailable =
                              draft.outcome === "Unavailable";

                            const saveDisabled =
                              rowLocked ||
                              !draft.outcome ||
                              (requiresUnavailable &&
                                (!draft.availableAgainAt ||
                                  draft.availableAgainAt.trim() === ""));

                            return (
                              <tr
                                key={id}
                                className={`border-b border-gray-100 last:border-b-0
                                  ${rowLocked ? "bg-green-50" : ""}
                                `}
                              >
                                {/* TECH ID / NAME */}
                                <td className="px-4 py-2 align-top">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-semibold text-gray-900">
                                        {resource.resourceId}
                                      </div>
                                      <div className="text-[11px] text-gray-500">
                                        {resource.name}
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleCopyId(resource.resourceId)
                                      }
                                      className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-[#0A4A7A]/30 text-[#0A4A7A] hover:bg-[#0A4A7A]/10"
                                    >
                                      <Copy size={11} />
                                      ID
                                    </button>
                                  </div>
                                </td>

                                {/* OUTCOME SELECT */}
                                <td className="px-4 py-2 align-top">
                                  <select
                                    className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs bg-white
                                    focus:outline-none focus:ring-1 focus:ring-[#0A4A7A] disabled:bg-gray-100 disabled:text-gray-400"
                                    disabled={rowLocked}
                                    value={draft.outcome || ""}
                                    onChange={(e) =>
                                      handleDraftChange(resource.resourceId, {
                                        outcome: e.target.value as CalloutOutcome,
                                      })
                                    }
                                  >
                                    <option value="">Select outcome…</option>
                                    {AVAILABLE_CALLOUT_OUTCOMES.map((key) => (
                                      <option key={key} value={key}>
                                        {CalloutOutcomeConfig[key].label}
                                      </option>
                                    ))}
                                  </select>
                                </td>

                                {/* UNAVAILABLE UNTIL */}
                                <td className="px-4 py-2 align-top">
                                  <div className="flex items-center gap-2">
                                    <Clock
                                      size={14}
                                      className={
                                        requiresUnavailable && !rowLocked
                                          ? "text-[#0A4A7A]"
                                          : "text-gray-400"
                                      }
                                    />
                                    <input
                                      type="datetime-local"
                                      className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs 
                                      focus:outline-none focus:ring-1 focus:ring-[#0A4A7A] 
                                      disabled:bg-gray-100 disabled:text-gray-400"
                                      disabled={!requiresUnavailable || rowLocked}
                                      value={draft.availableAgainAt || ""}
                                      onChange={(e) =>
                                        handleDraftChange(resource.resourceId, {
                                          availableAgainAt: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                  {requiresUnavailable &&
                                    (!draft.availableAgainAt ||
                                      draft.availableAgainAt.trim() === "") && (
                                      <p className="text-[10px] text-red-500 mt-1">
                                        Set return time when unavailable.
                                      </p>
                                    )}
                                </td>

                                {/* LAST OUTCOME */}
                                <td className="px-4 py-2 align-top">
                                  {renderLastOutcomeCell(resource)}
                                </td>

                                {/* SAVE BUTTON */}
                                <td className="px-4 py-2 align-top text-center">
                                  <button
                                    type="button"
                                    disabled={saveDisabled || saving}
                                    onClick={() =>
                                      handleRowSave(resource.resourceId)
                                    }
                                    className={`
                                    inline-flex items-center justify-center gap-1 
                                    text-[11px] px-3 py-1.5 rounded-md border  
                                    ${
                                      rowLocked
                                        ? "border-green-600 bg-green-50 text-green-700"
                                        : "border-[#0A4A7A] text-[#0A4A7A] hover:bg-[#0A4A7A]/10"
                                    }
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                  `}
                                  >
                                    {saving && (
                                      <Loader2
                                        size={12}
                                        className="animate-spin"
                                      />
                                    )}
                                    {rowLocked ? "Saved" : "Save"}
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* HISTORY SIDEBAR */}
                <div className="xl:w-[320px] w-full border border-[#0A4A7A]/20 rounded-xl bg-white shadow-sm flex flex-col">
                  <div className="px-4 py-3 border-b border-[#0A4A7A]/15 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#0A4A7A]">
                      <Clock size={16} />
                      <span className="text-sm font-semibold text-gray-800">
                        Recent History
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!onRefreshHistory) return;
                        Promise.resolve(onRefreshHistory()).catch(() => {
                          /* ignore */
                        });
                      }}
                      disabled={historyLoading}
                      className="text-xs text-[#0A4A7A] hover:text-[#0C5A97] inline-flex items-center gap-1"
                    >
                      {historyLoading ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Loading</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw size={14} /> Refresh
                        </>
                      )}
                    </button>
                  </div>

                  <div className="px-4 py-3 border-b border-[#0A4A7A]/15 space-y-2">
                    <span className="text-[11px] text-gray-500 uppercase tracking-wide">
                      Filter by tech
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setHistoryFilter("ALL")}
                        className={`px-3 py-1 rounded-full text-[11px] border transition-colors ${
                          historyFilter === "ALL"
                            ? "bg-[#0A4A7A] text-white border-[#0A4A7A]"
                            : "border-[#0A4A7A]/40 text-[#0A4A7A] hover:border-[#0A4A7A]"
                        }`}
                      >
                        All
                      </button>
                      {historyResourceOptions.map((id) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setHistoryFilter(id)}
                          className={`px-3 py-1 rounded-full text-[11px] border transition-colors ${
                            historyFilter === id
                              ? "bg-[#0A4A7A] text-white border-[#0A4A7A]"
                              : "border-[#0A4A7A]/40 text-[#0A4A7A] hover:border-[#0A4A7A]"
                          }`}
                        >
                          {id}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto px-4 py-3 space-y-3">
                    {historyError && (
                      <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {historyError}
                      </div>
                    )}

                    {!historyLoading && filteredHistory.length === 0 && (
                      <div className="text-xs text-gray-500 bg-[#0A4A7A]/5 border border-dashed border-[#0A4A7A]/25 rounded-lg px-3 py-4 text-center">
                        No history for this selection yet.
                      </div>
                    )}

                    {filteredHistory.map((entry) => (
                      <div
                        key={entry.id}
                        className="border border-[#0A4A7A]/15 rounded-lg px-3 py-2 bg-white shadow-sm"
                      >
                        <div className="flex items-center justify-between text-[11px] text-gray-500">
                          <span className="font-semibold text-[#0A4A7A] uppercase">
                            {entry.resourceId}
                          </span>
                          <span>{formatUkDateTime(entry.timestamp)}</span>
                        </div>

                        <div className="mt-1 text-sm font-semibold text-gray-900">
                          {formatHistoryOutcomeLabel(entry.outcome)}
                        </div>

                        {entry.note && (
                          <p className="mt-1 text-xs text-gray-600 leading-snug">
                            {entry.note}
                          </p>
                        )}

                        {entry.availableAgainAt && (
                          <p className="mt-2 text-[11px] text-gray-500">
                            Return {formatUkDateTime(entry.availableAgainAt)}
                          </p>
                        )}

                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-[11px] text-gray-400">
                            {entry.status ?? ""}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleViewProgress(entry)}
                            className="inline-flex items-center gap-1 text-[11px] text-[#0A4A7A] hover:text-[#0C5A97] font-semibold"
                          >
                            <ExternalLink size={13} /> View progress
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* FOOTER */}
            <div className="flex items-center justify-end px-7 py-3 border-t border-[#0A4A7A]/10 bg-[#0A4A7A]/5">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-[#0A4A7A]/30 text-[#0A4A7A] hover:bg-[#0A4A7A]/10"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
