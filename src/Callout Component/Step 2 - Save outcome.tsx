import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  Select,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import { AppButton } from "../shared-components";
import Engineering from '@mui/icons-material/Engineering';
import Person from '@mui/icons-material/Person';
import Assignment from '@mui/icons-material/Assignment';
import { alpha, useTheme } from "@mui/material/styles";
import { sharedStyles } from '@/Reusable helper/Shared styles - component';
import { CalloutOutcome, CalloutOutcomeConfig, ResourceRecord } from "@/types";
import { CalloutHistoryEntry } from "@/Callout Component/useCalloutHistory";

interface Step2Props {
  selectedGroup: string;
  resourceCountByGroup: Map<string, number>;
  isStarting: boolean;
  resources: ResourceRecord[];
  calloutHistory: CalloutHistoryEntry[];
  onResourceSelect?: (resourceId: string) => void;
  onOutcomeChange?: (resourceId: string, outcome: CalloutOutcome, availableAgainAt?: string) => void;
  taskId?: string | number | null;
  onSaveOutcome?: (payload: {
    taskId: string | number | null;
    resourceId: string;
    outcome: CalloutOutcome;
    availableAgainAt?: string;
  }) => Promise<void> | void;
}

export const Step2: React.FC<Step2Props> = ({
  selectedGroup,
  resourceCountByGroup,
  isStarting,
  resources,
  calloutHistory,
  onResourceSelect,
  onOutcomeChange: _onOutcomeChange,
  taskId,
  onSaveOutcome,
}) => {
  const theme = useTheme();
  const styles = sharedStyles(theme);

  // Get resources for the selected group
  const groupResources = useMemo(() => {
    if (!selectedGroup) return [];
    return resources.filter((r) => r.calloutGroup === selectedGroup);
  }, [resources, selectedGroup]);

  // Determine displayed resources based on scope
  const displayedResources = useMemo(() => {
    return groupResources;
  }, [groupResources]);

  // Draft state for outcomes
  const [rowDrafts, setRowDrafts] = useState<
    Record<string, { outcome: CalloutOutcome | ""; availableAgainAt: string; saving?: boolean }>
  >({});

  // Track saved rows
  const [rowSaved, setRowSaved] = useState<Record<string, boolean>>({});

  // Toast message state
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Initialize drafts when resources change
  useEffect(() => {
    const newDrafts: Record<string, { outcome: CalloutOutcome | ""; availableAgainAt: string }> = {};
    groupResources.forEach((resource) => {
      if (!rowDrafts[resource.resourceId]) {
        newDrafts[resource.resourceId] = {
          outcome: "",
          availableAgainAt: "",
        };
      }
    });
    if (Object.keys(newDrafts).length > 0) {
      setRowDrafts((prev) => ({ ...prev, ...newDrafts }));
    }
  }, [groupResources, rowDrafts]);

  // Toast handler
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 2200);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const showToast = (m: string) => setToastMsg(m);

  // Handle draft changes
  const handleDraftChange = (resourceId: string, changes: Partial<{ outcome: CalloutOutcome | ""; availableAgainAt: string }>) => {
    setRowDrafts((prev) => ({
      ...prev,
      [resourceId]: {
        outcome: prev[resourceId]?.outcome ?? "",
        availableAgainAt: prev[resourceId]?.availableAgainAt ?? "",
        ...changes,
      },
    }));

    // Notify parent of changes
    if (_onOutcomeChange && changes.outcome) {
      const draft = { ...rowDrafts[resourceId], ...changes };
      _onOutcomeChange(resourceId, draft.outcome as CalloutOutcome, draft.availableAgainAt);
    }
  };

  // Handle saving a row
  const handleRowSave = async (resourceId: string) => {
    if (!onSaveOutcome) return;

    const draft = rowDrafts[resourceId];
    const outcomeValue = (draft?.outcome || "") as CalloutOutcome | "";

    if (!outcomeValue) {
      showToast("Select an outcome first");
      return;
    }

    if (outcomeValue === "Unavailable" && (!draft?.availableAgainAt || draft.availableAgainAt.trim() === "")) {
      showToast("Set return time");
      return;
    }

    try {
      // Show spinner
      setRowDrafts((prev) => ({
        ...prev,
        [resourceId]: { ...prev[resourceId], saving: true },
      }));

      const payload = {
        taskId: taskId || null,
        resourceId,
        outcome: outcomeValue as CalloutOutcome,
        availableAgainAt: outcomeValue === "Unavailable" ? draft?.availableAgainAt : undefined,
      };

      await onSaveOutcome(payload);

      setRowSaved((prev) => ({ ...prev, [resourceId]: true }));
      const label = CalloutOutcomeConfig[outcomeValue].label;
      showToast(`Saved ${label}`);
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

  const formatUkDateTime = (iso: string | null | undefined): string => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${mins}`;
  };

  const renderLastOutcomeCell = (resource: ResourceRecord) => {
    // Get callout history entries for this resource
    const resourceCalloutHistory = calloutHistory.filter(entry => entry.resourceId === resource.resourceId);

    let label: string | null = null;
    let timestamp: string | null = null;
    let isReturnTime = false;

    // Use the most recent callout history entry
    const lastHistoryEntry = resourceCalloutHistory.length > 0
      ? resourceCalloutHistory[resourceCalloutHistory.length - 1]
      : null;

    const outcomeFromHistory = lastHistoryEntry?.outcome ?? null;
    const outcomeValue = outcomeFromHistory && String(outcomeFromHistory).trim()
      ? outcomeFromHistory
      : resource.lastOutcome ?? null;

    if (outcomeValue) {
      const outcomeKey = outcomeValue as CalloutOutcome;
      label = CalloutOutcomeConfig[outcomeKey]?.label ?? String(outcomeValue ?? "");
    }

    // Check if this outcome has a return time
    if (outcomeValue === "Unavailable" && lastHistoryEntry?.availableAgainAt && lastHistoryEntry.availableAgainAt.trim()) {
      timestamp = lastHistoryEntry.availableAgainAt;
      isReturnTime = true;
    }

    // If no return time, use the timestamp of the last callout
    if (!timestamp && lastHistoryEntry?.timestamp) {
      timestamp = lastHistoryEntry.timestamp;
    }

    if (!label && !timestamp) {
      return (
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
          No history
        </Typography>
      );
    }

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

  return (
    <Stack spacing={3}>
      <Typography variant="overline" sx={styles.sectionTitle}>
        Confirm Callout Start
      </Typography>

      <Box sx={styles.confirmationBox(isStarting)}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Engineering sx={{
            fontSize: 20,
            color: isStarting ? 'warning.main' : 'success.main'
          }} />
          <Stack spacing={0.5}>
            <Typography variant="body2" fontWeight={600} color="text.primary">
              {isStarting ? 'Starting callout...' : `Ready to start callout for: ${selectedGroup}`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {resourceCountByGroup.get(selectedGroup) ?? 0} engineers available
            </Typography>
          </Stack>
          {isStarting && (
            <Box sx={{ ml: 'auto' }}>
              <Typography variant="caption" color="warning.main">
                Opening callout panel...
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>

      {/* Resource Preview Table */}
      {!isStarting && displayedResources.length > 0 && (
        <Paper
          variant="outlined"
          sx={{
            borderRadius: 2,
            borderColor: alpha(theme.palette.primary.main, 0.14),
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.12)}` }}>
            <Typography variant="subtitle2" fontWeight={600} color="text.primary">
              Configure Callout Outcomes — {selectedGroup} ({displayedResources.length} engineers) - Task {taskId}
            </Typography>
          </Box>

          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }} align="center">Tech ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }} align="center">Outcome</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }} align="center">Return Time</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }} align="center">Last Outcome</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedResources.slice(0, 10).map((resource) => {
                  const draft = rowDrafts[resource.resourceId] || { outcome: "", availableAgainAt: "" };
                  const saving = !!draft.saving;
                  const hasSaved = !!rowSaved[resource.resourceId];
                  const rowLocked = hasSaved;

                  const requiresUnavailable = draft.outcome === "Unavailable";
                  const saveDisabled = rowLocked || !draft.outcome || (requiresUnavailable && (!draft.availableAgainAt || draft.availableAgainAt.trim() === ""));

                  return (
                    <TableRow
                      key={resource.resourceId}
                      sx={{
                        backgroundColor: rowLocked ? alpha(theme.palette.success.light, 0.25) : "transparent",
                        '&:last-of-type td': { borderBottom: 0 },
                      }}
                    >
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={600}>
                          {resource.resourceId}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <FormControl fullWidth size="small" disabled={rowLocked}>
                          <Select
                            native
                            value={draft.outcome || ""}
                            onChange={(event) => handleDraftChange(resource.resourceId, {
                              outcome: event.target.value as CalloutOutcome,
                            })}
                          >
                            <option value="">Select outcome…</option>
                            {Object.keys(CalloutOutcomeConfig).map((key) => (
                              <option key={key} value={key}>
                                {CalloutOutcomeConfig[key as CalloutOutcome].label}
                              </option>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="datetime-local"
                          size="small"
                          fullWidth
                          disabled={!requiresUnavailable || rowLocked}
                          value={draft.availableAgainAt || ""}
                          onChange={(event) => handleDraftChange(resource.resourceId, {
                            availableAgainAt: event.target.value,
                          })}
                          inputProps={{ step: 300 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {renderLastOutcomeCell(resource)}
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                          <Box sx={{ minWidth: 80 }}>
                            <AppButton
                              variant="contained"
                              color={rowLocked ? "success" : "primary"}
                              size="small"
                              onClick={() => handleRowSave(resource.resourceId)}
                              disabled={saveDisabled || saving}
                              sx={{ fontWeight: 600, minWidth: 60 }}
                            >
                              {saving ? (
                                <CircularProgress size={16} thickness={5} color="inherit" />
                              ) : rowLocked ? (
                                "Saved"
                              ) : (
                                "Save"
                              )}
                            </AppButton>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => onResourceSelect?.(resource.resourceId)}
                            sx={{ color: 'black' }}
                          >
                            <Person sx={{ fontSize: 16 }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {
                              // Placeholder for task action - implement onTaskSelect if needed
                              console.log('Task action for', resource.resourceId);
                            }}
                            sx={{ color: 'black' }}
                          >
                            <Assignment sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>

          {displayedResources.length > 10 && (
            <Box sx={{ p: 2, borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.12)}` }}>
              <Typography variant="caption" color="text.secondary">
                Showing first 10 of {displayedResources.length} engineers
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Toast Message */}
      {toastMsg && (
        <Alert
          severity="success"
          variant="filled"
          sx={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            minWidth: 300,
            boxShadow: theme.shadows[8],
          }}
        >
          {toastMsg}
        </Alert>
      )}

      <Alert
        severity="info"
        variant="outlined"
        sx={{
          borderRadius: 2,
          '& .MuiAlert-message': { width: '100%' }
        }}
      >
        <Typography variant="body2">
          Configure outcomes for each technician and click "Finish Setup" to complete the callout process.
          The callout management panel will open where you can track and manage responses.
        </Typography>
      </Alert>
    </Stack>
  );
};