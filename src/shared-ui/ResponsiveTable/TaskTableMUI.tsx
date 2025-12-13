import React, { useMemo, useState, useEffect, MutableRefObject, useRef } from 'react';
import { Box, useTheme, Paper, Stack, Typography, TextField, InputAdornment, Divider, Button, FormControlLabel, Checkbox } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import ResponsiveDataGrid from './ResponsiveDataGrid';
import { loadPersistedColumns, applyPersistedColumns, savePersistedColumns } from './usePersistedColumns';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, MoreVertical } from 'lucide-react';
import TaskRowContextMenu from '@/shared-ui/TaskRowContextMenu';

type Props = {
  rows: Record<string, any>[];
  headerNames: Record<string, string>;
  tableHeight?: number | string;
  containerRef?: MutableRefObject<HTMLElement | null>;
  reserveBottom?: number;
  debug?: boolean;
  onOpenPopout?: (tasks: Record<string, any>[], mouseScreenX: number, mouseScreenY: number) => void;
  onSelectionChange?: (rows: Record<string, any>[]) => void;
};

export default function TaskTableMUI({ rows, headerNames, tableHeight = 600, containerRef, reserveBottom = 160, debug = false, onOpenPopout, onSelectionChange }: Props) {
  const [selection, setSelection] = useState<any[]>([]);
  const theme = useTheme();

  const density = (typeof window !== 'undefined' && localStorage.getItem('taskTableDensity')) || 'compact';

  const columns: GridColDef[] = useMemo(() => {
    return Object.keys(headerNames).map((key) => ({
      field: key,
      headerName: headerNames[key] ?? key,
      flex: 1,
      minWidth: 120,
      sortable: true,
      resizable: true as any,
    }));
  }, [headerNames]);

  const gridRows = useMemo(() => {
    return rows.map((r, idx) => ({ id: r.taskId ?? r.workId ?? idx, ...r }));
  }, [rows]);

  // column state with persistence
  const [colState, setColState] = useState<GridColDef[]>(() => columns);

  useEffect(() => {
    setColState(columns);
  }, [columns]);

  useEffect(() => {
    try {
      const persisted = loadPersistedColumns();
      if (persisted) {
        const applied = applyPersistedColumns(columns, persisted);
        setColState(applied);
      }
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // handle right-click on rows to open context menu
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const onRowContextMenu = (params: any, event: React.MouseEvent) => {
    event.preventDefault();
    const colElem = (event.target as HTMLElement).closest('[data-field]') as HTMLElement | null;
    const colKey = colElem ? colElem.getAttribute('data-field') : null;
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      clickedRow: params.row,
      clickedColumnKey: colKey,
      mouseScreenX: (event as any).screenX ?? 0,
      mouseScreenY: (event as any).screenY ?? 0,
    });
  };

  useEffect(() => {
    if (onSelectionChange) {
      const selected = gridRows.filter((r) => selection.includes(r.id));
      onSelectionChange(selected as Record<string, any>[]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection]);

  // column menu state (simple column selector)
  const [columnMenuVisible, setColumnMenuVisible] = useState(false);
  const [columnFilter, setColumnFilter] = useState('');
  const [columnVisibilityModel, setColumnVisibilityModel] = useState<Record<string, boolean>>(() => {
    const model: Record<string, boolean> = {};
    columns.forEach((c) => { model[c.field] = !(c as any).hide; });
    return model;
  });

  useEffect(() => {
    // keep visibility model in sync when colState changes
    setColumnVisibilityModel(() => {
      const model: Record<string, boolean> = {};
      (colState || columns).forEach((c) => { model[c.field] = !c.hide; });
      return model;
    });
  }, [colState, columns]);

  const resetColumns = () => {
    try {
      savePersistedColumns({});
    } catch (e) {}
    setColState(columns.map((c) => ({ ...c })));
    setColumnVisibilityModel(() => {
      const model: Record<string, boolean> = {};
      columns.forEach((c) => { model[c.field] = true; });
      return model;
    });
  };

  // context menu for rows
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; clickedRow?: any; clickedColumnKey?: string | null; mouseScreenX?: number; mouseScreenY?: number }>({ visible: false, x: 0, y: 0 });
  const closeContextMenu = () => setContextMenu({ visible: false, x: 0, y: 0 });


  return (
    <Box sx={{ width: '100%', display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
      {/* simple header toolbar for table controls */}
      <Box sx={{ position: 'absolute', top: 8, left: 12, zIndex: 1200 }}>
        <Button size="small" variant="outlined" onClick={() => setColumnMenuVisible((v) => !v)} startIcon={<MoreVertical size={14} />}>Columns</Button>
      </Box>

      <AnimatePresence>
        {columnMenuVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            style={{ position: 'absolute', top: 44, left: 12, zIndex: 1300 }}
          >
            <Paper elevation={10} sx={{ width: 320, p: 2 }} onMouseDown={(e) => e.stopPropagation()}>
              <Stack spacing={1}>
                <Typography variant="overline" sx={{ color: 'text.secondary' }}>Header Settings</Typography>
                <TextField
                  size="small"
                  placeholder="Filter columns…"
                  value={columnFilter}
                  onChange={(e) => setColumnFilter(e.target.value)}
                  InputProps={{ startAdornment: (<InputAdornment position="start"><Search size={14} /></InputAdornment>) }}
                />
                <Divider />
                <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                  {columns.filter((key) => {
                    if (!columnFilter.trim()) return true;
                    const name = (headerNames as any)[key.field] ?? key.field;
                    return String(name).toLowerCase().includes(columnFilter.toLowerCase());
                  }).map((c) => (
                    <FormControlLabel key={c.field} control={(
                      <Checkbox size="small" checked={!!columnVisibilityModel[c.field]} onChange={(e) => {
                        const next = { ...columnVisibilityModel, [c.field]: e.target.checked };
                        setColumnVisibilityModel(next);
                        // apply hide
                        setColState((prev) => prev.map((pc) => pc.field === c.field ? { ...pc, hide: !e.target.checked } : pc));
                        try {
                          const cur = loadPersistedColumns() || {};
                          const hidden = Object.keys(next).filter(k => !next[k]);
                          savePersistedColumns({ ...cur, hidden });
                        } catch (err) {}
                      }} />
                    )} label={<Typography variant="body2">{headerNames[c.field] ?? c.field}</Typography>} sx={{ display: 'flex', px: 0.5 }} />
                  ))}
                </Box>
                <Divider />
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button size="small" variant="outlined" onClick={() => {
                    const anyEnabled = Object.values(columnVisibilityModel).some(Boolean);
                    const next = {} as Record<string, boolean>;
                    columns.forEach((c) => { next[c.field] = !anyEnabled ? true : false; });
                    setColumnVisibilityModel(next);
                    setColState((prev) => prev.map((pc) => ({ ...pc, hide: !next[pc.field] })));
                    try {
                      const cur = loadPersistedColumns() || {};
                      const hidden = Object.keys(next).filter(k => !next[k]);
                      savePersistedColumns({ ...cur, hidden });
                    } catch (err) {}
                  }}>Toggle</Button>
                  <Button size="small" variant="contained" onClick={() => { resetColumns(); setColumnMenuVisible(false); }}>Reset Columns</Button>
                </Stack>
              </Stack>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      <ResponsiveDataGrid
        rows={gridRows}
        columns={colState}
        containerRef={containerRef}
        debug={debug}
        checkboxSelection
        disableColumnMenu
        density={density as 'compact' | 'standard' | 'comfortable'}
        onRowSelectionModelChange={(newModel) => setSelection(newModel as any[])}
        rowSelectionModel={selection}
        pageSizeOptions={[25, 50, 100]}
        initialState={{ pagination: { paginationModel: { pageSize: 100 } } }}
        onRowDoubleClick={(params, event) => {
          if (onOpenPopout) onOpenPopout([params.row as any], (event as any).screenX ?? 0, (event as any).screenY ?? 0);
        }}
        onRowContextMenu={onRowContextMenu}
        reserveBottom={reserveBottom}
        sx={{
          '& .MuiDataGrid-cell': { py: density === 'compact' ? 0.5 : 1 },
          '& .MuiDataGrid-columnHeader': { py: 1 },
          '& .MuiDataGrid-columnHeaders': { backgroundColor: theme.palette.action.hover },
        }}
        onColumnResize={(params: any) => {
          const { colDef, width } = params;
          setColState((prev) => prev.map((c) => (c.field === colDef.field ? { ...c, width } : c)));
          // persist widths
          try {
            const cur = loadPersistedColumns() || {};
            const widths = { ...(cur.widths || {}) };
            widths[colDef.field] = width;
            savePersistedColumns({ ...cur, widths });
          } catch (e) {}
        }}
        onColumnVisibilityModelChange={(model: any) => {
          try {
            const cur = loadPersistedColumns() || {};
            const hidden = Object.keys(model).filter((k) => !model[k]);
            savePersistedColumns({ ...cur, hidden });
          } catch (e) {}
        }}
        onColumnOrderChange={(params: any) => {
          try {
            const cur = loadPersistedColumns() || {};
            const order = params.columnFields || params.items || [];
            savePersistedColumns({ ...cur, order });
          } catch (e) {}
        }}
      />
      {/* Row context menu (portal) */}
      <TaskRowContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        selectedRows={gridRows.filter((r) => selection.includes(r.id))}
        clickedColumnKey={contextMenu.clickedColumnKey ?? null}
        clickedRow={contextMenu.clickedRow ?? null}
        onClose={closeContextMenu}
        mouseScreenX={contextMenu.mouseScreenX ?? 0}
        mouseScreenY={contextMenu.mouseScreenY ?? 0}
        onOpenPopout={(tasks: any[], mX: number, mY: number) => {
          if (onOpenPopout) onOpenPopout(tasks, mX, mY);
        }}
        onOpenCalloutIncident={(task: any) => {
          /* forward if provided via props */
        }}
        onProgressTasks={(tasks: any[]) => {
          /* parent can attach handler via props if needed */
        }}
        onProgressNotes={(tasks: any[]) => {
          /* parent can attach handler via props if needed */
        }}
      />
    </Box>
  );
}
