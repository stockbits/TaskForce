import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  Alert,
  Box,
  CircularProgress,
  FormControl,
  IconButton,
  InputAdornment,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AppButton from '@/shared-ui/button';
import Close from '@mui/icons-material/Close';
import CalendarToday from '@mui/icons-material/CalendarToday';
import WarningAmber from '@mui/icons-material/WarningAmber';
import ListAlt from '@mui/icons-material/ListAlt';
import ContentCopy from '@mui/icons-material/ContentCopy';
import OpenInNew from '@mui/icons-material/OpenInNew';
import RotateLeft from '@mui/icons-material/RotateLeft';
import Person from '@mui/icons-material/Person';
import { alpha, useTheme } from "@mui/material/styles";
import { type CalloutHistoryEntry } from "@/hooks/useCalloutHistory";
import { SimpleTooltip } from '@/shared-ui';
/* -------------------------------------------------------
   CALLOUT OUTCOME MODEL
------------------------------------------------------- */

export type CalloutOutcome =
  | "AssignDispatchedAWI"
  | "CalloutDispatchedAWI"
  | "PendingACT"
  | "Disturbance"
  | "NoReply"
  | "Refusal"
  | "Unavailable";

export const CalloutOutcomeConfig: Record<
  CalloutOutcome,
  { label: string; requiresAvailabilityTime?: boolean }
> = {
  AssignDispatchedAWI: { label: "Assignment → Dispatched (AWI)" },
  CalloutDispatchedAWI: { label: "Callout → Dispatched (AWI)" },
  PendingACT: { label: "Pending Callout → Assigned (ACT)" },
  Disturbance: { label: "Disturbance" },
  NoReply: { label: "No Reply" },
  Refusal: { label: "Refusal" },
  Unavailable: { label: "Unavailable", requiresAvailabilityTime: true },
};

const AVAILABLE_CALLOUT_OUTCOMES: CalloutOutcome[] = (
  Object.keys(CalloutOutcomeConfig) as CalloutOutcome[]
).filter((key) => key !== "AssignDispatchedAWI");

type CalloutListScope = "main" | "backup" | "all";

const LIST_SCOPE_LABELS: Record<CalloutListScope, string> = {
  main: "Main List",
  backup: "Backup List",
  all: "All Lists",
};

// framer-motion removed — use static MUI components


/* -------------------------------------------------------
   TYPES
------------------------------------------------------- */

export interface ResourceHistoryEntry {
  previousOutcome: string | null;
  previousAvailableAgainAt: string | null;
  changedAt: string; // ISO timestamp
  taskIdUsed: string | number | null;
  outcomeApplied?: CalloutOutcome | string;
  availableAgainAt?: string | null;
}

export interface ResourceRecord {
  resourceId: string;
  name: string;
  calloutGroup?: string; // <-- REQUIRED FIX
  status?: string | null;
  lastOutcome?: CalloutOutcome | string | null;
  availableAgainAt?: string | null;
  contactNumber?: string;
  notes?: string;
  history?: ResourceHistoryEntry[];
  updatedAt?: string | null;
  division?: string | null;
  primarySkill?: string | null;
  secondarySkill?: string | null;
  pwa?: string | null;
  dispatchMode?: string | null;
  evDriver?: string | null;
  signOn?: string | null;
  signOff?: string | null;
  homePostCode?: string | null;
  homeLat?: number | null;
  homeLng?: number | null;
}

interface CalloutIncidentPanelProps {
  open: boolean;
  task: Record<string, any> | null;
  resources: ResourceRecord[];
  primaryResourceIds?: string[];
  selectedGroup?: string | null;
  onClose: () => void;
  history: CalloutHistoryEntry[];
  historyLoading?: boolean;
  historyError?: string | null;
  onRefreshHistory?: () => Promise<void> | void;
  onOpenResourcePopout?: (
    resource: ResourceRecord,
    history: CalloutHistoryEntry[]
  ) => void;
  onOpenTaskPopout?: () => void;

  onSaveRow?: (payload: {
    taskId: string | number | null;
    resourceId: string;
    outcome: CalloutOutcome;
    availableAgainAt?: string;
  }) => Promise<void> | void;
}

/* -------------------------------------------------------
   HELPERS
------------------------------------------------------- */

// UK format dd/mm/yyyy HH:MM
function formatUkDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

