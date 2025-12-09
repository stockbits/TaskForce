// src/A-Navigation_Container/TaskTable_Advanced.tsx
import React, {
  useMemo,
  useRef,
  useState,
  useEffect,
  MouseEvent,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ListChecks, Loader2, StickyNote, X } from "lucide-react";
import type { ProgressNoteEntry } from "@/types";

const TASK_PROGRESS_ORDER = [
  "Not Assigned (ACT)",
  "Assigned (ACT)",
  "Dispatched (AWI)",
];

const ADDITIONAL_STATUS_OPTIONS = [
  "Held Pending Details (HPD)",
  "Held Linked Task (HLD)",
  "Common (COMN)",
];

const STATUS_OPTIONS = [...TASK_PROGRESS_ORDER, ...ADDITIONAL_STATUS_OPTIONS];

const normalizeStatus = (status: string | null | undefined) =>
  status ? status.trim().toLowerCase() : "";

const resolveNextStatus = (current: string | null | undefined) => {
  const normalized = normalizeStatus(current);
  if (!normalized) {
    return {
      nextStatus: STATUS_OPTIONS[0],
      progressed: true,
    };
  }

  const index = TASK_PROGRESS_ORDER.findIndex(
    (status) => status.toLowerCase() === normalized
  );

  if (index === -1) {
    return {
      nextStatus: current && STATUS_OPTIONS.includes(current)
        ? current
        : STATUS_OPTIONS[0],
      progressed: !current,
    };
  }

  if (index >= TASK_PROGRESS_ORDER.length - 1) {
    return {
      nextStatus: TASK_PROGRESS_ORDER[index],
      progressed: false,
    };
  }

  return {
    nextStatus: TASK_PROGRESS_ORDER[index + 1],
    progressed: true,
  };
};

const normalizeProgressNotesArray = (value: unknown): ProgressNoteEntry[] => {
  if (Array.isArray(value)) {
    const mapped = value
      .map((entry) => {
        if (!entry) return null;
        const text = typeof (entry as any).text === "string" ? (entry as any).text.trim() : "";
        if (!text) return null;
        const tsSource = (entry as any).ts;
        const ts = typeof tsSource === "string" && tsSource
          ? tsSource
          : new Date().toISOString();
        return {
          ts,
          status: typeof (entry as any).status === "string" ? (entry as any).status : undefined,
          text,
          source: typeof (entry as any).source === "string" ? (entry as any).source : undefined,
        } as ProgressNoteEntry;
      })
      .filter((entry): entry is ProgressNoteEntry => Boolean(entry));

    return mapped.sort((a, b) => {
      const aTime = new Date(a.ts).getTime();
      const bTime = new Date(b.ts).getTime();
      return bTime - aTime;
    });
  }

  if (typeof value === "string" && value.trim()) {
    return [
      {
        ts: new Date().toISOString(),
        status: undefined,
        text: value.trim(),
        source: "Imported",
      },
    ];
  }

  return [];
};
import TaskRowContextMenu from "@/shared/ui/TaskRowContextMenu";

type SortDir = "asc" | "desc" | null;

export interface TaskTableAdvancedProps {
  // ⭐ used for data-row-id (e.g. "taskId")
  tableId?: string;
  rowIdKey?: string;
  rows: Record<string, any>[];
  headerNames: Record<string, string>;
  className?: string;
  tableHeight?: number | string;

  onOpenTask?: (row: Record<string, any>) => void;
  onOpenMultiple?: (rows: Record<string, any>[]) => void;
  clearSelectionTrigger?: number;

  onOpenPopout?: (
    tasks: Record<string, any>[],
    mouseScreenX: number,
    mouseScreenY: number
  ) => void;

  onOpenCalloutIncident?: (task: Record<string, any>) => void;

  // parent (ScheduleLivePage) gets selection
  onSelectionChange?: (rows: Record<string, any>[]) => void;

  // ⭐ MAP → TABLE: set of selected IDs (e.g. Set<taskId>)
  controlledSelectedRowIds?: Set<string>;
}

const AUTO_WIDTH_PADDING = 70;
const COLUMN_MENU_WIDTH = 220;

function detectType(v: any): "number" | "date" | "string" {
  if (v == null) return "string";
  if (typeof v === "number") return "number";
  if (typeof v === "string") {
    const num = Number(v.replace?.(/[, ]/g, "") ?? v);
    if (!Number.isNaN(num) && v.trim() !== "") return "number";
    const d = new Date(v);
    if (!Number.isNaN(d.getTime()) && /\d/.test(v)) return "date";
    return "string";
  }
  if (v instanceof Date) return "date";
  return "string";
}

function compareValues(a: any, b: any, dir: Exclude<SortDir, null>) {
  const ta = detectType(a);
  const tb = detectType(b);
  let res = 0;

  if (ta === "number" && tb === "number") {
    const an =
      typeof a === "number" ? a : Number(String(a).replace(/[, ]/g, ""));
    const bn =
      typeof b === "number" ? b : Number(String(b).replace(/[, ]/g, ""));
    res = an - bn;
  } else if (ta === "date" && tb === "date") {
    const ad = a instanceof Date ? a.getTime() : new Date(a).getTime();
    const bd = b instanceof Date ? b.getTime() : new Date(b).getTime();
    res = ad - bd;
  } else {
    res = String(a ?? "").localeCompare(String(b ?? ""), undefined, {
      sensitivity: "base",
      numeric: true,
    });
  }

  return dir === "asc" ? res : -res;
}

function nextSortDir(current: SortDir): SortDir {
  if (current === null) return "asc";
  if (current === "asc") return "desc";
  return null;
}

