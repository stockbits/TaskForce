import { Box } from "@mui/material";
import {
  DataGrid,
  type DataGridProps,
  type GridValidRowModel,
} from "@mui/x-data-grid";
export type ApplicationDataTableProperties<Row extends GridValidRowModel> =
  Omit<DataGridProps<Row>, "autoHeight"> & { label: string };
/** Data, columns and domain actions belong to the consuming feature. */
export default function ApplicationDataTable<Row extends GridValidRowModel>({
  label,
  ...properties
}: ApplicationDataTableProperties<Row>) {
  return (
    <Box
      role="region"
      aria-label={label}
      sx={{ width: "100%", minWidth: 0, height: "clamp(320px, 60dvh, 640px)" }}
    >
      <DataGrid<Row> aria-label={label} {...properties} />
    </Box>
  );
}
