import React, { useMemo, useState, useEffect, MutableRefObject, useRef, memo } from 'react';
import { Box, useTheme, Paper, Typography } from '@mui/material';
import { useAppSnackbar } from '@/shared-ui/SnackbarProvider';
import { GridColDef, useGridApiRef, GridToolbarContainer, GridToolbarColumnsButton, GridToolbarFilterButton, GridToolbarDensitySelector } from '@mui/x-data-grid';
import { DataGrid } from '@mui/x-data-grid';
// keep imports minimal: use built-in DataGrid behavior
// framer-motion removed — using static elements
// icon imports removed (unused)
import TaskRowContextMenu from '@/shared-ui/TaskRowContextMenu';

 type Props = {
  rows: Record<string, any>[];
  headerNames: Record<string, string>;
  tableHeight?: number | string;
  containerRef?: MutableRefObject<HTMLElement | null>;
  reserveBottom?: number;
  debug?: boolean;
  disablePagination?: boolean;
  hideToolbar?: boolean;
  controlledSelectedRowIds?: string[];
  rowIdKey?: string;
  onOpenPopout?: (tasks: Record<string, any>[], mouseScreenX: number, mouseScreenY: number) => void;
  onSelectionChange?: (rows: Record<string, any>[]) => void;
  onOpenCalloutIncident?: (task: Record<string, any>) => void;
  onProgressTasks?: (tasks: Record<string, any>[]) => void;
  onProgressNotes?: (tasks: Record<string, any>[]) => void;
  openColumnsAnchor?: HTMLElement | null;
  onRequestCloseColumns?: () => void;
  onSortChange?: (hasSorting: boolean, sortModel?: any[]) => void;
  scrollToTopTrigger?: number;
  sortingMode?: 'client' | 'server';
  sortModel?: any[];
};

