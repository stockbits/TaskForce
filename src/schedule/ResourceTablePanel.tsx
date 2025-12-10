// ============================================================================
// ResourceTablePanel.tsx — FINAL CLEAN VERSION
// Fully wired to useLiveSelectEngine.
// No selection logic — only forwards table selections.
// ============================================================================

import React, { useMemo } from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";
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
}

export default function ResourceTablePanel({
  data,
  selectedResources,
  onSelectionChange,
}: Props) {
  const theme = useTheme();

  const panelStyles = {
    height: '100%',
    display: "flex",
    flexDirection: "column" as const,
    borderRadius: 3,
    px: 3,
    py: 2.5,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
    boxShadow: "0 18px 46px rgba(8,58,97,0.18)",
    backgroundImage: "none",
  };

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
     CONTROLLED SELECTION SET
  ------------------------------------------------------------------------ */
  const selectedRowIds = useMemo(() => {
    return new Set(selectedResources.map((r) => String(r.resourceId)));
  }, [selectedResources]);

  /* ------------------------------------------------------------------------
     EMPTY STATE
  ------------------------------------------------------------------------ */
  if (!data || data.length === 0) {
    return (
      <Paper elevation={0} sx={panelStyles}>
        <Stack spacing={1} alignItems="center" justifyContent="center" sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            No resources loaded. Please define filters and press Search.
          </Typography>
        </Stack>
      </Paper>
    );
  }

  /* ------------------------------------------------------------------------
     MAIN RENDER — controlled selection only
  ------------------------------------------------------------------------ */
  return (
    <Paper elevation={0} sx={panelStyles}>
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TaskTableAdvanced
          rows={data}
          headerNames={headerNames}
          sx={{ height: '100%' }}
          tableHeight="100%"
          rowIdKey="resourceId"
          controlledSelectedRowIds={selectedRowIds}
          onSelectionChange={(rows) =>
            onSelectionChange(rows as ResourceRecord[])
          }
        />
      </Box>
    </Paper>
  );
}
