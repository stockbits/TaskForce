// ============================================================================
// ScheduleLivePage.tsx — MATERIAL UI MIGRATION
// Fully wired to useLiveSelectEngine.ts (central selection engine)
// ============================================================================

import React, { useState, useMemo, useRef } from "react";

import MapLegend from "./MapLegend";
import SearchModeWrapper from "./SearchModeWrapper";
import type { SearchToolFilters } from "./SearchToolPanel";

import TimelinePanel from "./TimelinePanel";
import MapPanel from "./MapPanel";
import TaskTablePanel from "./TaskTablePanel";
import ResourceTablePanel from "./ResourceTablePanel";

import mockTasks from "@/data/mockTasks.json";
import ResourceMock from "@/data/ResourceMock.json";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { usePanelDocking, PanelContainer } from "@/hooks/usePanelDocking";
import { PanelKey } from "@/types";

import { useSearchLeftMenu } from "@/hooks/useSearchLeftMenu";

import { useLiveSelectEngine } from "@/hooks/useLiveSelectEngine";

import {
  Search,
  SlidersHorizontal,
  Star,
  Info,
  Clock,
  Map,
  Users,
  ClipboardList,
} from "lucide-react";

import type { TaskRecord, ResourceRecord } from "@/hooks/useLiveSelectEngine";

