import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Alert,
  Box,
  CircularProgress,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AppButton from '@/shared-ui/button';
import {
  X,
  AlertTriangle,
  ClipboardList,
  Clock,
  Copy,
  ExternalLink,
  RotateCcw,
  User,
} from "lucide-react";
import { alpha, useTheme } from "@mui/material/styles";
import type { SelectChangeEvent } from "@mui/material/Select";
import { type CalloutHistoryEntry } from "@/hooks/useCalloutHistory";

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

const MotionBox = motion.create(Box);
const MotionPaper = motion.create(Paper);
const MotionTableRow = motion.create(TableRow);


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

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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
     TOAST HANDLER
  ------------------------------------------------------------------ */

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 2200);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const showToast = (m: string) => setToastMsg(m);

  /* ------------------------------------------------------------------
     HANDLERS
  ------------------------------------------------------------------ */

  const handleCopyId = async (resourceId: string) => {
    try {
      await navigator.clipboard.writeText(resourceId);
      showToast(`Copied ${resourceId}`);
    } catch {
      showToast("Unable to copy");
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
      showToast("Select an outcome first");
      return;
    }

    if (
      outcomeValue === "Unavailable" &&
      (!draft?.availableAgainAt || draft.availableAgainAt.trim() === "")
    ) {
      showToast("Set return time");
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
      showToast(`Saved ${label}`);

      if (onRefreshHistory) {
        Promise.resolve(onRefreshHistory()).catch(() => {
          /* ignore */
        });
      }
    } catch (err) {
      console.error("save error", err);
      showToast("Error saving");
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

  return (
    <AnimatePresence>
      {open && (
        <MotionBox
          ref={overlayRef}
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(10, 30, 60, 0.55)",
            backdropFilter: "blur(6px)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={handleOverlayMouseDown}
        >
          {/* PANEL */}
          <MotionPaper
            variant="outlined"
            elevation={18}
            sx={{
              position: 'relative',
              width: { xs: 'calc(100% - 32px)', md: 'calc(100% - 40px)' },
              maxWidth: { xs: '98vw', md: theme.spacing(190) }, // 1520px at md+
              maxHeight: '96vh',
              borderRadius: 4,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderColor: alpha(theme.palette.primary.main, 0.16),
              boxShadow: '0 24px 64px rgba(8,58,97,0.25)',
              backgroundImage: 'none',
            }}
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 24 }}
            transition={{ duration: 0.18 }}
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
                borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
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
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 10px 24px rgba(8,58,97,0.25)",
                  }}
                >
                  <AlertTriangle size={18} />
                </Box>

                <Stack spacing={0.5}>
                  <Typography variant="h6" fontWeight={600} color="text.primary">
                    {taskId ? `Callout Workflow — ${taskId}` : "Callout Workflow"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Set outcomes. After saving a row, it locks and stays in position until panel is closed.
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
                      color: theme.palette.primary.main,
                      '& .MuiSelect-select': { py: 1 },
                    }}
                  >
                    <option value="main">Main List</option>
                    <option value="backup" disabled={!hasBackupResources}>Backup List</option>
                    <option value="all">All Lists</option>
                  </Select>
                </FormControl>

                <IconButton onClick={onClose} sx={{ color: "text.secondary" }}>
                  <X size={18} />
                </IconButton>
              </Stack>

              {/* TOAST (centre top) */}
              {toastMsg && (
                <Box
                  sx={{
                    pointerEvents: "none",
                    position: "absolute",
                    top: 12,
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 10100,
                  }}
                >
                  <Paper
                    elevation={8}
                    sx={{
                      px: 2.5,
                      py: 1.25,
                      borderRadius: 2,
                      bgcolor: "rgba(17,24,39,0.92)",
                      color: "common.white",
                      maxWidth: 280,
                    }}
                  >
                    <Typography variant="caption" sx={{ display: "block" }}>
                      {toastMsg}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Box>

            {/* BODY */}
            <Box
              sx={{
                flex: 1,
                px: { xs: 3, md: 7 },
                pt: 4,
                pb: 6,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                overflow: { xs: "auto", xl: "hidden" },
                minHeight: 0,
              }}
            >
              {/* INFO BOX */}
              <Alert
                icon={<ClipboardList size={16} />}
                severity="info"
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                  color: theme.palette.primary.main,
                  '& .MuiAlert-icon': {
                    color: theme.palette.primary.main,
                    mt: 0.25,
                  },
                  typography: "caption",
                }}
              >
                Choose an <b>Outcome</b> for each tech. If selecting <b>Unavailable</b>, set a return time. Press <b>Save</b> to
                lock the row. Ordering is frozen until the panel closes.
              </Alert>

              <Stack
                direction={{ xs: "column", xl: "row" }}
                spacing={4}
                sx={{ minHeight: 0 }}
              >
                {/* RESOURCE TABLE */}
                <Paper
                  variant="outlined"
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    minHeight: 0,
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: 3,
                    borderColor: alpha(theme.palette.primary.main, 0.14),
                    boxShadow: "0 18px 40px rgba(8,58,97,0.16)",
                    bgcolor: alpha(theme.palette.background.paper, 0.98),
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      px: 3,
                      py: 2,
                      borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                      Callout Resource List — {listScopeLabel}
                    </Typography>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={`${listScope}-${panelResourceCount}`}
                        style={{ fontSize: "0.75rem", color: alpha(theme.palette.text.primary, 0.65) }}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.16 }}
                      >
                        {panelResourceCount} {panelResourceLabel}
                      </motion.span>
                    </AnimatePresence>
                  </Stack>

                  <MotionBox
                    layout
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    sx={{
                      flex: 1,
                      overflow: "auto",
                      px: 2,
                      py: 2.5,
                      maxHeight: panelContentMaxHeight,
                      minHeight: 260,
                    }}
                  >
                    <Table
                      size="small"
                      sx={{
                        minWidth: 720,
                        '& thead th': {
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "text.secondary",
                          textTransform: "uppercase",
                          letterSpacing: 0.6,
                        },
                        '& tbody td': {
                          fontSize: "0.78rem",
                          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                          verticalAlign: "top",
                        },
                      }}
                    >
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ minWidth: 140 }}>Tech ID</TableCell>
                          <TableCell sx={{ minWidth: 210 }}>Outcome</TableCell>
                          <TableCell sx={{ minWidth: 210 }}>Unavailable Until</TableCell>
                          <TableCell sx={{ minWidth: 190 }}>Last Outcome</TableCell>
                          <TableCell sx={{ minWidth: 220 }} align="right">
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
                            const rowLocked = hasSaved;
                            const isHistorySelected = historyFilter === resource.resourceId;

                            const requiresUnavailable = draft.outcome === "Unavailable";

                            const saveDisabled =
                              rowLocked ||
                              !draft.outcome ||
                              (requiresUnavailable && (!draft.availableAgainAt || draft.availableAgainAt.trim() === ""));

                            return (
                              <MotionTableRow
                                layout
                                key={id}
                                sx={{
                                  backgroundColor: rowLocked
                                    ? alpha(theme.palette.success.light, 0.25)
                                    : isHistorySelected
                                    ? alpha(theme.palette.primary.main, 0.1)
                                    : "transparent",
                                  transition: "background-color 160ms ease",
                                  '&:last-of-type td': { borderBottom: 0 },
                                }}
                              >
                                <TableCell>
                                  <Box
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => handleSelectHistoryResource(resource.resourceId)}
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        handleSelectHistoryResource(resource.resourceId);
                                      }
                                    }}
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      cursor: "pointer",
                                      userSelect: "none",
                                      borderRadius: 1,
                                      px: 1,
                                      py: 0.5,
                                      transition: "background-color 120ms ease",
                                      bgcolor: isHistorySelected
                                        ? alpha(theme.palette.primary.main, 0.18)
                                        : undefined,
                                      '&:hover': {
                                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                                      },
                                      '&:focus-visible': {
                                        outline: `2px solid ${theme.palette.primary.main}`,
                                        outlineOffset: 2,
                                      },
                                    }}
                                  >
                                    <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                                      {resource.resourceId}
                                    </Typography>
                                    <Tooltip title="Copy ID">
                                      <IconButton
                                        size="small"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          handleCopyId(resource.resourceId);
                                        }}
                                      >
                                        <Copy size={14} />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </TableCell>

                                <TableCell>
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

                                <TableCell>
                                  <Stack spacing={1} alignItems="flex-start">
                                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: "100%" }}>
                                      <Clock
                                        size={14}
                                        color={
                                          requiresUnavailable && !rowLocked
                                            ? theme.palette.primary.main
                                            : alpha(theme.palette.text.secondary, 0.8)
                                        }
                                      />
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
                                      />
                                    </Stack>
                                    {requiresUnavailable && (!draft.availableAgainAt || draft.availableAgainAt.trim() === "") && !rowLocked && (
                                      <Typography variant="caption" color="error">
                                        Set return time when unavailable.
                                      </Typography>
                                    )}
                                  </Stack>
                                </TableCell>

                                <TableCell>{renderLastOutcomeCell(resource)}</TableCell>

                                <TableCell align="right">
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
                                      sx={{ fontWeight: 600 }}
                                    >
                                      {rowLocked ? "Saved" : "Save"}
                                    </AppButton>

                                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                                      <Tooltip title="Resource details">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleOpenResourceDetails(resource.resourceId)}
                                        >
                                          <User size={14} />
                                        </IconButton>
                                      </Tooltip>

                                      {task && onOpenTaskPopout && (
                                        <Tooltip title="Open task">
                                          <IconButton size="small" onClick={onOpenTaskPopout}>
                                            <ExternalLink size={14} />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                    </Stack>
                                  </Stack>
                                </TableCell>
                              </MotionTableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </MotionBox>
                </Paper>

                {/* HISTORY SIDEBAR */}
                <Paper
                  variant="outlined"
                  sx={{
                    width: { xs: "100%", xl: 340 },
                    borderRadius: 3,
                    display: "flex",
                    flexDirection: "column",
                    borderColor: alpha(theme.palette.primary.main, 0.2),
                    boxShadow: "0 12px 32px rgba(8,58,97,0.12)",
                    bgcolor: alpha(theme.palette.background.paper, 0.98),
                    height: panelContentMaxHeight,
                    minHeight: 260,
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      px: 3,
                      py: 2.25,
                      borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Clock size={16} color={theme.palette.primary.main} />
                      <Typography variant="subtitle2" color="text.primary" fontWeight={600}>
                        Recent History
                      </Typography>
                    </Stack>
                    <AppButton
                      size="small"
                      variant="text"
                      onClick={() => {
                        if (!onRefreshHistory) return;
                        Promise.resolve(onRefreshHistory()).catch(() => {
                          /* ignore */
                        });
                      }}
                      disabled={historyLoading}
                      startIcon={
                        historyLoading ? (
                          <CircularProgress size={16} thickness={5} color="inherit" />
                        ) : (
                          <RotateCcw size={14} />
                        )
                      }
                      sx={{
                        fontWeight: 600,
                        color: theme.palette.primary.main,
                        gap: 0.75,
                        '&:hover': { color: alpha(theme.palette.primary.main, 0.85) },
                      }}
                    >
                      {historyLoading ? "Loading" : "Refresh"}
                    </AppButton>
                  </Stack>

                  <Box
                    sx={{
                      px: 3,
                      py: 2,
                      borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                    }}
                  >
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography
                        variant="caption"
                        sx={{
                          textTransform: "uppercase",
                          letterSpacing: 0.8,
                          color: "text.secondary",
                          fontWeight: 600,
                        }}
                      >
                        Filter
                      </Typography>
                      <AppButton
                        size="small"
                        variant="text"
                        onClick={handleResetHistoryFilter}
                        sx={{
                          fontWeight: 600,
                          color:
                            historyFilter === "ALL"
                              ? theme.palette.primary.main
                              : alpha(theme.palette.primary.main, 0.7),
                          '&:hover': {
                            color: theme.palette.primary.main,
                            backgroundColor: "transparent",
                          },
                        }}
                      >
                        Show all
                      </AppButton>
                    </Stack>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 1.5, lineHeight: 1.6 }}
                    >
                      Click a tech row on the left to focus their recent history.
                    </Typography>
                  </Box>

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
                      <Paper
                        variant="outlined"
                        sx={{
                          borderRadius: 2,
                          borderStyle: "dashed",
                          borderColor: alpha(theme.palette.primary.main, 0.25),
                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                          px: 2.5,
                          py: 3,
                          textAlign: "center",
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          No history for this selection yet.
                        </Typography>
                      </Paper>
                    )}

                    {filteredHistory.map((entry) => {
                      const resourceName =
                        resourceNameLookup.get(entry.resourceId) || null;

                      return (
                        <Paper
                          key={entry.id}
                          variant="outlined"
                          sx={{
                            borderRadius: 2,
                            borderColor: alpha(theme.palette.primary.main, 0.15),
                            px: 2.5,
                            py: 2.25,
                            boxShadow: "0 10px 24px rgba(8,58,97,0.08)",
                            bgcolor: theme.palette.background.paper,
                          }}
                        >
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                          >
                            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>
                              {resourceName || "Technician"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatUkDateTime(entry.timestamp)}
                            </Typography>
                          </Stack>

                          <Typography
                            variant="subtitle2"
                            sx={{ mt: 0.75, fontWeight: 600, color: "text.primary" }}
                          >
                            {formatHistoryOutcomeLabel(entry.outcome)}
                          </Typography>

                          {entry.note && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ mt: 1, lineHeight: 1.6, display: "block" }}
                            >
                              {entry.note}
                            </Typography>
                          )}

                          {entry.availableAgainAt && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1.25, display: "block" }}>
                              Return {formatUkDateTime(entry.availableAgainAt)}
                            </Typography>
                          )}

                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{ mt: 1.75 }}
                          >
                            <Typography
                              variant="overline"
                              sx={{
                                letterSpacing: 1,
                                color: "text.disabled",
                                textTransform: "uppercase",
                              }}
                            >
                              {entry.status ?? ""}
                            </Typography>
                            <AppButton
                              size="small"
                              variant="text"
                              onClick={() => handleViewProgress(entry)}
                              startIcon={<ExternalLink size={14} />}
                              sx={{
                                fontWeight: 600,
                                color: theme.palette.primary.main,
                                '&:hover': { color: alpha(theme.palette.primary.main, 0.85) },
                              }}
                            >
                              View progress
                            </AppButton>
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Box>
                </Paper>
              </Stack>
            </Box>
            {/* FOOTER */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                px: { xs: 3, md: 7 },
                py: 3,
                borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
              }}
            >
              <AppButton
                onClick={onClose}
                variant="outlined"
                color="primary"
                size="small"
                sx={{
                  fontWeight: 600,
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  color: theme.palette.primary.main,
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  },
                }}
              >
                Close
              </AppButton>
            </Box>
          </MotionPaper>
        </MotionBox>
      )}
    </AnimatePresence>
  );
};
