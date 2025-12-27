# Map Selection Pinning Logic Documentation

## Overview
The pinning system allows users to bring tasks/resources to the top of tables by selecting them from the map, even when column sorting is active. This provides immediate visibility of requested work regardless of current sort state.

## Core Components

### 1. **Pinned Order State**
```typescript
const [pinnedOrder, setPinnedOrder] = useState<string[]>([]);
```
- Maintains array of item IDs in the order they should appear at top
- Newest selections appear first (prepended to array)

### 2. **Map Selection Detection**
```typescript
useEffect(() => {
  if (selectionFromMap && selectedTasks.length > 0) {
    const newSelectedIds = selectedTasks
      .map(t => String(t.taskId))
      .filter(id => !currentPinnedIds.has(id));

    if (newSelectedIds.length > 0) {
      setPinnedOrder(prev => [...newSelectedIds, ...prev]); // Prepend new items
    }
  }
}, [selectedTasks, selectionFromMap]);
```
- Triggers when `selectionFromMap` is true (user clicked map)
- Adds new selections to front of pinned order
- Prevents duplicates

### 3. **Sort State Management**
```typescript
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
```
- Clears pinned order when user sorts (reshuffles everything)
- Clears table selections when sorting starts
- Tracks current sort criteria for display logic

### 4. **Display Data Logic**
```typescript
const displayData = useMemo(() => {
  // No pinned items: sort all data by current criteria
  if (pinnedOrder.length === 0) {
    return sortedData;
  }

  // Pinned items exist: split and reorder
  const pinnedItems = [];
  const unpinnedItems = [];

  data.forEach(item => {
    if (pinnedOrder.includes(String(item.taskId))) {
      pinnedItems.push(item);
    } else {
      unpinnedItems.push(item);
    }
  });

  // Sort pinned by selection order, unpinned by column criteria
  pinnedItems.sort(/* by pinnedOrder index */);
  unpinnedItems.sort(/* by current sort model */);

  return [...pinnedItems, ...unpinnedItems];
}, [data, pinnedOrder, currentSortModel]);
```

## Behavior Matrix

| Scenario | Pinned Order | Table Selections | Display |
|----------|-------------|------------------|---------|
| **No Sort + Map Select** | ✅ Add to top | ✅ Keep | Pinned first, rest original order |
| **Sort Active + Map Select** | ✅ Add to top | ✅ Keep | Pinned first, rest sorted by column |
| **Sort Column** | ❌ Clear | ❌ Clear | Everything sorted by column |
| **Sort Removed** | ❌ Clear | ❌ Clear | Original order |

## Key Technical Details

- **Server-Side Sorting**: DataGrid uses `sortingMode="server"` to prevent client-side sorting from overriding our pinned ordering
- **Dependency Management**: useEffect avoids `pinnedOrder` in deps to prevent loops
- **Type Safety**: Robust sorting handles null/undefined values and mixed data types
- **Performance**: useMemo ensures displayData only recalculates when necessary

## User Experience
- Map clicks always bring selected items to top of current view
- Column sorting clears pinning (reshuffles everything)
- Selected items ignore column sort order when pinned
- Unpinned items follow current column sort criteria

## Implementation Files
- `src/schedule/TaskTablePanel.tsx` - Task table pinning logic
- `src/schedule/ResourceTablePanel.tsx` - Resource table pinning logic
- `src/shared-ui/ResponsiveTable/TaskTableMUI.tsx` - DataGrid server-side sorting

This system provides intuitive "bring to top" functionality while respecting user sorting preferences.