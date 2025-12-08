import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CalloutOutcome } from "@/types";

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
  };
}

export function useCalloutHistory(): UseCalloutHistoryResult {
  const [history, setHistory] = useState<CalloutHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:5179/callout-history");
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const payload = await response.json();
      const items: CalloutHistoryEntry[] = Array.isArray(payload?.history)
        ? (payload.history as unknown[])
          .map((entry) => normalizeEntry(entry))
            .filter((entry): entry is CalloutHistoryEntry => Boolean(entry))
        : [];

      items.sort((a, b) => {
        const aTime = Date.parse(a.timestamp);
        const bTime = Date.parse(b.timestamp);

        const aValid = !Number.isNaN(aTime);
        const bValid = !Number.isNaN(bTime);

        if (aValid && bValid) return bTime - aTime;
        if (aValid) return -1;
        if (bValid) return 1;
        return 0;
      });

      setHistory(items);
    } catch (err: any) {
      console.warn("Unable to load callout history", err);
      setError(err?.message || "Unable to load history");
    } finally {
      setLoading(false);
      hasFetchedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hasFetchedRef.current) {
      refresh().catch(() => {
        /* handled above */
      });
    }
  }, [refresh]);

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
