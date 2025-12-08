// src/A-Navigation_Container/TaskTable_Advanced.tsx
import React, {
  useMemo,
  useRef,
  useState,
  useEffect,
  MouseEvent,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  const [columnMenu, setColumnMenu] = useState<{
    x: number;
    y: number;
    visible: boolean;
    key: string | null;
  }>({ x: 0, y: 0, visible: false, key: null });

  // Column menu filter
  const [columnFilter, setColumnFilter] = useState("");

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
              style={{ maxHeight: "calc(var(--vh, 1vh) * 28)" }}
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
      />
    </div>
  );
}
