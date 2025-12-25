// ============================================================================
// scheduleLive - Page.tsx — MATERIAL UI MIGRATION
// Fully wired to useLiveSelectEngine.ts (central selection engine)
// ============================================================================

import React, { useState, useMemo, useRef, useCallback, useEffect, lazy, Suspense } from "react";
import type { ScheduleLiveSearchFilters } from "@/shared-ui";

const ScheduleLegend = lazy(() => import("./UILegend"));
const ScheduleLiveSearch = lazy(() => import("@/shared-ui").then(m => ({ default: m.ScheduleLiveSearch })));
const TimelinePanel = lazy(() => import("./TimelinePanel"));
const MapPanel = lazy(() => import("./MapPanel"));
const TaskTablePanel = lazy(() => import("./TaskTablePanel"));
const ResourceTablePanel = lazy(() => import("./ResourceTablePanel"));

import mockTasks from "@/data/mockTasks.json";
import ResourceMock from "@/data/ResourceMock.json";

// replaced react-resizable-panels with internal flex splitter

import { usePanelDocking, PanelContainer } from "@/hooks/usePanelDocking";
import { PanelKey } from "@/types";

import { useSearchLeftMenu } from "@/hooks/useSearchLeftMenu";

import { useLiveSelectEngine } from "@/hooks/useLiveSelectEngine";

import { GlobalSearchField, SelectField } from "@/shared-ui";

import SlidersHorizontal from '@mui/icons-material/Tune';
import HelpOutline from '@mui/icons-material/HelpOutline';
import InfoIcon from '@mui/icons-material/Info';
import Bookmark from '@mui/icons-material/Bookmark';
import Clock from '@mui/icons-material/AccessTime';
import Map from '@mui/icons-material/Map';
import Users from '@mui/icons-material/People';
import ClipboardList from '@mui/icons-material/ListAlt';

import type { TaskRecord, ResourceRecord } from "@/hooks/useLiveSelectEngine";

import {
  Box,
  ClickAwayListener,
  Grow,
  IconButton,
  Paper,
  Popper,
  Skeleton,
  Stack,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useSettings } from '../contexts/SettingsContext';
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
function mapSelectedMode(id: string): "task" | "resource" {
  if (id === "resources") return "resource";
  if (id === "tasks") return "task";
  return "task"; // default
}

