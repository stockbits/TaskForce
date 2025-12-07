// ============================================================================
// ScheduleLivePage.tsx — FINAL VERSION
// Fully wired to useLiveSelectEngine.ts (central selection engine)
// ============================================================================

import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import MapLegend from "./components/MapLegend";
import SearchModeWrapper from "./components/SearchModeWrapper";

import TimelinePanel from "./components/TimelinePanel";
import MapPanel from "./components/MapPanel";
import TaskTablePanel from "./components/TaskTablePanel";
import ResourceTablePanel from "./components/ResourceTablePanel";

import mockTasks from "@/data/mockTasks.json";
import ResourceMock from "@/data/ResourceMock.json";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import {
  usePanelDocking,
  PanelContainer,
} from "@/lib/hooks/usePanelDocking";
import { PanelKey } from "@/types";

import { useSearchLeftMenu } from "@/lib/hooks/useSearchLeftMenu";

import { useLiveSelectEngine } from "@/features/schedule/hooks/useLiveSelectEngine";

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

import type { TaskRecord, ResourceRecord } from "./hooks/useLiveSelectEngine";

/* ============================================================================
   THEME
============================================================================ */
const THEME = {
  blue: "#0A4A7A",
  blueHover: "#08385E",
  blueSoft: "#E8F1F7",
  border: "#D7E0EA",
};

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
   CLICK OUTSIDE WRAPPER
