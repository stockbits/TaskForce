// ============================================================================
// useLiveSelectEngine.ts
// Centralised, bulletproof selection engine for Schedule Live.
// ✔ Instant map click selection
// ✔ CTRL multi-select
// ✔ Map selection stays even when user drags the map
// ✔ Table selection NEVER overrides map selection during drag or map-select
// ✔ Table & map always stay in sync
// useLiveSelectEngine.ts — With optional debugging
// ============================================================================

import { useRef, useState, useEffect } from "react";

const DEBUG_SELECT = true; // ← Set to false to disable ALL debug logging

export interface TaskRecord {
  taskId: string;
  lat?: number;
  lng?: number;
  [key: string]: any;
}

export interface ResourceRecord {
  resourceId: string;
  homeLat?: number;
  homeLng?: number;
  [key: string]: any;
}

export type SelectionOrigin = "map" | "table" | "clear" | null;

export function useLiveSelectEngine() {
  const [selectedTasks, setSelectedTasks] = useState<TaskRecord[]>([]);
  const [selectedResources, setSelectedResources] = useState<ResourceRecord[]>(
    []
  );
  const [shouldZoom, setShouldZoom] = useState(true);

  const originRef = useRef<SelectionOrigin>(null);
  const mapSelectingRef = useRef(false);
  const mapDraggingRef = useRef(false);

  // Derived singles
  const selectedTask = selectedTasks.length === 1 ? selectedTasks[0] : null;
  const selectedResource =
    selectedResources.length === 1 ? selectedResources[0] : null;

  // Debug selector
  useEffect(() => {
    if (!DEBUG_SELECT) return;
    console.log(
      "→ SELECTED TASKS:",
      selectedTasks.map((t) => t.taskId)
    );
    console.log(
      "→ SELECTED RESOURCES:",
      selectedResources.map((r) => r.resourceId)
    );
  }, [selectedTasks, selectedResources]);

  // ========================================================================
  // INTERNAL APPLY
  // ========================================================================
  const applySelection = <T>(
    items: T[],
    setter: (rows: T[]) => void,
    origin: SelectionOrigin
  ) => {
    if (DEBUG_SELECT)
      console.log("APPLY SELECTION (origin:", origin, ")", items);

    originRef.current = origin;
    setter(items);

    setTimeout(() => {
      originRef.current = null;
    }, 0);
  };

  // ========================================================================
  // TASK — MAP CLICK
  // ========================================================================
  const handleTaskMapClick = (task: TaskRecord, multi = false) => {
    if (DEBUG_SELECT)
      console.log("MAP CLICK TASK:", task.taskId, "multi:", multi);

    setShouldZoom(false);
    originRef.current = "map";
    mapSelectingRef.current = true;

    setSelectedTasks((prev) => {
      if (!multi) return [task];
      const exists = prev.some((p) => p.taskId === task.taskId);
      return exists
        ? prev.filter((p) => p.taskId !== task.taskId)
        : [...prev, task];
    });

    setTimeout(() => {
      originRef.current = null;
      mapSelectingRef.current = false;
    }, 30);
  };

  // ========================================================================
  // TASK — TABLE SELECT
  // ========================================================================
  const handleTaskTableSelect = (rows: TaskRecord[]) => {
    if (DEBUG_SELECT)
      console.log(
        "TABLE SELECT TASKS:",
        rows.map((r) => r.taskId)
      );

    if (
      mapSelectingRef.current ||
      originRef.current === "map" ||
      mapDraggingRef.current
    ) {
      if (DEBUG_SELECT)
        console.log("TABLE IGNORED — map is selecting/dragging");
      return;
    }

    setShouldZoom(true);
    applySelection(rows, setSelectedTasks, "table");
  };

  // ========================================================================
  // RESOURCE — MAP CLICK
  // ========================================================================
  const handleResourceMapClick = (res: ResourceRecord, multi = false) => {
    if (DEBUG_SELECT)
      console.log("MAP CLICK RESOURCE:", res.resourceId, "multi:", multi);

    setShouldZoom(false);
    originRef.current = "map";
    mapSelectingRef.current = true;

    setSelectedResources((prev) => {
      if (!multi) return [res];
      const exists = prev.some((p) => p.resourceId === res.resourceId);
      return exists
        ? prev.filter((p) => p.resourceId !== res.resourceId)
        : [...prev, res];
    });

    setTimeout(() => {
      originRef.current = null;
      mapSelectingRef.current = false;
    }, 30);
  };

  // ========================================================================
  // RESOURCE — TABLE SELECT
  // ========================================================================
  const handleResourceTableSelect = (rows: ResourceRecord[]) => {
    if (DEBUG_SELECT)
      console.log(
        "TABLE SELECT RESOURCES:",
        rows.map((r) => r.resourceId)
      );

    if (
      mapSelectingRef.current ||
      originRef.current === "map" ||
      mapDraggingRef.current
    ) {
      if (DEBUG_SELECT)
        console.log("TABLE IGNORED — map is selecting/dragging");
      return;
    }

    setShouldZoom(true);
    applySelection(rows, setSelectedResources, "table");
  };

  // ========================================================================
  // MAP DRAG EVENTS
  // ========================================================================
  const notifyMapDragStart = () => {
    if (DEBUG_SELECT) console.log("MAP DRAG START");
    mapDraggingRef.current = true;
  };

  const notifyMapDragEnd = () => {
    if (DEBUG_SELECT) console.log("MAP DRAG END");
    // Small delay to allow drag inertia
    setTimeout(() => {
      mapDraggingRef.current = false;
      if (DEBUG_SELECT) console.log("MAP DRAG CLEAR");
    }, 80);
  };

  // ========================================================================
  // CLEAR ALL
  // ========================================================================
  const clearAll = () => {
    if (DEBUG_SELECT) console.log("CLEAR ALL");

    originRef.current = "clear";
    setSelectedTasks([]);
    setSelectedResources([]);
    setShouldZoom(true);

    setTimeout(() => {
      originRef.current = null;
    }, 0);
  };

  return {
    selectedTasks,
    selectedTask,
    handleTaskMapClick,
    handleTaskTableSelect,

    selectedResources,
    selectedResource,
    handleResourceMapClick,
    handleResourceTableSelect,

    shouldZoom,

    notifyMapDragStart,
    notifyMapDragEnd,

    clearAll,
  };
}