export default function TaskTable_Advanced({
  rows,
  headerNames,
  className = "",
  tableHeight,
  onOpenTask,
  onOpenMultiple,
  clearSelectionTrigger,
  onOpenPopout,
  onOpenCalloutIncident,
  onSelectionChange,
  rowIdKey,
  controlledSelectedRowIds,
}: TaskTableAdvancedProps) {
  const hasDom = typeof window !== "undefined" && typeof document !== "undefined";
  /* ------------------- SORTING ------------------- */
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  /* ------------------- COLUMNS ------------------- */
  const allColumns = useMemo(() => Object.keys(headerNames), [headerNames]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(allColumns);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [widthsReady, setWidthsReady] = useState(false);

  const resizingColumn = useRef<string | null>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const [dragColKey, setDragColKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  /* ------------------- SELECTION ------------------- */
  // store selected rows as PAGE INDEXES (0..rowsPerPage-1)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null
  );

  // ⭐ tracks when user is actively clicking in the table
  const userSelectingRef = useRef(false);

  /* ---------------- CONTEXT MENU ---------------- */
  type ContextMenuState = {
    x: number;
    y: number;
    visible: boolean;
    clickedRow: Record<string, any> | null;
    clickedColumnKey: string | null;
  };

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    x: 0,
    y: 0,
    visible: false,
    clickedRow: null,
    clickedColumnKey: null,
  });

  const [progressDialog, setProgressDialog] = useState<{
    open: boolean;
    tasks: Record<string, any>[];
  }>({ open: false, tasks: [] });
  const [targetStatus, setTargetStatus] = useState<string>(STATUS_OPTIONS[0]);
  const [progressNote, setProgressNote] = useState<string>("");
  const [progressSaving, setProgressSaving] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [progressSuccess, setProgressSuccess] = useState<string | null>(null);

  const [multiNoteDialog, setMultiNoteDialog] = useState<{
    open: boolean;
    tasks: Record<string, any>[];
  }>({ open: false, tasks: [] });
  const [multiNoteText, setMultiNoteText] = useState<string>("");
  const [multiNoteSaving, setMultiNoteSaving] = useState(false);
  const [multiNoteError, setMultiNoteError] = useState<string | null>(null);
  const [multiNoteSuccess, setMultiNoteSuccess] = useState<string | null>(null);

  const [singleNoteDialog, setSingleNoteDialog] = useState<{
    open: boolean;
    task: Record<string, any> | null;
    notes: ProgressNoteEntry[];
  }>({ open: false, task: null, notes: [] });
  const [singleNoteText, setSingleNoteText] = useState<string>("");
  const [singleNoteSaving, setSingleNoteSaving] = useState(false);
  const [singleNoteError, setSingleNoteError] = useState<string | null>(null);
  const [singleNoteSuccess, setSingleNoteSuccess] = useState<string | null>(null);

  const [columnMenu, setColumnMenu] = useState<{
    x: number;
    y: number;
    visible: boolean;
    key: string | null;
  }>({ x: 0, y: 0, visible: false, key: null });

  // Column menu filter
  const [columnFilter, setColumnFilter] = useState("");

  // Responsive menu list height
  const [windowHeight, setWindowHeight] = useState<number>(() => window.innerHeight || 900);
  useEffect(() => {
    const onResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const menuListMaxHeight = useMemo(() => {
    if (windowHeight < 600) return `calc(var(--vh, 1vh) * 20)`;
    if (windowHeight < 800) return `calc(var(--vh, 1vh) * 22)`;
    return `calc(var(--vh, 1vh) * 24)`;
  }, [windowHeight]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const columnMenuRef = useRef<HTMLDivElement | null>(null);
  const tableRef = useRef<HTMLTableElement | null>(null);

  /* -------------- ABSOLUTE MOUSE POSITION -------------- */
  const [mouseScreenX, setMouseScreenX] = useState(0);
  const [mouseScreenY, setMouseScreenY] = useState(0);

  /* ------------------- PAGINATION ------------------- */
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));

  /* ------------------- DENSITY TOGGLE ------------------- */
  const [density, setDensity] = useState<"compact" | "comfortable">(() => {
    const saved = localStorage.getItem("taskTableDensity");
    return saved === "comfortable" ? "comfortable" : "compact";
  });
  useEffect(() => {
    localStorage.setItem("taskTableDensity", density);
  }, [density]);

  const clearSelection = useCallback(() => {
    setSelectedRows(new Set());
    setLastSelectedIndex(null);
  }, []);

  /* ------------------- EFFECTS ------------------- */

  useEffect(() => {
    setVisibleColumns(allColumns);
  }, [allColumns]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  /* ----------------- AUTO COLUMN WIDTH ----------------- */
  useEffect(() => {
    if (!rows.length || !visibleColumns.length) {
      setWidthsReady(true);
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.font = "12px Inter, sans-serif";

    const newWidths: Record<string, number> = {};

    for (const key of visibleColumns) {
      const headerWidth = ctx.measureText(headerNames[key] ?? key).width;
      const sampleWidth = rows
        .slice(0, 10)
        .map((r) => ctx.measureText(String(r[key] ?? "")).width)
        .reduce((a, b) => Math.max(a, b), 0);

      newWidths[key] = Math.min(
        Math.max(headerWidth, sampleWidth) + AUTO_WIDTH_PADDING,
        380
      );
    }

    setColumnWidths(newWidths);
    setTimeout(() => setWidthsReady(true), 120);
  }, [rows, headerNames, visibleColumns]);

  /* ---------------- SORT + PAGINATION ---------------- */
  const displayedRows = useMemo(() => {
    if (!rows.length) return [];
    if (!sortKey || !sortDir) return rows;
    return [...rows].sort((a, b) =>
      compareValues(a[sortKey], b[sortKey], sortDir)
    );
  }, [rows, sortKey, sortDir]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return displayedRows.slice(start, start + rowsPerPage);
  }, [displayedRows, page, rowsPerPage]);

  /* ------------------- MAP → TABLE SYNC ------------------- */
  useEffect(() => {
    if (userSelectingRef.current) {
      console.log(
        "🔵 TABLE: User selecting manually — ignore controlled update"
      );
      return;
    }

    if (!controlledSelectedRowIds || !rowIdKey) {
      console.log("🔵 TABLE: No controlled selection (map → table) triggered");
      return;
    }

    console.log(
      "🔵 TABLE: Controlled selection received:",
      Array.from(controlledSelectedRowIds)
    );

    const next = new Set<number>();

    pagedRows.forEach((row, pageIndex) => {
      const id = String(row[rowIdKey]);
      if (controlledSelectedRowIds.has(id)) {
        console.log(
          "🔵 TABLE: Match found on page index:",
          pageIndex,
          "id:",
          id
        );
        next.add(pageIndex);
      }
    });

    console.log("🔵 TABLE: Final row set:", Array.from(next));

    setSelectedRows(next);
  }, [controlledSelectedRowIds, pagedRows, rowIdKey]);

  // small timeout to reset the "user is clicking" flag
  useEffect(() => {
    const timeout = setTimeout(() => {
      userSelectingRef.current = false;
    }, 50);
    return () => clearTimeout(timeout);
  }, [selectedRows]);

  /* ---------------- COLUMN RESIZE ---------------- */
  useEffect(() => {
    const onMove = (evt: globalThis.MouseEvent) => {
      if (!resizingColumn.current) return;
      const key = resizingColumn.current;
      const deltaX = evt.clientX - startXRef.current;

      setColumnWidths((prev) => ({
        ...prev,
        [key]: Math.max(80, startWidthRef.current + deltaX),
      }));
    };

    const onUp = () => {
      resizingColumn.current = null;
      document.body.style.cursor = "default";
    };

    window.addEventListener("mousemove", onMove as EventListener);
    window.addEventListener("mouseup", onUp as EventListener);

    return () => {
      window.removeEventListener("mousemove", onMove as EventListener);
      window.removeEventListener("mouseup", onUp as EventListener);
    };
  }, []);

  const onMouseDownResize = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingColumn.current = key;
    startXRef.current = e.clientX;
    startWidthRef.current = columnWidths[key] ?? 180;
    document.body.style.cursor = "col-resize";
  };

  const onDoubleClickResize = (key: string) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.font = "12px Inter, sans-serif";

    const headerWidth = ctx.measureText(headerNames[key] ?? key).width;
    const maxCellWidth = rows
      .map((r) => ctx.measureText(String(r[key] ?? "")).width)
      .reduce((a, b) => Math.max(a, b), 0);

    const newWidth = Math.min(
      Math.max(headerWidth, maxCellWidth) + AUTO_WIDTH_PADDING,
      420
    );

    setColumnWidths((prev) => ({ ...prev, [key]: newWidth }));
  };

  /* ---------------- COLUMN REORDER ---------------- */
  const handleHeaderDragStart = (key: string, e: React.DragEvent) => {
    setDragColKey(key);
    setDragOverKey(null);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleHeaderDragOver = (key: string, e: React.DragEvent) => {
    e.preventDefault();
    if (dragColKey && dragColKey !== key) setDragOverKey(key);
  };

  const handleHeaderDrop = (key: string, e: React.DragEvent) => {
    e.preventDefault();
    if (!dragColKey || dragColKey === key) {
      setDragColKey(null);
      setDragOverKey(null);
      return;
    }

    setVisibleColumns((prev) => {
      const fromIndex = prev.indexOf(dragColKey);
      const toIndex = prev.indexOf(key);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });

    setDragColKey(null);
    setDragOverKey(null);
  };

  const handleHeaderDragEnd = () => {
    setDragColKey(null);
    setDragOverKey(null);
  };

  /* ---------------- COLUMN MENU ---------------- */
  const openColumnMenu = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const th = (e.currentTarget as HTMLElement).closest("th");
    if (!th) return;

    const card = containerRef.current;
    if (!card) return;

    const scrollWrapper = card.querySelector(
      ".table-scroll-wrapper"
    ) as HTMLElement | null;
    if (!scrollWrapper) return;

    const cardRect = card.getBoundingClientRect();
    const wrapperRect = scrollWrapper.getBoundingClientRect();
    const thRect = th.getBoundingClientRect();

    const centerX =
      wrapperRect.left -
      cardRect.left +
      wrapperRect.width / 2 -
      COLUMN_MENU_WIDTH / 2;

    const y = thRect.bottom - cardRect.top + 6;

    setColumnMenu({
      visible: true,
      key,
      x: centerX,
      y,
    });
  };

  const closeColumnMenu = useCallback(() => {
    setColumnMenu((prev) => ({ ...prev, visible: false, key: null }));
  }, []);

  const toggleColumnVisibility = (key: string) => {
    setVisibleColumns((prev) => {
      const isVisible = prev.includes(key);

      if (isVisible && prev.length === 1) return prev;

      if (isVisible) {
        const next = prev.filter((k) => k !== key);
        if (sortKey === key) {
          setSortKey(null);
          setSortDir(null);
        }
        return next;
      } else {
        const next = [...prev];
        const targetIndex = allColumns.indexOf(key);
        if (targetIndex === -1) return next;

        let insertAt = next.length;
        for (let i = 0; i < next.length; i++) {
          if (allColumns.indexOf(next[i]) > targetIndex) {
            insertAt = i;
            break;
          }
        }
        next.splice(insertAt, 0, key);
        return next;
      }
    });
  };

  const showAllColumns = () => {
    setVisibleColumns(allColumns);
  };

  const resetColumns = () => {
    setVisibleColumns(allColumns);
    setSortKey(null);
    setSortDir(null);
    setColumnWidths({});
  };

  /* ---------------- ROW CONTEXT MENU ---------------- */
  const handleContextMenu = (e: MouseEvent, rowIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Use viewport-relative coordinates for accurate placement (clientX/Y)
    setMouseScreenX(e.clientX);
    setMouseScreenY(e.clientY);

    // Detect column
    let clickedColumnKey: string | null = null;
    const target = e.target as HTMLElement | null;
    const td = target?.closest("td");
    if (td) {
      const attr = td.getAttribute("data-colkey");
      if (attr) clickedColumnKey = attr;
    }

    const clickedRow = pagedRows[rowIndex] ?? null;

    setContextMenu({
      x,
      y,
      visible: true,
      clickedRow,
      clickedColumnKey,
    });

    setSelectedRows((prev) => {
      const already = prev.has(rowIndex);
      if (!already) return new Set([rowIndex]);
      return prev;
    });
  };

  const closeMenu = useCallback(() => {
    setContextMenu((prev) => ({
      ...prev,
      visible: false,
      clickedRow: null,
      clickedColumnKey: null,
    }));
  }, []);

  const getTaskId = useCallback((task: Record<string, any> | null | undefined) => {
    if (!task) return null;
    return (
      task.taskId ??
      task.TaskID ??
      task.TaskId ??
      task.id ??
      task.ID ??
      task.Id ??
      null
    );
  }, []);

  const getTaskStatus = useCallback((task: Record<string, any> | null | undefined) => {
    if (!task) return "";
    return (
      task.taskStatus ??
      task.TaskStatus ??
      task.status ??
      task.Status ??
      ""
    );
  }, []);

  const dedupeTasks = useCallback((tasks: Record<string, any>[]) => {
    if (!tasks?.length) return [];
    const deduped: Record<string, any>[] = [];
    const seen = new Set<string>();

    for (const task of tasks) {
      if (!task) continue;
      const id = getTaskId(task);
      if (id != null) {
        const key = String(id);
        if (seen.has(key)) continue;
        seen.add(key);
      }
      deduped.push(task);
    }

    return deduped.length ? deduped : tasks;
  }, [getTaskId]);

  const extractProgressNotes = useCallback((task: Record<string, any> | null | undefined) => {
    if (!task) return [] as ProgressNoteEntry[];
    const raw =
      task.progressNotes ??
      task.ProgressNotes ??
      task.progress_notes ??
      task.quickNotes ??
      [];
    return normalizeProgressNotesArray(raw);
  }, []);

  const openProgressDialog = useCallback(
    (tasks: Record<string, any>[]) => {
      if (!tasks?.length) return;
      const normalised = dedupeTasks(tasks);
      const first = normalised[0];
      const nextDefault = (() => {
        if (!first) return STATUS_OPTIONS[0];
        const firstStatus = getTaskStatus(first);
        const candidate = resolveNextStatus(firstStatus).nextStatus;
        if (STATUS_OPTIONS.includes(candidate)) return candidate;
        if (firstStatus && STATUS_OPTIONS.includes(firstStatus)) return firstStatus;
        return STATUS_OPTIONS[0];
      })();

      setTargetStatus(nextDefault);
      setProgressDialog({ open: true, tasks: normalised });
      setProgressNote("");
      setProgressError(null);
      setProgressSuccess(null);
    },
    [dedupeTasks, getTaskStatus]
  );

  const closeProgressDialog = useCallback(() => {
    setProgressDialog({ open: false, tasks: [] });
    setProgressNote("");
    setProgressError(null);
    setProgressSuccess(null);
    setTargetStatus(STATUS_OPTIONS[0]);
  }, []);

  const openSingleNoteDialog = useCallback((task: Record<string, any>) => {
    const notes = extractProgressNotes(task);
    setSingleNoteDialog({ open: true, task, notes });
    setSingleNoteText("");
    setSingleNoteError(null);
    setSingleNoteSuccess(null);
  }, [extractProgressNotes]);

  const closeSingleNoteDialog = useCallback(() => {
    setSingleNoteDialog({ open: false, task: null, notes: [] });
    setSingleNoteText("");
    setSingleNoteError(null);
    setSingleNoteSuccess(null);
  }, []);

  const openMultiNoteDialog = useCallback((tasks: Record<string, any>[]) => {
    const normalised = dedupeTasks(tasks);
    if (!normalised.length) return;

    setMultiNoteDialog({ open: true, tasks: normalised });
    setMultiNoteText("");
    setMultiNoteError(null);
    setMultiNoteSuccess(null);
  }, [dedupeTasks]);

  const closeMultiNoteDialog = useCallback(() => {
    setMultiNoteDialog({ open: false, tasks: [] });
    setMultiNoteText("");
    setMultiNoteError(null);
    setMultiNoteSuccess(null);
  }, []);

  const handleProgressTasks = useCallback(
    (tasks: Record<string, any>[]) => {
      openProgressDialog(tasks);
    },
    [openProgressDialog]
  );

  const handleProgressNotesAction = useCallback(
    (tasks: Record<string, any>[]) => {
      const normalised = dedupeTasks(tasks);
      if (!normalised.length) return;

      if (normalised.length === 1) {
        openSingleNoteDialog(normalised[0]);
        return;
      }

      openMultiNoteDialog(normalised);
    },
    [dedupeTasks, openMultiNoteDialog, openSingleNoteDialog]
  );

  const handleSaveQuickNote = useCallback(async () => {
    const note = progressNote.trim();
    if (!note) {
      setProgressError("Enter a quick note before saving.");
      return;
    }
    if (progressSaving) return;

    setProgressSaving(true);
    setProgressError(null);
    setProgressSuccess(null);

    const failures: string[] = [];
    const successes: string[] = [];
    const updates: Array<{
      taskId: string;
      previousStatus: string;
      nextStatus: string;
      note: string;
      timestamp: string;
    }> = [];

    for (const task of progressDialog.tasks) {
      const rawId = getTaskId(task);
      if (!rawId) {
        failures.push("(missing id)");
        continue;
      }

      const taskId = String(rawId);

      const currentStatus = getTaskStatus(task);
      const chosenStatus = targetStatus && targetStatus.trim()
        ? targetStatus
        : resolveNextStatus(currentStatus).nextStatus;
      const statusToPersist = chosenStatus || currentStatus;
      const timestamp = new Date().toISOString();
      const noteBody =
        normalizeStatus(currentStatus) !== normalizeStatus(statusToPersist)
          ? `${note} (Status → ${statusToPersist})`
          : note;

      try {
        const resp = await fetch("http://localhost:5179/progress-notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId,
            text: noteBody,
            taskStatus: statusToPersist,
          }),
        });

        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }

        successes.push(taskId);

        updates.push({
          taskId,
          previousStatus: currentStatus,
          nextStatus: statusToPersist,
          note: noteBody,
          timestamp,
        });

      } catch (err) {
        console.warn("Quick note sync failed", err);
        failures.push(taskId);
      }
    }

    setProgressSaving(false);

    if (failures.length) {
      setProgressError(
        `Unable to update ${failures.length} task${
          failures.length === 1 ? "" : "s"
        }: ${failures.join(",")}`
      );
      if (successes.length) {
        setProgressSuccess(
          `Saved ${successes.length} task${successes.length === 1 ? "" : "s"}`
        );
      }
      return;
    }

    if (updates.length && typeof window !== "undefined") {
      document.dispatchEvent(
        new CustomEvent("taskforce:tasks-progressed", {
          detail: { items: updates },
        })
      );
    }

    if (successes.length) {
      const progressedCount = updates.filter(
        (entry) =>
          normalizeStatus(entry.previousStatus) !==
          normalizeStatus(entry.nextStatus)
      ).length;

      if (progressedCount > 0) {
        setProgressSuccess(
          `Updated ${successes.length} task${
            successes.length === 1 ? "" : "s"
          } (${progressedCount} progressed)`
        );
      } else {
        setProgressSuccess(
          `Saved ${successes.length} task${
            successes.length === 1 ? "" : "s"
          }`
        );
      }
    } else {
      setProgressSuccess("Saved");
    }
    setProgressNote("");

    setTimeout(() => {
      closeProgressDialog();
    }, 900);
  }, [
    closeProgressDialog,
    getTaskId,
    getTaskStatus,
    progressDialog.tasks,
    progressNote,
    progressSaving,
    targetStatus,
  ]);

  const handleSaveSingleNote = useCallback(async () => {
    const note = singleNoteText.trim();
    if (!note) {
      setSingleNoteError("Enter a note before saving.");
      return;
    }
    if (singleNoteSaving || !singleNoteDialog.task) return;

    setSingleNoteSaving(true);
    setSingleNoteError(null);
    setSingleNoteSuccess(null);

    const rawId = getTaskId(singleNoteDialog.task);
    if (!rawId) {
      setSingleNoteSaving(false);
      setSingleNoteError("Task identifier missing.");
      return;
    }

    const taskId = String(rawId);
    const currentStatus = getTaskStatus(singleNoteDialog.task);
    const statusForNote = currentStatus || "Updated";
    const timestamp = new Date().toISOString();

    try {
      const resp = await fetch("http://localhost:5179/progress-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          text: note,
          taskStatus: statusForNote,
        }),
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const newEntry: ProgressNoteEntry = {
        ts: timestamp,
        status: statusForNote,
        text: note,
        source: "Quick Progress",
      };

      setSingleNoteDialog((prev) => {
        if (!prev.task) return prev;
        return {
          open: prev.open,
          task: {
            ...prev.task,
            progressNotes: [
              newEntry,
              ...(Array.isArray(prev.task.progressNotes) ? prev.task.progressNotes : []),
            ],
          },
          notes: [newEntry, ...prev.notes],
        };
      });

      if (typeof document !== "undefined") {
        document.dispatchEvent(
          new CustomEvent("taskforce:tasks-progressed", {
            detail: {
              items: [
                {
                  taskId,
                  previousStatus: currentStatus,
                  nextStatus: statusForNote,
                  note,
                  timestamp,
                },
              ],
            },
          })
        );
      }

      setSingleNoteSuccess("Saved note");
      setSingleNoteText("");
    } catch (err) {
      console.warn("Single progress note sync failed", err);
      setSingleNoteError("Unable to save note. Try again.");
    } finally {
      setSingleNoteSaving(false);
    }
  }, [
    getTaskId,
    getTaskStatus,
    singleNoteDialog.task,
    singleNoteSaving,
    singleNoteText,
  ]);
  
  const handleSaveMultiNote = useCallback(async () => {
    const note = multiNoteText.trim();
    if (!note) {
      setMultiNoteError("Enter a note before saving.");
      return;
    }
    if (multiNoteSaving) return;

    setMultiNoteSaving(true);
    setMultiNoteError(null);
    setMultiNoteSuccess(null);

    const failures: string[] = [];
    const successes: string[] = [];
    const updates: Array<{
      taskId: string;
      previousStatus: string;
      nextStatus: string;
      note: string;
      timestamp: string;
    }> = [];

    for (const task of multiNoteDialog.tasks) {
      const rawId = getTaskId(task);
      if (!rawId) {
        failures.push("(missing id)");
        continue;
      }

      const taskId = String(rawId);
      const currentStatus = getTaskStatus(task);
      const statusForNote = currentStatus || "Updated";
      const timestamp = new Date().toISOString();

      try {
        const resp = await fetch("http://localhost:5179/progress-notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId,
            text: note,
            taskStatus: statusForNote,
          }),
        });

        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }

        successes.push(taskId);
        updates.push({
          taskId,
          previousStatus: currentStatus,
          nextStatus: statusForNote,
          note,
          timestamp,
        });
      } catch (err) {
        console.warn("Bulk progress note sync failed", err);
        failures.push(taskId);
      }
    }

    setMultiNoteSaving(false);

    if (failures.length) {
      setMultiNoteError(
        `Unable to update ${failures.length} task${
          failures.length === 1 ? "" : "s"
        }: ${failures.join(",")}`
      );
      if (successes.length) {
        setMultiNoteSuccess(
          `Saved ${successes.length} task${
            successes.length === 1 ? "" : "s"
          }`
        );
      }
      return;
    }

    if (updates.length && typeof document !== "undefined") {
      document.dispatchEvent(
        new CustomEvent("taskforce:tasks-progressed", {
          detail: { items: updates },
        })
      );
    }

    if (successes.length) {
      setMultiNoteSuccess(
        `Saved ${successes.length} task${
          successes.length === 1 ? "" : "s"
        }`
      );
    } else {
      setMultiNoteSuccess("Saved");
    }

    setMultiNoteText("");

    setTimeout(() => {
      closeMultiNoteDialog();
    }, 900);
  }, [
    closeMultiNoteDialog,
    getTaskId,
    getTaskStatus,
    multiNoteDialog.tasks,
    multiNoteSaving,
    multiNoteText,
  ]);

  useEffect(() => {
    if (!progressDialog.open) return;
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeProgressDialog();
      }
    };

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [closeProgressDialog, progressDialog.open]);

  useEffect(() => {
    if (!multiNoteDialog.open) return;
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMultiNoteDialog();
      }
    };

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [closeMultiNoteDialog, multiNoteDialog.open]);

  useEffect(() => {
    if (!singleNoteDialog.open) return;
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeSingleNoteDialog();
      }
    };

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [closeSingleNoteDialog, singleNoteDialog.open]);

  /* ---------------- CLEAR SELECTION ---------------- */
  useEffect(() => {
    if (clearSelectionTrigger === undefined) return;
    clearSelection();
  }, [clearSelectionTrigger, clearSelection]);

  useEffect(() => {
    clearSelection();
  }, [rows, clearSelection]);

  useEffect(() => {
    clearSelection();
  }, [sortKey, sortDir, clearSelection]);

  useEffect(() => {
    clearSelection();
  }, [page, rowsPerPage, clearSelection]);

  useEffect(() => {
    clearSelection();
  }, [visibleColumns, clearSelection]);

  /* ---------------- GLOBAL ESC + CLICK AWAY ---------------- */
  useEffect(() => {
    const onKey = (evt: globalThis.KeyboardEvent) => {
      if (evt.key === "Escape") {
        closeMenu();
        closeColumnMenu();
      }
    };

    const onClick = (evt: globalThis.MouseEvent) => {
      const target = evt.target as HTMLElement;

      if (columnMenu.visible) {
        const insideMenu = columnMenuRef.current?.contains(target);
        const onDots = target.closest(".column-dots-button");
        if (!insideMenu && !onDots) closeColumnMenu();
      }

      if (contextMenu.visible) {
        const menuEl = document.querySelector(".task-context-menu");
        const inside = menuEl?.contains(target) ?? false;
        if (inside) return;
        if (evt.button === 2) return;
        closeMenu();
      }

      // ⭐ Only clear if user clicks outside THIS table, but do NOT clear because of other tables or map root
      if (containerRef.current && !containerRef.current.contains(target)) {
        const clickedInsideAnyTable = target.closest("[data-table]");
        const clickedInsideThisTable = target.closest(
          `[data-table="${rowIdKey}"]`
        );
        const clickedInsideMap = target.closest('[data-map-root="true"]');

        // If clicked inside another table → do NOT clear THIS table
        if ((clickedInsideAnyTable && !clickedInsideThisTable) || clickedInsideMap) {
          return;
        }

        // Otherwise → clear normally
        clearSelection();
      }
    };

    window.addEventListener("keydown", onKey as EventListener);
    window.addEventListener("mousedown", onClick as EventListener);

    return () => {
      window.removeEventListener("keydown", onKey as EventListener);
      window.removeEventListener("mousedown", onClick as EventListener);
    };
  }, [
    contextMenu.visible,
    columnMenu.visible,
    closeMenu,
    closeColumnMenu,
    clearSelection,
  ]);

  /* ---------------- RENDER ---------------- */
  const fixedTableHeight = tableHeight ?? "calc(100vh - 600px)";
  const tableOpacity = widthsReady ? 1 : 0;
  const tableBlurClass = columnMenu.visible
    ? "blur-[1.5px] pointer-events-none"
    : "";
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const el = containerRef.current?.querySelector(
      ".table-scroll-wrapper"
    ) as HTMLElement | null;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 0);
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const selectedTasksForContext = Array.from(selectedRows)
    .map((pageIndex) => {
      const globalIndex = (page - 1) * rowsPerPage + pageIndex;
      return displayedRows[globalIndex];
    })
    .filter(Boolean);

  useEffect(() => {
    // Prevent feedback loop: only fire when the user clicks the table
    if (userSelectingRef.current && onSelectionChange) {
      onSelectionChange(selectedTasksForContext);
    }
  }, [selectedTasksForContext, onSelectionChange]);

  const clickedRowForContext = contextMenu.clickedRow ?? null;

  const progressPreview = useMemo(() => {
    const previewTarget = targetStatus && targetStatus.trim()
      ? targetStatus
      : STATUS_OPTIONS[0];

    return progressDialog.tasks.map((task) => {
      const id = getTaskId(task);
      const currentStatus = getTaskStatus(task);
      return {
        id,
        currentStatus,
        nextStatus: previewTarget,
        willChange:
          normalizeStatus(currentStatus) !== normalizeStatus(previewTarget),
      };
    });
  }, [getTaskId, getTaskStatus, progressDialog.tasks, targetStatus]);

  const multiNotePreview = useMemo(() => {
    return multiNoteDialog.tasks.map((task) => {
      const id = getTaskId(task);
      const currentStatus = getTaskStatus(task);
      return {
        id,
        currentStatus,
      };
    });
  }, [getTaskId, getTaskStatus, multiNoteDialog.tasks]);

  const singleNoteSummary = useMemo(() => {
    if (!singleNoteDialog.task) {
      return { id: null as string | null, status: "" };
    }
    const id = getTaskId(singleNoteDialog.task);
    const status = getTaskStatus(singleNoteDialog.task);
    return { id: id ? String(id) : null, status };
  }, [getTaskId, getTaskStatus, singleNoteDialog.task]);

  const formatNoteTimestamp = useCallback((value: string) => {
    try {
      return new Date(value).toLocaleString("en-GB", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return value;
    }
  }, []);

  // Keep selected row visible during keyboard navigation
  useEffect(() => {
    if (!tableRef.current) return;
    if (lastSelectedIndex == null) return;
    const rowEl = tableRef.current.querySelector(
      `tbody tr:nth-child(${lastSelectedIndex + 1})`
    ) as HTMLTableRowElement | null;
    rowEl?.scrollIntoView({ block: 'nearest' });
  }, [lastSelectedIndex]);

  return (
    <div
      ref={containerRef}
      data-table={rowIdKey}
      className={`w-full flex flex-col border border-gray-200 rounded-2xl shadow-md bg-white/80 backdrop-blur-sm overflow-hidden relative ${className}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (contextMenu.visible) return; // let menu own keys
        const maxIndex = pagedRows.length - 1;
        if (maxIndex < 0) return;

        const current = lastSelectedIndex ?? (selectedRows.size ? Math.min(...Array.from(selectedRows)) : 0);

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const nextIndex = Math.min(maxIndex, (current ?? -1) + 1);
          userSelectingRef.current = true;
          setSelectedRows(new Set([nextIndex]));
          setLastSelectedIndex(nextIndex);
          if (onSelectionChange) onSelectionChange([pagedRows[nextIndex]]);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const nextIndex = Math.max(0, (current ?? 0) - 1);
          userSelectingRef.current = true;
          setSelectedRows(new Set([nextIndex]));
          setLastSelectedIndex(nextIndex);
          if (onSelectionChange) onSelectionChange([pagedRows[nextIndex]]);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const index = current ?? 0;
          if (onOpenPopout && pagedRows[index]) {
            onOpenPopout([pagedRows[index]], mouseScreenX, mouseScreenY);
          } else if (onOpenTask && pagedRows[index]) {
            onOpenTask(pagedRows[index]);
          }
        } else if (e.key === 'Escape') {
          closeMenu();
          closeColumnMenu();
        }
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={`flex-grow overflow-auto table-scroll-wrapper transition-[filter] duration-150 ${tableBlurClass}`}
        style={{
          height: fixedTableHeight,
          minHeight: fixedTableHeight,
          maxHeight: fixedTableHeight,
        }}
      >
        <table
          role="grid"
          className="select-none w-auto text-xs text-left text-gray-800 border-separate"
          style={{
            tableLayout: "fixed",
            width: "100%",
            borderSpacing: 0,
            opacity: tableOpacity,
            transition: "opacity 0.25s ease-in-out",
          }}
          ref={tableRef}
        >
          <thead className={`bg-gray-100 text-gray-900 font-semibold sticky top-0 z-10 select-none border-b border-gray-200 ${scrolled ? 'shadow-sm' : ''}`}>
            <tr>
              {visibleColumns.map((key) => (
                <th
                  key={key}
                  aria-sort={
                    sortKey === key
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                  style={{ width: `${columnWidths[key] ?? 180}px` }}
                  className={`relative px-1 py-2 whitespace-nowrap select-none border-r border-gray-200 last:border-r-0 ${
                    dragOverKey === key ? "bg-[#0A4A7A]/10" : ""
                  }`}
                >
                  <button
                    type="button"
                    draggable
                    onDragStart={(e) => handleHeaderDragStart(key, e)}
                    onDragOver={(e) => handleHeaderDragOver(key, e)}
                    onDrop={(e) => handleHeaderDrop(key, e)}
                    onDragEnd={handleHeaderDragEnd}
                    onClick={() => {
                      if (sortKey !== key) {
                        setSortKey(key);
                        setSortDir("asc");
                      } else {
                        const next = nextSortDir(sortDir);
                        setSortDir(next);
                        if (next === null) setSortKey(null);
                      }
                    }}
                    className="w-full flex items-center justify-between gap-2 text-left cursor-pointer"
                  >
                    <span className="truncate px-2">{headerNames[key] ?? key}</span>
                    <span className="text-[9px] text-gray-500 pr-[14px]">
                      {sortKey === key ? (sortDir === "asc" ? "▲" : "▼") : ""}
                    </span>
                  </button>

                  <div className="absolute top-0 right-0 h-full w-[12px] flex items-center justify-center">
                    <button
                      type="button"
                      onClick={(e) => openColumnMenu(key, e)}
                      title="Column options"
                      aria-label={`Column options for ${headerNames[key] ?? key}`}
                      className="column-dots-button h-[18px] w-[10px] flex flex-col items-center justify-center cursor-pointer"
                    >
                      <span className="w-[2px] h-[2px] rounded-full bg-black mb-[1px]" />
                      <span className="w-[2px] h-[2px] rounded-full bg-black mb-[1px]" />
                      <span className="w-[2px] h-[2px] rounded-full bg-black" />
                    </button>

                    <div
                      onMouseDown={(e) => onMouseDownResize(key, e)}
                      onDoubleClick={() => onDoubleClickResize(key)}
                      className="absolute right-0 top-0 h-full w-[3px] cursor-col-resize"
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {pagedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length || 1}
                  className="px-3 py-10 text-center text-gray-600"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-3xl">🔎</div>
                    <div className="text-sm">No results found</div>
                    <div className="text-xs text-gray-500">
                      Try adjusting filters or resetting column layout.
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={resetColumns}
                        className="px-3 py-1.5 border rounded-md bg-white hover:bg-gray-100 text-gray-700"
                      >
                        Reset Columns
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              pagedRows.map((row, pageIndex) => {
                const globalIndex = (page - 1) * rowsPerPage + pageIndex;
                const isSelected = selectedRows.has(pageIndex);

                return (
                  <tr
                    data-row-index={globalIndex}
                    {...(rowIdKey ? { "data-row-id": row[rowIdKey] } : {})}
                    key={pageIndex}
                    onContextMenu={(e) => handleContextMenu(e, pageIndex)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();

                      if (onOpenPopout) {
                        const x = e.screenX;
                        const y = e.screenY;
                        onOpenPopout([pagedRows[pageIndex]], x, y);
                      }
                    }}
                    onClick={(e) => {
                      // mark that this selection is user-driven
                      userSelectingRef.current = true;

                      e.preventDefault();

                      // SHIFT RANGE SELECT
                      if (e.shiftKey && lastSelectedIndex !== null) {
                        const start = Math.min(lastSelectedIndex, pageIndex);
                        const end = Math.max(lastSelectedIndex, pageIndex);

                        const newSel = new Set<number>();
                        for (let j = start; j <= end; j++) newSel.add(j);

                        setSelectedRows(newSel);
                        return;
                      }

                      // CTRL / CMD TOGGLE SELECT
                      if (e.ctrlKey || e.metaKey) {
                        setSelectedRows((prev) => {
                          const next = new Set(prev);
                          next.has(pageIndex)
                            ? next.delete(pageIndex)
                            : next.add(pageIndex);
                          return next;
                        });

                        setLastSelectedIndex(pageIndex);
                        return;
                      }

                      // NORMAL CLICK → single select + callback
                      setSelectedRows(new Set([pageIndex]));
                      setLastSelectedIndex(pageIndex);

                      const fullRow = pagedRows[pageIndex];

                      // ⭐ Fire parent selection immediately (tasks or resources)
                      if (onSelectionChange) {
                        onSelectionChange([fullRow]);
                      }

                      // ⭐ Still support "open task" double-click behaviour
                      if (onOpenTask) {
                        onOpenTask(fullRow);
                      }
                    }}
                    className={`relative cursor-pointer border-b border-gray-100 ${
                      isSelected
                        ? "bg-indigo-100/70 after:content-[''] after:absolute after:left-[1px] after:top-[1px] after:h-[calc(100%-2px)] after:w-[3px] after:bg-[#0A4A7A] after:rounded-sm"
                        : pageIndex % 2 === 0
                        ? "bg-white"
                        : "bg-gray-50"
                    } hover:bg-indigo-50 transition-colors`}
                  >
                    {visibleColumns.map((key) => (
                      <td
                        key={key}
                        data-colkey={key}
                        className={`${density === 'comfortable' ? 'py-2.5' : 'py-1.5'} px-3 whitespace-nowrap overflow-hidden text-ellipsis border-r border-gray-100 last:border-r-0`}
                      >
                        {String(row[key] ?? "")}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && (
        <div className="flex flex-wrap justify-between items-center border-t border-gray-200 bg-gray-50 text-xs text-gray-700 px-4 py-2 gap-3">
          {/* Left: density + rows per page */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-gray-700">Density:</label>
              <select
                value={density}
                onChange={(e) => setDensity(e.target.value as any)}
                className="border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-800"
              >
                <option value="compact">Compact</option>
                <option value="comfortable">Comfortable</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="rowsPerPage" className="text-gray-700">Rows:</label>
              <select
                id="rowsPerPage"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-800"
              >
                {[25, 50, 100, 500].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: page info + controls */}
          <div className="flex items-center gap-3">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2 py-1 border rounded-md bg-white hover:bg-gray-100 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2 py-1 border rounded-md bg-white hover:bg-gray-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COLUMN MENU */}
      <AnimatePresence>
        {columnMenu.visible && columnMenu.key && (
          <motion.div
            ref={columnMenuRef}
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              top: columnMenu.y,
              left: columnMenu.x,
              width: "clamp(220px,22vw,320px)",
            }}
            className="absolute z-[99999] rounded-lg border border-gray-200 bg-white shadow-xl text-xs text-gray-800 py-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Header Settings
            </div>

            {/* Search filter */}
            <div className="px-3 pb-2">
              <input
                type="text"
                placeholder="Filter columns…"
                value={columnFilter}
                onChange={(e) => setColumnFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs bg-white"
              />
            </div>

            <div
              className="overflow-y-auto"
              style={{ maxHeight: menuListMaxHeight, paddingBottom: 8 }}
            >
              {allColumns
                .filter((key) => {
                  if (!columnFilter.trim()) return true;
                  const name = headerNames[key] ?? key;
                  return name.toLowerCase().includes(columnFilter.toLowerCase());
                })
                .map((key) => {
                const enabled = visibleColumns.includes(key);
                return (
                  <label
                    key={key}
                    className="flex items-center gap-2 px-3 py-1 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => toggleColumnVisibility(key)}
                      className="accent-[#0A4A7A]"
                    />
                    <span className="truncate">{headerNames[key] ?? key}</span>
                  </label>
                );
              })}
            </div>

            <div className="sticky bottom-0 mt-2 pt-2 pb-2 border-t border-gray-200 flex items-center justify-end px-3 gap-2 bg-white shadow-[0_-2px_6px_rgba(0,0,0,0.06)] rounded-b-lg">
              <button
                type="button"
                onClick={() => {
                  const anyEnabled = visibleColumns.length > 0;
                  if (anyEnabled) {
                    setVisibleColumns([]);
                  } else {
                    setVisibleColumns(allColumns);
                  }
                }}
                className="px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100 text-[11px]"
              >
                {visibleColumns.length > 0 ? "Unselect All" : "Select All"}
              </button>
              <button
                type="button"
                onClick={resetColumns}
                className="px-2 py-1 rounded bg-[#0A4A7A] text-white hover:bg-[#09385D] text-[11px]"
              >
                Reset Columns
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ROW CONTEXT MENU */}
      <TaskRowContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        selectedRows={selectedTasksForContext}
        clickedColumnKey={contextMenu.clickedColumnKey}
        clickedRow={clickedRowForContext}
        onClose={closeMenu}
        mouseScreenX={mouseScreenX}
        mouseScreenY={mouseScreenY}
        onOpenPopout={(tasks: any[], mX: number, mY: number) => {
          if (onOpenPopout) onOpenPopout(tasks, mX, mY);
        }}
        onOpenCalloutIncident={(task: any) => {
          if (onOpenCalloutIncident) onOpenCalloutIncident(task);
        }}
        onProgressTasks={handleProgressTasks}
        onProgressNotes={handleProgressNotesAction}
      />

      {hasDom &&
        createPortal(
          <AnimatePresence>
            {progressDialog.open && (
              <motion.div
                key="progress-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-[120000] flex items-center justify-center bg-black/45 backdrop-blur-sm px-4"
                onClick={closeProgressDialog}
              >
                <motion.div
                  key="progress-dialog"
                  initial={{ opacity: 0, y: 18, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 18, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                  className="w-full max-w-4xl rounded-3xl bg-white shadow-[0_32px_90px_rgba(8,58,97,0.34)] border border-[#0A4A7A]/12 p-8"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 flex items-center justify-center rounded-full bg-[#0A4A7A] text-white shadow-sm">
                        <ListChecks size={22} />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">Progress Tasks</h3>
                        <p className="text-sm text-gray-500">
                          {progressDialog.tasks.length} task{progressDialog.tasks.length === 1 ? "" : "s"} selected
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={closeProgressDialog}
                      className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="mb-6 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
                    <div>
                      <span className="text-xs font-semibold text-[#0A4A7A] uppercase tracking-wide">
                        Selected Tasks
                      </span>
                      <div className="mt-2 flex flex-col gap-2 max-h-44 overflow-y-auto rounded-xl border border-gray-200/80 bg-gray-50/60 p-3">
                        {progressPreview.length === 0 ? (
                          <span className="text-gray-400 text-xs">No task identifiers</span>
                        ) : (
                          progressPreview.map(({ id, currentStatus, nextStatus }, index) => (
                            <div
                              key={id ?? `task-${index}`}
                              className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2"
                            >
                              <span className="font-semibold text-[#0A4A7A] text-xs whitespace-nowrap">
                                {id ?? "Unknown Task"}
                              </span>
                              <span className="text-[11px] text-gray-600 whitespace-nowrap">
                                {currentStatus ? currentStatus : "—"}
                                <span className="mx-1 text-gray-400">→</span>
                                {nextStatus}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#0A4A7A] uppercase tracking-wide">
                        Target Status
                      </label>
                      <select
                        value={targetStatus}
                        onChange={(event) => setTargetStatus(event.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A7A]/35"
                      >
                        <optgroup label="Core progression">
                          {TASK_PROGRESS_ORDER.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Additional statuses">
                          {ADDITIONAL_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </optgroup>
                      </select>

                      <div className="mt-3 rounded-xl border border-dashed border-[#0A4A7A]/25 bg-[#0A4A7A]/5 p-3">
                        <p className="text-xs text-[#0A4A7A]">
                          Selected tasks will be stamped with the note below and updated to <span className="font-semibold">{targetStatus}</span> unless they already match.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className="text-xs font-semibold text-[#0A4A7A] uppercase tracking-wide flex items-center gap-2">
                      <StickyNote size={14} className="text-[#0A4A7A]" />
                      Quick Note
                    </label>
                    <textarea
                      value={progressNote}
                      onChange={(event) => setProgressNote(event.target.value)}
                      placeholder="Share the next steps, blockers, or field updates for these tasks…"
                      className="mt-2 w-full h-32 text-sm p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A4A7A]/30"
                    />
                  </div>

                  {(progressError || progressSuccess) && (
                    <div className="mb-4 space-y-1 text-sm">
                      {progressError && (
                        <p className="text-red-600">{progressError}</p>
                      )}
                      {progressSuccess && (
                        <p className="text-green-600">{progressSuccess}</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                      onClick={closeProgressDialog}
                      disabled={progressSaving}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-2 text-sm rounded-md text-white flex items-center gap-2 ${
                        progressNote.trim() && !progressSaving
                          ? "bg-[#0A4A7A] hover:bg-[#083B61]"
                          : "bg-gray-300 cursor-not-allowed"
                      }`}
                      onClick={handleSaveQuickNote}
                      disabled={!progressNote.trim() || progressSaving}
                    >
                      {progressSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                      Save Note
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {hasDom &&
        createPortal(
          <AnimatePresence>
            {multiNoteDialog.open && (
              <motion.div
                key="progress-note-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-[120000] flex items-center justify-center bg-black/45 backdrop-blur-sm px-4"
                onClick={closeMultiNoteDialog}
              >
                <motion.div
                  key="progress-note-dialog"
                  initial={{ opacity: 0, y: 18, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 18, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                  className="w-full max-w-3xl rounded-3xl bg-white shadow-[0_32px_90px_rgba(8,58,97,0.34)] border border-[#0A4A7A]/12 p-8"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 flex items-center justify-center rounded-full bg-[#0A4A7A] text-white shadow-sm">
                        <StickyNote size={22} />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">Bulk Progress Notes</h3>
                        <p className="text-sm text-gray-500">
                          {multiNoteDialog.tasks.length} task{multiNoteDialog.tasks.length === 1 ? "" : "s"} selected
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={closeMultiNoteDialog}
                      className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="mb-5">
                    <span className="text-xs font-semibold text-[#0A4A7A] uppercase tracking-wide">
                      Selected Tasks
                    </span>
                    <div className="mt-2 flex flex-col gap-2 max-h-44 overflow-y-auto rounded-xl border border-gray-200/80 bg-gray-50/60 p-3">
                      {multiNotePreview.length === 0 ? (
                        <span className="text-gray-400 text-xs">No task identifiers</span>
                      ) : (
                        multiNotePreview.map(({ id, currentStatus }, index) => (
                          <div
                            key={id ?? `multi-note-${index}`}
                            className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2"
                          >
                            <span className="font-semibold text-[#0A4A7A] text-xs whitespace-nowrap">
                              {id ?? "Unknown Task"}
                            </span>
                            <span className="text-[11px] text-gray-600 whitespace-nowrap">
                              {currentStatus || "—"}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className="text-xs font-semibold text-[#0A4A7A] uppercase tracking-wide flex items-center gap-2">
                      <StickyNote size={14} className="text-[#0A4A7A]" />
                      Quick Note
                    </label>
                    <textarea
                      value={multiNoteText}
                      onChange={(event) => setMultiNoteText(event.target.value)}
                      placeholder="Share context that applies to all selected tasks…"
                      className="mt-2 w-full h-32 text-sm p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A4A7A]/30"
                    />
                    <p className="mt-2 text-[11px] text-gray-500">
                      This note will be added to each selected task without changing its current status.
                    </p>
                  </div>

                  {(multiNoteError || multiNoteSuccess) && (
                    <div className="mb-4 space-y-1 text-sm">
                      {multiNoteError && (
                        <p className="text-red-600">{multiNoteError}</p>
                      )}
                      {multiNoteSuccess && (
                        <p className="text-green-600">{multiNoteSuccess}</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                      onClick={closeMultiNoteDialog}
                      disabled={multiNoteSaving}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-2 text-sm rounded-md text-white flex items-center gap-2 ${
                        multiNoteText.trim() && !multiNoteSaving
                          ? "bg-[#0A4A7A] hover:bg-[#083B61]"
                          : "bg-gray-300 cursor-not-allowed"
                      }`}
                      onClick={handleSaveMultiNote}
                      disabled={!multiNoteText.trim() || multiNoteSaving}
                    >
                      {multiNoteSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                      Save Note
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {hasDom &&
        createPortal(
          <AnimatePresence>
            {singleNoteDialog.open && (
              <motion.div
                key="progress-note-single-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-[120000] flex items-center justify-center bg-black/45 backdrop-blur-sm px-4"
                onClick={closeSingleNoteDialog}
              >
                <motion.div
                  key="progress-note-single-dialog"
                  initial={{ opacity: 0, y: 18, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 18, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                  className="w-full max-w-4xl rounded-3xl bg-white shadow-[0_32px_90px_rgba(8,58,97,0.34)] border border-[#0A4A7A]/12 p-8"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 flex items-center justify-center rounded-full bg-[#0A4A7A] text-white shadow-sm">
                        <StickyNote size={22} />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">Progress Notes</h3>
                        <p className="text-sm text-gray-500">
                          {singleNoteSummary.id ? `Task ${singleNoteSummary.id}` : "Selected task"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={closeSingleNoteDialog}
                      className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="mb-6 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
                    <div className="flex flex-col gap-4">
                      <div>
                        <span className="text-xs font-semibold text-[#0A4A7A] uppercase tracking-wide">
                          Existing Notes
                        </span>
                        <div className="mt-2 flex flex-col gap-2 max-h-60 overflow-y-auto rounded-xl border border-gray-200/80 bg-gray-50/60 p-3">
                          {singleNoteDialog.notes.length === 0 ? (
                            <span className="text-gray-400 text-sm">No progress notes captured yet.</span>
                          ) : (
                            singleNoteDialog.notes.map((note, index) => (
                              <div
                                key={`${note.ts}-${index}`}
                                className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm"
                              >
                                <div className="flex items-center justify-between gap-3 text-xs text-gray-600">
                                  <span className="font-medium text-gray-800">{formatNoteTimestamp(note.ts)}</span>
                                  <span className="px-2 py-0.5 rounded bg-[#0A4A7A]/10 text-[#0A4A7A] whitespace-nowrap">
                                    {note.status || "Logged"}
                                  </span>
                                </div>
                                {note.source && (
                                  <div className="text-[11px] text-gray-500 uppercase tracking-wide">
                                    Source: {note.source}
                                  </div>
                                )}
                                <div className="whitespace-pre-wrap text-sm text-gray-700">
                                  {note.text}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div>
                        <span className="text-xs font-semibold text-[#0A4A7A] uppercase tracking-wide">
                          Selected Task
                        </span>
                        <div className="mt-2 flex flex-col gap-2 rounded-xl border border-gray-200/80 bg-gray-50/60 p-3">
                          <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
                            <span className="font-semibold text-[#0A4A7A] text-xs whitespace-nowrap">
                              {singleNoteSummary.id ?? "Unknown Task"}
                            </span>
                            <span className="text-[11px] text-gray-600 whitespace-nowrap">
                              {singleNoteSummary.status || "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-dashed border-[#0A4A7A]/25 bg-[#0A4A7A]/5 p-4">
                        <p className="text-xs text-[#0A4A7A]">
                          Current status remains <span className="font-semibold">{singleNoteSummary.status || "Unknown"}</span>.
                        </p>
                        <p className="mt-2 text-[11px] text-gray-500">
                          Add a quick note without progressing the task status.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className="text-xs font-semibold text-[#0A4A7A] uppercase tracking-wide flex items-center gap-2">
                      <StickyNote size={14} className="text-[#0A4A7A]" />
                      Quick Note
                    </label>
                    <textarea
                      value={singleNoteText}
                      onChange={(event) => setSingleNoteText(event.target.value)}
                      placeholder="Share new updates, blockers, or field activity…"
                      className="mt-2 w-full h-32 text-sm p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A4A7A]/30"
                    />
                    <p className="mt-2 text-[11px] text-gray-500">
                      This note will be appended to the task timeline immediately.
                    </p>
                  </div>

                  {(singleNoteError || singleNoteSuccess) && (
                    <div className="mb-4 space-y-1 text-sm">
                      {singleNoteError && <p className="text-red-600">{singleNoteError}</p>}
                      {singleNoteSuccess && <p className="text-green-600">{singleNoteSuccess}</p>}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                      onClick={closeSingleNoteDialog}
                      disabled={singleNoteSaving}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-2 text-sm rounded-md text-white flex items-center gap-2 ${
                        singleNoteText.trim() && !singleNoteSaving
                          ? "bg-[#0A4A7A] hover:bg-[#083B61]"
                          : "bg-gray-300 cursor-not-allowed"
                      }`}
                      onClick={handleSaveSingleNote}
                      disabled={!singleNoteText.trim() || singleNoteSaving}
                    >
                      {singleNoteSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                      Save Note
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