============================================================================ */
function ClickOutside({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClick();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClick]);

  return <div ref={ref}>{children}</div>;
}

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
  const currentFiltersRef = useRef<any>({});

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

  /* ============================================================================
     SELECTION ENGINE
     ============================================================================ */
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

  /* ============================================================================
     DIVISION OPTIONS
  ============================================================================ */
  const divisionOptions = useMemo(() => {
    const s = new Set<string>();
    (mockTasks as TaskRecord[]).forEach((t) => t.division && s.add(t.division));
    return Array.from(s).sort();
  }, []);

  const domainOptions = useMemo(() => {
    const s = new Set<string>();
    (mockTasks as TaskRecord[]).forEach((t) => t.domain && s.add(String(t.domain).toUpperCase()));
    return Array.from(s).sort();
  }, []);

  /* ============================================================================
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

  /* ============================================================================
     DIVISION CHANGE
  ============================================================================ */
  const handleDivisionChange = (value: string) => {
    setDivision(value);
    setTaskData([]);
    setResourceData([]);
    setResetKey((n) => n + 1);

    if (value) {
      const rows = (mockTasks as TaskRecord[]).filter(
        (t) => t.division === value
      );
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

    // Rebuild dropdowns based on domain + division if set
    let rows = [...(mockTasks as TaskRecord[])];
    if (value) rows = rows.filter((t) => String(t.domain).toUpperCase() === value);
    if (division) rows = rows.filter((t) => t.division === division);
    setDropdownData(buildFilteredDropdowns(rows));

    setSearchAnywhere("");
  };

  /* ============================================================================
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

  /* ============================================================================
     TASK SEARCH
  ============================================================================ */
  const runTaskSearch = (filters: any) => {
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

    // Sort at source: importance desc, then appointmentStartDate asc
    results.sort((a, b) => {
      const ai = Number(a.importanceScore ?? 0);
      const bi = Number(b.importanceScore ?? 0);
      if (bi !== ai) return bi - ai; // desc

      const aDate = a.appointmentStartDate ? new Date(a.appointmentStartDate).getTime() : 0;
      const bDate = b.appointmentStartDate ? new Date(b.appointmentStartDate).getTime() : 0;
      return aDate - bDate; // asc
    });

    setTaskData(results);
    setSearchOpen(false);
    setSearchButtonActive(false);
  };

  /* ============================================================================
     RESOURCE SEARCH
  ============================================================================ */
  const runResourceSearch = (filters: any) => {
    // Resource search MUST be derived from division selection
    if (!division) {
      setResourceData([]);
      return;
    }

    let results = [...allResources];

    // Apply division first (primary key for resource lookup)
    results = results.filter((r) => r.division === division);

    // Optional secondary filter by domain, if provided
    if (domain) {
      results = results.filter((r) => String(r.domain).toUpperCase() === domain);
    }
    if (filters.statuses?.length) {
      results = results.filter((r) => filters.statuses.includes(r.status));
    }
    if (filters.pwa?.length) {
      results = results.filter((r) => filters.pwa.includes(r.pwa));
    }

    // Sort at source: status priority then availableAgainAt asc
    const statusPriority: Record<string, number> = {
      Available: 1,
      Busy: 2,
      Offline: 3,
    };

    results.sort((a, b) => {
      const sa = statusPriority[a.status] ?? 99;
      const sb = statusPriority[b.status] ?? 99;
      if (sa !== sb) return sa - sb;

      const aTime = a.availableAgainAt ? new Date(a.availableAgainAt).getTime() : Number.POSITIVE_INFINITY;
      const bTime = b.availableAgainAt ? new Date(b.availableAgainAt).getTime() : Number.POSITIVE_INFINITY;
      return aTime - bTime;
    });

    setResourceData(results);
    setSearchOpen(false);
    setSearchButtonActive(false);
  };

  /* ============================================================================
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

    setSearchOpen(false);
    setSearchButtonActive(false);
  };

  /* ============================================================================
     CLEAR ALL (data + selection)
  ============================================================================ */
  const handleClearAll = () => {
    clearAll();

    setSearchAnywhere("");
    setTaskData([]);
    setResourceData([]);
    setResetKey((n) => n + 1);

    if (division) {
      const rows = (mockTasks as TaskRecord[]).filter(
        (t) => t.division === division
      );
      setDropdownData(buildFilteredDropdowns(rows));
    } else {
      setDropdownData({
        statuses: [],
        pwa: [],
        capabilities: [],
        commitmentTypes: [],
      });
    }

    setSearchOpen(false);
    setSearchButtonActive(false);
  };

  /* ============================================================================
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
            // ✔ Use the REAL engine functions
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

  /* ============================================================================
     PANEL LAYOUT
  ============================================================================ */
  const TOP = ["timeline", "map"] as PanelKey[];
  const BOTTOM = ["resources", "tasks"] as PanelKey[];

  const topRow = TOP.filter((k) => visiblePanels.includes(k));
  const bottomRow = BOTTOM.filter((k) => visiblePanels.includes(k));

  const effectiveTop = maximizedPanel ? [maximizedPanel] : topRow;
  const effectiveBottom = maximizedPanel ? [] : bottomRow;

  /* ============================================================================
     TOOLBAR
  ============================================================================ */
  const toolbar = (
    <div className="w-full bg-white border-b border-gray-200 px-3 py-2 flex items-center gap-3">
      {/* DIVISION SELECT (first) */}
      <div
        className="rounded-md shadow-sm bg-white px-2 py-1.5 hover:bg-gray-100"
        style={{ border: `1px solid ${THEME.blue}` }}
      >
        <select
          value={division}
          onChange={(e) => handleDivisionChange(e.target.value)}
          className="text-sm bg-transparent outline-none"
          style={{ minWidth: "clamp(90px,10vw,120px)" }}
        >
          <option value="">Division</option>
          {divisionOptions.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* DOMAIN SELECT (second) */}
      <div
        className="rounded-md shadow-sm bg-white px-2 py-1.5 hover:bg-gray-100"
        style={{ border: `1px solid ${THEME.blue}` }}
      >
        <select
          value={domain}
          onChange={(e) => handleDomainChange(e.target.value)}
          className="text-sm bg-transparent outline-none"
          style={{ minWidth: "clamp(90px,10vw,120px)" }}
        >
          <option value="">Domain</option>
          {domainOptions.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* GLOBAL SEARCH */}
      <div
        className="border border-gray-300 rounded-md shadow-sm bg-white px-2 py-1.5 flex items-center gap-2"
        style={{ minWidth: "clamp(180px,20vw,240px)" }}
      >
        <Search size={16} className="text-gray-500" />
        <input
          value={searchAnywhere}
          onChange={(e) => setSearchAnywhere(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runGlobalSearch()}
          placeholder="Search anywhere…"
          className="text-sm bg-transparent outline-none flex-1"
        />
      </div>

      {/* SEARCH TOOL BUTTON */}
      <button
        ref={searchButtonRef}
        disabled={!division}
        onClick={() => {
          setSearchOpen(!searchOpen);
          setSearchButtonActive(!searchOpen);
        }}
        className={`border rounded-md shadow-sm px-3 py-1.5 text-sm flex items-center gap-2 ${
          division ? "bg-white hover:bg-gray-100" : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
        style={
          division && searchButtonActive
            ? {
                backgroundColor: THEME.blueSoft,
                borderColor: THEME.blue,
                color: THEME.blue,
              }
            : {}
        }
      >
        <SlidersHorizontal size={16} />
        Search Tool
      </button>

      {/* FAV */}
      <button
        onClick={() => setFavActive((v) => !v)}
        className={`rounded-md shadow-sm px-2 py-1.5 ${favActive ? '' : 'hover:bg-gray-100'}`}
        style={{
          border: `1px solid ${THEME.blue}`,
          background: favActive ? THEME.blue : "white",
        }}
        title="Favorite"
      >
        <Star size={16} className={favActive ? "text-white" : "text-gray-700"} />
      </button>

      {/* MAP LEGEND BUTTON */}
      <button
        onClick={() => setLegendOpen((o) => !o)}
        className={`rounded-md shadow-sm px-2 py-1.5 ${legendOpen ? '' : 'hover:bg-gray-100'}`}
        title="Map Legend"
        style={{
          border: `1px solid ${THEME.blue}`,
          background: legendOpen ? THEME.blue : "white",
        }}
      >
        <Info size={16} className={legendOpen ? "text-white" : "text-gray-700"} />
      </button>

      <div className="flex-1" />

      {/* CLEAR ALL */}
      <button
        onClick={handleClearAll}
        className="border border-gray-300 rounded-md shadow-sm bg-white px-3 py-1.5 text-sm hover:bg-gray-100"
      >
        Clear All
      </button>

      {/* COLLAPSED DOCK */}
      {collapsedPanels.length > 0 && (
        <div className="flex items-center gap-2 ml-2">
          {collapsedPanels.map((key) => (
            <button
              key={key}
              onClick={() => togglePanel(key)}
              className="inline-flex items-center justify-center w-8 h-8 border rounded-md bg-white hover:bg-gray-50 shadow-sm"
            >
              {React.createElement(PANEL_DEFS[key].icon, {
                size: 15,
                className: "text-gray-700",
              })}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  /* ============================================================================
     RENDER
  ============================================================================ */
  return (
    <div className="flex-1 min-h-0 flex flex-col bg-gray-100 relative">
      {toolbar}

      {/* LEGEND (EXTERNAL) */}
      <MapLegend visible={legendOpen} onClose={() => setLegendOpen(false)} />

      {/* SEARCH TOOL POPUP */}
      <AnimatePresence>
        {searchOpen && division && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute z-[1000]"
            style={{
              top:
                (searchButtonRef.current?.offsetTop ?? 0) +
                (searchButtonRef.current?.offsetHeight ?? 0) +
                6,
              left: searchButtonRef.current?.offsetLeft ?? 0,
              width: "min(95vw,760px)",
            }}
          >
            <ClickOutside
              onClick={() => {
                setSearchOpen(false);
                setSearchButtonActive(false);
              }}
            >
              <div
                className="bg-white border shadow-xl rounded-lg p-4 flex flex-col gap-4"
                style={{
                  borderColor: THEME.blue,
                  boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.15)",
                }}
              >
                <div className="flex gap-4">
                  {/* LEFT SEARCH MENU */}
                  <div
                    className="bg-white border rounded-lg shadow-sm p-3 space-y-6"
                    style={{ width: "clamp(180px,24vw,240px)", borderColor: THEME.border }}
                  >
                    {/* TASK SEARCH MENU */}
                    <div>
                      <div className="text-[10px] font-semibold text-gray-500 px-1 mb-1">
                        TASK SEARCHES
                      </div>
                      <div className="space-y-1">
                        {taskItems.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => select(item.id)}
                            className={`w-full text-left px-3 py-1.5 rounded-md border text-xs transition ${
                              isActive(item.id)
                                ? "bg-[#0A4A7A] text-white border-[#08385E]"
                                : "bg-gray-50 hover:bg-gray-100 border-gray-300"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* RESOURCE SEARCH MENU */}
                    <div>
                      <div className="text-[10px] font-semibold text-gray-500 px-1 mb-1">
                        RESOURCE SEARCHES
                      </div>
                      <div className="space-y-1">
                        {resourceItems.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => select(item.id)}
                            className={`w-full text-left px-3 py-1.5 rounded-md border text-xs transition ${
                              isActive(item.id)
                                ? "bg-[#0A4A7A] text-white border-[#08385E]"
                                : "bg-gray-50 hover:bg-gray-100 border-gray-300"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT FILTER PANEL */}
                  <div className="flex-1">
                    <div
                      className="bg-white border rounded-lg shadow-sm p-4"
                      style={{ borderColor: THEME.border }}
                    >
                      <SearchModeWrapper
                        mode={mapSelectedMode(selectedMode)}
                        onSearch={(f) => (currentFiltersRef.current = f)}
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
                    </div>
                  </div>
                </div>

                {/* EXECUTE SEARCH BUTTON */}
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => {
                      const filters = currentFiltersRef.current;
                      const mode = mapSelectedMode(selectedMode);
                      // Run the search independently based on selected menu
                      if (mode.startsWith("task")) {
                        runTaskSearch(filters);
                      } else {
                        runResourceSearch(filters);
                      }
                    }}
                    className="px-5 py-2 rounded-md text-sm font-medium text-white"
                    style={{ background: THEME.blue }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = THEME.blueHover)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = THEME.blue)
                    }
                  >
                    Search
                  </button>
                </div>
              </div>
            </ClickOutside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN 4-PANEL LAYOUT */}
      <div className="flex-1 min-h-0 px-1 pt-1">
        <PanelGroup
          key={visiblePanels.join("-")}
          direction="vertical"
          className="h-full"
        >
          {/* TOP ROW */}
          {effectiveTop.length > 0 && (
            <>
              <Panel defaultSize={50}>
                <PanelGroup direction="horizontal">
                  {effectiveTop.map((key, index) => (
                    <React.Fragment key={key}>
                      {index > 0 && (
                        <PanelResizeHandle className="w-[4px] bg-white/40" />
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
                <PanelResizeHandle className="h-[4px] bg-white/40" />
              )}
            </>
          )}

          {/* BOTTOM ROW */}
          {effectiveBottom.length > 0 && (
            <Panel defaultSize={50}>
              <PanelGroup direction="horizontal">
                {effectiveBottom.map((key, index) => (
                  <React.Fragment key={key}>
                    {index > 0 && (
                      <PanelResizeHandle className="w-[4px] bg-white/40" />
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
      </div>
    </div>
  );
}
