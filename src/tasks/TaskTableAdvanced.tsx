// Core progression statuses for tasks (edit as needed for your workflow)
const TASK_PROGRESS_ORDER = [
  "Assigned",
  "Dispatched",
  "Accepted",
  "In Progress",
  "Incomplete",
  "Complete",
];

// Additional statuses that may be used in your app
const ADDITIONAL_STATUS_OPTIONS = [
  "On Hold",
  "Cancelled",
  "Deferred",
  "Rejected",
  "Other",
];
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
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import { MoreVertical, Search, ListChecks, StickyNote, X } from "lucide-react";
import TaskRowContextMenu from "@/shared-ui/TaskRowContextMenu";
import type { ProgressNoteEntry } from "@/types";
import type { SelectChangeEvent } from "@mui/material/Select";

const STATUS_OPTIONS = [...TASK_PROGRESS_ORDER, ...ADDITIONAL_STATUS_OPTIONS];

const normalizeStatus = (status: string | null | undefined) =>
  status ? status.trim().toLowerCase() : "";

const resolveNextStatus = (current: string | null | undefined) => {
  const normalized = normalizeStatus(current);
  if (!normalized) {
    return {
      nextStatus: STATUS_OPTIONS[0],
      progressed: true,
    } as const;
  }

  const index = TASK_PROGRESS_ORDER.findIndex(
    (status) => status.toLowerCase() === normalized
  );

  if (index === -1) {
    return {
      nextStatus:
        current && STATUS_OPTIONS.includes(current)
          ? current
          : STATUS_OPTIONS[0],
      progressed: !current,
    } as const;
  }

  if (index >= TASK_PROGRESS_ORDER.length - 1) {
    return {
      nextStatus: TASK_PROGRESS_ORDER[index],
      progressed: false,
    } as const;
  }

  return {
    nextStatus: TASK_PROGRESS_ORDER[index + 1],
    progressed: true,
  } as const;
};

