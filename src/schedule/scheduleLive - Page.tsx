// ============================================================================
// scheduleLive - Page.tsx — MATERIAL UI MIGRATION
// Fully wired to useLiveSelectEngine.ts (central selection engine)
// ============================================================================

import React, { useState, useMemo, useRef } from "react";

import MapLegend from "./MapLegend";
import { ScheduleLiveSearch, ScheduleLiveSearchFilters } from "@/shared-ui";

import TimelinePanel from "./TimelinePanel";
import MapPanel from "./MapPanel";
import TaskTablePanel from "./TaskTablePanel";
import ResourceTablePanel from "./ResourceTablePanel";

import mockTasks from "@/data/mockTasks.json";
import ResourceMock from "@/data/ResourceMock.json";

// replaced react-resizable-panels with internal flex splitter

import { usePanelDocking, PanelContainer } from "@/hooks/usePanelDocking";
import { PanelKey } from "@/types";

import { useSearchLeftMenu } from "@/hooks/useSearchLeftMenu";

import { useLiveSelectEngine } from "@/hooks/useLiveSelectEngine";

import GlobalSearchField from "@/shared-ui/text-fields/GlobalSearchField";

import Search from '@mui/icons-material/Search';
import SlidersHorizontal from '@mui/icons-material/Tune';
import Star from '@mui/icons-material/Star';
import Info from '@mui/icons-material/Info';
import Clock from '@mui/icons-material/AccessTime';
import Map from '@mui/icons-material/Map';
import Users from '@mui/icons-material/People';
import ClipboardList from '@mui/icons-material/ListAlt';

import type { TaskRecord, ResourceRecord } from "@/hooks/useLiveSelectEngine";