/* ============================================================================
   MAIN COMPONENT
============================================================================ */
export default function ScheduleLivePage() {
  const theme = useTheme();
  const accent = theme.palette.primary.main;
  const borderColor = alpha(accent, 0.18);
  const surfaceShadow = "0 24px 54px rgba(8,58,97,0.22)";

  /* ---------------- DOMAIN + DIVISION ---------------- */
  const [domain, setDomain] = useState<string>("");
  const [division, setDivision] = useState<string>("");
  
  /* ---------------- SETTINGS ---------------- */
  const { settings } = useSettings();

  const autoLoadResources = settings.autoLoadResources;

  /* ---------------- LEGEND ---------------- */
  const [legendOpen, setLegendOpen] = useState(false);
  const legendButtonRef = useRef<HTMLButtonElement | null>(null);

  /* ---------------- SEARCH TOOL ---------------- */
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchButtonActive, setSearchButtonActive] = useState(false);
  const searchButtonRef = useRef<HTMLButtonElement | null>(null);

  const [searchAnywhere, setSearchAnywhere] = useState("");
  const currentFiltersRef = useRef<ScheduleLiveSearchFilters>({} as ScheduleLiveSearchFilters);
  const [searchTab, setSearchTab] = useState<"task" | "resource">("task");

  /* ---------------- TABLE DATA ---------------- */
  const [taskData, setTaskData] = useState<TaskRecord[]>([]);
  const [taskTableData, setTaskTableData] = useState<TaskRecord[]>([]);
  const [resourceData, setResourceData] = useState<ResourceRecord[]>([]);

  /* ---------------- TIMELINE DATE STATE ---------------- */
  const [timelineStartDate, setTimelineStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(5, 0, 0, 0); // start at 5:00 AM
    return d;
  });
  const [timelineEndDate, setTimelineEndDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999); // end at end of current day
    return d;
  });
  const allResources = ResourceMock as ResourceRecord[];

  /* ---------------- DROPDOWN DATA ---------------- */
  const [dropdownData, setDropdownData] = useState({
    statuses: [] as string[],
    pwa: [] as string[],
    capabilities: [] as string[],
    commitmentTypes: [] as string[],
  });

  const [resetKey, setResetKey] = useState(0);
  const [clearKey, setClearKey] = useState(0);

  /* ---------------- LEFT MENU ---------------- */
  const { selectedMode } = useSearchLeftMenu();

  React.useEffect(() => {
    setSearchTab(mapSelectedMode(selectedMode));
  }, [selectedMode]);

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
  const handleDivisionChange = useCallback((value: string) => {
    setDivision(value);
    setTaskData([]);
    setTaskTableData([]);
    setResourceData([]);
    setResetKey((n) => n + 1);

    if (value) {
      const rows = (mockTasks as TaskRecord[]).filter((t) => t.division === value);
      setTaskData(rows);
      setDropdownData(buildFilteredDropdowns(rows));
      if (autoLoadResources) {
        runResourceSearch({} as ScheduleLiveSearchFilters);
      }
    } else {
      setDropdownData({
        statuses: [],
        pwa: [],
        capabilities: [],
        commitmentTypes: [],
      });
    }

    setSearchAnywhere("");
  }, [autoLoadResources]);

  const handleDomainChange = useCallback((value: string) => {
    setDomain(value);
    setTaskData([]);
    setTaskTableData([]);
    setResourceData([]);
    setResetKey((n) => n + 1);

    let rows = [...(mockTasks as TaskRecord[])];
    if (value) rows = rows.filter((t) => String(t.domain).toUpperCase() === value);
    if (division) rows = rows.filter((t) => t.division === division);
    setTaskData(rows);
    setDropdownData(buildFilteredDropdowns(rows));

    if (autoLoadResources && division) {
      runResourceSearch({} as ScheduleLiveSearchFilters);
    }

    setSearchAnywhere("");
  }, [division, autoLoadResources]);

  /* ==========================================================================
     DOCKING LOGIC
  ============================================================================ */
  const {
    visiblePanels,
    maximizedPanel,
    collapsedPanels,
    togglePanel,
    closePanel,
    maximizePanel,
    panelSizes,
    rowSizes,
    updatePanelSize,
    updateRowSize,
  } = usePanelDocking();

  /* ==========================================================================
     SEARCH HELPERS
  ============================================================================ */
  const handleCloseSearchPanel = useCallback(() => {
    setSearchOpen(false);
    setSearchButtonActive(false);
  }, []);

  const handleSearchToggle = useCallback(() => {
    if (!division) return;
    setSearchOpen((prev) => {
      const next = !prev;
      setSearchButtonActive(next);
      return next;
    });
  }, [division]);

  const anchorEl = searchButtonRef.current;
  const isSearchPopperOpen = Boolean(searchOpen && division && anchorEl);

  const handleSearchClickAway = useCallback((event: MouseEvent | TouchEvent) => {
    if (anchorEl && anchorEl.contains(event.target as Node)) {
      return;
    }
    handleCloseSearchPanel();
  }, [anchorEl, handleCloseSearchPanel]);

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

    setTaskTableData(results);
    // Removed handleCloseSearchPanel() to keep panel open with filters selected
  };

  /* ==========================================================================
     RESOURCE SEARCH
  ============================================================================ */
  const runResourceSearch = (filters: ScheduleLiveSearchFilters) => {
    let results = [...allResources];

    if (division) {
      results = results.filter((r) => r.division === division);
    }

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

    const taskMatches = (mockTasks as TaskRecord[]).filter(
      (t) => t.taskId && t.taskId.toLowerCase() === q
    );
    if (taskMatches.length) {
      setTaskData(taskMatches);
    }

    const resourceMatches = allResources.filter(
      (r) => r.resourceId && String(r.resourceId).toLowerCase() === q
    );
    if (resourceMatches.length) {
      setResourceData(resourceMatches);
      // Select the matched resource for the timeline
      handleResourceTableSelect(resourceMatches);
    }

    // Removed handleCloseSearchPanel() to keep panel open with filters selected
  };

  /* ==========================================================================
     CLEAR ALL (data + selection)
  ============================================================================ */
  const handleClearAll = useCallback(() => {
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
  }, [clearAll, division, handleCloseSearchPanel]);

  useEffect(() => {
    if (autoLoadResources && division) {
      runResourceSearch({} as ScheduleLiveSearchFilters);
    }
  }, [autoLoadResources, division]);

  /* ==========================================================================
     TIMELINE TASK INTERACTIONS
  ============================================================================ */
  const handleTaskBlockClick = (task: TaskRecord) => {
    handleTaskTableSelect([task]);
    setTaskTableData(prev => {
      if (prev.some(t => t.taskId === task.taskId)) return prev;
      return [task, ...prev];
    });
  };

  const handleTaskBlockDoubleClick = (task: TaskRecord) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todaysTasks = taskData.filter(t => {
      const taskDate = new Date(t.appointmentStartDate || t.startDate || t.expectedStartDate).toISOString().split('T')[0];
      return taskDate === todayStr;
    });
    setTaskTableData(todaysTasks);
  };

  const handleResourceClick = (resource: any) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const resourceTasks = taskData.filter(t => {
      const taskDate = new Date(t.appointmentStartDate || t.startDate || t.expectedStartDate).toISOString().split('T')[0];
      return taskDate === todayStr && (t.employeeId === resource.resourceId || t.resourceId === resource.resourceId);
    });
    setTaskTableData(resourceTasks);
  };

  /* ==========================================================================
     PANEL RENDERER
  ============================================================================ */
  const renderPanelBody = (key: PanelKey) => {
    switch (key) {
      case "timeline":
        return (
          <Suspense fallback={<div>Loading timeline...</div>}>
            <TimelinePanel
              isMaximized={!!maximizedPanel}
              startDate={timelineStartDate}
              endDate={timelineEndDate}
              onStartDateChange={setTimelineStartDate}
              onEndDateChange={setTimelineEndDate}
              resources={resourceData}
              tasks={taskData}
              onTaskClick={handleTaskBlockClick}
              onTaskDoubleClick={handleTaskBlockDoubleClick}
              onResourceClick={handleResourceClick}
            />
          </Suspense>
        );

      case "map":
        return (
          <Suspense fallback={<div>Loading map...</div>}>
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
          </Suspense>
        );

      case "resources":
        return (
          <Suspense fallback={<div>Loading resources...</div>}>
            <ResourceTablePanel
              data={resourceData}
              selectedResources={selectedResources}
              onSelectionChange={handleResourceTableSelect}
              selectionFromMap={selectionFromMap}
              onClearSelection={clearResourceSelections}
            />
          </Suspense>
        );

      case "tasks":
        return (
          <Suspense fallback={<div>Loading tasks...</div>}>
            <TaskTablePanel
              data={taskTableData}
              selectedTasks={selectedTasks}
              onSelectionChange={handleTaskTableSelect}
              selectionFromMap={selectionFromMap}
              onClearSelection={clearTaskSelections}
            />
          </Suspense>
        );

      default:
        return null;
    }
  };

  /* ==========================================================================
     PANEL LAYOUT
  ============================================================================ */

  const topLeftVisible = visiblePanels.includes('timeline');
  const topRightVisible = visiblePanels.includes('map');
  const bottomLeftVisible = visiblePanels.includes('resources');
  const bottomRightVisible = visiblePanels.includes('tasks');

  const topRowHas = Number(topLeftVisible || topRightVisible);
  const bottomRowHas = Number(bottomLeftVisible || bottomRightVisible);
  const rowsCount = topRowHas + bottomRowHas;

  const leftColHas = Number(topLeftVisible || bottomLeftVisible);
  const rightColHas = Number(topRightVisible || bottomRightVisible);
  const colsCount = leftColHas + rightColHas;

  const panelsContainerRef = useRef<HTMLDivElement | null>(null);

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
      <SelectField
        value={division}
        onChange={handleDivisionChange}
        options={divisionOptions}
        placeholder="Division"
        sx={{ maxWidth: '200px', flex: 1 }}
      />

      <SelectField
        value={domain}
        onChange={handleDomainChange}
        options={domainOptions}
        placeholder="Domain"
        sx={{ maxWidth: '200px', flex: 1 }}
      />

      <GlobalSearchField
        value={searchAnywhere}
        onChange={(e) => setSearchAnywhere(e.target.value)}
        onSearch={runGlobalSearch}
        placeholder="Global Search"
        size="small"
        showSearchButton={true}
        searchTooltip="Search by Task ID, Work ID, Estimate Number, Employee ID"
        sx={{ height: theme.custom?.inputHeight ?? 40, '& .MuiInputBase-input': { fontSize: 13, lineHeight: `${theme.custom?.chipSize ?? 28}px` } }}
      />

      {/* Search Tool + Clear All buttons on the left */}
      <AppButton
        ref={searchButtonRef}
        onClick={handleSearchToggle}
        variant={searchButtonActive ? "contained" : "contained"}
        color="primary"
        size="small"
        startIcon={<SlidersHorizontal sx={{ fontSize: 16 }} />}
        disabled={!division}
        sx={{ minWidth: 96, fontWeight: 500, mr: 1, ...(searchButtonActive && { boxShadow: theme.shadows[4] }) }}
      >
        Search Tool
      </AppButton>

      <AppButton variant="contained" size="small" onClick={handleClearAll} sx={{ minWidth: 96, fontWeight: 500, mr: 1 }}>
        Clear All
      </AppButton>

      {/* Icon buttons on the left - matching dock icon size */}
      <IconButton
        ref={legendButtonRef}
        size="medium"
        onClick={() => setLegendOpen((o) => !o)}
        sx={{
          mr: 0.5,
        }}
        title="Schedule Legend"
      >
        <InfoIcon sx={{ fontSize: 18 }} />
      </IconButton>

      <IconButton
        size="medium"
        sx={{
          mr: 0.5,
        }}
        title="Help"
      >
        <HelpOutline sx={{ fontSize: 18 }} />
      </IconButton>

      <IconButton
        size="medium"
        sx={{
          mr: 0.5,
        }}
        title="Favorites"
      >
        <Bookmark sx={{ fontSize: 18 }} />
      </IconButton>

      <Box sx={{ flexGrow: 1 }} />

      {collapsedPanels.length > 0 && (
        <Stack direction="row" spacing={1} ml={1} alignItems="center">
          {collapsedPanels.map((key) => (
            <IconButton
              key={key}
              size="medium"
              onClick={() => togglePanel(key)}
              sx={{
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
      placement="bottom"
      transition
      modifiers={[{ name: "offset", options: { offset: [0, 10] } }]}
      sx={{ zIndex: 12000 }}
    >
        {({ TransitionProps }) => (
          <Grow
            {...TransitionProps}
            timeout={400}
            style={{ 
              transformOrigin: 'top left',
              willChange: 'transform',
            }}
            easing={{
              enter: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
              exit: 'cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Box>
              <ClickAwayListener onClickAway={handleSearchClickAway}>
                <Box
                  sx={{
                    borderRadius: 3,
                    p: 2,
                    width: 1100,
                    maxWidth: '95vw',
                    mx: 'auto',
                    border: `1px solid ${borderColor}`,
                    boxShadow: surfaceShadow,
                    backgroundColor: theme.palette.background.paper,
                    transform: 'translateZ(0)', // Force hardware acceleration
                    overflow: 'hidden', // Prevent content overflow during animation
                  }}
                >
                <Stack direction={{ xs: "column" }} spacing={0}>
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
                    <Suspense fallback={
                      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Skeleton variant="rectangular" width={200} height={300} sx={{ borderRadius: 2 }} />
                          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Skeleton variant="rectangular" height={50} sx={{ borderRadius: 1 }} />
                            <Skeleton variant="rectangular" height={50} sx={{ borderRadius: 1 }} />
                            <Skeleton variant="rectangular" height={50} sx={{ borderRadius: 1 }} />
                          </Box>
                        </Box>
                      </Box>
                    }>
                      <ScheduleLiveSearch
                      mode={mapSelectedMode(selectedMode)}
                      onSearch={(filters: ScheduleLiveSearchFilters) => {
                        currentFiltersRef.current = filters;
                      }}
                      onTabChange={setSearchTab}
                      dropdownData={{
                        ...dropdownData,
                        division: divisionOptions,
                        domainId: domainOptions,
                        resourceStatuses: Array.from(
                          new Set(allResources.map((r) => r.status))
                        ).sort(),
                      }}
                      resetKey={resetKey}
                      clearKey={clearKey}
                      hideActions={true}
                    />
                    </Suspense>
                  </Box>
                </Stack>

                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                  <AppButton
                    variant="contained"
                    color="primary"
                    size="medium"
                    onClick={() => {
                      setClearKey((n) => n + 1);
                    }}
                    sx={{
                      px: 3.5,
                      fontWeight: 700,
                      boxShadow: "0 18px 38px rgba(8,58,97,0.24)",
                    }}
                  >
                    Clear
                  </AppButton>
                  <AppButton
                    variant="contained"
                    color="primary"
                    size="medium"
                    onClick={() => {
                      const filters = currentFiltersRef.current;
                      if (searchTab === "task") {
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
        </Grow>
      )}
    </Popper>
  );

  /* ==========================================================================
     RESIZE HANDLES
  ============================================================================ */
  const [isResizing, setIsResizing] = useState<{ type: 'horizontal' | 'vertical'; key: string } | null>(null);

  const handleResizeStart = (type: 'horizontal' | 'vertical', key: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    setIsResizing({ type, key });

    const startX = event.clientX;
    const startY = event.clientY;
    const container = panelsContainerRef.current;
    const containerRect = container?.getBoundingClientRect();

    if (!container || !containerRect) return;

    const onMove = (ev: MouseEvent) => {
      if (!isResizing) return;
      ev.preventDefault();

      if (isResizing.type === 'horizontal') {
        // Horizontal resizing between left/right panels in the same row
        const deltaX = ev.clientX - startX;

        if (isResizing.key === 'top') {
          // Resizing between timeline and map
          const timelineWidth = panelSizes.timeline;

          const newTimelinePx = timelineWidth * containerRect.width + deltaX;
          const newTimelineFraction = Math.max(0.1, Math.min(0.9, newTimelinePx / containerRect.width));
          const newMapFraction = Math.max(0.1, Math.min(0.9, 1 - newTimelineFraction));

          updatePanelSize('timeline', newTimelineFraction);
          updatePanelSize('map', newMapFraction);
        } else if (isResizing.key === 'bottom') {
          // Resizing between resources and tasks
          const resourcesWidth = panelSizes.resources;

          const newResourcesPx = resourcesWidth * containerRect.width + deltaX;
          const newResourcesFraction = Math.max(0.1, Math.min(0.9, newResourcesPx / containerRect.width));
          const newTasksFraction = Math.max(0.1, Math.min(0.9, 1 - newResourcesFraction));

          updatePanelSize('resources', newResourcesFraction);
          updatePanelSize('tasks', newTasksFraction);
        }
      } else {
        // Vertical resizing between top/bottom rows
        const deltaY = ev.clientY - startY;
        const currentHeightFraction = rowSizes[isResizing.key as 'top' | 'bottom'];
        const newHeightPx = currentHeightFraction * containerRect.height + deltaY;
        const newHeightFraction = Math.max(0.1, Math.min(0.9, newHeightPx / containerRect.height));
        updateRowSize(isResizing.key as 'top' | 'bottom', newHeightFraction);
      }
    };

    const onUp = () => {
      setIsResizing(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Resize handle component
  const ResizeHandle = ({ 
    type, 
    handleKey, 
    sx = {} 
  }: { 
    type: 'horizontal' | 'vertical'; 
    handleKey: string; 
    sx?: any 
  }) => (
    <Box
      sx={{
        position: 'relative',
        cursor: type === 'horizontal' ? 'ew-resize' : 'ns-resize',
        userSelect: 'none',
        '&:hover': {
          '& .resize-indicator': {
            opacity: 1,
          },
        },
        ...sx,
      }}
      onMouseDown={handleResizeStart(type, handleKey)}
    >
      <Box
        className="resize-indicator"
        sx={{
          position: 'absolute',
          opacity: 0,
          transition: 'opacity 0.2s ease',
          ...(type === 'horizontal' 
            ? {
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: 4,
                height: 24,
                bgcolor: alpha(theme.palette.primary.main, 0.3),
                borderRadius: 1,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.5),
                },
              }
            : {
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: 24,
                height: 4,
                bgcolor: alpha(theme.palette.primary.main, 0.3),
                borderRadius: 1,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.5),
                },
              }
          ),
        }}
      />
    </Box>
  );

    return (
      <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", position: "relative" }}>
        {toolbar}

        <Suspense fallback={<div>Loading legend...</div>}>
          <ClickAwayListener onClickAway={() => setLegendOpen(false)}>
            <ScheduleLegend 
              visible={legendOpen} 
              onClose={() => setLegendOpen(false)}
              anchorEl={legendButtonRef.current}
            />
          </ClickAwayListener>
        </Suspense>

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
                  : `1fr ${rowsCount === 2 ? '6px' : ''} 1fr`.trim(),
                gridTemplateColumns: (() => {
                  if (colsCount === 1) return '1fr';

                  const leftWidth = topLeftVisible ? panelSizes.timeline : panelSizes.resources;
                  const rightWidth = topRightVisible ? panelSizes.map : panelSizes.tasks;
                  const totalWidth = leftWidth + rightWidth;

                  // Normalize to ensure they add up to 100%
                  const leftPercent = Math.round((leftWidth / totalWidth) * 100);
                  const rightPercent = 100 - leftPercent;

                  return `${leftPercent}% 6px ${rightPercent}%`;
                })(),
                width: '100%',
                height: '100%',
                minHeight: 0,
                gap: 0,
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

              {/* Horizontal resize handle (top row) */}
              {colsCount === 2 && (
                <ResizeHandle
                  type="horizontal"
                  handleKey="top"
                  sx={{
                    gridRow: '1',
                    gridColumn: '2',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                />
              )}

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

              {/* Vertical resize handle */}
              {rowsCount === 2 && (
                <ResizeHandle
                  type="vertical"
                  handleKey="top"
                  sx={{
                    gridRow: '2',
                    gridColumn: '1 / span 3',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
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

              {/* Horizontal resize handle (bottom row) */}
              {colsCount === 2 && (
                <ResizeHandle
                  type="horizontal"
                  handleKey="bottom"
                  sx={{
                    gridRow: '3',
                    gridColumn: '2',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                />
              )}

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
