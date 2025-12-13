import { GridColDef } from '@mui/x-data-grid';

const STORAGE_KEY = 'taskTable_columns_v1';

export function loadPersistedColumns(): { order?: string[]; widths?: Record<string, number>; hidden?: string[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function savePersistedColumns(payload: { order?: string[]; widths?: Record<string, number>; hidden?: string[] }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    // ignore
  }
}

export function applyPersistedColumns(cols: GridColDef[], persisted: ReturnType<typeof loadPersistedColumns>) {
  if (!persisted) return cols;
  const widths = persisted.widths || {};
  const hiddenSet = new Set(persisted.hidden || []);
  const order = persisted.order || [];
  // reorder
  if (order.length) {
    const map = new Map(cols.map((c) => [c.field, c]));
    const ordered: GridColDef[] = [];
    order.forEach((f) => {
      if (map.has(f)) ordered.push({ ...(map.get(f) as GridColDef) });
    });
    // append any missing
    cols.forEach((c) => {
      if (!order.includes(c.field)) ordered.push({ ...c });
    });
    cols = ordered;
  } else {
    cols = cols.map((c) => ({ ...c }));
  }

  return cols.map((c) => ({ ...c, width: widths[c.field] ?? c.width, hide: hiddenSet.has(c.field) }));
}
