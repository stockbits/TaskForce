import { useCallback, useMemo, useState } from "react";
import seedHistory from "@/Database Models/Call Out - Model.json";
import type { CalloutOutcome } from "@/shared-types";

export interface CalloutHistoryEntry {
  id: string;
  taskId: string | number | null;
  workId: string | number | null;
  resourceId: string;
  outcome: CalloutOutcome | string;
  status: string | null;
  availableAgainAt: string | null;
  note: string | null;
  timestamp: string;
  taskIcon?: string | null;
}

interface UseCalloutHistoryResult {
  history: CalloutHistoryEntry[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  appendLocal: (entry: CalloutHistoryEntry) => void;
  getByTaskId: (taskId: string | number | null | undefined) => CalloutHistoryEntry[];
  getByWorkId: (workId: string | number | null | undefined) => CalloutHistoryEntry[];
}

function normalizeEntry(raw: any): CalloutHistoryEntry | null {
  if (!raw) return null;
  const resourceId = typeof raw.resourceId === "string" ? raw.resourceId : String(raw.resourceId ?? "").trim();
  if (!resourceId) return null;

  const id = typeof raw.id === "string" ? raw.id : String(raw.id ?? `${resourceId}-${Date.now()}`);
  const timestamp = typeof raw.timestamp === "string" && raw.timestamp ? raw.timestamp : new Date().toISOString();

  return {
    id,
    taskId: raw.taskId ?? null,
    workId: raw.workId ?? null,
    resourceId,
    outcome: raw.outcome ?? "",
    status: raw.status ?? null,
    availableAgainAt: raw.availableAgainAt ?? null,
    note: raw.note ?? null,
    timestamp,
    taskIcon: raw.taskIcon ?? null,
  };
}

function buildSeedHistory(): CalloutHistoryEntry[] {
  const raw = Array.isArray(seedHistory) ? seedHistory : [];
  const entries = raw
    .map((entry: any) => normalizeEntry(entry))
    .filter((entry): entry is CalloutHistoryEntry => Boolean(entry));

  entries.sort((a, b) => {
    const aTime = Date.parse(a.timestamp);
    const bTime = Date.parse(b.timestamp);

    const aValid = !Number.isNaN(aTime);
    const bValid = !Number.isNaN(bTime);

    if (aValid && bValid) return bTime - aTime;
    if (aValid) return -1;
    if (bValid) return 1;
    return 0;
  });

  return entries;
}

export function useCalloutHistory(): UseCalloutHistoryResult {
  const [history, setHistory] = useState<CalloutHistoryEntry[]>(() => buildSeedHistory());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setHistory(buildSeedHistory());
        setLoading(false);
        resolve();
      }, 120);
    });
  }, []);

  const appendLocal = useCallback((entry: CalloutHistoryEntry) => {
    setHistory((prev) => {
      const normalised = normalizeEntry(entry);
      if (!normalised) return prev;
      const withoutDuplicate = prev.filter((item) => item.id !== normalised.id);
      return [normalised, ...withoutDuplicate];
    });
  }, []);

  const getByTaskId = useCallback(
    (taskId: string | number | null | undefined) => {
      if (!taskId && taskId !== 0) return [];
      const compare = String(taskId);
      return history.filter((entry) => String(entry.taskId ?? "") === compare);
    },
    [history]
  );

  const getByWorkId = useCallback(
    (workId: string | number | null | undefined) => {
      if (!workId && workId !== 0) return [];
      const compare = String(workId);
      return history.filter((entry) => String(entry.workId ?? "") === compare);
    },
    [history]
  );

  return useMemo(
    () => ({ history, loading, error, refresh, appendLocal, getByTaskId, getByWorkId }),
    [appendLocal, error, getByTaskId, getByWorkId, history, loading, refresh]
  );
}
