// ============================================================================
// ResourceTablePanel.tsx — FINAL CLEAN VERSION
// Fully wired to useLiveSelectEngine.
// No selection logic — only forwards table selections.
// ============================================================================

import React, { useMemo, useState, useEffect } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import TaskTableAdvanced from "@/tasks/TaskTableAdvanced";
import type { ResourceRecord } from "@/hooks/useLiveSelectEngine";

const PRIORITY_KEYS: string[] = [
  "resourceId",
  "name",
  "status",
  "calloutGroup",
  "primarySkill",
  "availableAgainAt",
];

function prettifyLabel(key: string): string {
  return key
    .replace(/[_\-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

interface Props {
  data: ResourceRecord[];
  selectedResources: ResourceRecord[];
  onSelectionChange: (rows: ResourceRecord[]) => void;
  selectionFromMap: boolean;
  onClearSelection?: () => void;
}

export default function ResourceTablePanel({
  data,
  selectedResources,
  onSelectionChange,
  selectionFromMap,
  onClearSelection,
}: Props) {
  const theme = useTheme();
  const [currentSortModel, setCurrentSortModel] = useState<any[]>([]);
  const [pinnedOrder, setPinnedOrder] = useState<string[]>([]);
  const [prevDataLength, setPrevDataLength] = useState(0);

  /* ------------------------------------------------------------------------
     AUTO BUILD HEADERS
  ------------------------------------------------------------------------ */
  const headerNames = useMemo(() => {
    if (!data?.length) return {};

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

  /* ------------------------------------------------------------------------
     PINNED ORDER: Selected items stay at top until user sorts or data changes
  ------------------------------------------------------------------------ */
  useEffect(() => {
    // Reset pinned order when data is cleared (new search started)
    if (prevDataLength > 0 && data.length === 0) {
      setPinnedOrder([]);
    }
    setPrevDataLength(data.length);
  }, [data.length, prevDataLength]);

  useEffect(() => {
    // Add newly selected items from map to the top of pinned order
    // Always do this when we have map selections
    if (selectionFromMap && selectedResources.length > 0) {
      const currentPinnedIds = new Set(pinnedOrder);
      const newSelectedIds = selectedResources
        .map(r => String(r.resourceId))
        .filter(id => !currentPinnedIds.has(id));
      
      if (newSelectedIds.length > 0) {
        setPinnedOrder(prev => [...newSelectedIds, ...prev]);
      }
    }
  }, [selectedResources, selectionFromMap]);

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
    const pinnedItems: ResourceRecord[] = [];
    const unpinnedItems: ResourceRecord[] = [];
    
    data.forEach(item => {
      const itemId = String(item.resourceId);
      if (pinnedOrder.includes(itemId)) {
        pinnedItems.push(item);
      } else {
        unpinnedItems.push(item);
      }
    });
    
    // Sort pinned items according to pinned order (not by column criteria)
    pinnedItems.sort((a, b) => {
      const aIndex = pinnedOrder.indexOf(String(a.resourceId));
      const bIndex = pinnedOrder.indexOf(String(b.resourceId));
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
  }, [data, pinnedOrder, currentSortModel]);

  /* ------------------------------------------------------------------------
     CONTROLLED SELECTION SET
  ------------------------------------------------------------------------ */
  const selectedRowIds = useMemo(() => {
    if (!selectedResources?.length) return new Set<string>();
    return new Set(selectedResources.map((r) => String(r.resourceId)));
  }, [selectedResources]);

  /* ------------------------------------------------------------------------
     EMPTY STATE
  ------------------------------------------------------------------------ */
  if (!data || data.length === 0) {
    return (
      <Stack spacing={1} alignItems="center" justifyContent="center" sx={{ flex: 1, height: '100%', minHeight: 0 }}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          No resources loaded. Please define filters and press Search.
        </Typography>
      </Stack>
    );
  }

  /* ------------------------------------------------------------------------
     MAIN RENDER — controlled selection only
  ------------------------------------------------------------------------ */
  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", height: '100%', minHeight: 0, overflow: 'auto' }}>
      <TaskTableAdvanced
        rows={displayData}
        headerNames={headerNames}
        sx={{ height: '100%' }}
        tableHeight="100%"
        rowIdKey="resourceId"
        controlledSelectedRowIds={selectedRowIds}
        disablePagination={true}
        onSelectionChange={(rows: ResourceRecord[]) =>
          onSelectionChange(rows as ResourceRecord[])
        }
        onSortChange={(hasSorting: boolean, sortModel?: any[]) => {
          setCurrentSortModel(sortModel || []);
          // Clear pinned order when sorting changes - everything reshuffles
          if (hasSorting || (sortModel && sortModel.length === 0)) {
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
