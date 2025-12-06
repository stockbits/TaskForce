// ============================================================================
// ResourceTablePanel.tsx — FINAL CLEAN VERSION
// Fully wired to useLiveSelectEngine.
// No selection logic — only forwards table selections.
// ============================================================================

import React, { useMemo } from "react";
import TaskTable_Advanced from "../../A-Navigation_Container/TaskTable_Advanced";
import type { ResourceRecord } from "../hooks/useLiveSelectEngine";

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
      <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm border border-gray-200 rounded-2xl bg-white">
        No resources loaded. Please define filters and press Search.
      </div>
    );
  }

  /* ------------------------------------------------------------------------
     MAIN RENDER — controlled selection only
  ------------------------------------------------------------------------ */
  return (
    <TaskTable_Advanced
      rows={data}
      headerNames={headerNames}
      className="h-full"
      tableHeight="100%"
      rowIdKey="resourceId"
      controlledSelectedRowIds={selectedRowIds}
      onSelectionChange={(rows) => onSelectionChange(rows as ResourceRecord[])}
    />
  );
}
