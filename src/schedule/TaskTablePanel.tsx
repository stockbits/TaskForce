// ============================================================================
// TaskTablePanel.tsx — FINAL VERSION
// Fully wired to useLiveSelectEngine.
// No selection logic inside — only forwards table selections.
// ============================================================================

import React, { useMemo, useState, useEffect } from "react";
import { Box, Stack, Typography } from "@mui/material";
import TaskTableAdvanced from "@/tasks/TaskTableAdvanced";
import type { TaskRecord } from "@/hooks/useLiveSelectEngine";

const PRIORITY_KEYS = [
  "taskId",
  "taskStatus",
  "employeeId",
  "resourceName",
  "commitmentType",
  "postCode",
  "customerAddress",
  "taskType",
  "primarySkill",
  "importanceScore",
  "taskCreated",
  "appointmentStartDate",
];

function prettifyLabel(key: string) {
  return key
    .replace(/[_\-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

interface TaskTablePanelProps {
  data: TaskRecord[];
  selectedTasks: TaskRecord[];
  onSelectionChange: (rows: TaskRecord[]) => void;
  selectionFromMap: boolean;
  onClearSelection?: () => void;
}

export default function TaskTablePanel({
  data,
  selectedTasks,
  onSelectionChange,
  selectionFromMap,
  onClearSelection,
}: TaskTablePanelProps) {
  const [currentSortModel, setCurrentSortModel] = useState<any[]>([]);
  const [pinnedOrder, setPinnedOrder] = useState<string[]>([]);
  const [prevDataLength, setPrevDataLength] = useState(0);

  /* ==========================================================================
     AUTO HEADER BUILDER
     ========================================================================== */
  const headerNames = useMemo(() => {
    if (!data || data.length === 0) return {};

    const all = new Set<string>();
    data.forEach((row) => Object.keys(row).forEach((k) => all.add(k)));

    const ordered = [
      ...PRIORITY_KEYS.filter((k) => all.has(k)),
      ...[...all].filter((k) => !PRIORITY_KEYS.includes(k)),
    ];

    const out: Record<string, string> = {};
    ordered.forEach((key) => (out[key] = prettifyLabel(key)));
    return out;
  }, [data]);

  /* ==========================================================================
     PINNED ORDER: Selected items stay at top until user sorts or data changes
  ========================================================================== */
  useEffect(() => {
    // Reset pinned order when data is cleared (new search started)
    if (prevDataLength > 0 && data.length === 0) {
      setPinnedOrder([]);
    }
    setPrevDataLength(data.length);
  }, [data.length, prevDataLength]);

  useEffect(() => {
    // Pin currently selected items to the top - replace pinned order with current selection
    const selectedIds = selectedTasks.map(t => String(t.taskId));
    setPinnedOrder(selectedIds);
  }, [selectedTasks]);

  const displayData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // If no pinned items, return data sorted by current sort model
    if (pinnedOrder.length === 0) {
      let sortedData = [...data];
      if (currentSortModel && currentSortModel.length > 0) {
        sortedData.sort((a, b) => {
          for (const sortItem of currentSortModel) {
            const { field, sort } = sortItem;
            const aValue = a[field];
            const bValue = b[field];
            
            // Handle null/undefined values
            if (aValue == null && bValue == null) continue;
            if (aValue == null) return sort === 'desc' ? 1 : -1;
            if (bValue == null) return sort === 'desc' ? -1 : 1;
            
            let comparison = 0;
            if (typeof aValue === 'string' && typeof bValue === 'string') {
              comparison = aValue.localeCompare(bValue);
            } else if (typeof aValue === 'number' && typeof bValue === 'number') {
              comparison = aValue - bValue;
            } else {
              // Convert to strings for comparison
              const aStr = String(aValue);
              const bStr = String(bValue);
              comparison = aStr.localeCompare(bStr);
            }
            
            if (comparison !== 0) {
              return sort === 'desc' ? -comparison : comparison;
            }
          }
          return 0;
        });
      }
      return sortedData;
    }
    
    // Split data: pinned items first (in pinned order), then unpinned sorted by current criteria
    const pinnedItems: TaskRecord[] = [];
    const unpinnedItems: TaskRecord[] = [];
    
    data.forEach(item => {
      const itemId = String(item.taskId);
      if (pinnedOrder.includes(itemId)) {
        pinnedItems.push(item);
      } else {
        unpinnedItems.push(item);
      }
    });
    
    // Sort pinned items according to pinned order (not by column criteria)
    pinnedItems.sort((a, b) => {
      const aIndex = pinnedOrder.indexOf(String(a.taskId));
      const bIndex = pinnedOrder.indexOf(String(b.taskId));
      return aIndex - bIndex;
    });
    
    // Sort unpinned items by current sort criteria
    if (currentSortModel && currentSortModel.length > 0) {
      unpinnedItems.sort((a, b) => {
        for (const sortItem of currentSortModel) {
          const { field, sort } = sortItem;
          const aValue = a[field];
          const bValue = b[field];
          
          // Handle null/undefined values
          if (aValue == null && bValue == null) continue;
          if (aValue == null) return sort === 'desc' ? 1 : -1;
          if (bValue == null) return sort === 'desc' ? -1 : 1;
          
          let comparison = 0;
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            comparison = aValue.localeCompare(bValue);
          } else if (typeof aValue === 'number' && typeof bValue === 'number') {
            comparison = aValue - bValue;
          } else {
            // Convert to strings for comparison
            const aStr = String(aValue);
            const bStr = String(bValue);
            comparison = aStr.localeCompare(bStr);
          }
          
          if (comparison !== 0) {
            return sort === 'desc' ? -comparison : comparison;
          }
        }
        return 0;
      });
    }
    
    return [...pinnedItems, ...unpinnedItems];
  }, [data, pinnedOrder, currentSortModel]).map(item => item).sort((a, b) => {
    // Favor "Assigned (ACT)" by sorting it first
    const statusA = a.taskStatus || '';
    const statusB = b.taskStatus || '';
    if (statusA === 'Assigned (ACT)' && statusB !== 'Assigned (ACT)') return -1;
    if (statusB === 'Assigned (ACT)' && statusA !== 'Assigned (ACT)') return 1;
    return 0; // Keep other orders as is
  });

  /* ==========================================================================
     CONTROLLED SELECTION SET
  ========================================================================== */
  const selectedRowIds = useMemo(() => {
    if (!selectedTasks?.length) return new Set<string>();
    return new Set(selectedTasks.map((t) => String(t.taskId)));
  }, [selectedTasks]);
  /* ==========================================================================
     EMPTY STATE
     ========================================================================== */
  if (!data || data.length === 0) {
    return (
      <Stack spacing={1} alignItems="center" justifyContent="center" sx={{ flex: 1, height: '100%', minHeight: 0 }}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          No tasks loaded yet. Please define filters and press Search.
        </Typography>
      </Stack>
    );
  }

  /* ==========================================================================
     MAIN RENDER — forward selection only
     ========================================================================== */
  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", height: '100%', minHeight: 0, overflow: 'auto' }}>
      <TaskTableAdvanced
        rows={displayData}
        headerNames={headerNames}
        sx={{ height: '100%' }}
        hideToolbar={true}
        tableHeight="100%"
        rowIdKey="taskId"
        controlledSelectedRowIds={selectedRowIds}
        disablePagination={true}
        sortingMode={pinnedOrder.length > 0 ? 'server' : 'client'}
        sortModel={pinnedOrder.length > 0 ? [] : currentSortModel}
        onSelectionChange={(rows: TaskRecord[]) => onSelectionChange(rows as TaskRecord[])}
        onSortChange={(hasSorting: boolean, sortModel?: any[]) => {
          setCurrentSortModel(sortModel || []);
          // Clear pinned order when user applies sorting
          if (hasSorting) {
            setPinnedOrder([]);
          }
          // Clear all selections when user applies sorting
          if (hasSorting && onClearSelection) {
            onClearSelection();
          }
        }}
      />
    </Box>
  );
}
