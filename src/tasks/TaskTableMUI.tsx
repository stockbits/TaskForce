import React, { useMemo, useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

type Props = {
  rows: Record<string, any>[];
  headerNames: Record<string, string>;
  tableHeight?: number | string;
  onOpenPopout?: (tasks: Record<string, any>[], mouseScreenX: number, mouseScreenY: number) => void;
  onSelectionChange?: (rows: Record<string, any>[]) => void;
};

export default function TaskTableMUI({ rows, headerNames, tableHeight = 600, onOpenPopout, onSelectionChange }: Props) {
  const [selection, setSelection] = useState<any[]>([]);

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

  useEffect(() => {
    if (onSelectionChange) {
      const selected = gridRows.filter((r) => selection.includes(r.id));
      onSelectionChange(selected as Record<string, any>[]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection]);

  return (
    <Box sx={{ width: '100%', height: typeof tableHeight === 'number' ? tableHeight : tableHeight }}>
      <DataGrid
        rows={gridRows}
        columns={columns}
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
        sx={{
          '& .MuiDataGrid-cell': { py: density === 'compact' ? 0.5 : 1 },
          '& .MuiDataGrid-columnHeader': { py: 1 },
        }}
      />
    </Box>
  );
}
