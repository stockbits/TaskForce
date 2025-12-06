// ============================================================================
// TaskTablePanel.tsx — FINAL VERSION
// Fully wired to useLiveSelectEngine.
// No selection logic inside — only forwards table selections.
// ============================================================================

import React, { useMemo } from "react";
import TaskTable_Advanced from "@/features/tasks/components/TaskTable_Advanced";
import type { TaskRecord } from "@/features/schedule/hooks/useLiveSelectEngine";

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
      <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm border border-gray-200 rounded-2xl bg-white">
        No tasks loaded yet. Please define filters and press Search.
      </div>
    );
  }

  /* ==========================================================================
     MAIN RENDER — forward selection only
     ========================================================================== */
  return (
    <TaskTable_Advanced
      rows={data}
      headerNames={headerNames}
      className="h-full"
      tableHeight="100%"
      rowIdKey="taskId"
      controlledSelectedRowIds={selectedRowIds}
      onSelectionChange={(rows) => onSelectionChange(rows as TaskRecord[])}
    />
  );
}
