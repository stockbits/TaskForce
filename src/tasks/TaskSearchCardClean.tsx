import React, { useState, useMemo, useCallback } from "react";
// framer-motion removed — render static Card components
import { useAppSnackbar } from '@/shared-ui/SnackbarProvider';
import mockTasks from "@/data/mockTasks.json";
import {
  Box,
  useTheme,
  Card,
  CardActions,
  CardContent,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Grid,
  Tabs,
  Tab,
  Stack,
  Tooltip,
} from '@mui/material';
import ListAlt from '@mui/icons-material/ListAlt';
import StickyNote2 from '@mui/icons-material/StickyNote2';
import WarningAmber from '@mui/icons-material/WarningAmber';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import TodayIcon from '@mui/icons-material/Today';
import TodayOutlinedIcon from '@mui/icons-material/TodayOutlined';
import DateTimePopover from '@/shared-ui/DateTimePopover';
import { MultiSelectField, FreeTypeSelectField, CombinedLocationField } from '@/shared-ui';
import ImpScoreField from '@/shared-ui/text-fields/ImpScoreField';
import ExactGlobalSearchField from '@/shared-ui/text-fields/ExactGlobalSearchField';
import AppButton from '@/shared-ui/button';
import Visibility from '@mui/icons-material/Visibility';

type Filters = {
  taskSearch: string;
  division: string[];
  domainId: string[];
  taskStatuses: string[];
  requester: string;
  responseCode: string[];
  commitType: string[];
  capabilities: string[];
  pwa: string[];
  jobType: string;
  scoreCondition: string;
  scoreValue: string;
  locationType: string;
  locationValue: string;
  fromDate: string;
  fromTime: string;
  toDate: string;
  toTime: string;
};

type Props = {
  onSearch: (filters: Record<string, any>) => void;
  onClear: () => void;
  onCopy?: () => void;
  onExport?: () => void;
  canCopy?: boolean;
  forceCollapsed?: boolean;
  onOpenColumns?: (anchor: HTMLElement) => void;
  hasResults?: boolean;
  selectedRows?: Record<string, any>[];
  onOpenPopout?: (tasks: any[]) => void;
  onProgressTasks?: (tasks: any[]) => void;
  onProgressNotes?: (tasks: any[]) => void;
  onOpenCalloutIncident?: (task: any) => void;
};

type ArrayFilterKey =
  | "division"
  | "domainId"
  | "taskStatuses"
  | "responseCode"
  | "commitType"
  | "capabilities"
  | "pwa";

// use Card directly instead of motion-wrapped variant

const INITIAL_FILTERS: Filters = {
  taskSearch: "",
  division: [],
  domainId: [],
  taskStatuses: [],
  requester: "",
  responseCode: [],
  commitType: [],
  capabilities: [],
  pwa: [],
  jobType: "",
  scoreCondition: "",
  scoreValue: "",
  locationType: "",
  locationValue: "",
  fromDate: "",
  fromTime: "",
  toDate: "",
  toTime: "",
};