import {
  Box,
  Button,
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
import InputAdornment from "@mui/material/InputAdornment";
import { alpha, useTheme } from "@mui/material/styles";

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
  const currentFiltersRef = useRef<SearchToolFilters>({} as SearchToolFilters);

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
    shouldZoom,
    clearAll,
    notifyMapDragStart,
    notifyMapDragEnd,
  } = useLiveSelectEngine();

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
  const runTaskSearch = (filters: SearchToolFilters) => {
    let results = [...(mockTasks as TaskRecord[])];

    if (domain) {
      results = results.filter((t) => String(t.domain).toUpperCase() === domain);
    }
    if (division) {
      results = results.filter((t) => t.division === division);
    }
    if (filters.statuses?.length) {
      results = results.filter((t) => filters.statuses.includes(t.taskStatus));
    }
    if (filters.pwa?.length) {
      results = results.filter((t) => filters.pwa.includes(t.pwa));
    }
    if (filters.capabilities?.length) {
      results = results.filter((t) =>
        t.capabilities?.some((c: string) => filters.capabilities.includes(c))
      );
    }
    if (filters.commitmentTypes?.length) {
      results = results.filter((t) =>
        filters.commitmentTypes.includes(t.commitmentType)
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
    handleCloseSearchPanel();
  };

  /* ==========================================================================
     RESOURCE SEARCH
  ============================================================================ */
  const runResourceSearch = (filters: SearchToolFilters) => {
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
    if (filters.statuses?.length) {
      results = results.filter((r) => filters.statuses.includes(r.status));
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
    handleCloseSearchPanel();
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
      matched = true;
    }

    if (!matched) console.log("No match found.");

    handleCloseSearchPanel();
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
        return <TimelinePanel />;

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
          />
        );

      case "resources":
        return (
          <ResourceTablePanel
            data={resourceData}
            selectedResources={selectedResources}
            onSelectionChange={handleResourceTableSelect}
          />
        );

      case "tasks":
        return (
          <TaskTablePanel
            data={taskData}
            selectedTasks={selectedTasks}
            onSelectionChange={handleTaskTableSelect}
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
        sx={{ minWidth: { xs: theme.spacing(14), sm: theme.spacing(18) } }}
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
        sx={{ minWidth: { xs: theme.spacing(14), sm: theme.spacing(18) } }}
        SelectProps={{ displayEmpty: true, renderValue: (selected) => (selected ? String(selected) : 'Domain') }}
      >
        <MenuItem value="">All</MenuItem>
        {domainOptions.map((d) => (
          <MenuItem key={d} value={d}>
            {d}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        size="small"
        value={searchAnywhere}
        onChange={(e) => setSearchAnywhere(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && runGlobalSearch()}
        placeholder="Search anywhere…"
        sx={{ minWidth: { xs: theme.spacing(20), sm: theme.spacing(30) } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" sx={{ color: alpha(theme.palette.text.primary, 0.6) }}>
              <Search size={16} />
            </InputAdornment>
          ),
        }}
      />

      <Button
        ref={searchButtonRef}
        onClick={handleSearchToggle}
        variant={searchButtonActive ? "contained" : "outlined"}
        color="primary"
        size="small"
        startIcon={<SlidersHorizontal size={16} />}
        disabled={!division}
        sx={{
          boxShadow: searchButtonActive ? "0 14px 36px rgba(8,58,97,0.25)" : "none",
          bgcolor: searchButtonActive ? accentSoft : undefined,
          borderColor: searchButtonActive ? accent : undefined,
        }}
      >
        Search Tool
      </Button>

      <IconButton
        size="small"
        onClick={() => setFavActive((v) => !v)}
        sx={{
          borderRadius: 2,
          border: `1px solid ${borderColor}`,
          boxShadow: favActive ? "0 14px 36px rgba(8,58,97,0.2)" : "none",
          bgcolor: favActive ? accent : "white",
          color: favActive ? theme.palette.common.white : theme.palette.text.primary,
          '&:hover': {
            bgcolor: favActive ? accentHover : alpha(accent, 0.08),
          },
        }}
      >
        <Star size={16} />
      </IconButton>

      <IconButton
        size="small"
        onClick={() => setLegendOpen((o) => !o)}
        sx={{
          borderRadius: 2,
          border: `1px solid ${borderColor}`,
          boxShadow: legendOpen ? "0 14px 36px rgba(8,58,97,0.2)" : "none",
          bgcolor: legendOpen ? accent : "white",
          color: legendOpen ? theme.palette.common.white : theme.palette.text.primary,
          '&:hover': {
            bgcolor: legendOpen ? accentHover : alpha(accent, 0.08),
          },
        }}
        title="Map Legend"
      >
        <Info size={16} />
      </IconButton>

      <Box sx={{ flexGrow: 1 }} />

      <Button variant="outlined" size="small" onClick={handleClearAll}>
        Clear All
      </Button>

      {collapsedPanels.length > 0 && (
        <Stack direction="row" spacing={1.5} ml={2} alignItems="center">
          {collapsedPanels.map((key) => (
            <IconButton
              key={key}
              size="small"
              onClick={() => togglePanel(key)}
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                bgcolor: "white",
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
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
    >
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={160}>
          <Box>
            <ClickAwayListener onClickAway={handleSearchClickAway}>
              <Paper
                elevation={16}
                sx={{
                  borderRadius: 3,
                  p: 3,
                  border: `1px solid ${borderColor}`,
                  boxShadow: surfaceShadow,
                  backgroundImage: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                }}
                style={{ width: "min(95vw, 760px)" }}
              >
                <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      width: { xs: "100%", md: "clamp(200px,24vw,240px)" },
                      borderRadius: 2,
                      border: `1px solid ${alpha(accent, 0.12)}`,
                      boxShadow: "0 18px 42px rgba(8,58,97,0.18)",
                      backgroundImage: "none",
                      p: 2.5,
                      display: "flex",
                      flexDirection: "column",
                      gap: 3,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="overline"
                        sx={{ fontWeight: 700, color: alpha(theme.palette.text.secondary, 0.9) }}
                      >
                        Task Searches
                      </Typography>
                      <Stack spacing={1} mt={1.5}>
                        {taskItems.map((item) => (
                          <Button
                            key={item.id}
                            onClick={() => select(item.id)}
                            fullWidth
                            size="small"
                            variant={isActive(item.id) ? "contained" : "outlined"}
                            color="primary"
                            sx={{
                              justifyContent: "flex-start",
                              textTransform: "none",
                              fontSize: 12,
                              fontWeight: 600,
                              borderRadius: 1.5,
                            }}
                          >
                            {item.label}
                          </Button>
                        ))}
                      </Stack>
                    </Box>

                    <Divider flexItem sx={{ my: 1 }} />

                    <Box>
                      <Typography
                        variant="overline"
                        sx={{ fontWeight: 700, color: alpha(theme.palette.text.secondary, 0.9) }}
                      >
                        Resource Searches
                      </Typography>
                      <Stack spacing={1} mt={1.5}>
                        {resourceItems.map((item) => (
                          <Button
                            key={item.id}
                            onClick={() => select(item.id)}
                            fullWidth
                            size="small"
                            variant={isActive(item.id) ? "contained" : "outlined"}
                            color="primary"
                            sx={{
                              justifyContent: "flex-start",
                              textTransform: "none",
                              fontSize: 12,
                              fontWeight: 600,
                              borderRadius: 1.5,
                            }}
                          >
                            {item.label}
                          </Button>
                        ))}
                      </Stack>
                    </Box>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      flex: 1,
                      borderRadius: 2,
                      border: `1px solid ${alpha(accent, 0.12)}`,
                      boxShadow: "0 18px 42px rgba(8,58,97,0.18)",
                      backgroundImage: "none",
                      p: 3,
                    }}
                  >
                    <SearchModeWrapper
                      mode={mapSelectedMode(selectedMode)}
                      onSearch={(filters) => {
                        currentFiltersRef.current = filters;
                      }}
                      onClear={() => {
                        setTaskData([]);
                        setResourceData([]);
                        setResetKey((n) => n + 1);
                      }}
                      dropdownData={{
                        ...dropdownData,
                        resourceStatuses: Array.from(
                          new Set(allResources.map((r) => r.status))
                        ).sort(),
                      }}
                      resetKey={resetKey}
                    />
                  </Paper>
                </Stack>

                <Stack direction="row" justifyContent="flex-end">
                  <Button
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
                  </Button>
                </Stack>
              </Paper>
            </ClickAwayListener>
          </Box>
        </Fade>
      )}
    </Popper>
  );

  /* ==========================================================================
     RENDER
  ============================================================================ */
  return (
    <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", position: "relative", backgroundColor: alpha(theme.palette.primary.light, 0.08) }}>
      {toolbar}

      <MapLegend visible={legendOpen} onClose={() => setLegendOpen(false)} />

      {searchToolPopper}

      <Box sx={{ flex: 1, minHeight: 0, px: 1, pt: 1 }}>
        <PanelGroup
          key={visiblePanels.join("-")}
          direction="vertical"
          style={{ height: "100%" }}
        >
          {effectiveTop.length > 0 && (
            <>
              <Panel defaultSize={50}>
                <PanelGroup direction="horizontal" style={{ height: "100%" }}>
                  {effectiveTop.map((key, index) => (
                    <React.Fragment key={key}>
                      {index > 0 && (
                        <PanelResizeHandle
                          style={{
                            width: 4,
                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                            cursor: "col-resize",
                          }}
                        />
                      )}
                      <Panel>
                        <PanelContainer
                          title={PANEL_DEFS[key].label}
                          icon={PANEL_DEFS[key].icon}
                          isMaximized={isPanelMaximized(key)}
                          onMaximize={() => maximizePanel(key)}
                          onClose={() => closePanel(key)}
                          visibleCount={visiblePanels.length}
                        >
                          {renderPanelBody(key)}
                        </PanelContainer>
                      </Panel>
                    </React.Fragment>
                  ))}
                </PanelGroup>
              </Panel>

              {effectiveBottom.length > 0 && (
                <PanelResizeHandle
                  style={{
                    height: 4,
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    cursor: "row-resize",
                  }}
                />
              )}
            </>
          )}

          {effectiveBottom.length > 0 && (
            <Panel defaultSize={50}>
              <PanelGroup direction="horizontal" style={{ height: "100%" }}>
                {effectiveBottom.map((key, index) => (
                  <React.Fragment key={key}>
                    {index > 0 && (
                      <PanelResizeHandle
                        style={{
                          width: 4,
                          backgroundColor: alpha(theme.palette.primary.main, 0.08),
                          cursor: "col-resize",
                        }}
                      />
                    )}
                    <Panel>
                      <PanelContainer
                        title={PANEL_DEFS[key].label}
                        icon={PANEL_DEFS[key].icon}
                        isMaximized={isPanelMaximized(key)}
                        onMaximize={() => maximizePanel(key)}
                        onClose={() => closePanel(key)}
                        visibleCount={visiblePanels.length}
                      >
                        {renderPanelBody(key)}
                      </PanelContainer>
                    </Panel>
                  </React.Fragment>
                ))}
              </PanelGroup>
            </Panel>
          )}
        </PanelGroup>
      </Box>
    </Box>
  );
}
