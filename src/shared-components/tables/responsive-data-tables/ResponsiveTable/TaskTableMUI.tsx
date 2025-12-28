import React, { useMemo, useState, useEffect, MutableRefObject, useRef, memo } from 'react';
import { Box, useTheme, Paper, Typography, Skeleton, Fade } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useAppSnackbar } from '@/shared-components';
import { GridColDef, useGridApiRef, GridToolbarContainer, GridToolbarColumnsButton, GridToolbarFilterButton, GridToolbarDensitySelector } from '@mui/x-data-grid';
import { DataGrid } from '@mui/x-data-grid';
// keep imports minimal: use built-in DataGrid behavior
// framer-motion removed — using static elements
// icon imports removed (unused)
import { TaskRowContextMenu } from '@/shared-components';
import { useTheme as useAppTheme } from '@/System Settings/Dark Mode Handler - Component';

 type Props = {
  rows: Record<string, any>[];
  headerNames: Record<string, string>;
  tableHeight?: number | string;
  containerRef?: MutableRefObject<HTMLElement | null>;
  reserveBottom?: number;
  debug?: boolean;
  disablePagination?: boolean;
  hideToolbar?: boolean;
  loading?: boolean;
  controlledSelectedRowIds?: string[] | Set<string>;
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

const TaskTableMUIComponent = memo(function TaskTableMUI({ rows, headerNames, tableHeight = 600, containerRef: _containerRef, reserveBottom: _reserveBottom = 160, disablePagination = false, hideToolbar = false, loading = false, controlledSelectedRowIds, rowIdKey, onOpenPopout, onSelectionChange, onOpenCalloutIncident, onProgressTasks, onProgressNotes, openColumnsAnchor, onRequestCloseColumns: _onRequestCloseColumns, onSortChange, scrollToTopTrigger, sortingMode, sortModel }: Props) {
  // Internal state for uncontrolled components
  const [selection, setSelection] = useState<string[]>([]);
  
  // For controlled components, use controlledSelectedRowIds directly as rowSelectionModel
  const rowSelectionModel = useMemo(() => {
    let ids: string[] = [];
    if (controlledSelectedRowIds !== undefined) {
      ids = Array.isArray(controlledSelectedRowIds)
        ? controlledSelectedRowIds
        : Array.from(controlledSelectedRowIds as Set<string>);
      // Ensure all IDs are strings and filter out any invalid ones
      ids = ids.filter(id => id != null).map(id => String(id));
    } else {
      // For uncontrolled components, ensure selection is always an array
      ids = Array.isArray(selection) ? selection : [];
    }
    
    return { type: 'include' as const, ids: new Set(ids) };
  }, [controlledSelectedRowIds, selection]);
  const theme = useTheme();
  const { mode } = useAppTheme();
  const colStateRef = useRef<GridColDef[]>([]);
  

  const density: 'compact' | 'standard' | 'comfortable' = (typeof window !== 'undefined' && localStorage.getItem('taskTableDensity') as 'compact' | 'standard' | 'comfortable') || 'compact';

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

  // Ensure selection state is properly initialized
  useEffect(() => {
    if (controlledSelectedRowIds === undefined) {
      setSelection([]);
    }
  }, [controlledSelectedRowIds]);

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
  // const onRowContextMenu = (params: any, event: React.MouseEvent) => {
  //   event.preventDefault();
  //   const colElem = (event.target as HTMLElement).closest('[data-field]') as HTMLElement | null;
  //   const colKey = colElem ? colElem.getAttribute('data-field') : null;
  //   // ensure the clicked row becomes selected when right-clicking
  //   try {
  //     const id = params?.id;
  //     if (id != null) {
  //       if (controlledSelectedRowIds !== undefined) {
  //         // For controlled components, notify parent of selection change
  //         if (onSelectionChange) {
  //           const selected = (gridRows || []).filter((r) => String(r.id) === String(id));
  //           onSelectionChange(selected as Record<string, any>[]);
  //         }
  //       } else {
  //         // For uncontrolled components, update internal state and notify parent
  //         setSelection((prev) => (Array.isArray(prev) && prev.includes(String(id)) ? prev : [String(id)]));
  //         if (onSelectionChange) {
  //           const selected = (gridRows || []).filter((r) => String(r.id) === String(id));
  //           onSelectionChange(selected as Record<string, any>[]);
  //         }
  //       }
  //       // We select the right-clicked row; let DataGrid manage selection indices for shift/range.
  //     }
  //   } catch {}
  //   setContextMenu({
  //     visible: true,
  //     x: event.clientX,
  //     y: event.clientY,
  //     clickedRow: params.row,
  //     clickedColumnKey: colKey,
  //     mouseScreenX: (event as any).screenX ?? 0,
  //     mouseScreenY: (event as any).screenY ?? 0,
  //   });
  // };

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
    // const AnyDataGrid: any = DataGrid as any;
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

  // Skeleton loading component for smooth transitions
  const TableSkeleton = () => (
    <Box sx={{ p: 2 }}>
      {/* Header skeleton */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        {Object.keys(headerNames).map((key, _index) => (
          <Skeleton key={key} variant="rectangular" width={120} height={40} />
        ))}
      </Box>
      {/* Row skeletons */}
      {Array.from({ length: 10 }).map((_, rowIndex) => (
        <Box key={rowIndex} sx={{ display: 'flex', gap: 2, mb: 1 }}>
          <Skeleton variant="rectangular" width={50} height={36} /> {/* Checkbox */}
          {Object.keys(headerNames).map((key) => (
            <Skeleton key={key} variant="rectangular" width={120} height={36} />
          ))}
        </Box>
      ))}
    </Box>
  );

  const paperSx: any = (typeof tableHeight === 'string' && tableHeight.trim().endsWith('%'))
    ? { width: '100%', zIndex: 0, display: 'flex', flex: 1, minHeight: 0, flexDirection: 'column', height: '100%', overflow: 'auto' }
    : { height: tableHeight, width: '100%', zIndex: 0, overflow: 'auto' };

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, position: 'relative' }}>

      {/* DataGrid's built-in column menu/panel is used instead of a custom Popper */}

      <Paper ref={paperRef as any} sx={paperSx}>
        {loading ? (
          <Fade in={loading} timeout={300}>
            <Box>
              <TableSkeleton />
            </Box>
          </Fade>
        ) : (
          <Fade in={!loading} timeout={300}>
            <Box sx={{ height: '100%' }}>
              <DataGrid
          rows={gridRows}
          columns={colState}
          checkboxSelection={true}
          disableVirtualization={true}
          rowSelectionModel={rowSelectionModel as any}
          onRowSelectionModelChange={(newSelectionModel: any) => {
            // Handle the new GridRowSelectionModel format
            const safeSelectionIds: string[] = newSelectionModel?.ids ? Array.from(newSelectionModel.ids).map(String) : [];
            
            if (controlledSelectedRowIds !== undefined && onSelectionChange) {
              // For controlled components, notify parent of selection change
              const selectedRows = gridRows.filter(r => safeSelectionIds.includes(String(r.id)));
              onSelectionChange(selectedRows as Record<string, any>[]);
            } else {
              // For uncontrolled components, update internal state and notify parent
              setSelection(safeSelectionIds);
              if (onSelectionChange) {
                const selectedRows = gridRows.filter(r => safeSelectionIds.includes(String(r.id)));
                onSelectionChange(selectedRows as Record<string, any>[]);
              }
            }
          }}
          getRowClassName={(params: any) => {
            if (controlledSelectedRowIds) {
              const selectedIds = Array.isArray(controlledSelectedRowIds) 
                ? controlledSelectedRowIds 
                : Array.from(controlledSelectedRowIds);
              if (selectedIds.includes(String(params.id))) {
                return 'selected-row';
              }
            }
            return '';
          }}
          onRowClick={(params: any) => {
            if (!controlledSelectedRowIds || !onSelectionChange) return;
            
            // Toggle selection for this row (additional functionality beyond checkboxes)
            const rowId = String(params.id);
            const currentSelection = Array.isArray(controlledSelectedRowIds) 
              ? controlledSelectedRowIds 
              : Array.from(controlledSelectedRowIds);
            const isSelected = currentSelection.includes(rowId);
            
            let newSelection;
            if (isSelected) {
              // Remove from selection
              newSelection = currentSelection.filter(id => id !== rowId);
            } else {
              // Add to selection
              newSelection = [...currentSelection, rowId];
            }
            
            // Convert back to the same type as input for the parent component
            const selectedRows = gridRows.filter(r => newSelection.includes(String(r.id)));
            onSelectionChange(selectedRows as Record<string, any>[]);
          }}
          pagination={true}
          hideFooter={disablePagination}
          pageSizeOptions={[25, 50, 100]}
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model: any) => {
            setPage(model.page);
            setPageSize(model.pageSize);
          }}
          slots={hideToolbar ? {} : { toolbar: CustomToolbar }}
          density={density}
          sx={{ 
            flex: 1, 
            minHeight: 0, 
            border: 0, 
            overflow: 'hidden', 
            '& .MuiDataGrid-cell': { 
              py: density === 'compact' ? 0.5 : 1, 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              color: theme.palette.text.primary,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }, 
            '& .MuiDataGrid-columnHeaders': { 
              backgroundColor: mode === 'dark' ? theme.palette.background.paper : theme.palette.action.hover,
              borderBottom: `1px solid ${theme.palette.divider}`,
              position: 'sticky',
              top: 0,
              zIndex: 1,
            }, 
            '& .MuiDataGrid-columnHeaderTitle': { 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              color: theme.palette.text.primary,
              fontWeight: 600,
            },
            '& .MuiDataGrid-row': {
              cursor: controlledSelectedRowIds ? 'pointer' : 'default',
              '&:hover': {
                backgroundColor: controlledSelectedRowIds ? (mode === 'dark' ? theme.palette.action.hover : theme.palette.action.hover) : 'transparent',
              },
            },
            '& .selected-row': {
              backgroundColor: theme.custom.selectionColor,
              '&:hover': {
                backgroundColor: mode === 'dark' 
                  ? alpha(theme.palette.common.white, 0.3) 
                  : alpha(theme.palette.primary.main, 0.2),
              },
            },
            '& .MuiDataGrid-footerContainer': {
              backgroundColor: theme.palette.background.paper,
              borderTop: `1px solid ${theme.palette.divider}`,
              color: theme.palette.text.primary,
            },
            '& .MuiTablePagination-root': {
              color: theme.palette.text.primary,
            },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              color: theme.palette.text.secondary,
            },
            '& .MuiTablePagination-select': {
              color: theme.palette.text.primary,
            },
            '& .MuiTablePagination-actions .MuiIconButton-root': {
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: mode === 'dark' ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
              },
            },
            '& .MuiCheckbox-root': {
              color: mode === 'dark' ? "rgba(255, 255, 255, 0.7)" : theme.palette.text.secondary,
              '&.Mui-checked': {
                color: mode === 'dark' ? theme.palette.secondary.main : theme.palette.primary.main,
              },
              '&.Mui-indeterminate': {
                color: mode === 'dark' ? theme.palette.secondary.main : theme.palette.primary.main,
              },
              '&:hover': {
                backgroundColor: mode === 'dark' ? theme.palette.action.hover : alpha(theme.palette.primary.main, 0.04),
              },
            },
            // header checkbox styling is handled globally via theme (MuiCssBaseline)
          }}
          // ensure DataGrid performs client-side sorting (do not accidentally enter server-mode)
          sortingMode={sortingMode || 'client'}
          sortModel={sortModel}
          // notify parent when sort model changes (useful for higher-level features like pinned ordering)
          onSortModelChange={(model: any) => {
            try {
              if (onSortChange) onSortChange(Boolean(model && model.length > 0), model || []);
            } catch {}
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
            </Box>
          </Fade>
        )}
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
        selectedRows={gridRows.filter((r) => rowSelectionModel.ids.has(String(r.id)))}
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
