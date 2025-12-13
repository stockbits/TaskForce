// ============================================================================
// TaskTablePanel.tsx — FINAL VERSION
// Fully wired to useLiveSelectEngine.
// No selection logic inside — only forwards table selections.
// ============================================================================

import React, { useMemo } from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import TaskTableAdvanced from "@/tasks/TaskTableAdvanced";
import type { TaskRecord } from "@/hooks/useLiveSelectEngine";

const PRIORITY_KEYS = [
  "taskId",
  "taskStatus",
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
}

export default function TaskTablePanel({
  data,
  selectedTasks,
  onSelectionChange,
}: TaskTablePanelProps) {
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
      <Paper elevation={0} sx={panelStyles}>
        <Stack spacing={1} alignItems="center" justifyContent="center" sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            No tasks loaded yet. Please define filters and press Search.
          </Typography>
        </Stack>
      </Paper>
    );
  }

  /* ==========================================================================
     MAIN RENDER — forward selection only
     ========================================================================== */
  return (
    <Paper elevation={0} sx={panelStyles}>
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TaskTableAdvanced
          rows={data}
          headerNames={headerNames}
          sx={{ height: '100%' }}
          tableHeight="100%"
          rowIdKey="taskId"
          controlledSelectedRowIds={selectedRowIds}
          onSelectionChange={(rows: TaskRecord[]) => onSelectionChange(rows as TaskRecord[])}
        />
      </Box>
    </Paper>
  );
}
