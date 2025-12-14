export function filterTasks(
  allRows: Record<string, any>[],
  filters: Record<string, any>
): Record<string, any>[] {
  let filtered = [...allRows];

  // Global quick search
  if (filters.taskSearch?.trim()) {
    const q = filters.taskSearch.toLowerCase();
    filtered = filtered.filter((t) =>
      [t.taskId, t.resourceName, t.workId, t.assetName, t.description]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }

  if (filters.division?.length) {
    filtered = filtered.filter((t) => filters.division.includes(t.groupCode));
  }

  // Multi-select domain list
  if (filters.domainId?.length) {
    filtered = filtered.filter((t) =>
      filters.domainId.includes(String(t.domain || "").toUpperCase())
    );
  }

  if (filters.taskStatuses?.length) {
    filtered = filtered.filter((t) =>
      filters.taskStatuses.includes(t.taskStatus)
    );
  }

  if (filters.responseCode?.length) {
    filtered = filtered.filter((t) =>
      filters.responseCode.includes(t.responseCode)
    );
  }

  if (filters.requester?.trim()) {
    const q = filters.requester.toLowerCase();
    filtered = filtered.filter((t) =>
      String(t.resourceName || "")
        .toLowerCase()
        .includes(q)
    );
  }

  if (filters.commitType?.length) {
    filtered = filtered.filter((t) =>
      filters.commitType.includes(t.commitmentType)
    );
  }

  if (filters.capabilities?.length) {
    filtered = filtered.filter((t) =>
      filters.capabilities.includes(t.primarySkill)
    );
  }

  if (filters.jobType?.trim()) {
    const q = filters.jobType.toLowerCase();
    filtered = filtered.filter((t) =>
      String(t.taskType || "")
        .toLowerCase()
        .includes(q)
    );
  }

  return filtered;
}

import { useMemo } from "react";

export function useTaskFilters(
  allRows: Record<string, any>[],
  filters: Record<string, any>
): Record<string, any>[] {
  return useMemo(() => filterTasks(allRows, filters), [allRows, filters]);
}