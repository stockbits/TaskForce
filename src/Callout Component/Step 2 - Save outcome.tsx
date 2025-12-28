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
  List,
  ListItem,
  ListItemText,
  Divider,
  Card,
  CardContent,
  Chip,
  MenuItem,
} from "@mui/material";
import { AppButton } from "../shared-components";
import Person from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import History from '@mui/icons-material/History';
// removed unused Task icon import
import Users from '@mui/icons-material/People';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { alpha, useTheme } from "@mui/material/styles";
import { CalloutOutcome, CalloutOutcomeConfig, ResourceRecord } from "@/shared-types";
import { CalloutHistoryEntry } from "@/Callout Component/useCalloutHistory";

interface Step2Props {
  task?: Record<string, any> | null;
  selectedGroup: string;
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
  onHistoryUpdate?: (entry: CalloutHistoryEntry) => void;
  onUnsavedChanges?: (hasUnsaved: boolean) => void;
}

type ResourceListType = 'main' | 'backup' | 'all';

export const Step2: React.FC<Step2Props> = ({
  task,
  selectedGroup,
  isStarting,
  resources,
  calloutHistory,
  onResourceSelect,
  onOutcomeChange: _onOutcomeChange,
  taskId,
  onSaveOutcome,
  onHistoryUpdate,
  onUnsavedChanges,

}) => {
  const theme = useTheme();

  // Get resources for the selected group
  const groupResources = useMemo(() => {
    if (!selectedGroup) return [];
    return resources.filter((r) => r.calloutGroup === selectedGroup);
  }, [resources, selectedGroup]);

  // Resource list type selection
  const [selectedListType, setSelectedListType] = useState<ResourceListType>('main');

  // Determine displayed resources based on scope
  const displayedResources = useMemo(() => {
    let filtered = groupResources;

    switch (selectedListType) {
      case 'main':
        // Filter for main list - resources with primary skill
        filtered = groupResources.filter(r => r.primarySkill);
        break;
      case 'backup':
        // Filter for backup list - resources with secondary skill but no primary
        filtered = groupResources.filter(r => r.secondarySkill && !r.primarySkill);
        break;
      case 'all':
      default:
        // Show all resources
        filtered = groupResources;
        break;
    }

    return filtered;
  }, [groupResources, selectedListType]);

  // Draft state for outcomes
  const [rowDrafts, setRowDrafts] = useState<
    Record<string, { outcome: CalloutOutcome | ""; availableAgainAt: string; saving?: boolean }>
  >({});

  // toast notifications removed: UI uses button state and cleared inputs as feedback

  // History panel state
  const [selectedHistoryResourceId, setSelectedHistoryResourceId] = useState<string | null>(null);

  // Local history map to keep most recent N entries per resource for immediate UI updates
  const [localHistoryMap, setLocalHistoryMap] = useState<Record<string, CalloutHistoryEntry[]>>({});

  // Track recently saved outcomes for immediate display in Last Outcome column
  const [recentlySavedOutcomes, setRecentlySavedOutcomes] = useState<
    Record<string, { outcome: CalloutOutcome; availableAgainAt?: string; timestamp: string }>
  >({});

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

  // Initialize local history map from prop, keep most recent 5 per resource
  useEffect(() => {
    const map: Record<string, CalloutHistoryEntry[]> = {};
    calloutHistory.forEach((entry) => {
      if (!map[entry.resourceId]) map[entry.resourceId] = [];
      map[entry.resourceId].push(entry);
    });
    Object.keys(map).forEach((rid) => {
      map[rid] = map[rid]
        .sort((a, b) => (new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()))
        .slice(0, 5);
    });
    setLocalHistoryMap(map);
  }, [calloutHistory]);

  // toast handler removed

  // Check for unsaved changes
  useEffect(() => {
    if (!onUnsavedChanges) return;
    
    const hasUnsaved = Object.values(rowDrafts).some(draft => 
      draft.outcome && draft.outcome.trim() !== ""
    );
    
    onUnsavedChanges(hasUnsaved);
  }, [rowDrafts, onUnsavedChanges]);

  // showToast removed

  // History panel handlers
  const toggleHistoryPanel = (resourceId: string) => {
    setSelectedHistoryResourceId(selectedHistoryResourceId === resourceId ? null : resourceId);
  };

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
      return;
    }

    if (outcomeValue === "Unavailable" && (!draft?.availableAgainAt || draft.availableAgainAt.trim() === "")) {
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

      // Update history with the saved outcome
      if (onHistoryUpdate) {
        onHistoryUpdate({
          id: `OUTCOME-${resourceId}-${Date.now()}`,
          taskId: taskId || task?.taskId || task?.TaskID || null,
          workId: null,
          resourceId,
          outcome: outcomeValue as CalloutOutcome,
          status: null,
          availableAgainAt: outcomeValue === "Unavailable" ? draft?.availableAgainAt || null : null,
          note: `Outcome set to ${CalloutOutcomeConfig[outcomeValue].label}`,
          timestamp: new Date().toISOString(),
          taskIcon: 'Assignment',
        });
      }

      // Also update local history map immediately so UI shows top 5 (newest first)
      const newEntry: CalloutHistoryEntry = {
        id: `OUTCOME-${resourceId}-${Date.now()}`,
        taskId: taskId || task?.taskId || task?.TaskID || null,
        workId: null,
        resourceId,
        outcome: outcomeValue as CalloutOutcome,
        status: null,
        availableAgainAt: outcomeValue === "Unavailable" ? draft?.availableAgainAt || null : null,
        note: `Outcome set to ${CalloutOutcomeConfig[outcomeValue].label}`,
        timestamp: new Date().toISOString(),
        taskIcon: 'Assignment',
      };

      setLocalHistoryMap((prev) => {
        const list = prev[resourceId] ? [newEntry, ...prev[resourceId]] : [newEntry];
        return { ...prev, [resourceId]: list.slice(0, 5) };
      });

      // Immediately update the Last Outcome display
      setRecentlySavedOutcomes((prev) => ({
        ...prev,
        [resourceId]: {
          outcome: outcomeValue as CalloutOutcome,
          availableAgainAt: outcomeValue === "Unavailable" ? draft?.availableAgainAt : undefined,
          timestamp: new Date().toISOString(),
        },
      }));

      // Clear the draft after successful save
      setRowDrafts((prev) => ({
        ...prev,
        [resourceId]: { outcome: "", availableAgainAt: "", saving: false },
      }));

    } catch (err) {
      console.error("save error", err);
    } finally {
      // Remove spinner (only if not already cleared above)
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
    const resourceId = resource.resourceId;

    // Check for recently saved outcome first
    const recentlySaved = recentlySavedOutcomes[resourceId];
    if (recentlySaved) {
      const label = CalloutOutcomeConfig[recentlySaved.outcome]?.label ?? String(recentlySaved.outcome);
      const timestamp = recentlySaved.availableAgainAt && recentlySaved.outcome === "Unavailable" 
        ? recentlySaved.availableAgainAt 
        : recentlySaved.timestamp;
      const isReturnTime = recentlySaved.availableAgainAt && recentlySaved.outcome === "Unavailable";

      return (
        <Stack spacing={0.25} sx={{ lineHeight: 1.4 }}>
          <Typography variant="caption" color="text.primary" sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
          {timestamp && (
            <Typography variant="caption" color="text.secondary">
              {isReturnTime ? "Return:" : "Updated:"} {formatUkDateTime(timestamp)}
            </Typography>
          )}
        </Stack>
      );
    }

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

  const getDisplayedHistoryFor = (resourceId: string) => {
    const local = localHistoryMap[resourceId];
    if (local && local.length > 0) return local;
    const filtered = calloutHistory.filter((e) => e.resourceId === resourceId);
    return filtered
      .sort((a, b) => (new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()))
      .slice(0, 5);
  };

  const renderIconFor = (iconName?: string | null) => {
    switch (iconName) {
      case 'Assignment':
        return <AssignmentIcon sx={{ fontSize: 14 }} />;
      default:
        return <AssignmentIcon sx={{ fontSize: 14 }} />;
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', height: 'calc(100vh - 80px)', overflow: 'hidden' }}>
      {/* Main Content */}
      <Box sx={{ flex: selectedHistoryResourceId ? 1 : 'auto', minWidth: 0, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Stack spacing={3} sx={{ flex: 1, minHeight: 0, height: '100%' }}>
          {/* Progress Information */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            {/* Progress Information */}
            {task && (
              <Paper variant="outlined" sx={{ ...{ p: 2, borderRadius: 2 }, flex: 1 }}>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Stack spacing={2} sx={{ flex: 1 }}>
                      <Typography variant="overline">
                        Progress
                      </Typography>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Chip
                          label={task.taskId || task.TaskID || task.id || 'Unknown'}
                          size="small"
                          color={theme.palette.mode === 'dark' ? 'secondary' : 'primary'}
                          variant="outlined"
                        />

                        <ChevronRight sx={{ color: 'text.secondary', fontSize: 18 }} />

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Users sx={{ fontSize: 18, color: 'success.main' }} />
                          <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.mode === 'dark' ? 'text.primary' : 'primary.main' }}>
                            Selected: {selectedGroup}
                          </Typography>
                        </Box>
                      </Stack>
                    </Stack>

                    {/* Resource List Selection */}
                    {!isStarting && groupResources.length > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                          Resource List:
                        </Typography>
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                          <Select
                            value={selectedListType}
                            onChange={(event) => setSelectedListType(event.target.value as ResourceListType)}
                            displayEmpty
                          >
                            <MenuItem value="main">Main List</MenuItem>
                            <MenuItem value="backup">Backup</MenuItem>
                            <MenuItem value="all">Show All</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    )}
                  </Box>
                </Stack>
              </Paper>
            )}
          </Box>

          {/* Resource Preview Table */}
          {!isStarting && displayedResources.length > 0 && (
            <Paper
              variant="outlined"
              sx={{
                borderRadius: 2,
                borderColor: alpha(theme.palette.primary.main, 0.14),
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: 'calc(100vh - 220px)',
              }}
            >
              <Box sx={{ maxHeight: 'calc(100vh - 220px)', overflow: 'auto' }}>
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

                  const requiresUnavailable = draft.outcome === "Unavailable";
                  const saveDisabled = !draft.outcome || (requiresUnavailable && (!draft.availableAgainAt || draft.availableAgainAt.trim() === ""));

                  return (
                    <TableRow
                      key={resource.resourceId}
                      sx={{
                        backgroundColor: "transparent",
                        '&:last-of-type td': { borderBottom: 0 },
                      }}
                    >
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {resource.resourceId}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <FormControl fullWidth size="small">
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
                          sx={{
                            maxWidth: 180,
                            '& input': { color: theme.palette.text.primary },
                            '& input::-webkit-calendar-picker-indicator': {
                              filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none'
                            }
                          }}
                          disabled={!requiresUnavailable}
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
                              color="primary"
                              size="small"
                              onClick={() => handleRowSave(resource.resourceId)}
                              disabled={saveDisabled || saving}
                              sx={{ fontWeight: 600, minWidth: 60 }}
                            >
                              {saving ? (
                                <CircularProgress size={16} thickness={5} color="inherit" />
                              ) : (
                                "Save"
                              )}
                            </AppButton>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => onResourceSelect?.(resource.resourceId)}
                            sx={{ color: theme.palette.text.primary }}
                          >
                            <Person sx={{ fontSize: 16 }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {
                              // Placeholder for task action - implement onTaskSelect if needed
                              console.log('Task action for', resource.resourceId);
                            }}
                            sx={{ color: theme.palette.text.primary }}
                          >
                            <AssignmentIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => toggleHistoryPanel(resource.resourceId)}
                            sx={{ color: theme.palette.text.primary }}
                          >
                            <History sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>

          <Box sx={{ p: 2, borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.12)}` }}>
            <Typography variant="caption" color="text.secondary">
              {displayedResources.length} engineers
            </Typography>
          </Box>
        </Paper>
      )}

        </Stack>
      </Box>

      {/* Toast removed - button state and cleared inputs act as feedback */}

      {/* History Panel */}
      {selectedHistoryResourceId && (
        <Box sx={{ width: 400, flexShrink: 0, maxHeight: 'calc(100vh - 200px)', overflow: 'hidden' }}>
          <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Callout History - {selectedHistoryResourceId}
                </Typography>
                <IconButton size="small" onClick={() => setSelectedHistoryResourceId(null)}>
                  <Typography variant="caption" sx={{ fontSize: 12, color: theme.palette.text.primary }}>✕</Typography>
                </IconButton>
              </Stack>
              <List dense sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                {getDisplayedHistoryFor(selectedHistoryResourceId || "").map((entry, index) => (
                    <React.Fragment key={entry.id}>
                      <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
                        <ListItemText
                          primary={
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="body2" fontWeight={600}>
                                {CalloutOutcomeConfig[entry.outcome as CalloutOutcome]?.label || entry.outcome}
                              </Typography>
                              {entry.taskId && (
                                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ ml: 1 }}>
                                  <IconButton
                                    size="small"
                                    sx={{ p: 0.5, color: theme.palette.text.primary }}
                                    onClick={() => console.log('task clicked', entry.taskId)}
                                  >
                                    {renderIconFor(entry.taskIcon)}
                                  </IconButton>
                                  <Typography variant="caption" color="text.secondary">
                                    {entry.taskId}
                                  </Typography>
                                </Stack>
                              )}
                            </Stack>
                          }
                          secondary={
                            <Stack spacing={0.5}>
                              <Typography variant="caption" color="text.secondary">
                                {formatUkDateTime(entry.timestamp)}
                              </Typography>
                              {entry.availableAgainAt && (
                                <Typography variant="caption" color="text.secondary">
                                  Return: {formatUkDateTime(entry.availableAgainAt)}
                                </Typography>
                              )}
                              {entry.note && (
                                <Typography variant="caption" color="text.secondary">
                                  {entry.note}
                                </Typography>
                              )}
                            </Stack>
                          }
                        />
                      </ListItem>
                      {index < calloutHistory.filter(e => e.resourceId === selectedHistoryResourceId).length - 1 && (
                        <Divider component="li" />
                      )}
                    </React.Fragment>
                  ))}
                {calloutHistory.filter(entry => entry.resourceId === selectedHistoryResourceId).length === 0 && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                          No history available
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Box>
      )}

    </Box>
  </>
  );
};