export default function TaskSearchCard({
  onSearch,
  onClear,
  onCopy,
  onExport,
  canCopy = false,
  forceCollapsed: _forceCollapsed = false,
  onOpenColumns: _onOpenColumns,
  hasResults = false,
  selectedRows = [],
  onOpenPopout,
  onProgressTasks,
  onProgressNotes,
  onOpenCalloutIncident,
}: Props) {
  const theme = useTheme();
  const [filters, setFilters] = useState<Filters>(() => ({ ...INITIAL_FILTERS }));
  const [isFavourite, setIsFavourite] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "advanced">("basic");
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [actionsAnchorEl, setActionsAnchorEl] = useState<null | HTMLElement>(null);
  const [dateMenuAnchor, setDateMenuAnchor] = useState<null | HTMLElement>(null);

  const uniq = (arr: (string | null | undefined)[]) =>
    Array.from(new Set(arr.filter(Boolean) as string[]));

  const divisionOptions = useMemo(
    () => uniq(mockTasks.map((t) => t.division)).sort(),
    []
  );
  const domainOptions = useMemo(
    () => uniq(mockTasks.map((t) => t.domain)).sort(),
    []
  );
  const statusOptions = useMemo(() => {
    const raw = uniq(mockTasks.map((t) => t.taskStatus));
    return raw.sort((a, b) => {
      const matchA = a.match(/\(([^)]+)\)\s*$/);
      const matchB = b.match(/\(([^)]+)\)\s*$/);
      const labelA = matchA?.[1] ?? a;
      const labelB = matchB?.[1] ?? b;
      return labelA.localeCompare(labelB);
    });
  }, []);
  const responseOptions = useMemo(
    () => uniq(mockTasks.map((t) => t.responseCode)).sort(),
    []
  );
  const commitOptions = useMemo(
    () => uniq(mockTasks.map((t) => t.commitmentType)).sort(),
    []
  );
  const capabilityOptions = useMemo(
    () => uniq(mockTasks.flatMap((t) => t.capabilities || [])).sort(),
    []
  );
  const pwaOptions = useMemo(
    () => uniq(mockTasks.map((t) => t.pwa)).sort(),
    []
  );
  const requesterOptions = useMemo(
    () => uniq(mockTasks.map((t) => t.resourceName)).sort(),
    []
  );
  const jobTypeOptions = useMemo(
    () => uniq(mockTasks.map((t) => t.taskType)).sort(),
    []
  );

  // Prefill header describing what users can search (no example values)
  const prefillPrompt = useMemo(() => {
    return "Search by Task ID, Work ID, Estimate Number, Employee ID";
  }, []);

  // Use a responsive standard width for all boxes, but allow per-field
  // expansion based on the measured DB values (or overrides) so default
  // prompt/placeholder values (plus breathing room and the select-all icon)
  // are visible on load without forcing the control to resize later.
  // Measured pixel widths (client-only). We'll compute these on mount so the
  // box widths match the actual rendered prompt text + icon precisely.

  // Standard box width used across filter controls to keep consistent sizing.
  // Increased responsive values to give more breathing room so pills/numbers
  // and default placeholder text don't feel cramped.

  const canSearch = useMemo(() => {
    if (filters.taskSearch.trim().length > 0) return true;
    return filters.division.length > 0 && filters.domainId.length > 0 && filters.taskStatuses.length > 0;
  }, [filters.division.length, filters.domainId.length, filters.taskStatuses.length, filters.taskSearch]);

  const handleFieldChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = event.target;
      setFilters((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleMultiChange = useCallback(
    (key: ArrayFilterKey, value: string[]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // removed handleChipDelete — top prefill chips were removed per UX request

  const handleSearch = useCallback(() => {
    onSearch(filters);
  }, [filters, onSearch]);

  const handleClear = useCallback(() => {
    setFilters({ ...INITIAL_FILTERS });
    onClear();
  }, [onClear]);

  const handleMenuOpen = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setMenuAnchorEl(event.currentTarget);
    },
    []
  );

  const handleMenuClose = useCallback(() => {
    setMenuAnchorEl(null);
  }, []);

  const handleCopy = useCallback(() => {
    if (canCopy && onCopy) {
      onCopy();
    } else {
      snackbar.error("No data to copy");
    }
    handleMenuClose();
  }, [canCopy, handleMenuClose, onCopy]);

  const handleExport = useCallback(() => {
    if (canCopy && onExport) {
      onExport();
    } else {
      snackbar.error("No data to export");
    }
    handleMenuClose();
  }, [canCopy, handleMenuClose, onExport]);

  const snackbar = useAppSnackbar();

  return (
    <Card
      sx={{
        borderRadius: '12px 12px 0 0',
        boxShadow: "0 18px 35px rgba(10, 74, 122, 0.12)",
        overflow: "hidden",
        width: "100%",
        maxWidth: '100%',
        mx: 0,
      }}
    >
      <Box sx={{ px: { xs: 2, md: 3 }, py: 0.5, bgcolor: 'transparent' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tabs
            value={activeTab}
            onChange={(_e, v) => setActiveTab(v)}
            variant="standard"
            sx={{ minHeight: 36 }}
          >
            <Tab value="basic" label="Basic" sx={{ minHeight: 36, px: 1 }} />
            <Tab value="advanced" label="Advanced" sx={{ minHeight: 36, px: 1 }} />
          </Tabs>

          <Box sx={{ flex: 1 }} />

          <ExactGlobalSearchField
            name="taskSearch"
            value={filters.taskSearch}
            onChange={handleFieldChange}
            onSearch={handleSearch}
            placeholder={prefillPrompt}
            size="small"
            showSearchButton={true}
            enableValidation={filters.taskSearch.trim().length > 0 || (filters.division.length === 0 || filters.domainId.length === 0 || filters.taskStatuses.length === 0)}
            searchTooltip={prefillPrompt}
            sx={{}}
          />
          {/* debug badge removed */}
          <IconButton
            onClick={(e) => setDateMenuAnchor(e.currentTarget)}
            size="small"
            sx={{ ml: 1 }}
            aria-label="date-filter"
          >
            { (filters.fromDate || filters.toDate || filters.fromTime || filters.toTime) ? (
              <TodayIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
            ) : (
              <TodayOutlinedIcon sx={{ fontSize: 20 }} />
            )}
          </IconButton>

          <IconButton onClick={() => setIsFavourite((p) => !p)} size="small" sx={{ ml: 1 }} aria-label="favourite">
            {isFavourite ? (
              <BookmarkIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
            ) : (
              <BookmarkBorderIcon sx={{ fontSize: 20 }} />
            )}
          </IconButton>
        </Box>
      </Box>

        <CardContent
          sx={{
            pt: 0.5,
            pb: 2,
            px: 2,
            maxHeight: 'none',
            overflowY: 'visible',
          }}
        >
          {/* top prefill chips removed — not providing value in this UI */}

          {/* Tabs moved to top compact header row */}

          {activeTab === "basic" && (
            <Box mt={1}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.25 }} />
                <Grid container spacing={1.5} alignItems="center">
                    <Grid item xs={12} sm="auto" md="auto">
                        <MultiSelectField
                          label="Division *"
                          options={divisionOptions}
                          value={filters.division}
                          onChange={(value: string[]) => handleMultiChange("division", value)}
                          showSelectAllIcon
                          required
                        />
                    </Grid>

                  <Grid item xs={12} sm="auto" md="auto">
                      <MultiSelectField
                        label="Domain ID *"
                        options={domainOptions}
                        value={filters.domainId}
                        onChange={(value: string[]) => handleMultiChange("domainId", value)}
                        showSelectAllIcon
                        required
                      />
                  </Grid>

                  <Grid item xs={12} sm="auto" md="auto">
                      <MultiSelectField
                        label="Task Status *"
                        options={statusOptions}
                        value={filters.taskStatuses}
                        onChange={(value: string[]) => handleMultiChange("taskStatuses", value)}
                        showSelectAllIcon
                        required
                      />
                  </Grid>

                  <Grid item xs={12} sm="auto" md="auto">
                      <MultiSelectField
                        label="PWA Selector"
                        options={pwaOptions}
                        value={filters.pwa}
                        onChange={(value: string[]) => handleMultiChange("pwa", value)}
                        showSelectAllIcon
                      />
                  </Grid>

                  <Grid item xs={12} sm="auto" md="auto">
                      <MultiSelectField
                        label="Capabilities"
                        options={capabilityOptions}
                        value={filters.capabilities}
                        onChange={(value: string[]) => handleMultiChange("capabilities", value)}
                        showSelectAllIcon
                      />
                  </Grid>
                </Grid>
              </Box>
          )}

          {activeTab === "advanced" && (
            <Box mt={1}>
                <Grid container spacing={1.5} alignItems="center">
                <Grid item xs={12} sm="auto" md="auto">
                    <MultiSelectField
                      label="Commit Type"
                      options={commitOptions}
                      value={filters.commitType}
                      onChange={(value: string[]) => handleMultiChange("commitType", value)}
                      showSelectAllIcon
                    />
                </Grid>

                <Grid item xs={12} sm="auto" md="auto">
                    <MultiSelectField
                      label="Response Code"
                      options={responseOptions}
                      value={filters.responseCode}
                      onChange={(value: string[]) => handleMultiChange("responseCode", value)}
                      showSelectAllIcon
                    />
                </Grid>
                <Grid item xs={12} sm="auto" md="auto">
                    <FreeTypeSelectField
                      label="Requester"
                      options={requesterOptions}
                      value={filters.requester}
                      onChange={(next: string) => setFilters((prev) => ({ ...prev, requester: next }))}
                    />
                </Grid>

                <Grid item xs={12} sm="auto" md="auto">
                    <FreeTypeSelectField
                      label="Job Type"
                      options={jobTypeOptions}
                      value={filters.jobType}
                      onChange={(next: string) => setFilters((prev) => ({ ...prev, jobType: next }))}
                    />
                </Grid>

                <Grid item xs={12} sm="auto" md="auto">
                    <CombinedLocationField
                      locationType={filters.locationType}
                      locationValue={filters.locationValue}
                      onTypeChange={(val) => setFilters((prev) => ({ ...prev, locationType: val }))}
                      onValueChange={(val) => setFilters((prev) => ({ ...prev, locationValue: val }))}
                    />
                </Grid>

                <Grid item xs={12} sm="auto" md="auto">
                    <ImpScoreField
                      label="IMP Score"
                      condition={(filters.scoreCondition as any) || ''}
                      value={filters.scoreValue}
                      onConditionChange={(next) => setFilters((prev) => ({ ...prev, scoreCondition: next }))}
                      onValueChange={(next) => setFilters((prev) => ({ ...prev, scoreValue: next }))}
                    />
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>

      <DateTimePopover
        anchorEl={dateMenuAnchor}
        open={Boolean(dateMenuAnchor)}
        onClose={() => setDateMenuAnchor(null)}
        fromDate={filters.fromDate}
        fromTime={filters.fromTime}
        toDate={filters.toDate}
        toTime={filters.toTime}
        onChangeField={(name, value) => setFilters((prev) => ({ ...prev, [name]: value }))}
        onClear={() => setFilters((prev) => ({ ...prev, fromDate: '', fromTime: '', toDate: '', toTime: '' }))}
      />

      <Divider />

      <CardActions
        sx={{
          px: 2,
          py: 1,
          bgcolor: theme.palette.grey[50],
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          {hasResults ? (
            <AppButton
              variant="outlined"
              size="small"
              onClick={handleMenuOpen}
              sx={{
                px: 1,
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              Data
            </AppButton>
          ) : null}
          {hasResults && (
            <>
              <AppButton
                variant="outlined"
                size="small"
                onClick={(e) => setActionsAnchorEl(e.currentTarget)}
                sx={{ ml: 1 }}
              >
                Menu Items
              </AppButton>

              <Menu
                anchorEl={actionsAnchorEl}
                open={Boolean(actionsAnchorEl)}
                onClose={() => setActionsAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
              >
                {/* Copy and Export moved out — use Actions menu for viewer/progress/callout only */}

                <MenuItem
                  onClick={() => {
                    if (!selectedRows || !selectedRows.length) return;
                    if (onOpenPopout) onOpenPopout(selectedRows || []);
                    else window.dispatchEvent(new CustomEvent('taskforce:open-popout', { detail: { tasks: selectedRows } }));
                    setActionsAnchorEl(null);
                  }}
                  disabled={!selectedRows || selectedRows.length === 0}
                >
                  <ListItemIcon>
                    <Visibility style={{ fontSize: 16, color: '#1976d2' }} />
                  </ListItemIcon>
                  Open Viewer{selectedRows && selectedRows.length > 1 ? ` (${selectedRows.length})` : ""}
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    if (!selectedRows || !selectedRows.length) return;
                    if (onProgressTasks) onProgressTasks(selectedRows || []);
                    else window.dispatchEvent(new CustomEvent('taskforce:progress-tasks', { detail: { tasks: selectedRows } }));
                    setActionsAnchorEl(null);
                  }}
                  disabled={!selectedRows || selectedRows.length === 0}
                >
                  <ListItemIcon>
                    <ListAlt style={{ fontSize: 16, color: '#2e7d32' }} />
                  </ListItemIcon>
                  Progress Tasks{selectedRows && selectedRows.length > 1 ? ` (${selectedRows.length})` : ""}
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    if (!selectedRows || !selectedRows.length) return;
                    if (onProgressNotes) onProgressNotes(selectedRows || []);
                    else window.dispatchEvent(new CustomEvent('taskforce:progress-notes', { detail: { tasks: selectedRows } }));
                    setActionsAnchorEl(null);
                  }}
                  disabled={!selectedRows || selectedRows.length === 0}
                >
                  <ListItemIcon>
                    <StickyNote2 style={{ fontSize: 16, color: '#ed6c02' }} />
                  </ListItemIcon>
                  Progress Notes{selectedRows && selectedRows.length > 1 ? ` (${selectedRows.length})` : ""}
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    // prefer single task for callout incident; fall back to first selected
                    const task = selectedRows && selectedRows.length ? selectedRows[0] : null;
                    if (!task) return;
                    if (onOpenCalloutIncident) onOpenCalloutIncident(task);
                    else window.dispatchEvent(new CustomEvent('taskforce:open-callout-incident', { detail: { task } }));
                    setActionsAnchorEl(null);
                  }}
                  disabled={!(selectedRows && selectedRows.length === 1)}
                >
                  <ListItemIcon>
                    <WarningAmber style={{ fontSize: 16, color: '#d32f2f' }} />
                  </ListItemIcon>
                  Callout Incident
                </MenuItem>
              </Menu>
            </>
          )}
          {/* Columns button removed — using DataGrid's built-in column menu */}
            <Menu
              anchorEl={menuAnchorEl}
              open={Boolean(menuAnchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
            >
              <MenuItem onClick={handleCopy} sx={{ display: 'flex', alignItems: 'center' }}>
                <ListItemIcon>
                  <ContentCopyIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{canCopy ? "Copy" : "Copy (empty)"}</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleExport} sx={{ display: 'flex', alignItems: 'center' }}>
                <ListItemIcon>
                  <FileDownloadIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Export</ListItemText>
              </MenuItem>
            </Menu>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <AppButton
            variant="outlined"
            size="small"
            onClick={handleClear}
          >
            Clear
          </AppButton>
          <Tooltip title={!canSearch ? "Select Division, Domain ID, and Task Status, or type in the global search." : ""} arrow>
            <span>
              <AppButton
                variant="contained"
                size="small"
                onClick={handleSearch}
                disabled={!canSearch}
                sx={{
                  boxShadow: "none",
                }}
              >
                Search
              </AppButton>
            </span>
          </Tooltip>
        </Stack>
      </CardActions>
    </Card>
  );
}

/* MultiSelectField moved to src/shared-ui/MultiSelectField.tsx */