const TaskTableMUIComponent = memo(function TaskTableMUI({ rows, headerNames, tableHeight = 600, containerRef: _containerRef, reserveBottom: _reserveBottom = 160, disablePagination = false, hideToolbar = false, controlledSelectedRowIds, rowIdKey, onOpenPopout, onSelectionChange, onOpenCalloutIncident, onProgressTasks, onProgressNotes, openColumnsAnchor, onRequestCloseColumns: _onRequestCloseColumns, onSortChange, scrollToTopTrigger, sortingMode, sortModel }: Props) {
  // Internal state for uncontrolled components
  const [selection, setSelection] = useState<string[]>([]);
  
  // For controlled components, use controlledSelectedRowIds directly as rowSelectionModel
  const rowSelectionModel = controlledSelectedRowIds !== undefined
    ? (Array.isArray(controlledSelectedRowIds)
        ? controlledSelectedRowIds
        : Array.from(controlledSelectedRowIds as Set<string>))
    : selection;
  const theme = useTheme();
  const colStateRef = useRef<GridColDef[]>([]);
  

  const density = (typeof window !== 'undefined' && localStorage.getItem('taskTableDensity')) || 'compact';

  const columns: GridColDef[] = useMemo(() => {
    // Small component for rendering a copyable cell: clicking the text copies value and flashes a highlight
    const CellWithCopy: React.FC<{ value: any }> = ({ value }) => {
      const [copied, setCopied] = React.useState(false);
      const display = value == null ? '' : String(value);
      const snackbar = useAppSnackbar();
      const theme = useTheme();

      const handleCopy = async (ev: React.MouseEvent) => {
        ev.stopPropagation();
        try {
          await navigator.clipboard.writeText(display);
          setCopied(true);
          snackbar.success('Copied to clipboard');
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          try {
            const ta = document.createElement('textarea');
            ta.value = display;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
            setCopied(true);
            snackbar.success('Copied to clipboard');
            window.setTimeout(() => setCopied(false), 1500);
          } catch {
            snackbar.error('Copy failed');
          }
        }
      };

      return (
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1, position: 'relative' }} className="tf-cell-copy">
          <Typography
            variant="body2"
            onClick={handleCopy}
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              px: 0.25,
              transition: theme.transitions.create(['color', 'background-color'], {
                duration: theme.transitions.duration.shortest,
              }),
              backgroundColor: copied ? theme.palette.success.main : 'transparent',
              color: copied ? theme.palette.success.contrastText : 'inherit',
              cursor: 'pointer',
              borderRadius: 0.5,
            }}
          >
            {display}
          </Typography>
          <style>{`.tf-cell-copy:hover .MuiTypography-root{ color: ${theme.palette.primary.main}; }`}</style>
        </Box>
      );
    };

    return Object.keys(headerNames).map((key) => ({
      field: key,
      headerName: headerNames[key] ?? key,
      minWidth: 120,
      sortable: true,
      renderCell: (params: any) => <CellWithCopy value={params.value} />,
    }));
  }, [headerNames, theme]);

  const gridRows = useMemo(() => {
    return (rows || []).map((r, idx) => ({ 
      id: String(r[rowIdKey || 'taskId'] ?? r.taskId ?? r.workId ?? idx), 
      ...r 
    }));
  }, [rows, rowIdKey]);

  // column state with persistence
  const [colState, setColState] = useState<GridColDef[]>(() => columns);

  useEffect(() => {
    setColState(columns);
  }, [columns]);

  // keep ref in sync
  useEffect(() => {
    colStateRef.current = colState;
  }, [colState]);

  // Auto-fit column widths: measure header + cell text and set widths on first load or when rows change
  const autoFitDoneRef = useRef<string | null>(null);
  useEffect(() => {
    try {
      // compute signature to run when headers or row COUNT change
      // NOTE: exclude row content/sample to avoid recomputing widths when rows are merely reordered (e.g. sorting)
      const sig = JSON.stringify({ headers: Object.keys(headerNames || {}), rowCount: (gridRows || []).length });
      if (autoFitDoneRef.current === sig) return;
      autoFitDoneRef.current = sig;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const bodyStyle = window.getComputedStyle(document.body);
      ctx.font = bodyStyle.font || '14px sans-serif';

      const padding = 56; // cell padding + grip/resize allowance (increase to include header icons)
      const maxCap = Math.max(300, Math.round(window.innerWidth * 0.6));

      const widths: Record<string, number> = {};
      colStateRef.current.forEach((col) => {
        const field = col.field;
        let maxW = 0;
        const headerText = String(col.headerName ?? field);
        maxW = Math.max(maxW, Math.round(ctx.measureText(headerText).width));
        // sample rows (limit to 200 for performance)
        const sample = gridRows.slice(0, 200);
        for (let i = 0; i < sample.length; i++) {
          const v = String((sample[i] as any)[field] ?? '');
          if (!v) continue;
          const w = Math.round(ctx.measureText(v).width);
          if (w > maxW) maxW = w;
        }
        const target = Math.min(maxCap, Math.max(col.minWidth || 120, maxW + padding));
        widths[field] = target;
      });

        // no-op: we rely on DataGrid's built-in column menu/panel

      // apply widths
      setColState((prev) => prev.map((c) => ({ ...c, width: widths[c.field] || c.width })));
    } catch {
      // ignore
    }
     
  }, [gridRows]);

  // handle right-click on rows to open context menu
  const onRowContextMenu = (params: any, event: React.MouseEvent) => {
    event.preventDefault();
    const colElem = (event.target as HTMLElement).closest('[data-field]') as HTMLElement | null;
    const colKey = colElem ? colElem.getAttribute('data-field') : null;
    // ensure the clicked row becomes selected when right-clicking
    try {
      const id = params?.id;
      if (id != null) {
        if (controlledSelectedRowIds !== undefined) {
          // For controlled components, notify parent of selection change
          if (onSelectionChange) {
            const selected = (gridRows || []).filter((r) => String(r.id) === String(id));
            onSelectionChange(selected as Record<string, any>[]);
          }
        } else {
          // For uncontrolled components, update internal state
          setSelection((prev) => (Array.isArray(prev) && prev.includes(String(id)) ? prev : [String(id)]));
        }
        // We select the right-clicked row; let DataGrid manage selection indices for shift/range.
      }
    } catch {}
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

  // column menu state (simple column selector)
  // const [columnVisibilityModel, setColumnVisibilityModel] = useState<Record<string, boolean>>(() => {
  //   const model: Record<string, boolean> = {};
  //   columns.forEach((c) => { model[c.field] = !(c as any).hide; });
  //   return model;
  // });
  

  useEffect(() => {
    // keep visibility model in sync when colState changes
    // setColumnVisibilityModel(() => {
    //   const model: Record<string, boolean> = {};
    //   (colState || columns).forEach((c) => { model[c.field] = !(c as any).hide; });
    //   return model;
    // });
  }, [colState, columns]);

  // controlled via prop from parent - open/close when anchor prop changes
  useEffect(() => {
    // If parent requests opening columns UI, open DataGrid's built-in column menu anchored to first visible column
    if (openColumnsAnchor && apiRef && apiRef.current) {
      const field = (colState && colState.length && colState[0].field) ? colState[0].field : undefined;
      if (field) {
        try { apiRef.current.toggleColumnMenu(field); } catch {}
      }
    }
  }, [openColumnsAnchor]);

  // Use MUI DataGrid's native column resize/reorder behavior (no custom DOM interceptors)

  // fallback: listen for global openColumns events when parent doesn't wire prop
  useEffect(() => {
    // no global fallback: parent should provide `openColumnsAnchor` prop
    return () => {};
  }, []);

  // Scroll to top when triggered
  useEffect(() => {
    if (scrollToTopTrigger !== undefined && apiRef.current) {
      try {
        apiRef.current.scrollToIndexes({ rowIndex: 0 });
      } catch {
        // fallback
      }
    }
  }, [scrollToTopTrigger]);

    // DataGrid typing is strict for some event props; use an any-cast for JSX usage below
    const AnyDataGrid: any = DataGrid as any;
    const apiRef = useGridApiRef();
    const paperRef = useRef<HTMLDivElement | null>(null);
    const [pageSize, setPageSize] = useState<number>(50);
    const [page, setPage] = useState<number>(0);

    // compute pageSize based on available height inside the Paper container
    useEffect(() => {
      function computePageSize() {
        try {
          const paper = paperRef.current;
          if (!paper) return;
          const header = paper.querySelector('.MuiDataGrid-columnHeaders') as HTMLElement | null;
          const footer = paper.querySelector('.MuiDataGrid-footer') as HTMLElement | null;
          const rowEl = paper.querySelector('.MuiDataGrid-row') as HTMLElement | null;
          const paperHeight = paper.clientHeight || 0;
          const headerH = header?.clientHeight ?? 48;
          const footerH = disablePagination ? 0 : (footer?.clientHeight ?? 56);
          const available = Math.max(0, paperHeight - headerH - footerH);
          const defaultRow = density === 'compact' ? 36 : 52;
          const rowH = rowEl?.clientHeight ?? defaultRow;
          const computed = Math.max(50, Math.floor(available / Math.max(1, rowH)));
          if (computed && computed !== pageSize) setPageSize(computed);
        } catch {
          // ignore
        }
      }

      computePageSize();
      const ro = new ResizeObserver(() => computePageSize());
      if (paperRef.current) ro.observe(paperRef.current);
      window.addEventListener('resize', computePageSize);
      return () => {
        try { ro.disconnect(); } catch {}
        window.removeEventListener('resize', computePageSize);
      };
    }, [rows, density, tableHeight, disablePagination]);

    // Recreate MUI's "basic usage" toolbar layout but without export:
    // QuickFilter on the left, toolbar actions on the right (columns/filter/density)
    const CustomToolbar = () => (
      <GridToolbarContainer>
        <Box sx={{ flex: 1 }} />
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
      </GridToolbarContainer>
    );

  // context menu for rows
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; clickedRow?: any; clickedColumnKey?: string | null; mouseScreenX?: number; mouseScreenY?: number }>({ visible: false, x: 0, y: 0 });
  const closeContextMenu = () => setContextMenu({ visible: false, x: 0, y: 0 });


  const paperSx: any = (typeof tableHeight === 'string' && tableHeight.trim().endsWith('%'))
    ? { width: '100%', zIndex: 0, display: 'flex', flex: 1, minHeight: 0, flexDirection: 'column', height: '100%', overflow: 'hidden' }
    : { height: tableHeight, width: '100%', zIndex: 0, overflow: 'hidden' };

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, position: 'relative' }}>

      {/* DataGrid's built-in column menu/panel is used instead of a custom Popper */}

      <Paper ref={paperRef as any} sx={paperSx}>
        <AnyDataGrid
          rows={gridRows}
          columns={colState}
          rowSelectionModel={rowSelectionModel}
          checkboxSelection
          components={hideToolbar ? {} : { Toolbar: CustomToolbar }}
          density={density as 'compact' | 'standard' | 'comfortable'}
          rowHeight={40}
          // Use client-side/native MUI sorting
          apiRef={apiRef}
          pagination={!disablePagination}
          hideFooter={disablePagination}
          // ensure current pageSize is present in options to avoid MUI warning
          pageSizeOptions={(function(){
            const opts = [50,100,500];
            if (!opts.includes(pageSize)) opts.push(pageSize);
            return opts.sort((a,b)=>a-b);
          })()}
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model: any) => {
            try {
              if (!model) return;
              if (typeof model.pageSize === 'number') setPageSize(model.pageSize);
              if (typeof model.page === 'number') setPage(model.page);
            } catch {}
          }}
          onRowDoubleClick={(params: any, event: any) => {
            if (onOpenPopout) onOpenPopout([params.row as any], (event as any).screenX ?? 0, (event as any).screenY ?? 0);
          }}
          onRowContextMenu={onRowContextMenu as any}
          onCellContextMenu={onRowContextMenu as any}
          // rely on MUI client-side sorting; no server callbacks
          onRowSelectionModelChange={(model: any) => {
            try {
              // model may be an array of ids (strings/numbers) or an object for checkboxSelection
              const ids = Array.isArray(model) ? model : Object.keys(model || {});
              const newSelection = (ids || []).map(String) as string[];

              // For controlled components, always notify parent of changes
              // For uncontrolled components, update internal state
              if (controlledSelectedRowIds !== undefined) {
                if (onSelectionChange) {
                  const selected = (gridRows || []).filter((r) => newSelection.includes(String(r.id)));
                  onSelectionChange(selected as Record<string, any>[]);
                }
              } else {
                setSelection(newSelection);
                if (onSelectionChange) {
                  const selected = (gridRows || []).filter((r) => newSelection.includes(String(r.id)));
                  onSelectionChange(selected as Record<string, any>[]);
                }
              }
            } catch (err) {
              console.error('Error in onRowSelectionModelChange:', err);
            }
          }}
          sx={{ flex: 1, minHeight: 0, border: 0, overflow: 'hidden', '& .MuiDataGrid-cell': { py: density === 'compact' ? 0.5 : 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }, '& .MuiDataGrid-columnHeaders': { backgroundColor: theme.palette.action.hover }, '& .MuiDataGrid-columnHeaderTitle': { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }}
          // ensure DataGrid performs client-side sorting (do not accidentally enter server-mode)
          sortingMode={sortingMode || 'client'}
          sortModel={sortModel}
          // notify parent when sort model changes (useful for higher-level features like pinned ordering)
          onSortModelChange={(model: any) => {
            try {
              if (onSortChange) onSortChange(Boolean(model && model.length > 0), model || []);
            } catch {}
          }}
          onColumnResize={(params: any) => {
            const { colDef, width } = params;
            setColState((prev) => prev.map((c) => (c.field === colDef.field ? { ...c, width } : c)));
          }}
          onColumnVisibilityModelChange={(model: any) => {
            try {
              // setColumnVisibilityModel(() => ({ ...(model || {}) }));
              setColState((prev) => prev.map((c) => ({ ...c, hide: !((model || {})[c.field]) })));
            } catch {}
          }}
          onColumnOrderChange={(params: any) => {
            try {
              const order = params.columnFields || params.items || [];
              if (Array.isArray(order) && order.length) {
                setColState((prev) => {
                  const byField: Record<string, any> = {};
                  prev.forEach((c) => { byField[c.field] = c; });
                  const ordered: any[] = [];
                  order.forEach((f: string) => { if (byField[f]) ordered.push({ ...byField[f] }); });
                  prev.forEach((c) => { if (!order.includes(c.field)) ordered.push({ ...c }); });
                  return ordered;
                });
              }
            } catch {}
          }}
        />
      </Paper>
      {/* debug badge removed */}
      {/* Toolbar rendered inside DataGrid to maintain proper context */}
      {/* overlay container removed; relying on native MUI header visuals */}

      {/* open-manage-columns event: anchor our custom Popper to the header element */}
      {/* Row context menu (portal) */}
      <TaskRowContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        selectedRows={gridRows.filter((r) => (selection || []).includes(String(r.id)))}
        clickedColumnKey={contextMenu.clickedColumnKey ?? null}
        clickedRow={contextMenu.clickedRow ?? null}
        onClose={closeContextMenu}
        mouseScreenX={contextMenu.mouseScreenX ?? 0}
        mouseScreenY={contextMenu.mouseScreenY ?? 0}
        onOpenPopout={(tasks: any[], mX: number, mY: number) => {
          if (onOpenPopout) onOpenPopout(tasks, mX, mY);
        }}
        onOpenCalloutIncident={(task: any) => {
          if (onOpenCalloutIncident) onOpenCalloutIncident(task);
        }}
        onProgressTasks={(tasks: any[]) => {
          if (onProgressTasks) onProgressTasks(tasks);
        }}
        onProgressNotes={(tasks: any[]) => {
          if (onProgressNotes) onProgressNotes(tasks);
        }}
      />
    </Box>
  );
});

TaskTableMUIComponent.displayName = "TaskTableMUI";

export default TaskTableMUIComponent;