const normalizeProgressNotesArray = (value: unknown): ProgressNoteEntry[] => {
  if (Array.isArray(value)) {
    const mapped = value
      .map((entry) => {
        if (!entry) return null;
        const text = typeof (entry as any).text === "string" ? (entry as any).text.trim() : "";
        if (!text) return null;
        const tsSource = (entry as any).ts;
        const ts = typeof tsSource === "string" && tsSource ? tsSource : new Date().toISOString();
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

type SortDir = "asc" | "desc" | null;

export interface TaskTableAdvancedProps {
  // ⭐ used for data-row-id (e.g. "taskId")
  tableId?: string;
  rowIdKey?: string;
  rows: Record<string, any>[];
  headerNames: Record<string, string>;
  tableHeight?: number | string;
  sx?: SxProps<Theme>;

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
const COLUMN_MENU_WIDTH = 28 * 8; // theme.spacing(28) = 224px

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
  tableHeight,
  sx,
  onOpenTask,
  onOpenMultiple,
  clearSelectionTrigger,
  onOpenPopout,
  onOpenCalloutIncident,
  onSelectionChange,
  rowIdKey,
  controlledSelectedRowIds,
}: TaskTableAdvancedProps) {
  const theme = useTheme();
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
  const [targetResourceId, setTargetResourceId] = useState<string>("");
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
  const scrollWrapperRef = useRef<HTMLDivElement | null>(null);
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
    const scrollWrapper = scrollWrapperRef.current;
    if (!card || !scrollWrapper) return;

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
        const bodyPayload: any = {
          taskId,
          text: noteBody,
          taskStatus: statusToPersist,
        };

        if (targetResourceId && String(targetResourceId).trim()) {
          bodyPayload.resourceId = String(targetResourceId).trim();
        }

        const resp = await fetch("http://localhost:5179/progress-notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyPayload),
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
        const onDots = target.closest('[data-column-button="true"]');
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
  const tableFilter = columnMenu.visible ? "blur(1.5px)" : "none";
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const el = scrollWrapperRef.current;
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

  const containerBaseSx = useMemo(() => ({
    width: "100%",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflow: "hidden",
    borderRadius: 3,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
    boxShadow: "0 20px 50px rgba(8, 58, 97, 0.12)",
    backgroundColor: alpha(theme.palette.background.paper, 0.94),
    // backdropFilter: "blur(6px)",
    outline: "none",
  }), [theme]);

  const containerSx = useMemo(() => {
    if (!sx) return containerBaseSx;
    if (Array.isArray(sx)) return [containerBaseSx, ...sx];
    return [containerBaseSx, sx];
  }, [containerBaseSx, sx]);

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
    <Paper
      ref={containerRef}
      data-table={rowIdKey}
      component="section"
      elevation={0}
      square={false}
      tabIndex={0}
      sx={containerSx}
      onKeyDown={(e) => {
        // ...existing code...
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Box
        ref={scrollWrapperRef}
        sx={{
          flexGrow: 1,
          overflowX: "auto",
          overflowY: "auto",
          filter: tableFilter,
          transition: "filter 150ms ease",
          height: fixedTableHeight,
          minHeight: fixedTableHeight,
          maxHeight: fixedTableHeight,
        }}
      >
        <Table stickyHeader size="small" padding="none" ref={tableRef} sx={{
          tableLayout: "auto",
          minWidth: '100%',
          width: "100%",
          borderSpacing: 0,
          opacity: tableOpacity,
          transition: "opacity 200ms ease-in-out",
          '& thead th': {
            bgcolor: scrolled
              ? alpha(theme.palette.background.paper, 0.98)
              : alpha(theme.palette.background.paper, 0.94),
            borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
            position: "sticky",
            top: 0,
            zIndex: 1,
            px: 0.5,
            py: 0.5,
            fontSize: '0.75rem'
          },
          '& th, & td': {
            color: theme.palette.text.primary,
            borderRight: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
            '&:last-of-type': { borderRight: "none" },
            minWidth: 80,
            maxWidth: 'none',
            whiteSpace: 'normal',
            overflow: 'visible',
            textOverflow: 'initial',
            wordBreak: 'break-word',
          },
        }}>
          <TableHead>
            <TableRow>
              {visibleColumns.map((key) => (
                <TableCell
                  key={key}
                  sortDirection={sortKey === key ? sortDir ?? false : false}
                  sx={{
                    position: "relative",
                    px: 1,
                    py: 1,
                    '&.drag-over': {
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                    },
                  }}
                  className={dragOverKey === key ? "drag-over" : undefined}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
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
                    sx={{
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    <Typography variant="subtitle2" noWrap sx={{ pl: 1 }}>
                      {headerNames[key] ?? key}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {sortKey === key ? (sortDir === "asc" ? "▲" : "▼") : ""}
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <IconButton
                      size="small"
                      data-column-button="true"
                      aria-label={`Column options for ${headerNames[key] ?? key}`}
                      onClick={(e) => openColumnMenu(key, e)}
                    >
                      <MoreVertical size={16} />
                    </IconButton>
                    <Box
                      onMouseDown={(e) => onMouseDownResize(key, e)}
                      onDoubleClick={() => onDoubleClickResize(key)}
                      sx={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        height: "100%",
                        width: 6,
                        cursor: "col-resize",
                        zIndex: 2,
                      }}
                    />
                  </Stack>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length || 1} align="center" sx={{ py: 6 }}>
                  <Stack spacing={1.5} alignItems="center" sx={{ color: "text.secondary" }}>
                    <Typography variant="h4" component="span" sx={{ lineHeight: 1 }}>
                      🔎
                    </Typography>
                    <Typography variant="body2">No results found</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Try adjusting filters or resetting column layout.
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={resetColumns}
                      sx={{ mt: 1, borderRadius: 2 }}
                    >
                      Reset Columns
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              pagedRows.map((row, pageIndex) => {
                const globalIndex = (page - 1) * rowsPerPage + pageIndex;
                const isSelected = selectedRows.has(pageIndex);

                return (
                  <TableRow
                    hover
                    key={pageIndex}
                    data-row-index={globalIndex}
                    {...(rowIdKey ? { "data-row-id": row[rowIdKey] } : {})}
                    onContextMenu={(e) => handleContextMenu(e, pageIndex)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (onOpenPopout) {
                        onOpenPopout([pagedRows[pageIndex]], e.screenX, e.screenY);
                      }
                    }}
                    onClick={(e) => {
                      userSelectingRef.current = true;
                      e.preventDefault();

                      if (e.shiftKey && lastSelectedIndex !== null) {
                        const start = Math.min(lastSelectedIndex, pageIndex);
                        const end = Math.max(lastSelectedIndex, pageIndex);
                        const newSel = new Set<number>();
                        for (let j = start; j <= end; j += 1) newSel.add(j);
                        setSelectedRows(newSel);
                        return;
                      }

                      if (e.ctrlKey || e.metaKey) {
                        setSelectedRows((prev) => {
                          const next = new Set(prev);
                          next.has(pageIndex) ? next.delete(pageIndex) : next.add(pageIndex);
                          return next;
                        });
                        setLastSelectedIndex(pageIndex);
                        return;
                      }

                      setSelectedRows(new Set([pageIndex]));
                      setLastSelectedIndex(pageIndex);
                      const fullRow = pagedRows[pageIndex];
                      if (onSelectionChange) onSelectionChange([fullRow]);
                      if (onOpenTask) onOpenTask(fullRow);
                    }}
                    selected={isSelected}
                    sx={{
                      position: "relative",
                      cursor: "pointer",
                      backgroundColor: isSelected
                        ? alpha(theme.palette.primary.light, 0.14)
                        : pageIndex % 2 === 0
                        ? alpha(theme.palette.background.paper, 0.9)
                        : alpha(theme.palette.background.default, 0.9),
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.12),
                      },
                      boxShadow: isSelected
                        ? `inset 6px 0 0 0 ${theme.palette.primary.main}`
                        : undefined,
                    }}
                  >
                    {visibleColumns.map((key) => (
                      <TableCell
                        key={key}
                        data-colkey={key}
                        sx={{
                              px: density === "comfortable" ? 1.5 : 0.75,
                              py: density === "comfortable" ? 1.25 : 0.25,
                              fontSize: density === "comfortable" ? '0.9rem' : '0.72rem',
                              lineHeight: density === "comfortable" ? 1.25 : 1.0,
                        }}
                      >
                            <Box sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {String(row[key] ?? "")}
                            </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Box>

      {rows.length > 0 && (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
          sx={{
            borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
            bgcolor: alpha(theme.palette.background.paper, 0.92),
            px: 3,
            py: 2,
            color: "text.secondary",
          }}
        >
          <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap" useFlexGap>
            <FormControl size="small">
              <InputLabel id="density-label">Density</InputLabel>
              <Select
                labelId="density-label"
                label="Density"
                value={density}
                onChange={(event: SelectChangeEvent) => setDensity(event.target.value as any)}
                sx={{ minWidth: { xs: theme.spacing(14), sm: theme.spacing(18) } }}
              >
                <MenuItem value="compact">Compact</MenuItem>
                <MenuItem value="comfortable">Comfortable</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel id="rows-label">Rows</InputLabel>
              <Select
                labelId="rows-label"
                label="Rows"
                value={String(rowsPerPage)}
                onChange={(event) => {
                  setRowsPerPage(Number(event.target.value));
                  setPage(1);
                }}
                sx={{ minWidth: { xs: theme.spacing(12), sm: theme.spacing(15) } }}
              >
                {[25, 50, 100, 500].map((n) => (
                  <MenuItem key={n} value={String(n)}>
                    {n}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Page {page} of {totalPages}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                sx={{ borderRadius: 2 }}
              >
                Prev
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                sx={{ borderRadius: 2 }}
              >
                Next
              </Button>
            </Stack>
          </Stack>
        </Stack>
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
              position: "absolute",
              top: columnMenu.y,
              left: columnMenu.x,
              width: "clamp(220px,22vw,320px)",
              zIndex: 99999,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Paper elevation={10} sx={{
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
              boxShadow: "0 18px 40px rgba(8, 58, 97, 0.28)",
              py: 1.5,
            }}>
              <Stack spacing={1.5} sx={{ px: 2 }}>
                <Typography
                  variant="overline"
                  sx={{
                    color: theme.palette.text.secondary,
                    letterSpacing: 0.8,
                    fontWeight: 700,
                  }}
                >
                  Header Settings
                </Typography>
                <TextField
                  size="small"
                  placeholder="Filter columns…"
                  value={columnFilter}
                  onChange={(event) => setColumnFilter(event.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={16} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Stack>

              <Divider sx={{ my: 1.5 }} />

              <Box sx={{ maxHeight: menuListMaxHeight, overflowY: "auto", px: 1.5, pb: 1 }}>
                <Stack spacing={0.25}>
                  {allColumns
                    .filter((key) => {
                      if (!columnFilter.trim()) return true;
                      const name = headerNames[key] ?? key;
                      return name.toLowerCase().includes(columnFilter.toLowerCase());
                    })
                    .map((key) => {
                      const enabled = visibleColumns.includes(key);
                      return (
                        <FormControlLabel
                          key={key}
                          control={
                            <Checkbox
                              size="small"
                              checked={enabled}
                              onChange={() => toggleColumnVisibility(key)}
                            />
                          }
                          label={
                            <Typography variant="body2" noWrap>
                              {headerNames[key] ?? key}
                            </Typography>
                          }
                          sx={{
                            m: 0,
                            px: 1,
                            py: 0.75,
                            borderRadius: 2,
                            gap: 1.5,
                            alignItems: "center",
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.06),
                            },
                            '& .MuiFormControlLabel-label': {
                              width: "100%",
                            },
                          }}
                        />
                      );
                    })}
                </Stack>
              </Box>

              <Divider />

              <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ px: 2, py: 1.5 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    const anyEnabled = visibleColumns.length > 0;
                    if (anyEnabled) {
                      setVisibleColumns([]);
                    } else {
                      setVisibleColumns(allColumns);
                    }
                  }}
                  sx={{ borderRadius: 2 }}
                >
                  {visibleColumns.length > 0 ? "Unselect All" : "Select All"}
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={resetColumns}
                  sx={{ borderRadius: 2 }}
                >
                  Reset Columns
                </Button>
              </Stack>
            </Paper>
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
                onClick={closeProgressDialog}
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 120000,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(0,0,0,0.45)",
                  padding: "16px",
                }}
              >
                <motion.div
                  key="progress-dialog"
                  initial={{ opacity: 0, y: 18, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 18, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                  onClick={(event) => event.stopPropagation()}
                  style={{ width: "100%", maxWidth: "880px" }}
                >
                  <Dialog
                    open
                    onClose={closeProgressDialog}
                    maxWidth="lg"
                    hideBackdrop
                    disablePortal
                    keepMounted
                    PaperProps={{
                      sx: {
                        borderRadius: 4,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                        boxShadow: "0 40px 120px rgba(8,58,97,0.35)",
                        backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,247,250,0.96))",
                        overflow: "hidden",
                      },
                    }}
                  >
                    <DialogTitle sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                    }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                          sx={{
                            height: 48,
                            width: 48,
                            borderRadius: "50%",
                            bgcolor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 8px 20px rgba(8,58,97,0.35)",
                          }}
                        >
                          <ListChecks size={22} />
                        </Box>
                        <div>
                          <Typography variant="h6" fontWeight={600} color="text.primary">
                            Progress Tasks
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {progressDialog.tasks.length} task{progressDialog.tasks.length === 1 ? "" : "s"} selected
                          </Typography>
                        </div>
                      </Stack>
                      <IconButton onClick={closeProgressDialog}>
                        <X size={20} />
                      </IconButton>
                    </DialogTitle>

                    <DialogContent dividers sx={{ display: "grid", gap: 3, gridTemplateColumns: { lg: "1.6fr 1fr", xs: "1fr" } }}>
                      <Stack spacing={2}>
                        <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: 1 }}>
                          Selected Tasks
                        </Typography>
                        <Paper variant="outlined" sx={{
                          maxHeight: 180,
                          overflowY: "auto",
                          borderRadius: 3,
                          borderColor: alpha(theme.palette.primary.main, 0.12),
                          bgcolor: alpha(theme.palette.primary.main, 0.03),
                          p: 2,
                        }}>
                          <Stack spacing={1.5}>
                            {progressPreview.length === 0 ? (
                              <Typography variant="caption" color="text.secondary">
                                No task identifiers.
                              </Typography>
                            ) : (
                              progressPreview.map(({ id, currentStatus, nextStatus }, index) => (
                                <Stack
                                  key={id ?? `task-${index}`}
                                  direction="row"
                                  spacing={2}
                                  alignItems="center"
                                  justifyContent="space-between"
                                  sx={{
                                    borderRadius: 2,
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                                    bgcolor: theme.palette.background.paper,
                                    px: 2,
                                    py: 1.25,
                                  }}
                                >
                                  <Typography variant="subtitle2" color="primary" noWrap>
                                    {id ?? "Unknown Task"}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" noWrap>
                                    {currentStatus ? currentStatus : "—"}
                                    <Typography component="span" sx={{ mx: 1, color: "text.disabled" }}>
                                      →
                                    </Typography>
                                    {nextStatus}
                                  </Typography>
                                </Stack>
                              ))
                            )}
                          </Stack>
                        </Paper>
                      </Stack>

                      <Stack spacing={2.5}>
                        <FormControl fullWidth size="small">
                          <InputLabel id="target-status-label">Target Status</InputLabel>
                          <Select
                            labelId="target-status-label"
                            label="Target Status"
                            value={targetStatus}
                            onChange={(event) => setTargetStatus(event.target.value)}
                          >
                            <MenuItem disabled value="__CORE__">
                              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                                Core progression
                              </Typography>
                            </MenuItem>
                            {TASK_PROGRESS_ORDER.map((status) => (
                              <MenuItem key={status} value={status}>
                                {status}
                              </MenuItem>
                            ))}
                            <Divider component="li" sx={{ my: 0.5 }} />
                            <MenuItem disabled value="__ADDITIONAL__">
                              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                                Additional statuses
                              </Typography>
                            </MenuItem>
                            {ADDITIONAL_STATUS_OPTIONS.map((status) => (
                              <MenuItem key={status} value={status}>
                                {status}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Alert severity="info" variant="outlined" sx={{ borderRadius: 3 }}>
                          Selected tasks will be stamped with the note below and updated to
                          <strong> {targetStatus} </strong>
                          unless they already match.
                        </Alert>
                        {/* Assign-to-resource input removed — pins are shown at start */}
                      </Stack>

                      <Stack spacing={1.5} sx={{ gridColumn: "1 / -1" }}>
                        <Typography variant="overline" sx={{ letterSpacing: 1, color: "text.secondary" }}>
                          Quick Note
                        </Typography>
                        <TextField
                          multiline
                          minRows={4}
                          value={progressNote}
                          onChange={(event) => setProgressNote(event.target.value)}
                          placeholder="Share the next steps, blockers, or field updates for these tasks…"
                        />
                      </Stack>

                      {(progressError || progressSuccess) && (
                        <Alert severity={progressError ? "error" : "success"} sx={{ gridColumn: "1 / -1" }}>
                          {progressError || progressSuccess}
                        </Alert>
                      )}
                    </DialogContent>

                    <DialogActions sx={{ px: 3, py: 2, gap: 1.5 }}>
                      <Button
                        variant="outlined"
                        onClick={closeProgressDialog}
                        disabled={progressSaving}
                        sx={{ borderRadius: 2 }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleSaveQuickNote}
                        disabled={!progressNote.trim() || progressSaving}
                        sx={{ borderRadius: 2 }}
                        startIcon={
                          progressSaving ? (
                            <CircularProgress color="inherit" size={18} thickness={5} />
                          ) : undefined
                        }
                      >
                        Save Note
                      </Button>
                    </DialogActions>
                  </Dialog>
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
                onClick={closeMultiNoteDialog}
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 120000,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(0,0,0,0.45)",
                  padding: "16px",
                }}
              >
                <motion.div
                  key="progress-note-dialog"
                  initial={{ opacity: 0, y: 18, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 18, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                  onClick={(event) => event.stopPropagation()}
                  style={{ width: "100%", maxWidth: "760px" }}
                >
                  <Dialog
                    open
                    onClose={closeMultiNoteDialog}
                    fullWidth
                    maxWidth="md"
                    hideBackdrop
                    disablePortal
                    keepMounted
                    PaperProps={{
                      sx: {
                        borderRadius: 4,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                        boxShadow: "0 32px 90px rgba(8,58,97,0.34)",
                        backgroundImage:
                          "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,247,250,0.96))",
                        overflow: "hidden",
                      },
                    }}
                  >
                    <DialogTitle
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                          sx={{
                            height: 48,
                            width: 48,
                            borderRadius: "50%",
                            bgcolor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 8px 20px rgba(8,58,97,0.35)",
                          }}
                        >
                          <StickyNote size={22} />
                        </Box>
                        <Box>
                          <Typography variant="h6" fontWeight={600} color="text.primary">
                            Bulk Progress Notes
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {multiNoteDialog.tasks.length} task{multiNoteDialog.tasks.length === 1 ? "" : "s"} selected
                          </Typography>
                        </Box>
                      </Stack>
                      <IconButton onClick={closeMultiNoteDialog} aria-label="Close bulk notes dialog">
                        <X size={20} />
                      </IconButton>
                    </DialogTitle>

                    <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <Stack spacing={2}>
                        <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: 1 }}>
                          Selected Tasks
                        </Typography>
                        <Paper
                          variant="outlined"
                          sx={{
                            maxHeight: 180,
                            overflowY: "auto",
                            borderRadius: 3,
                            borderColor: alpha(theme.palette.primary.main, 0.12),
                            bgcolor: alpha(theme.palette.primary.main, 0.03),
                            p: 2,
                          }}
                        >
                          <Stack spacing={1.5}>
                            {multiNotePreview.length === 0 ? (
                              <Typography variant="caption" color="text.secondary">
                                No task identifiers.
                              </Typography>
                            ) : (
                              multiNotePreview.map(({ id, currentStatus }, index) => (
                                <Stack
                                  key={id ?? `multi-note-${index}`}
                                  direction="row"
                                  spacing={2}
                                  alignItems="center"
                                  justifyContent="space-between"
                                  sx={{
                                    borderRadius: 2,
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                                    bgcolor: theme.palette.background.paper,
                                    px: 2,
                                    py: 1.25,
                                  }}
                                >
                                  <Typography variant="subtitle2" color="primary" noWrap>
                                    {id ?? "Unknown Task"}
                                  </Typography>
                                  <Chip
                                    size="small"
                                    label={currentStatus || "-"}
                                    variant="outlined"
                                    sx={{ borderRadius: 2 }}
                                  />
                                </Stack>
                              ))
                            )}
                          </Stack>
                        </Paper>
                      </Stack>

                      <Stack spacing={1.5}>
                        <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: 1 }}>
                          Quick Note
                        </Typography>
                        <TextField
                          multiline
                          minRows={4}
                          value={multiNoteText}
                          onChange={(event) => setMultiNoteText(event.target.value)}
                          placeholder="Share context that applies to all selected tasks…"
                        />
                        <Typography variant="caption" color="text.secondary">
                          This note will be added to each selected task without changing its current status.
                        </Typography>
                      </Stack>

                      {(multiNoteError || multiNoteSuccess) && (
                        <Alert severity={multiNoteError ? "error" : "success"}>
                          {multiNoteError || multiNoteSuccess}
                        </Alert>
                      )}
                    </DialogContent>

                    <DialogActions sx={{ px: 3, py: 2, gap: 1.5 }}>
                      <Button
                        variant="outlined"
                        onClick={closeMultiNoteDialog}
                        disabled={multiNoteSaving}
                        sx={{ borderRadius: 2 }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleSaveMultiNote}
                        disabled={!multiNoteText.trim() || multiNoteSaving}
                        sx={{ borderRadius: 2 }}
                        startIcon={
                          multiNoteSaving ? (
                            <CircularProgress color="inherit" size={18} thickness={5} />
                          ) : undefined
                        }
                      >
                        Save Note
                      </Button>
                    </DialogActions>
                  </Dialog>
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
                onClick={closeSingleNoteDialog}
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 120000,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(0,0,0,0.45)",
                  padding: "16px",
                }}
              >
                <motion.div
                  key="progress-note-single-dialog"
                  initial={{ opacity: 0, y: 18, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 18, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                  onClick={(event) => event.stopPropagation()}
                  style={{ width: "100%", maxWidth: "960px" }}
                >
                  <Dialog
                    open
                    onClose={closeSingleNoteDialog}
                    fullWidth
                    maxWidth="lg"
                    hideBackdrop
                    disablePortal
                    keepMounted
                    PaperProps={{
                      sx: {
                        borderRadius: 4,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                        boxShadow: "0 32px 90px rgba(8,58,97,0.34)",
                        backgroundImage:
                          "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,247,250,0.96))",
                        overflow: "hidden",
                      },
                    }}
                  >
                    <DialogTitle
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                          sx={{
                            height: 48,
                            width: 48,
                            borderRadius: "50%",
                            bgcolor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 8px 20px rgba(8,58,97,0.35)",
                          }}
                        >
                          <StickyNote size={22} />
                        </Box>
                        <Box>
                          <Typography variant="h6" fontWeight={600} color="text.primary">
                            Progress Notes
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {singleNoteSummary.id ? `Task ${singleNoteSummary.id}` : "Selected task"}
                          </Typography>
                        </Box>
                      </Stack>
                      <IconButton onClick={closeSingleNoteDialog} aria-label="Close progress note dialog">
                        <X size={20} />
                      </IconButton>
                    </DialogTitle>

                    <DialogContent
                      dividers
                      sx={{
                        display: "grid",
                        gap: 3,
                        gridTemplateColumns: { lg: "1.6fr 1fr", xs: "1fr" },
                      }}
                    >
                      <Stack spacing={2}>
                        <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: 1 }}>
                          Existing Notes
                        </Typography>
                        <Paper
                          variant="outlined"
                          sx={{
                            maxHeight: 240,
                            overflowY: "auto",
                            borderRadius: 3,
                            borderColor: alpha(theme.palette.primary.main, 0.12),
                            bgcolor: alpha(theme.palette.primary.main, 0.03),
                            p: 2,
                          }}
                        >
                          <Stack spacing={1.5}>
                            {singleNoteDialog.notes.length === 0 ? (
                              <Typography variant="body2" color="text.secondary">
                                No progress notes captured yet.
                              </Typography>
                            ) : (
                              singleNoteDialog.notes.map((note, index) => (
                                <Stack
                                  key={`${note.ts}-${index}`}
                                  spacing={1}
                                  sx={{
                                    borderRadius: 2,
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                                    bgcolor: theme.palette.background.paper,
                                    px: 2,
                                    py: 1.5,
                                    boxShadow: "0 10px 24px rgba(8,58,97,0.1)",
                                  }}
                                >
                                  <Stack
                                    direction="row"
                                    alignItems="center"
                                    justifyContent="space-between"
                                    spacing={2}
                                  >
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                      {formatNoteTimestamp(note.ts)}
                                    </Typography>
                                    <Chip size="small" label={note.status || "Logged"} color="primary" sx={{ borderRadius: 2 }} />
                                  </Stack>
                                  {note.source && (
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        textTransform: "uppercase",
                                        letterSpacing: 0.6,
                                        color: "text.secondary",
                                      }}
                                    >
                                      Source: {note.source}
                                    </Typography>
                                  )}
                                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", color: "text.primary" }}>
                                    {note.text}
                                  </Typography>
                                </Stack>
                              ))
                            )}
                          </Stack>
                        </Paper>
                      </Stack>

                      <Stack spacing={2}>
                        <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: 1 }}>
                          Selected Task
                        </Typography>
                        <Paper
                          variant="outlined"
                          sx={{
                            borderRadius: 3,
                            borderColor: alpha(theme.palette.primary.main, 0.12),
                            bgcolor: alpha(theme.palette.primary.main, 0.03),
                            p: 2,
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={2}
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{
                              borderRadius: 2,
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                              bgcolor: theme.palette.background.paper,
                              px: 2,
                              py: 1.25,
                            }}
                          >
                            <Typography variant="subtitle2" color="primary" noWrap>
                              {singleNoteSummary.id ?? "Unknown Task"}
                            </Typography>
                            <Chip
                              size="small"
                              label={singleNoteSummary.status || "—"}
                              variant="outlined"
                              sx={{ borderRadius: 2 }}
                            />
                          </Stack>
                        </Paper>
                        <Box
                          sx={{
                            borderRadius: 3,
                            border: `1px dashed ${alpha(theme.palette.primary.main, 0.25)}`,
                            bgcolor: alpha(theme.palette.primary.main, 0.06),
                            p: 3,
                          }}
                        >
                          <Typography variant="body2" color="primary">
                            Current status remains
                            <Typography component="span" sx={{ fontWeight: 600, ml: 0.5 }}>
                              {singleNoteSummary.status || "Unknown"}
                            </Typography>
                            .
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
                            Add a quick note without progressing the task status.
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack spacing={1.5} sx={{ gridColumn: "1 / -1" }}>
                        <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: 1 }}>
                          Quick Note
                        </Typography>
                        <TextField
                          multiline
                          minRows={4}
                          value={singleNoteText}
                          onChange={(event) => setSingleNoteText(event.target.value)}
                          placeholder="Share new updates, blockers, or field activity…"
                        />
                        <Typography variant="caption" color="text.secondary">
                          This note will be appended to the task timeline immediately.
                        </Typography>
                      </Stack>

                      {(singleNoteError || singleNoteSuccess) && (
                        <Alert severity={singleNoteError ? "error" : "success"} sx={{ gridColumn: "1 / -1" }}>
                          {singleNoteError || singleNoteSuccess}
                        </Alert>
                      )}
                    </DialogContent>

                    <DialogActions sx={{ px: 3, py: 2, gap: 1.5 }}>
                      <Button
                        variant="outlined"
                        onClick={closeSingleNoteDialog}
                        disabled={singleNoteSaving}
                        sx={{ borderRadius: 2 }}
                      >
                        Close
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleSaveSingleNote}
                        disabled={!singleNoteText.trim() || singleNoteSaving}
                        sx={{ borderRadius: 2 }}
                        startIcon={
                          singleNoteSaving ? (
                            <CircularProgress color="inherit" size={18} thickness={5} />
                          ) : undefined
                        }
                      >
                        Save Note
                      </Button>
                    </DialogActions>
                  </Dialog>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </Paper>
  );
}