function getLastChangeTime(resource: ResourceRecord): number | null {
  if (!resource.history || resource.history.length === 0) return null;
  const last = resource.history[resource.history.length - 1];
  const t = Date.parse(last.changedAt);
  return Number.isNaN(t) ? null : t;
}

/* -------------------------------------------------------
   COMPONENT
------------------------------------------------------- */

export const CalloutIncidentPanel: React.FC<CalloutIncidentPanelProps> = ({
  open,
  task,
  resources,
  primaryResourceIds = [],
  selectedGroup = null,
  onClose,
  history,
  historyLoading = false,
  historyError = null,
  onRefreshHistory,
  onSaveRow,
  onOpenResourcePopout,
  onOpenTaskPopout,
}) => {
  const taskId =
    task?.TaskID ?? task?.taskId ?? task?.id ?? task?.TaskId ?? null;
  const workId =
    task?.workId ?? task?.WorkID ?? task?.WorkId ?? task?.workID ?? null;
  const theme = useTheme();

  /* ------------------------------------------------------------------
     STATE
  ------------------------------------------------------------------ */

  // ❗ORDER FROZEN FOR SESSION (no reordering while panel is open)
  const [orderedResourceIds, setOrderedResourceIds] = useState<string[]>([]);
  const [listScope, setListScope] = useState<CalloutListScope>("main");

  // Per-row draft (outcome & unavailable time)
  const [rowDrafts, setRowDrafts] = useState<
    Record<
      string,
      {
        outcome: CalloutOutcome | "";
        availableAgainAt: string;
        assignedResourceId?: string;
        saving?: boolean;
      }
    >
  >({});

  // Which rows have been saved (row locking + green highlight)
  const [rowSaved, setRowSaved] = useState<Record<string, boolean>>({});

  const [historyFilter, setHistoryFilter] = useState<string>("ALL");
  const handleResetHistoryFilter = useCallback(() => {
    setHistoryFilter("ALL");
  }, []);

  const handleSelectHistoryResource = useCallback((resourceId: string) => {
    setHistoryFilter((prev) => (prev === resourceId ? "ALL" : resourceId));
  }, []);

  useEffect(() => {
    if (open) {
      setListScope("main");
    }
  }, [open]);

  useEffect(() => {
    setHistoryFilter("ALL");
  }, [listScope]);

  useEffect(() => {
    if (!open) {
      setOrderedResourceIds([]);
      setRowDrafts({});
      setRowSaved({});
      return;
    }

    setRowDrafts({});
    setRowSaved({});
  }, [open]);

  const resourceMap = useMemo(() => {
    const map = new Map<string, ResourceRecord>();
    for (const res of resources) {
      map.set(res.resourceId, res);
    }
    return map;
  }, [resources]);

  const handleOpenResourceDetails = useCallback(
    (resourceId: string) => {
      if (!onOpenResourcePopout) return;
      const resource = resourceMap.get(resourceId);
      if (!resource) return;

      const resourceHistory = history.filter(
        (entry) => entry.resourceId === resourceId
      );

      onOpenResourcePopout(resource, resourceHistory);
    },
    [history, onOpenResourcePopout, resourceMap]
  );

  const primaryResourceSet = useMemo(() => {
    return new Set(primaryResourceIds.filter(Boolean));
  }, [primaryResourceIds]);

  const groupResources = useMemo(() => {
    if (!selectedGroup) return [] as ResourceRecord[];
    return resources.filter((r) => r.calloutGroup === selectedGroup);
  }, [resources, selectedGroup]);

  const mainResources = useMemo(() => {
    if (primaryResourceSet.size > 0) {
      return resources.filter((r) => primaryResourceSet.has(r.resourceId));
    }
    if (groupResources.length > 0) {
      return groupResources.slice(0, 6);
    }
    return resources.slice(0, 6);
  }, [groupResources, primaryResourceSet, resources]);

  const backupResources = useMemo(() => {
    if (groupResources.length > 0) {
      const mainIds = new Set(mainResources.map((r) => r.resourceId));
      return groupResources.filter((r) => !mainIds.has(r.resourceId));
    }

    if (primaryResourceSet.size > 0) {
      return resources.filter((r) => !primaryResourceSet.has(r.resourceId));
    }

    const mainIds = new Set(mainResources.map((r) => r.resourceId));
    return resources.filter((r) => !mainIds.has(r.resourceId));
  }, [groupResources, mainResources, primaryResourceSet, resources]);

  const listResources = useMemo(() => {
    switch (listScope) {
      case "backup":
        return backupResources;
      case "all":
        return resources;
      default:
        return mainResources;
    }
  }, [backupResources, listScope, mainResources, resources]);

  const panelResources = listResources.length ? listResources : mainResources;
  const panelResourceCount = panelResources.length;
  const panelResourceLabel = panelResourceCount === 1 ? "resource" : "resources";
  const hasBackupResources = backupResources.length > 0;
  const listScopeLabel = LIST_SCOPE_LABELS[listScope];
  const panelContentMaxHeight = "calc(96vh - 320px)";

  /* ------------------------------------------------------------------
     INITIALISE ON OPEN
     - First load generates the ordering and freezes it.
     - ❗PARENT UPDATES DO NOT RESORT during session.
  ------------------------------------------------------------------ */

  useEffect(() => {
    if (!open) return;

    const nextIds = panelResources.map((r) => r.resourceId);
    const nextIdSet = new Set(nextIds);
    const currentIdSet = new Set(orderedResourceIds);

    const membershipChanged =
      nextIds.length !== orderedResourceIds.length ||
      nextIds.some((id) => !currentIdSet.has(id)) ||
      orderedResourceIds.some((id) => !nextIdSet.has(id));

    if (!membershipChanged) {
      return;
    }

    const sorted = [...panelResources].sort((a, b) => {
      const aTime = getLastChangeTime(a);
      const bTime = getLastChangeTime(b);

      if (aTime === null && bTime === null) {
        return a.resourceId.localeCompare(b.resourceId);
      }
      if (aTime === null) return -1;
      if (bTime === null) return 1;
      return aTime - bTime;
    });

    setOrderedResourceIds(sorted.map((r) => r.resourceId));

    setRowDrafts((prev) => {
      const next = { ...prev };
      for (const r of sorted) {
        if (!next[r.resourceId]) {
          next[r.resourceId] = {
            outcome: "",
            availableAgainAt: "",
            assignedResourceId: r.resourceId,
          };
        }
      }
      return next;
    });
  }, [open, panelResources, orderedResourceIds]);

  useEffect(() => {
    if (!open) return;
    setHistoryFilter("ALL");
    if (onRefreshHistory) {
      Promise.resolve(onRefreshHistory()).catch(() => {
        /* handled upstream */
      });
    }
  }, [open, onRefreshHistory]);

  /* ------------------------------------------------------------------
     HANDLERS
  ------------------------------------------------------------------ */

  const handleCopyId = async (resourceId: string) => {
    try {
      await navigator.clipboard.writeText(resourceId);
      // showToast(`Copied ${resourceId}`);
    } catch {
      // showToast("Unable to copy");
    }
  };

  const handleDraftChange = (
    resourceId: string,
    changes: Partial<{ outcome: CalloutOutcome | ""; availableAgainAt: string; assignedResourceId?: string }>
  ) => {
    setRowDrafts((prev) => ({
      ...prev,
      [resourceId]: {
        outcome: prev[resourceId]?.outcome ?? "",
        availableAgainAt: prev[resourceId]?.availableAgainAt ?? "",
        assignedResourceId: prev[resourceId]?.assignedResourceId ?? resourceId,
        ...changes,
      },
    }));
  };

  const handleRowSave = async (resourceId: string) => {
    if (!onSaveRow) return;

    const draft = rowDrafts[resourceId];
    const outcomeValue = (draft?.outcome || "") as CalloutOutcome | "";

    if (!outcomeValue) {
      // showToast("Select an outcome first");
      return;
    }

    if (
      outcomeValue === "Unavailable" &&
      (!draft?.availableAgainAt || draft.availableAgainAt.trim() === "")
    ) {
      // showToast("Set return time");
      return;
    }

    const assigned = draft.assignedResourceId && String(draft.assignedResourceId).trim()
      ? draft.assignedResourceId
      : resourceId;

    const payload = {
      taskId,
      resourceId: assigned,
      outcome: outcomeValue as CalloutOutcome,
      availableAgainAt:
        outcomeValue === "Unavailable"
          ? draft?.availableAgainAt
          : undefined,
    };

    try {
      // Show spinner
      setRowDrafts((prev) => ({
        ...prev,
        [resourceId]: { ...prev[resourceId], saving: true },
      }));

      await onSaveRow(payload);

      /* --------------------------------------------------------
         LOCAL PATCH HISTORY
         - Updates the “Last Outcome” column immediately
         - Does NOT trigger reorder
      -------------------------------------------------------- */
      const res = resources.find((r) => r.resourceId === resourceId);
      if (res) {
        const now = new Date().toISOString();
        const availabilityTs =
          payload.outcome === "Unavailable"
            ? payload.availableAgainAt ?? null
            : null;

        res.history = [
          ...(res.history ?? []),
          {
            previousOutcome: res.lastOutcome ?? null,
            previousAvailableAgainAt: res.availableAgainAt ?? null,
            changedAt: now,
            taskIdUsed: taskId,
            outcomeApplied: payload.outcome,
            availableAgainAt: availabilityTs,
          },
        ];

        res.lastOutcome = payload.outcome;
        res.availableAgainAt =
          payload.outcome === "Unavailable"
            ? payload.availableAgainAt ?? null
            : null;
      }

      setRowSaved((prev) => ({ ...prev, [resourceId]: true }));
      const label = CalloutOutcomeConfig[payload.outcome].label;
      // showToast(`Saved ${label}`);

      if (onRefreshHistory) {
        Promise.resolve(onRefreshHistory()).catch(() => {
          /* ignore */
        });
      }
    } catch (err) {
      console.error("save error", err);
      // showToast("Error saving");
    } finally {
      // Remove spinner
      setRowDrafts((prev) => ({
        ...prev,
        [resourceId]: { ...prev[resourceId], saving: false },
      }));
    }
  };
  /* -----------------------------------------------------
     RENDER HELPERS
  ----------------------------------------------------- */

  const renderLastOutcomeCell = (resource: ResourceRecord) => {
    let label: string | null = null;
    let timestamp: string | null = null;
    let isReturnTime = false;

    const hasHistory = Array.isArray(resource.history) && resource.history.length > 0;
    const lastHistoryEntry = hasHistory
      ? resource.history![resource.history!.length - 1]
      : null;

    const outcomeFromHistory = (lastHistoryEntry?.outcomeApplied ?? null) as
      | CalloutOutcome
      | string
      | null;
    const outcomeValue =
      outcomeFromHistory && String(outcomeFromHistory).trim()
        ? outcomeFromHistory
        : resource.lastOutcome ?? null;

    if (outcomeValue) {
      const outcomeKey = outcomeValue as CalloutOutcome;
      label =
        CalloutOutcomeConfig[outcomeKey]?.label ?? String(outcomeValue ?? "");
    }

    const normalizedAvailability =
      lastHistoryEntry?.availableAgainAt ?? resource.availableAgainAt ?? null;

    if (
      outcomeValue === "Unavailable" &&
      normalizedAvailability &&
      normalizedAvailability.trim()
    ) {
      timestamp = normalizedAvailability;
      isReturnTime = true;
    }

    if (!timestamp) {
      const changeTimestamp =
        lastHistoryEntry?.changedAt ?? resource.updatedAt ?? null;
      if (changeTimestamp && changeTimestamp.trim()) {
        timestamp = changeTimestamp;
      }
    }

    if (!label && !timestamp)
      return (
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
          No history
        </Typography>
      );

    return (
      <Stack spacing={0.25} sx={{ lineHeight: 1.4 }}>
        {label && (
          <Typography variant="caption" color="text.primary" sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
        )}
        {timestamp && (
          <Typography variant="caption" color="text.secondary">
            {isReturnTime ? "Return:" : "Updated:"} {formatUkDateTime(timestamp)}
          </Typography>
        )}
      </Stack>
    );
  };

  const overlayRef = useRef<HTMLDivElement | null>(null);

  const handleOverlayMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === overlayRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  const panelResourceIds = useMemo(() => {
    return new Set(panelResources.map((r) => r.resourceId));
  }, [panelResources]);

  const filteredHistory = useMemo(() => {
    if (!history || history.length === 0) return [] as CalloutHistoryEntry[];
    const taskMatch = taskId != null ? String(taskId) : null;
    const workMatch = workId != null ? String(workId) : null;

    const entries = history
      .filter((entry) => {
        if (!panelResourceIds.has(entry.resourceId)) {
          return false;
        }

        if (historyFilter !== "ALL" && entry.resourceId !== historyFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const aTask = a.taskId != null ? String(a.taskId) : null;
        const bTask = b.taskId != null ? String(b.taskId) : null;
        const aWork = a.workId != null ? String(a.workId) : null;
        const bWork = b.workId != null ? String(b.workId) : null;

        const aMatchesWork = workMatch && aWork ? Number(aWork === workMatch) : 0;
        const bMatchesWork = workMatch && bWork ? Number(bWork === workMatch) : 0;
        if (aMatchesWork !== bMatchesWork) return bMatchesWork - aMatchesWork;

        const aMatchesTask = taskMatch && aTask ? Number(aTask === taskMatch) : 0;
        const bMatchesTask = taskMatch && bTask ? Number(bTask === taskMatch) : 0;
        if (aMatchesTask !== bMatchesTask) return bMatchesTask - aMatchesTask;

        const aTime = Date.parse(a.timestamp);
        const bTime = Date.parse(b.timestamp);
        if (!Number.isNaN(aTime) && !Number.isNaN(bTime)) {
          return bTime - aTime;
        }
        if (!Number.isNaN(aTime)) return -1;
        if (!Number.isNaN(bTime)) return 1;
        return 0;
      });

    return entries.slice(0, 30);
  }, [history, historyFilter, panelResourceIds, taskId, workId]);

  const resourceNameLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const res of resources) {
      map.set(res.resourceId, res.name ?? "");
    }
    return map;
  }, [resources]);

  const formatHistoryOutcomeLabel = useCallback(
    (outcome: CalloutOutcome | string): string => {
      if (
        outcome &&
        typeof outcome === "string" &&
        outcome in CalloutOutcomeConfig
      ) {
        return CalloutOutcomeConfig[outcome as CalloutOutcome].label;
      }
      return String(outcome ?? "");
    },
    []
  );

  const handleViewProgress = useCallback(
    (entry: CalloutHistoryEntry) => {
      if (typeof window === "undefined") return;
      const detail = {
        taskId:
          entry.taskId != null
            ? String(entry.taskId)
            : taskId != null
            ? String(taskId)
            : null,
        workId:
          entry.workId != null
            ? String(entry.workId)
            : workId != null
            ? String(workId)
            : null,
        resourceId: entry.resourceId,
      };

      window.dispatchEvent(
        new CustomEvent("taskforce:view-progress-notes", { detail })
      );
    },
    [taskId, workId]
  );

  /* -----------------------------------------------------
     JSX
  ----------------------------------------------------- */

  if (!open) return null;

  return (
    <Box
          ref={overlayRef}
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: theme.palette.mode === 'dark' 
              ? "rgba(0, 0, 0, 0.7)" 
              : "rgba(10, 30, 60, 0.55)",
            backdropFilter: "blur(6px)",
          }}
          onMouseDown={handleOverlayMouseDown}
        >
          {/* PANEL */}
          <Paper
            variant="outlined"
            elevation={18}
            sx={{
              position: 'relative',
              width: { xs: '100%', md: '100%' },
              maxWidth: { xs: '100vw', md: '100vw' },
              height: '96vh',
              borderRadius: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderColor: 'transparent',
              boxShadow: 'none',
              backgroundColor: 'transparent',
              mx: 2, // slight horizontal margin
            }}
          
          >
            {/* HEADER */}
            <Box
              component="header"
              sx={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: { xs: 3, md: 5 },
                py: 3,
                borderBottom: theme.palette.mode === 'dark'
                  ? `1px solid ${alpha(theme.palette.common.white, 0.06)}`
                  : `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                backgroundColor: alpha(theme.palette.background.paper, 0.92),
                backdropFilter: "blur(8px)",
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    height: theme.spacing(4.5), // 36px
                    width: theme.spacing(4.5),
                    borderRadius: "50%",
                    bgcolor: theme.palette.mode === 'dark' 
                      ? theme.palette.common.white 
                      : theme.palette.primary.main,
                    color: theme.palette.mode === 'dark' ? theme.palette.common.black : theme.palette.primary.contrastText,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: theme.palette.mode === 'dark' ? 'none' : "0 10px 24px rgba(8,58,97,0.25)",
                  }}
                >
                  <WarningAmber sx={{ fontSize: 18 }} />
                </Box>

                <Stack spacing={0.5}>
                  <Typography variant="h6" fontWeight={600} color="text.primary">
                    {taskId ? `Callout Workflow — ${taskId}` : "Callout Workflow"}
                  </Typography>
                </Stack>
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center">
                <FormControl size="small" sx={{ minWidth: { xs: theme.spacing(16), sm: theme.spacing(20) } }}>
                  <Select
                    native
                    value={listScope}
                    onChange={((event: any) =>
                      setListScope(event.target.value as CalloutListScope)
                    ) as any}
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.mode === 'dark' 
                        ? theme.palette.common.white 
                        : theme.palette.primary.main,
                      '& .MuiSelect-select': { py: 1 },
                    }}
                  >
                    <option value="main">Main List</option>
                    <option value="backup" disabled={!hasBackupResources}>Backup List</option>
                    <option value="all">All Lists</option>
                  </Select>
                </FormControl>

                <IconButton 
                  onClick={onClose} 
                  sx={{ 
                    width: theme.spacing(4.5),
                    height: theme.spacing(4.5),
                    p: 0,
                    borderRadius: '50%',
                    color: theme.palette.mode === 'dark' ? theme.palette.common.white : alpha(theme.palette.text.primary, 0.9),
                    bgcolor: 'transparent',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.06) : alpha(theme.palette.text.primary, 0.06),
                    },
                    boxShadow: 'none',
                  }}
                >
                  <Close sx={{ fontSize: 18 }} />
                </IconButton>
              </Stack>


            </Box>

            {/* BODY */}
            <Box
              sx={{
                flex: 1,
                px: { xs: 3, md: 7 },
                  pt: 3,
                pb: 6,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                overflow: 'hidden',
                minHeight: 0,
                bgcolor: theme.palette.background.paper,
              }}
            >
              <Box sx={{ px: { xs: 2, md: 0 }, mb: 2 }}>
                <Alert
                  icon={<ListAlt sx={{ fontSize: 16 }} />}
                  severity="info"
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    borderColor: alpha(theme.palette.primary.main, 0.12),
                    bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.02) : alpha(theme.palette.primary.main, 0.04),
                    color: theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.primary.main,
                    '& .MuiAlert-icon': {
                      color: theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.primary.main,
                      mt: 0.25,
                    },
                    typography: "caption",
                  }}
                >
                  Choose an <b>Outcome</b> for each tech. If selecting <b>Unavailable</b>, set a return time. Press <b>Save</b> to
                  lock the row. Ordering is frozen until the panel closes.
                </Alert>
              </Box>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={4}
                sx={{ minHeight: 0, height: '100%' }}
              >
                {/* RESOURCE TABLE */}
                <Box
                  sx={{
                    display: 'flex',
                    flex: 1.4,
                    minWidth: 0,
                    height: '100%',
                      minHeight: 0,
                    flexDirection: "column",
                    px: { xs: 2, md: 0 },
                  }}
                >
                  <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 2.5 } }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{
                        mb: 2,
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                        Callout Resource List — {listScopeLabel}
                      </Typography>
                      <Box component="span" sx={{ fontSize: "0.75rem", color: alpha(theme.palette.text.primary, 0.65) }}>
                        {panelResourceCount} {panelResourceLabel}
                      </Box>
                    </Stack>

                  </Box>

                  <Box
                    sx={{
                      flex: 1,
                      overflowX: 'hidden',
                      overflowY: 'auto',
                    }}
                  >
                    <Table
                      size="small"
                      sx={{
                        tableLayout: 'fixed',
                        minWidth: { xs: 600, md: 720 },
                        '& thead th': {
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "text.secondary",
                          textTransform: "uppercase",
                          letterSpacing: 0.6,
                        },
                        '& tbody td': {
                          fontSize: "0.78rem",
                          borderBottom: theme.palette.mode === 'dark'
                            ? `1px solid ${alpha(theme.palette.common.white, 0.04)}`
                            : `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                          verticalAlign: "top",
                        },
                      }}
                    >
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ width: '10%', px: 1 }}>TECH ID</TableCell>
                          <TableCell sx={{ minWidth: 160 }}>Outcome</TableCell>
                          <TableCell sx={{ minWidth: 160 }}>Unavailable Until</TableCell>
                          <TableCell sx={{ minWidth: 150 }}>Last Outcome</TableCell>
                          <TableCell sx={{ minWidth: 180 }} align="right">
                            Actions
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {orderedResourceIds.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ py: 5, color: "text.secondary" }}>
                              No resources for this list.
                            </TableCell>
                          </TableRow>
                        ) : (
                          orderedResourceIds.map((id) => {
                            if (!panelResourceIds.has(id)) return null;

                            const resource =
                              resourceMap.get(id) ??
                              ({
                                resourceId: id,
                                name: "",
                              } as ResourceRecord);

                            const draft = rowDrafts[id] || {
                              outcome: "",
                              availableAgainAt: "",
                            };

                            const saving = !!draft.saving;
                            const hasSaved = !!rowSaved[id];
                            const rowLocked = false; // Allow re-saving
                            const isHistorySelected = historyFilter === resource.resourceId;

                            const requiresUnavailable = draft.outcome === "Unavailable";

                            const saveDisabled =
                              rowLocked ||
                              !draft.outcome ||
                              (requiresUnavailable && (!draft.availableAgainAt || draft.availableAgainAt.trim() === ""));

                            return (
                              <TableRow
                                key={id}
                                onClick={() => handleSelectHistoryResource(resource.resourceId)}
                                sx={{
                                  cursor: 'pointer',
                                  backgroundColor: rowLocked
                                    ? alpha(theme.palette.success.light, 0.25)
                                    : isHistorySelected
                                    ? alpha(theme.palette.mode === 'dark' 
                                      ? theme.palette.common.white 
                                      : theme.palette.primary.main, 0.1)
                                    : "transparent",
                                  transition: "background-color 160ms ease",
                                  '&:last-of-type td': { borderBottom: 0 },
                                }}
                              >
                                <TableCell sx={{ width: '10%', px: 1, display: 'flex', alignItems: 'center' }}>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                      px: 0.5,
                                      py: 0,
                                      height: '100%'
                                    }}
                                  >
                                    <Typography variant="subtitle2" fontWeight={600} color="text.primary" sx={{ fontSize: '0.8rem', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {resource.resourceId}
                                    </Typography>
                                    <SimpleTooltip title="Copy ID">
                                      <IconButton
                                        size="small"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          handleCopyId(resource.resourceId);
                                        }}
                                        sx={{ p: 0.25, mt: 0 }}
                                      >
                                        <ContentCopy style={{ fontSize: 10, verticalAlign: 'middle' }} />
                                      </IconButton>
                                    </SimpleTooltip>
                                  </Box>
                                </TableCell>

                                <TableCell sx={{ width: '20%' }}>
                                    <FormControl fullWidth size="small" disabled={rowLocked}>
                                    <Select
                                      native
                                      value={draft.outcome || ""}
                                      onChange={((event: any) =>
                                        handleDraftChange(resource.resourceId, {
                                          outcome: event.target.value as CalloutOutcome,
                                        })
                                      ) as any}
                                    >
                                      <option value="">Select outcome…</option>
                                      {AVAILABLE_CALLOUT_OUTCOMES.map((key) => (
                                        <option key={key} value={key}>
                                          {CalloutOutcomeConfig[key].label}
                                        </option>
                                      ))}
                                    </Select>
                                  </FormControl>
                                </TableCell>

                                <TableCell sx={{ width: '40%' }}>
                                  <Stack spacing={1} alignItems="flex-start">
                                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: "100%" }}>
                                      <TextField
                                        type="datetime-local"
                                        size="small"
                                        fullWidth
                                        disabled={!requiresUnavailable || rowLocked}
                                        value={draft.availableAgainAt || ""}
                                        onChange={(event) =>
                                          handleDraftChange(resource.resourceId, {
                                            availableAgainAt: event.target.value,
                                          })
                                        }
                                        inputProps={{ step: 300 }}
                                        InputProps={{
                                          endAdornment: (
                                            <InputAdornment position="end">
                                              <CalendarToday sx={{ fontSize: 18, color: theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.primary.main }} />
                                            </InputAdornment>
                                          ),
                                        }}
                                      />
                                    </Stack>
                                  </Stack>
                                </TableCell>

                                <TableCell sx={{ width: '15%' }}>{renderLastOutcomeCell(resource)}</TableCell>

                                <TableCell sx={{ width: '20%' }} align="right">
                                  <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={1.5}
                                    justifyContent="flex-end"
                                    alignItems={{ xs: "stretch", sm: "center" }}
                                  >
                                      {/* assignedResourceId removed — pins shown at start */}
                                    <AppButton
                                      variant={rowLocked ? "contained" : "outlined"}
                                      color={rowLocked ? "success" : "primary"}
                                      size="small"
                                      onClick={() => handleRowSave(resource.resourceId)}
                                      disabled={saveDisabled || saving}
                                      startIcon={
                                        saving ? (
                                          <CircularProgress size={16} thickness={5} color="inherit" />
                                        ) : undefined
                                      }
                                      sx={{
                                        fontWeight: 600,
                                        color: theme.palette.mode === 'dark' && !rowLocked ? theme.palette.common.white : undefined,
                                      }}
                                    >
                                      {rowLocked ? "Saved" : "Save"}
                                    </AppButton>

                                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                                      <SimpleTooltip title="Resource details">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleOpenResourceDetails(resource.resourceId)}
                                        >
                                          <Person sx={{ fontSize: 14 }} />
                                        </IconButton>
                                      </SimpleTooltip>

                                      {task && onOpenTaskPopout && (
                                        <SimpleTooltip title="Open task">
                                          <IconButton size="small" onClick={onOpenTaskPopout}>
                                            <OpenInNew sx={{ fontSize: 14 }} />
                                          </IconButton>
                                        </SimpleTooltip>
                                      )}
                                    </Stack>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </Box>
                </Box>

                {/* HISTORY SIDEBAR */}
                <Box
                  sx={{
                    width: { xs: "100%", md: 320 },
                    height: '100%',
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 260,
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    sx={{
                      px: 3,
                      py: 2.25,
                      borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                    }}
                  >
                    <Typography variant="subtitle2" color="text.primary" fontWeight={600}>
                      Recent History
                    </Typography>
                  </Stack>
                  {/* Simplified header: removed filter block to reduce visual clutter */}

                  <Box
                    sx={{
                      flex: 1,
                      overflowY: "auto",
                      px: 3,
                      pt: 3,
                      pb: 4,
                      display: "flex",
                      flexDirection: "column",
                      gap: 2.5,
                      minHeight: 0,
                    }}
                  >
                    {historyError && (
                      <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
                        {historyError}
                      </Alert>
                    )}

                    {!historyLoading && filteredHistory.length === 0 && (
                        <Box
                        sx={{
                          borderRadius: 0,
                          borderStyle: "none",
                          borderColor: 'transparent',
                          bgcolor: 'transparent',
                          px: 2.5,
                          py: 3,
                          textAlign: "center",
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          No history for this selection yet.
                        </Typography>
                      </Box>
                    )}

                    {filteredHistory.map((entry) => {
                      const resourceName =
                        resourceNameLookup.get(entry.resourceId) || null;

                      return (
                        <Box
                          key={entry.id}
                          sx={{
                            borderRadius: 0,
                            borderColor: 'transparent',
                            px: 1.5,
                            py: 1,
                            boxShadow: 'none',
                            bgcolor: 'transparent',
                          }}
                        >
                          <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Stack>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                                {resourceName || "Technician"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatHistoryOutcomeLabel(entry.outcome)}
                              </Typography>
                            </Stack>

                            <Stack alignItems="flex-end" spacing={0.5}>
                              <Typography variant="caption" color="text.secondary">
                                {formatUkDateTime(entry.timestamp)}
                              </Typography>
                              <IconButton size="small" onClick={() => handleViewProgress(entry)} sx={{ color: theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.primary.main }}>
                                <OpenInNew sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Stack>
                          </Stack>

                          {(entry.note || entry.availableAgainAt) && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                              {entry.note}
                              {entry.note && entry.availableAgainAt ? ' — ' : ''}
                              {entry.availableAgainAt ? `Return ${formatUkDateTime(entry.availableAgainAt)}` : ''}
                            </Typography>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Stack>
            </Box>
            {/* Footer removed — panel closes on overlay click or top X */}
          </Paper>
        </Box>
  );
};