import {
  Box,
  ClickAwayListener,
  Divider,
  Fade,
  IconButton,
  MenuItem,
  Paper,
  Popper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import InputAdornment from "@mui/material/InputAdornment";
import { alpha, useTheme } from "@mui/material/styles";
import AppButton from '@/shared-ui/button';

/* ============================================================================
   PANEL DEFINITIONS
============================================================================ */
const PANEL_DEFS: Record<PanelKey, { label: string; icon: any }> = {
  timeline: { label: "Gantt Timeline", icon: Clock },
  map: { label: "Map View", icon: Map },
  resources: { label: "Resource Table", icon: Users },
  tasks: { label: "Task Table", icon: ClipboardList },
};

/* ============================================================================
   SEARCH MODE MAPPER
============================================================================ */
function mapSelectedMode(id: string): string {
  return id === "resource-active" ? "resource-active" : "task-default";
}

/* ============================================================================
   MAIN COMPONENT
============================================================================ */
export default function ScheduleLivePage() {
  const theme = useTheme();
  const accent = theme.palette.primary.main;
  const accentHover = theme.palette.primary.dark;
  const accentSoft = alpha(accent, 0.1);
  const borderColor = alpha(accent, 0.18);
  const surfaceShadow = "0 24px 54px rgba(8,58,97,0.22)";

  /* ---------------- COMMON STYLES ---------------- */
  const commonPaperSx = {
    borderRadius: 3,
    elevation: 2,
  };

  /* ---------------- DOMAIN + DIVISION ---------------- */
  const [domain, setDomain] = useState<string>("");
  const [division, setDivision] = useState<string>("");
  const [favActive, setFavActive] = useState<boolean>(false);

  /* ---------------- LEGEND ---------------- */
  const [legendOpen, setLegendOpen] = useState(false);

  /* ---------------- SEARCH TOOL ---------------- */
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchButtonActive, setSearchButtonActive] = useState(false);
  const searchButtonRef = useRef<HTMLButtonElement | null>(null);

  const [searchAnywhere, setSearchAnywhere] = useState("");
  const currentFiltersRef = useRef<ScheduleLiveSearchFilters>({} as ScheduleLiveSearchFilters);

  /* ---------------- TABLE DATA ---------------- */
  const [taskData, setTaskData] = useState<TaskRecord[]>([]);
  const [resourceData, setResourceData] = useState<ResourceRecord[]>([]);
  const allResources = ResourceMock as ResourceRecord[];

  /* ---------------- DROPDOWN DATA ---------------- */
  const [dropdownData, setDropdownData] = useState({
    statuses: [] as string[],
    pwa: [] as string[],
    capabilities: [] as string[],
    commitmentTypes: [] as string[],
  });

  const [resetKey, setResetKey] = useState(0);

  /* ---------------- LEFT MENU ---------------- */
  const { selectedMode, select, isActive, taskItems, resourceItems } =
    useSearchLeftMenu();

  /* ==========================================================================
     SELECTION ENGINE
     ========================================================================== */
  const {
    selectedTasks,
    selectedTask,
    handleTaskMapClick,
    handleTaskTableSelect,
    selectedResources,
    selectedResource,
    handleResourceMapClick,
    handleResourceTableSelect,
    selectionFromMap,
    shouldZoom,
    clearAll,
    notifyMapDragStart,
    notifyMapDragEnd,
  } = useLiveSelectEngine();

  // Listen for resource selection from header avatars
  React.useEffect(() => {
    const handleResourceSelected = (event: any) => {
      const { resource } = event.detail;
      // Select the resource using the selection engine
      handleResourceTableSelect([resource]);
      // Also update the search field to show the selected resource ID
      setSearchAnywhere(resource.resourceId);
    };

    window.addEventListener('resourceSelected', handleResourceSelected);
    return () => window.removeEventListener('resourceSelected', handleResourceSelected);
  }, []);

  /* ==========================================================================
     SELECTION CLEAR FUNCTIONS
  ========================================================================== */
  const clearTaskSelections = () => {
    handleTaskTableSelect([]);
  };

  const clearResourceSelections = () => {
    handleResourceTableSelect([]);
  };

  /* ==========================================================================
     DIVISION OPTIONS
  ============================================================================ */
  const divisionOptions = useMemo(() => {
    const s = new Set<string>();
    (mockTasks as TaskRecord[]).forEach((t) => t.division && s.add(t.division));
    return Array.from(s).sort();
  }, []);

  const domainOptions = useMemo(() => {
    const s = new Set<string>();
    (mockTasks as TaskRecord[]).forEach((t) =>
      t.domain && s.add(String(t.domain).toUpperCase())
    );
    return Array.from(s).sort();
  }, []);

  /* ==========================================================================
     DROPDOWN BUILDER
  ============================================================================ */
  function buildFilteredDropdowns(rows: TaskRecord[]) {
    const statuses = new Set<string>();
    const pwa = new Set<string>();
    const capabilities = new Set<string>();
    const commitmentTypes = new Set<string>();

    for (const t of rows) {
      if (t.taskStatus) statuses.add(t.taskStatus);
      if (t.pwa) pwa.add(t.pwa);
      if (Array.isArray(t.capabilities))
        t.capabilities.forEach((c: string) => capabilities.add(c));
      if (t.commitmentType) commitmentTypes.add(t.commitmentType);
    }

    return {
      statuses: [...statuses].sort(),
      pwa: [...pwa].sort(),
      capabilities: [...capabilities].sort(),
      commitmentTypes: [...commitmentTypes].sort(),
    };
  }

  /* ==========================================================================
     DIVISION CHANGE
  ============================================================================ */
  const handleDivisionChange = (value: string) => {
    setDivision(value);
    setTaskData([]);
    setResourceData([]);
    setResetKey((n) => n + 1);

    if (value) {
      const rows = (mockTasks as TaskRecord[]).filter((t) => t.division === value);
      setDropdownData(buildFilteredDropdowns(rows));
    } else {
      setDropdownData({
        statuses: [],
        pwa: [],
        capabilities: [],
        commitmentTypes: [],
      });
    }

    setSearchAnywhere("");
  };

  const handleDomainChange = (value: string) => {
    setDomain(value);
    setTaskData([]);
    setResourceData([]);
    setResetKey((n) => n + 1);

    let rows = [...(mockTasks as TaskRecord[])];
    if (value) rows = rows.filter((t) => String(t.domain).toUpperCase() === value);
    if (division) rows = rows.filter((t) => t.division === division);
    setDropdownData(buildFilteredDropdowns(rows));

    setSearchAnywhere("");
  };

  /* ==========================================================================
     DOCKING LOGIC
  ============================================================================ */
  const {
    visiblePanels,
    maximizedPanel,
    collapsedPanels,
    isPanelMaximized,
    togglePanel,
    closePanel,
    maximizePanel,
  } = usePanelDocking();

  /* ==========================================================================
     SEARCH HELPERS
  ============================================================================ */
  const handleCloseSearchPanel = () => {
    setSearchOpen(false);
    setSearchButtonActive(false);
  };

  const handleSearchToggle = () => {
    if (!division) return;
    setSearchOpen((prev) => {
      const next = !prev;
      setSearchButtonActive(next);
      return next;
    });
  };

  const anchorEl = searchButtonRef.current;
  const isSearchPopperOpen = Boolean(searchOpen && division && anchorEl);

  const handleSearchClickAway = (event: MouseEvent | TouchEvent) => {
    if (anchorEl && anchorEl.contains(event.target as Node)) {
      return;
    }
    handleCloseSearchPanel();
  };

  /* ==========================================================================
     TASK SEARCH
  ============================================================================ */
  const runTaskSearch = (filters: ScheduleLiveSearchFilters) => {
    let results = [...(mockTasks as TaskRecord[])];

    if (domain) {
      results = results.filter((t) => String(t.domain).toUpperCase() === domain);
    }
    if (division) {
      results = results.filter((t) => t.division === division);
    }
    if (filters.taskStatuses?.length) {
      results = results.filter((t) => filters.taskStatuses.includes(t.taskStatus));
    }
    if (filters.pwa?.length) {
      results = results.filter((t) => filters.pwa.includes(t.pwa));
    }
    if (filters.capabilities?.length) {
      results = results.filter((t) =>
        t.capabilities?.some((c: string) => filters.capabilities.includes(c))
      );
    }
    if (filters.commitType?.length) {
      results = results.filter((t) =>
        filters.commitType.includes(t.commitmentType)
      );
    }

    results.sort((a, b) => {
      const ai = Number(a.importanceScore ?? 0);
      const bi = Number(b.importanceScore ?? 0);
      if (bi !== ai) return bi - ai;

      const aDate = a.appointmentStartDate
        ? new Date(a.appointmentStartDate).getTime()
        : 0;
      const bDate = b.appointmentStartDate
        ? new Date(b.appointmentStartDate).getTime()
        : 0;
      return aDate - bDate;
    });

    setTaskData(results);
    // Removed handleCloseSearchPanel() to keep panel open with filters selected
  };

  /* ==========================================================================
     RESOURCE SEARCH
  ============================================================================ */
  const runResourceSearch = (filters: ScheduleLiveSearchFilters) => {
    if (!division) {
      setResourceData([]);
      handleCloseSearchPanel();
      return;
    }

    let results = [...allResources];

    results = results.filter((r) => r.division === division);

    if (domain) {
      results = results.filter((r) => String(r.domain).toUpperCase() === domain);
    }
    if (filters.taskStatuses?.length) {
      results = results.filter((r) => filters.taskStatuses.includes(r.status));
    }
    if (filters.pwa?.length) {
      results = results.filter((r) => filters.pwa.includes(r.pwa));
    }

    const statusPriority: Record<string, number> = {
      Available: 1,
      Busy: 2,
      Offline: 3,
    };

    results.sort((a, b) => {
      const sa = statusPriority[a.status] ?? 99;
      const sb = statusPriority[b.status] ?? 99;
      if (sa !== sb) return sa - sb;

      const aTime = a.availableAgainAt
        ? new Date(a.availableAgainAt).getTime()
        : Number.POSITIVE_INFINITY;
      const bTime = b.availableAgainAt
        ? new Date(b.availableAgainAt).getTime()
        : Number.POSITIVE_INFINITY;
      return aTime - bTime;
    });

    setResourceData(results);
    // Removed handleCloseSearchPanel() to keep panel open with filters selected
  };

  /* ==========================================================================
     GLOBAL SEARCH
  ============================================================================ */
  const runGlobalSearch = () => {
    const q = searchAnywhere.trim().toLowerCase();
    if (!q) return;

    let matched = false;

    const taskMatches = (mockTasks as TaskRecord[]).filter(
      (t) => t.taskId && t.taskId.toLowerCase() === q
    );
    if (taskMatches.length) {
      setTaskData(taskMatches);
      matched = true;
    }

    const resourceMatches = allResources.filter(
      (r) => r.resourceId && String(r.resourceId).toLowerCase() === q
    );
    if (resourceMatches.length) {
      setResourceData(resourceMatches);
      // Select the matched resource for the timeline
      handleResourceTableSelect(resourceMatches);
      matched = true;
    }

    // Removed handleCloseSearchPanel() to keep panel open with filters selected
  };

  /* ==========================================================================
     CLEAR ALL (data + selection)
  ============================================================================ */
  const handleClearAll = () => {
    clearAll();

    setSearchAnywhere("");
    setTaskData([]);
    setResourceData([]);
    setResetKey((n) => n + 1);

    if (division) {
      const rows = (mockTasks as TaskRecord[]).filter((t) => t.division === division);
      setDropdownData(buildFilteredDropdowns(rows));
    } else {
      setDropdownData({
        statuses: [],
        pwa: [],
        capabilities: [],
        commitmentTypes: [],
      });
    }

    handleCloseSearchPanel();
  };

  /* ==========================================================================
     PANEL RENDERER
  ============================================================================ */
  const renderPanelBody = (key: PanelKey) => {
    switch (key) {
      case "timeline":
        return <TimelinePanel selectedResource={selectedResource} />;

      case "map":
        return (
          <MapPanel
            tasks={taskData}
            resources={resourceData}
            selectedTask={selectedTask}
            selectedTasks={selectedTasks}
            selectedResource={selectedResource}
            selectedResources={selectedResources}
            shouldZoom={shouldZoom}
            handleTaskMapClick={handleTaskMapClick}
            handleResourceMapClick={handleResourceMapClick}
            notifyMapDragStart={notifyMapDragStart}
            notifyMapDragEnd={notifyMapDragEnd}
            showMarkers={true}
          />
        );

      case "resources":
        return (
          <ResourceTablePanel
            data={resourceData}
            selectedResources={selectedResources}
            onSelectionChange={handleResourceTableSelect}
            selectionFromMap={selectionFromMap}
            onClearSelection={clearResourceSelections}
          />
        );

      case "tasks":
        return (
          <TaskTablePanel
            data={taskData}
            selectedTasks={selectedTasks}
            onSelectionChange={handleTaskTableSelect}
            selectionFromMap={selectionFromMap}
            onClearSelection={clearTaskSelections}
          />
        );

      default:
        return null;
    }
  };

  /* ==========================================================================
     PANEL LAYOUT
  ============================================================================ */
  const TOP = ["timeline", "map"] as PanelKey[];
  const BOTTOM = ["resources", "tasks"] as PanelKey[];

  const topRow = TOP.filter((k) => visiblePanels.includes(k));
  const bottomRow = BOTTOM.filter((k) => visiblePanels.includes(k));

  const effectiveTop = maximizedPanel ? [maximizedPanel] : topRow;
  const effectiveBottom = maximizedPanel ? [] : bottomRow;

  const topLeftVisible = visiblePanels.includes('timeline');
  const topRightVisible = visiblePanels.includes('map');
  const bottomLeftVisible = visiblePanels.includes('resources');
  const bottomRightVisible = visiblePanels.includes('tasks');

  const topHasBoth = topLeftVisible && topRightVisible;
  const bottomHasBoth = bottomLeftVisible && bottomRightVisible;
  const leftHasBoth = topLeftVisible && bottomLeftVisible;
  const rightHasBoth = topRightVisible && bottomRightVisible;

  const topRowHas = Number(topLeftVisible || topRightVisible);
  const bottomRowHas = Number(bottomLeftVisible || bottomRightVisible);
  const rowsCount = topRowHas + bottomRowHas;

  const leftColHas = Number(topLeftVisible || bottomLeftVisible);
  const rightColHas = Number(topRightVisible || bottomRightVisible);
  const colsCount = leftColHas + rightColHas;

  // splitter state: fraction of height occupied by top area (0..1)
  const [topFraction, setTopFraction] = useState<number>(0.5);
  const panelsContainerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const onSplitterMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
    draggingRef.current = true;
    const startY = event.clientY;
    const container = panelsContainerRef.current;
    const startRect = container?.getBoundingClientRect();
    const startHeight = startRect?.height ?? 0;

    const onMove = (moveEvent: MouseEvent) => {
      if (!draggingRef.current || !container) return;
      const delta = moveEvent.clientY - startY;
      const newTopPx = (startRect?.top ?? 0) >= 0 ? (startRect!.height * topFraction + delta) : 0;
      const frac = Math.max(0.12, Math.min(0.88, newTopPx / startHeight));
      setTopFraction(frac);
    };

    const onUp = () => {
      draggingRef.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  /* ==========================================================================
     TOOLBAR
  ============================================================================ */
  const toolbar = (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        px: 2.5,
        py: 1.5,
        display: "flex",
        alignItems: "center",
        gap: 2,
        backgroundImage: "none",
        borderRadius: 0,
      }}
    >
      <TextField
        select
        size="small"
        value={division}
        onChange={(e) => handleDivisionChange(e.target.value)}
        sx={{ 
          minWidth: { xs: theme.spacing(14), sm: theme.spacing(18) },
          height: theme.custom?.inputHeight ?? 40,
          '& .MuiInputBase-input': { fontSize: 13, lineHeight: `${theme.custom?.chipSize ?? 28}px` }
        }}
        SelectProps={{ displayEmpty: true, renderValue: (selected) => (selected ? String(selected) : 'Division') }}
      >
        <MenuItem value="">All</MenuItem>
        {divisionOptions.map((d) => (
          <MenuItem key={d} value={d}>
            {d}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        value={domain}
        onChange={(e) => handleDomainChange(e.target.value)}
        sx={{ 
          minWidth: { xs: theme.spacing(14), sm: theme.spacing(18) },
          height: theme.custom?.inputHeight ?? 40,
          '& .MuiInputBase-input': { fontSize: 13, lineHeight: `${theme.custom?.chipSize ?? 28}px` }
        }}
        SelectProps={{ displayEmpty: true, renderValue: (selected) => (selected ? String(selected) : 'Domain') }}
      >
        <MenuItem value="">All</MenuItem>
        {domainOptions.map((d) => (
          <MenuItem key={d} value={d}>
            {d}
          </MenuItem>
        ))}
      </TextField>

      <GlobalSearchField
        value={searchAnywhere}
        onChange={(e) => setSearchAnywhere(e.target.value)}
        onSearch={runGlobalSearch}
        placeholder="Search by Task ID, Work ID, Estimate Number, Employee ID, or Resource ID"
        size="small"
        showSearchButton={true}
        sx={{ height: theme.custom?.inputHeight ?? 40, '& .MuiInputBase-input': { fontSize: 13, lineHeight: `${theme.custom?.chipSize ?? 28}px` } }}
      />

      {/* Search Tool + Clear All + quick icons (kept left for workflow) */}
      <AppButton
        ref={searchButtonRef}
        onClick={handleSearchToggle}
        variant={searchButtonActive ? "contained" : "outlined"}
        color="primary"
        size="small"
        startIcon={<SlidersHorizontal sx={{ fontSize: 16 }} />}
        disabled={!division}
        sx={{ minWidth: 96, fontWeight: 500, mr: 1, ...(searchButtonActive && { boxShadow: theme.shadows[4] }) }}
      >
        Search Tool
      </AppButton>

      <AppButton variant="outlined" size="small" onClick={handleClearAll} sx={{ minWidth: 96, fontWeight: 500, mr: 1 }}>
        Clear All
      </AppButton>

      <IconButton
        size="small"
        onClick={() => setFavActive((v) => !v)}
        color={favActive ? "primary" : "default"}
        sx={{
          width: 40,
          height: 40,
          borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`,
          ...(favActive && {
            bgcolor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            borderColor: theme.palette.primary.main,
            '&:hover': { bgcolor: theme.palette.primary.dark },
          }),
          mr: 1,
        }}
      >
        <Star sx={{ fontSize: 16 }} />
      </IconButton>

      <IconButton
        size="small"
        onClick={() => setLegendOpen((o) => !o)}
        color={legendOpen ? "primary" : "default"}
        sx={{
          width: 40,
          height: 40,
          borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`,
          ...(legendOpen && {
            bgcolor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            borderColor: theme.palette.primary.main,
            '&:hover': { bgcolor: theme.palette.primary.dark },
          }),
          mr: 1,
        }}
        title="Map Legend"
      >
        <Info sx={{ fontSize: 16 }} />
      </IconButton>

      <Box sx={{ flexGrow: 1 }} />

      {collapsedPanels.length > 0 && (
        <Stack direction="row" spacing={1} ml={2} alignItems="center">
          {collapsedPanels.map((key) => (
            <IconButton
              key={key}
              size="small"
              onClick={() => togglePanel(key)}
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`,
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                },
              }}
              title={`Show ${PANEL_DEFS[key].label}`}
            >
              {React.createElement(PANEL_DEFS[key].icon, {
                size: 15,
              })}
            </IconButton>
          ))}
        </Stack>
      )}
    </Paper>
  );

  /* ==========================================================================
     SEARCH TOOL POPOVER
  ============================================================================ */
  const searchToolPopper = (
    <Popper
      open={isSearchPopperOpen}
      anchorEl={anchorEl}
      placement="bottom-start"
      transition
      modifiers={[{ name: "offset", options: { offset: [0, 10] } }]}
      sx={{ zIndex: 12000 }}
    >
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={160}>
          <Box>
            <ClickAwayListener onClickAway={handleSearchClickAway}>
              <Box
                sx={{
                  borderRadius: 3,
                  p: 2,
                  minWidth: 550,
                  maxWidth: 900,
                  mx: 'auto',
                  border: `1px solid ${borderColor}`,
                  boxShadow: surfaceShadow,
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                  <Box
                    sx={{
                      width: 220,
                      borderRadius: 2,
                      p: 2.5,
                      display: "flex",
                      flexDirection: "column",
                      gap: 3,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="overline"
                        sx={{ fontWeight: 700, color: alpha(theme.palette.text.secondary, 0.9), mb: 0.5 }}
                      >
                        Task Search
                      </Typography>
                      <Stack spacing={1} mt={1}>
                        {taskItems.map((item) => (
                          <AppButton
                            key={item.id}
                            onClick={() => select(item.id)}
                            size="small"
                            variant={isActive(item.id) ? "contained" : "outlined"}
                            color="primary"
                            endIcon={isActive(item.id) ? <CheckIcon /> : undefined}
                            sx={{
                              justifyContent: "flex-start",
                              fontSize: 13,
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              minWidth: 120,
                              px: 1.5,
                              py: 0.5,
                            }}
                          >
                            {item.label}
                          </AppButton>
                        ))}
                      </Stack>
                    </Box>

                    <Divider flexItem sx={{ my: 0.5 }} />

                    <Box>
                      <Typography
                        variant="overline"
                        sx={{ fontWeight: 700, color: alpha(theme.palette.text.secondary, 0.9), mb: 0.5 }}
                      >
                        Resource Search
                      </Typography>
                      <Stack spacing={1} mt={1}>
                        {resourceItems.map((item) => (
                          <AppButton
                            key={item.id}
                            onClick={() => select(item.id)}
                            size="small"
                            variant={isActive(item.id) ? "contained" : "outlined"}
                            color="primary"
                            endIcon={isActive(item.id) ? <CheckIcon /> : undefined}
                            sx={{
                              justifyContent: "flex-start",
                              fontSize: 13,
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              minWidth: 120,
                              px: 1.5,
                              py: 0.5,
                            }}
                          >
                            {item.label}
                          </AppButton>
                        ))}
                      </Stack>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'flex-start',
                      px: { xs: 2, sm: 3, md: 4 },
                      py: 2,
                      minHeight: 0,
                    }}
                  >
                    <ScheduleLiveSearch
                      mode={mapSelectedMode(selectedMode) === "resource-active" ? "resource" : "task"}
                      onSearch={(filters: ScheduleLiveSearchFilters) => {
                        currentFiltersRef.current = filters;
                      }}
                      onClear={() => {
                        setTaskData([]);
                        setResourceData([]);
                        setResetKey((n) => n + 1);
                      }}
                      dropdownData={{
                        ...dropdownData,
                        division: divisionOptions,
                        domainId: domainOptions,
                        resourceStatuses: Array.from(
                          new Set(allResources.map((r) => r.status))
                        ).sort(),
                      }}
                      resetKey={resetKey}
                      hideActions={true}
                    />
                  </Box>
                </Stack>

                <Stack direction="row" justifyContent="flex-end">
                  <AppButton
                    variant="contained"
                    size="medium"
                    onClick={() => {
                      const filters = currentFiltersRef.current;
                      const mode = mapSelectedMode(selectedMode);
                      if (mode.startsWith("task")) {
                        runTaskSearch(filters);
                      } else {
                        runResourceSearch(filters);
                      }
                    }}
                    sx={{
                      px: 3.5,
                      fontWeight: 700,
                      boxShadow: "0 18px 38px rgba(8,58,97,0.24)",
                    }}
                  >
                    Search
                  </AppButton>
                </Stack>
              </Box>
            </ClickAwayListener>
          </Box>
        </Fade>
      )}
    </Popper>
  );

  /* ==========================================================================
     RENDER
  ============================================================================ */
    // splitter constants and independent X/Y fractions
    const SPLITTER_HEIGHT = 6; // px (horizontal splitter)
    const SPLITTER_WIDTH = 6; // px (vertical splitter)

    const [colFraction, setColFraction] = useState<number>(0.5);
    const [rowFraction, setRowFraction] = useState<number>(0.5);
    const draggingRowRef = useRef(false);
    const draggingColRef = useRef(false);

    const onHorizontalMouseDown = (event: React.MouseEvent) => {
      // prevent starting a drag while the search popper is open
      if (isSearchPopperOpen) return;
      event.preventDefault();
      draggingRowRef.current = true;
      const startY = event.clientY;
      const container = panelsContainerRef.current;
      const rect = container?.getBoundingClientRect();
      const startHeight = rect?.height ?? 0;

      const onMove = (ev: MouseEvent) => {
        if (!draggingRowRef.current || !container) return;
        const delta = ev.clientY - startY;
        const newTopPx = rowFraction * startHeight + delta;
        const frac = Math.max(0.12, Math.min(0.88, newTopPx / startHeight));
        setRowFraction(frac);
      };

      const onUp = () => {
        draggingRowRef.current = false;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    };

    const onVerticalMouseDown = (event: React.MouseEvent) => {
      // prevent starting a drag while the search popper is open
      if (isSearchPopperOpen) return;
      event.preventDefault();
      draggingColRef.current = true;
      const startX = event.clientX;
      const container = panelsContainerRef.current;
      const rect = container?.getBoundingClientRect();
      const startWidth = rect?.width ?? 0;

      const onMove = (ev: MouseEvent) => {
        if (!draggingColRef.current || !container) return;
        const delta = ev.clientX - startX;
        const newLeftPx = colFraction * startWidth + delta;
        const frac = Math.max(0.12, Math.min(0.88, newLeftPx / startWidth));
        setColFraction(frac);
      };

      const onUp = () => {
        draggingColRef.current = false;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    };

    return (
      <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", position: "relative" }}>
        {toolbar}

        <MapLegend visible={legendOpen} onClose={() => setLegendOpen(false)} />

        {searchToolPopper}

        <Box ref={panelsContainerRef} sx={{ minHeight: 0, position: 'relative', height: '100%', overflow: 'hidden' }} data-visible-panels={visiblePanels.join(',')}>
          { (maximizedPanel || visiblePanels.length === 1) ? (
            (() => {
              const single = maximizedPanel ?? visiblePanels[0];
              return (
                <Box sx={{ display: 'flex', height: '100%', minHeight: 0 }}>
                  <PanelContainer
                    title={PANEL_DEFS[single].label}
                    icon={PANEL_DEFS[single].icon}
                    isMaximized={true}
                    onMaximize={() => maximizePanel(single)}
                    onClose={() => closePanel(single)}
                    visibleCount={visiblePanels.length}
                  >
                    {renderPanelBody(single)}
                  </PanelContainer>
                </Box>
              );
            })()
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateRows: rowsCount === 1
                  ? '1fr'
                  : `${Math.round(rowFraction * 100)}% ${SPLITTER_HEIGHT}px ${Math.round((1 - rowFraction) * 100)}%`,
                gridTemplateColumns: colsCount === 1
                  ? '1fr'
                  : `${Math.round(colFraction * 100)}% ${SPLITTER_WIDTH}px ${Math.round((1 - colFraction) * 100)}%`,
                width: '100%',
                height: '100%',
                minHeight: 0,
              }}
            >
              {/* Top-left */}
              <Box sx={{ gridRow: '1', gridColumn: topLeftVisible && !topRightVisible ? '1 / span 3' : '1', display: 'flex', minHeight: 0, zIndex: 10 }}>
                {visiblePanels.includes('timeline') && (
                  <PanelContainer
                    title={PANEL_DEFS['timeline'].label}
                    icon={PANEL_DEFS['timeline'].icon}
                    isMaximized={false}
                    onMaximize={() => maximizePanel('timeline')}
                    onClose={() => closePanel('timeline')}
                    visibleCount={visiblePanels.length}
                  >
                    {renderPanelBody('timeline')}
                  </PanelContainer>
                )}
              </Box>

              {/* Top-right */}
              <Box sx={{ gridRow: '1', gridColumn: !topLeftVisible && topRightVisible ? '1 / span 3' : '3', display: 'flex', minHeight: 0, zIndex: 10 }}>
                {visiblePanels.includes('map') && (
                  <PanelContainer
                    title={PANEL_DEFS['map'].label}
                    icon={PANEL_DEFS['map'].icon}
                    isMaximized={false}
                    onMaximize={() => maximizePanel('map')}
                    onClose={() => closePanel('map')}
                    visibleCount={visiblePanels.length}
                  >
                    {renderPanelBody('map')}
                  </PanelContainer>
                )}
              </Box>

              {/* Vertical splitter */}
              {colsCount === 2 && (topHasBoth || bottomHasBoth) && (
                <Box
                  gridRow={rowsCount === 2 ? '1 / span 3' : topHasBoth ? '1' : '3'}
                  gridColumn="2"
                  role="separator"
                  onMouseDown={onVerticalMouseDown}
                  sx={{
                    width: SPLITTER_WIDTH,
                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                    cursor: isSearchPopperOpen ? 'default' : 'col-resize',
                    pointerEvents: isSearchPopperOpen ? 'none' : 'auto',
                    zIndex: 5,
                  }}
                />
              )}

              {/* Horizontal splitter */}
              {rowsCount === 2 && (leftHasBoth || rightHasBoth) && (
                <Box
                  gridRow="2"
                  gridColumn={colsCount === 2 ? '1 / span 3' : leftHasBoth ? '1' : '3'}
                  role="separator"
                  onMouseDown={onHorizontalMouseDown}
                  sx={{
                    height: SPLITTER_HEIGHT,
                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                    cursor: isSearchPopperOpen ? 'default' : 'row-resize',
                    pointerEvents: isSearchPopperOpen ? 'none' : 'auto',
                    zIndex: 5,
                  }}
                />
              )}

              {/* Bottom-left */}
              <Box sx={{ gridRow: '3', gridColumn: bottomLeftVisible && !bottomRightVisible ? '1 / span 3' : '1', display: 'flex', minHeight: 0, zIndex: 10 }}>
                {visiblePanels.includes('resources') && (
                  <PanelContainer
                    title={PANEL_DEFS['resources'].label}
                    icon={PANEL_DEFS['resources'].icon}
                    isMaximized={false}
                    onMaximize={() => maximizePanel('resources')}
                    onClose={() => closePanel('resources')}
                    visibleCount={visiblePanels.length}
                  >
                    {renderPanelBody('resources')}
                  </PanelContainer>
                )}
              </Box>

              {/* Bottom-right */}
              <Box sx={{ gridRow: '3', gridColumn: !bottomLeftVisible && bottomRightVisible ? '1 / span 3' : '3', display: 'flex', minHeight: 0, zIndex: 10 }}>
                {visiblePanels.includes('tasks') && (
                  <PanelContainer
                    title={PANEL_DEFS['tasks'].label}
                    icon={PANEL_DEFS['tasks'].icon}
                    isMaximized={false}
                    onMaximize={() => maximizePanel('tasks')}
                    onClose={() => closePanel('tasks')}
                    visibleCount={visiblePanels.length}
                  >
                    {renderPanelBody('tasks')}
                  </PanelContainer>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    );
}
