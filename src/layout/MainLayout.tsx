import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalloutLandingPage } from "@features/callout/components/CalloutLandingPage";
import mockTasks from "@/data/mockTasks.json";
import ResourceMock from "@/data/ResourceMock.json";
import ScheduleLivePage from "@/features/schedule/ScheduleLivePage";
import { User } from "lucide-react";

import {
  CalloutIncidentPanel,
  CalloutOutcome,
  CalloutOutcomeConfig,
  ResourceRecord,
} from "@features/callout/components/CalloutIncidentPanel";
import {
  Menu,
  Search,
  Folder,
  ClipboardList,
  Settings,
  ListChecks,
  AlertTriangle,
  Users,
  UserCog,
  Globe,
  Calendar,
  Cog,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { createPortal } from "react-dom";

import { Sidebar } from "./Sidebar";
import TaskSearchCard from "@/features/tasks/components/TaskSearchCardClean";
import TaskTable_Advanced from "@/features/tasks/components/TaskTable_Advanced";
import TaskPopoutPanel from "@/features/tasks/components/TaskPopoutPanel";

import { cardMap } from "@/shared/config/menuRegistry";
import { TaskDetails, ProgressNoteEntry } from "@/types";
import { useExternalWindow } from "@/lib/hooks/useExternalWindow";
import { useCalloutHistory } from "@/lib/hooks/useCalloutHistory";
import type { CalloutHistoryEntry } from "@/lib/hooks/useCalloutHistory";

/* =========================================================
   ICON MAP & TABLE HEADERS
========================================================= */
const iconMap: Record<string, any> = {
  "Operation Toolkit": ClipboardList,
  "General Settings": Settings,
  "Task Admin": ListChecks,
  "Jeopardy Admin": AlertTriangle,
  "Resource Admin": Users,
  "Self Service Admin": Settings,
  "User Admin": UserCog,
  "Domain Admin": Globe,
  "Schedule Admin": Calendar,
  "System Admin": Cog,
};

const headerNames: Record<string, string> = {
  taskId: "Task ID",
  taskStatus: "Task Status",
  taskType: "Task Type",
  primarySkill: "Primary Skill",
  importanceScore: "Importance Score",
  msc: "MSC",
  taskCreated: "Task Created",
  groupCode: "Group Code",
  systemType: "System Type",
  employeeId: "Employee ID",
  resourceName: "Resource Name",
  asset: "Asset",
  assetName: "Asset Name",
  commitmentDate: "Commitment Date",
  commitmentType: "Commitment Type",
  arrivedAtDate: "Arrived At Date",
  domain: "Domain",
  estimatedDuration: "Estimated Duration",
  lastProgression: "Last Progression",
  category: "Category",
  description: "Description",
  responseCode: "Response Code",
  postCode: "Post Code",
  appointmentStartDate: "Appointment Start Date",
  linkedTask: "Linked Task",
  customerAddress: "Customer Address",
  expectedStartDate: "Expected Start Date",
  expectedFinishDate: "Expected Finish Date",
  externalQueueId: "External Queue Id",
  workId: "Work Id",
  estimateNumber: "Estimate Number",
  startDate: "Start Date",
};

const ALL_TASK_SECTIONS = [
  "Work Details",
  "Commitments / Customer / Location",
  "Scheduling / Resources",
  "Access Restrictions",
  "Job Notes",
  "Progress Notes",
  "Closure",
];

/* =========================================================
   HELPERS
========================================================= */

function filterTasks(
  allRows: Record<string, any>[],
  filters: Record<string, any>
): Record<string, any>[] {
  let filtered = [...allRows];

  // Global quick search
  if (filters.taskSearch?.trim()) {
    const q = filters.taskSearch.toLowerCase();
    filtered = filtered.filter((t) =>
      [t.taskId, t.resourceName, t.workId, t.assetName, t.description]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }

  if (filters.division?.length) {
    filtered = filtered.filter((t) => filters.division.includes(t.groupCode));
  }

  // ⭐ MULTI-SELECT DOMAIN LIST
  if (filters.domainId?.length) {
    filtered = filtered.filter((t) =>
      filters.domainId.includes(String(t.domain || "").toUpperCase())
    );
  }

  if (filters.taskStatuses?.length) {
    filtered = filtered.filter((t) =>
      filters.taskStatuses.includes(t.taskStatus)
    );
  }

  if (filters.responseCode?.length) {
    filtered = filtered.filter((t) =>
      filters.responseCode.includes(t.responseCode)
    );
  }

  if (filters.requester?.trim()) {
    const q = filters.requester.toLowerCase();
    filtered = filtered.filter((t) =>
      String(t.resourceName || "")
        .toLowerCase()
        .includes(q)
    );
  }

  if (filters.commitType?.length) {
    filtered = filtered.filter((t) =>
      filters.commitType.includes(t.commitmentType)
    );
  }

  if (filters.capabilities?.length) {
    filtered = filtered.filter((t) =>
      filters.capabilities.includes(t.primarySkill)
    );
  }

  if (filters.jobType?.trim()) {
    const q = filters.jobType.toLowerCase();
    filtered = filtered.filter((t) =>
      String(t.taskType || "")
        .toLowerCase()
        .includes(q)
    );
  }

  return filtered;
}

function buildClipboardHtml(
  headerKeys: string[],
  rows: Record<string, any>[]
): string {
  return `
    <table border="1" cellpadding="4" cellspacing="0">
      <thead><tr>${headerKeys
        .map((h) => `<th>${headerNames[h]}</th>`)
        .join("")}</tr></thead>
      <tbody>${rows
        .map(
          (r) =>
            `<tr>${headerKeys
              .map((h) => `<td>${r[h] ?? ""}</td>`)
              .join("")}</tr>`
        )
        .join("")}</tbody>
    </table>`;
}

function buildCSV(headerKeys: string[], rows: Record<string, any>[]): string {
  const headerRow = headerKeys.map((h) => headerNames[h]).join(",");
  const dataRows = rows.map((r) => headerKeys.map((h) => r[h] ?? "").join(","));
  return [headerRow, ...dataRows].join("\n");
}

/* =========================================================
   HEADER COMPONENT (memoized)
========================================================= */

interface HeaderProps {
  currentMenu: { label: string; icon: any };
  windowWidth: number;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  globalResults: any[];
  showDropdown: boolean;
  setShowDropdown: (v: boolean) => void;
  onSelectResult: (item: any) => void;
  onToggleSidebar: () => void;
}

/* =========================================================
   HEADER COMPONENT (memoized) — Updated White Toolbar
========================================================= */

const Header: React.FC<HeaderProps> = memo(
  ({
    currentMenu,
    windowWidth,
    searchQuery,
    setSearchQuery,
    globalResults,
    showDropdown,
    setShowDropdown,
    onSelectResult,
    onToggleSidebar,
  }) => {
    return (
      <header
        className={`
        relative z-30
        flex items-center justify-between
        bg-[#0A4A7A]       /* deep blue */
        text-white
        h-[70px]
        px-4 sm:px-6
        shadow-[0_2px_6px_rgba(0,0,0,0.35)]   /* MUCH deeper shadow */
      `}
      >
        {/* --- Strong separation band under header --- */}
        <div
          className="absolute bottom-[-10px] left-0 w-full h-[10px]
                      bg-gradient-to-b from-black/15 to-transparent pointer-events-none"
        />

        {/* LEFT SIDE */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="w-[42px] h-[42px] flex items-center justify-center rounded-md 
             hover:bg-black/10 transition"
          >
            <Menu size={28} strokeWidth={3.2} className="text-black/90" />
          </button>

          <h1 className="font-semibold text-lg hidden sm:block tracking-tight">
            {currentMenu?.label ?? "Dashboard"}
          </h1>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-4 relative">
          {/* Search */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-2.5 text-white/80"
            />
            <input
              placeholder="Search anywhere..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowDropdown(globalResults.length > 0)}
              className="pl-9 pr-3 py-2 rounded-md border border-white/30 bg-white/10 
                       text-sm text-white placeholder-white/70
                       focus:outline-none focus:ring-2 focus:ring-white/40"
              style={{ width: "clamp(180px,22vw,280px)" }}
            />

            <AnimatePresence>
              {showDropdown && globalResults.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-full bg-white text-gray-800
                           rounded-md shadow-xl border border-gray-200 z-[9999]"
                >
                  {globalResults.map((item: any, idx: number) => (
                    <li
                      key={idx}
                      onMouseDown={() => onSelectResult(item)}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                    >
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">
                        {item.category}
                      </div>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {/* Avatar (use the strong blue you showed in screenshot) */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center
             bg-[#0A0A0A] border border-white/20 shadow-lg"
          >
            <User size={18} className="text-white" />
          </div>
        </div>
      </header>
    );
  }
);

Header.displayName = "Header";

/* =========================================================
   MAIN CONTENT CARDS (memoized)
========================================================= */

interface MainContentProps {
  currentMenu: { label: string; icon: any };
  filteredItems: any[];
  windowWidth: number;
  onCardClick: (item: any) => void;
}

const MainContent: React.FC<MainContentProps> = memo(
  ({ currentMenu, filteredItems, windowWidth, onCardClick }) => {
    const shortLabel = currentMenu?.label?.split(" ")[0] ?? "Dashboard";

    return (
      <div className="flex flex-col w-full max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 py-12">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-2">
            {React.createElement(currentMenu?.icon || Folder, {
              size: 30,
              className: "text-[#0A4A7A]",
            })}
            <h1 className="text-3xl font-bold text-gray-900">
              {windowWidth < 950 ? shortLabel : currentMenu?.label}
            </h1>
          </div>
          <p className="text-gray-500 text-sm">
            {currentMenu?.label
              ? `${currentMenu.label} Overview`
              : "Overview of your workspace"}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentMenu?.label || "default"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className={`mt-6 grid ${
              windowWidth < 950
                ? "grid-cols-1"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            } gap-8 place-items-center`}
          >
            {filteredItems.length ? (
              filteredItems.map((item: any, idx: number) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => onCardClick(item)}
                  className="cursor-pointer bg-white rounded-xl border border-gray-200 shadow-sm 
                               p-6 w-full sm:w-72 md:w-80 min-h-[140px] text-center hover:shadow-md transition-all"
                >
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">
                    {item.name}
                  </h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full flex justify-center mt-12">
                <p className="text-gray-400 text-sm">No results found.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }
);

MainContent.displayName = "MainContent";

/* =========================================================
   MAIN APP CONTAINER
========================================================= */

export default function MainLayout() {
  /* ---------------------- Menu & layout ---------------------- */
  const defaultMenu = "Operation Toolkit";

  const [currentMenu, setCurrentMenu] = useState<any>({
    label: defaultMenu,
    icon: iconMap[defaultMenu] || Folder,
  });

  const [cards, setCards] = useState<any[]>(cardMap[defaultMenu] || []);
  const [activeSubPage, setActiveSubPage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [globalResults, setGlobalResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [uiScale, setUiScale] = useState(1);

  /* ---------------------- Data ---------------------- */
  const [allRows, setAllRows] = useState<Record<string, any>[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Resources for callout
  const [resources, setResources] = useState<ResourceRecord[]>([]);
  const [resourceLoaded, setResourceLoaded] = useState(false);

  // AUTO-GENERATE callout groups from resource dataset
  const calloutGroups = useMemo(() => {
    const groups = resources
      .map((r) => r.calloutGroup)
      .filter((g): g is string => Boolean(g)); // remove null/undefined

    return Array.from(new Set(groups)).sort(); // unique + alphabetical
  }, [resources]);

  // Inline expand (kept for future inline panel use)
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  /* ---------------------- External window hook ---------------------- */
  const {
    externalContainer,
    externalTasks,
    externalExpandedSections,
    openExternalWindow,
    openResourceWindow,
    closeExternalWindow,
    setExternalExpandedSections,
  } = useExternalWindow();

  const [incidentOpen, setIncidentOpen] = useState(false);
  const [incidentTask, setIncidentTask] = useState<Record<string, any> | null>(
    null
  );
  // Inline popout state
  useEffect(() => {
    return () => closeExternalWindow();
  }, [closeExternalWindow]);

  useEffect(() => {
    const handleViewProgressNotes = (event: Event) => {
      const custom = event as CustomEvent<{
        taskId?: string | null;
        workId?: string | null;
      }>;

      const detail = custom.detail || {};
      const targetTaskId = detail.taskId;
      const targetWorkId = detail.workId;

      let targetRow: Record<string, any> | undefined;

      if (targetTaskId) {
        const compare = String(targetTaskId);
        targetRow = allRows.find((row) => {
          const rowTask =
            row?.taskId ?? row?.TaskID ?? row?.TaskId ?? row?.id ?? null;
          return rowTask != null && String(rowTask) === compare;
        });
      }

      if (!targetRow && targetWorkId) {
        const compare = String(targetWorkId);
        targetRow = allRows.find((row) => {
          const rowWork =
            row?.workId ?? row?.WorkID ?? row?.WorkId ?? row?.workID ?? null;
          return rowWork != null && String(rowWork) === compare;
        });
      }

      if (!targetRow) return;

      setExternalExpandedSections(["Progress Notes"]);
      const coordsX = window.innerWidth / 2;
      const coordsY = window.innerHeight / 2;
      openExternalWindow([targetRow as TaskDetails], coordsX, coordsY);
    };

    window.addEventListener(
      "taskforce:view-progress-notes",
      handleViewProgressNotes as EventListener
    );
    return () => {
      window.removeEventListener(
        "taskforce:view-progress-notes",
        handleViewProgressNotes as EventListener
      );
    };
  }, [allRows, openExternalWindow, setExternalExpandedSections]);

  // CALLOUT LANDING (NEW)
  const [calloutLandingOpen, setCalloutLandingOpen] = useState(false);
  const [selectedCalloutResources, setSelectedCalloutResources] = useState<
    ResourceRecord[]
  >([]);
  const [selectedCalloutGroup, setSelectedCalloutGroup] = useState<string | null>(
    null
  );

  const {
    history: calloutHistory,
    loading: calloutHistoryLoading,
    error: calloutHistoryError,
    refresh: refreshCalloutHistory,
    appendLocal: appendCalloutHistory,
  } = useCalloutHistory();

  const handleOpenCalloutIncident = useCallback((task: Record<string, any>) => {
    setIncidentTask(task);
    setCalloutLandingOpen(true); // << opens landing screen first
  }, []);

  /* ---------------------- Effects ---------------------- */

  // Load mock task data
  useEffect(() => {
    setAllRows(mockTasks as Record<string, any>[]);
    setDataLoaded(true);
  }, []);

  // Load resource mock data (static import)
  useEffect(() => {
    try {
      setResources(ResourceMock as ResourceRecord[]);
      setResourceLoaded(true);
    } catch (err) {
      toast.error("Error loading resource data.");
    }
  }, []);

  // Window resize + update CSS variable for mobile 100vh fixes
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    const resize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
      setVh();

      // Compute a conservative UI scale based on height so smaller viewports
      // get a denser/compact UI automatically. Clamp between 0.75 and 1.
      const h = window.innerHeight;
      const computed = Math.max(0.75, Math.min(1, h / 900));
      setUiScale(Number(computed.toFixed(2)));
      // Also set a CSS var for access if needed
      document.documentElement.style.setProperty("--ui-scale", String(computed));
      // Adjust base font-size lightly to help density (keeps readable)
      const fontSize = Math.max(13, Math.min(16, Math.round(h / 60)));
      document.documentElement.style.fontSize = `${fontSize}px`;
    };

    // initialize
    setVh();
    // also initialize scale + font
    const h0 = window.innerHeight;
    const initScale = Math.max(0.75, Math.min(1, h0 / 900));
    setUiScale(Number(initScale.toFixed(2)));
    document.documentElement.style.setProperty("--ui-scale", String(initScale));
    const initFont = Math.max(13, Math.min(16, Math.round(h0 / 60)));
    document.documentElement.style.fontSize = `${initFont}px`;

    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Global menu-card search across cardMap
  const allCardsFlattened = useMemo(
    () =>
      Object.entries(cardMap).flatMap(([menu, cards]) =>
        (cards as any[]).map((c) => ({ ...c, category: menu }))
      ),
    []
  );

  useEffect(() => {
    if (!searchQuery.trim()) {
      setGlobalResults([]);
      setShowDropdown(false);
      return;
    }

    const results = allCardsFlattened.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setGlobalResults(results);
    setShowDropdown(results.length > 0);
  }, [searchQuery, allCardsFlattened]);

  /* ---------------------- Handlers ---------------------- */

  const handleMenuClick = useCallback((menu: any) => {
    const label = menu.label;

    setCurrentMenu({
      label,
      icon: iconMap[label] || Folder,
    });

    setCards(cardMap[label] || []);
    setRows([]);
    setActiveSubPage(null);
    setSearchQuery("");
    setGlobalResults([]);
    setShowDropdown(false);
  }, []);

  const handleCardClick = useCallback((item: any) => {
    if (item.name === "Task Management") {
      setActiveSubPage("TaskManagement");
      setRows([]);
    }

    if (item.name === "Schedule Live") {
      setActiveSubPage("ScheduleLive"); // ⭐ NEW PAGE ID
    }
  }, []);

  const handleSearch = useCallback(
    (filters: Record<string, any>) => {
      if (!dataLoaded) {
        toast.error("Data not loaded yet.");
        return;
      }

      const filtered = filterTasks(allRows, filters);

      if (filtered.length === 0) {
        setRows([]);
        toast.error("No matching tasks found.");
        return;
      }

      setRows(filtered);
    },
    [allRows, dataLoaded]
  );

  const handleClear = useCallback(() => {
    setRows([]);
    setExpandedSections([]);
    toast.success("Filters cleared.", { id: "clear-toast", icon: "🧹" });
  }, []);

  const canCopy = rows.length > 0;

  const handleCopyAll = useCallback(async () => {
    if (!canCopy) {
      toast.error("No data to copy.");
      return;
    }

    const headers = Object.keys(headerNames);
    const html = buildClipboardHtml(headers, rows);
    await navigator.clipboard.writeText(html);
    toast.success("Copied", { icon: "📋" });
  }, [rows, canCopy]);

  const handleExportCSV = useCallback(() => {
    if (!canCopy) {
      toast.error("No data to export.");
      return;
    }

    const headers = Object.keys(headerNames);
    const csv = buildCSV(headers, rows);

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "FilteredTasks.csv";
    link.click();

    toast.success("Exported", { icon: "💾" });
  }, [rows, canCopy]);

  const handleHeaderSelectResult = useCallback((item: any) => {
    setSearchQuery("");
    setShowDropdown(false);

    const label = item.category;
    const menuCards = cardMap[label] || [];

    setCurrentMenu({ label, icon: iconMap[label] || Folder });
    setCards(menuCards);
    setActiveSubPage(item.name === "Task Management" ? "TaskManagement" : null);
  }, []);

  // Build domain and division options from DB (mock JSON)
  const domainOptions = useMemo(() => {
    const set = new Set<string>();
    (mockTasks as any[]).forEach((t) => {
      const v = String(t.domain || "").toUpperCase();
      if (v) set.add(v);
    });
    return Array.from(set).sort();
  }, []);

  const divisionOptions = useMemo(() => {
    const set = new Set<string>();
    (mockTasks as any[]).forEach((t) => {
      const v = String(t.groupCode || "").toUpperCase();
      if (v) set.add(v);
    });
    return Array.from(set).sort();
  }, []);

  const handleChangeDomain = useCallback((v: string) => {
    setSelectedDomain(v);
    // Optionally filter division list when domain changes (kept simple)
    // No hard filter applied to options; use selection to drive data filters.
  }, []);

  const handleChangeDivision = useCallback((v: string) => {
    setSelectedDivision(v);
  }, []);

  // Callback passed into TaskTable_Advanced for popout
  const handleOpenPopout = useCallback(
    (tasks: Record<string, any>[], mouseX: number, mouseY: number) => {
      if (!tasks || tasks.length === 0) return;
      openExternalWindow(tasks as TaskDetails[], mouseX, mouseY);
    },
    [openExternalWindow]
  );

  const handleOpenResourcePopout = useCallback(
    (resource: ResourceRecord, resourceHistory: CalloutHistoryEntry[]) => {
      if (!resource) return;

      const mergedHistory = resourceHistory.length
        ? resourceHistory
        : calloutHistory.filter(
            (entry) => entry.resourceId === resource.resourceId
          );

      openResourceWindow(resource, mergedHistory);
    },
    [calloutHistory, openResourceWindow]
  );

  // Outcome → task status mapping
  const mapOutcomeToTaskStatus = (
    current: string,
    outcome: CalloutOutcome
  ): string => {
    switch (outcome) {
      case "AssignDispatchedAWI":
      case "CalloutDispatchedAWI":
        return "Dispatched (AWI)";
      case "PendingACT":
        return "Assigned (ACT)";
      case "Disturbance":
      case "NoReply":
        return "Callout Failed";
      case "Refusal":
        return "Refused";
      case "Unavailable":
        return "Awaiting Resource";
      default:
        return current;
    }
  };

  // Outcome → resource status mapping
  const mapOutcomeToResourceStatus = (
    current: string | null | undefined,
    outcome: CalloutOutcome
  ): string => {
    switch (outcome) {
      case "AssignDispatchedAWI":
      case "CalloutDispatchedAWI":
        return "Busy";
      case "PendingACT":
        return "Pending";
      case "Disturbance":
        return "Flagged";
      case "NoReply":
        return "No Reply";
      case "Refusal":
        return "Refused";
      case "Unavailable":
        return "Unavailable";
      default:
        return current || "Available";
    }
  };

  // MANUAL save from CalloutIncidentPanel (per row)
  const handleCalloutRowSave = useCallback(
    async (payload: {
      taskId: string | number | null;
      resourceId: string;
      outcome: CalloutOutcome;
      availableAgainAt?: string;
    }) => {
      const { taskId, resourceId, outcome, availableAgainAt } = payload;
      const timestamp = new Date().toISOString();

      const formatForNote = (iso?: string | null) => {
        if (!iso) return null;
        try {
          const date = new Date(iso);
          if (Number.isNaN(date.getTime())) {
            return iso;
          }
          const day = String(date.getDate()).padStart(2, "0");
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const year = date.getFullYear();
          const hours = String(date.getHours()).padStart(2, "0");
          const minutes = String(date.getMinutes()).padStart(2, "0");
          return `${day}/${month}/${year} ${hours}:${minutes}`;
        } catch {
          return iso;
        }
      };

      const appendProgressNote = (
        task: TaskDetails,
        entry: ProgressNoteEntry | null
      ): ProgressNoteEntry[] | string | undefined => {
        if (!entry) {
          return task.progressNotes;
        }

        const baseNotes = (() => {
          if (Array.isArray(task.progressNotes)) {
            return [...task.progressNotes];
          }
          if (typeof task.progressNotes === "string" && task.progressNotes.trim()) {
            return [
              {
                ts: task.taskCreated || timestamp,
                status: "",
                text: task.progressNotes.trim(),
                source: "Imported",
              } as ProgressNoteEntry,
            ];
          }
          return [] as ProgressNoteEntry[];
        })();

        return [...baseNotes, entry];
      };

      let calloutHistoryEntry: Omit<CalloutHistoryEntry, "id"> | null = null;

      // Update resources + resource history
      setResources((prev) =>
        prev.map((r) => {
          if (r.resourceId !== resourceId) return r;

          const previousOutcome = r.lastOutcome ?? null;
          const previousAvailable =
            (r.availableAgainAt as string | null) ?? null;

          return {
            ...r,
            status: mapOutcomeToResourceStatus(r.status, outcome),
            lastOutcome: outcome,
            availableAgainAt:
              outcome === "Unavailable" ? availableAgainAt ?? null : null,
            history: [
              ...(r.history ?? []),
              {
                previousOutcome,
                previousAvailableAgainAt: previousAvailable,
                changedAt: timestamp,
                taskIdUsed: taskId ?? null,
                outcomeApplied: outcome,
                availableAgainAt:
                  outcome === "Unavailable" ? availableAgainAt ?? null : null,
              },
            ],
          };
        })
      );

      // Helper to apply task updates + task history
      const applyToTasks = (list: Record<string, any>[]) =>
        list.map((t) => {
          if (t.taskId !== taskId) return t;

          const previousTaskStatus = t.taskStatus;
          const previousEmployeeId = t.employeeId ?? null;
          const nextTaskStatus = mapOutcomeToTaskStatus(t.taskStatus, outcome);
          const resourceLabel = t.resourceName
            ? `${t.resourceName} (${resourceId})`
            : resourceId;
          const outcomeLabel =
            CalloutOutcomeConfig[outcome]?.label ?? String(outcome);

          let noteEntry: ProgressNoteEntry | null = null;
          let noteText = `${resourceLabel} outcome set to ${outcomeLabel}.`;
          if (taskId) {
            if (outcome === "Unavailable") {
              const availabilityLabel = formatForNote(availableAgainAt);
              noteEntry = {
                ts: timestamp,
                status: "Unavailable",
                text: availabilityLabel
                  ? `${resourceLabel} marked unavailable. Next availability ${availabilityLabel}.`
                  : `${resourceLabel} marked unavailable.`,
                source: "Callout",
              };
              noteText = noteEntry.text;
            } else if (nextTaskStatus && nextTaskStatus.includes("AWI")) {
              noteEntry = {
                ts: timestamp,
                status: outcome,
                text: `${resourceLabel} set to ${outcomeLabel}.`,
                source: "Callout",
              };
              noteText = noteEntry.text;
            }

            if (!calloutHistoryEntry) {
              calloutHistoryEntry = {
                taskId,
                workId: (t.workId as string | null) ?? null,
                resourceId,
                outcome,
                status: nextTaskStatus ?? null,
                availableAgainAt:
                  outcome === "Unavailable" ? availableAgainAt ?? null : null,
                note: noteText,
                timestamp,
              };
            }
          }

          return {
            ...t,
            taskStatus: nextTaskStatus,
            employeeId: resourceId,
            lastOutcome: outcome,
            availableAgainAt:
              outcome === "Unavailable" ? availableAgainAt ?? null : null,
            updatedAt: timestamp,
            history: [
              ...(t.history ?? []),
              {
                previousTaskStatus,
                previousEmployeeId,
                changedAt: timestamp,
                outcomeApplied: outcome,
                resourceIdUsed: resourceId,
                availableAgainAt:
                  outcome === "Unavailable" ? availableAgainAt ?? null : null,
              },
            ],
            progressNotes: appendProgressNote(t as TaskDetails, noteEntry),
          };
        });

      setAllRows((prev) => applyToTasks(prev));
      setRows((prev) => applyToTasks(prev));

      if (calloutHistoryEntry) {
        const outboundHistoryEntry = calloutHistoryEntry as Omit<
          CalloutHistoryEntry,
          "id"
        >;
        const entry: CalloutHistoryEntry = {
          id: `SESSION-${resourceId}-${Date.now()}`,
          ...outboundHistoryEntry,
        };
        appendCalloutHistory(entry);
      }
    },
    [appendCalloutHistory]
  );

  // External panel expand handlers
  const handleExternalToggleSection = useCallback(
    (section: string) => {
      setExternalExpandedSections((prev: string[]) =>
        prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
      );
    },
    [setExternalExpandedSections]
  );

  const handleExternalExpandAll = useCallback(() => {
    setExternalExpandedSections(ALL_TASK_SECTIONS);
  }, [setExternalExpandedSections]);

  const handleExternalCollapseAll = useCallback(() => {
    setExternalExpandedSections([]);
  }, [setExternalExpandedSections]);

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div
      className="overflow-hidden bg-[#F5F7FA] text-gray-900 font-inter relative w-full"
      style={{
        height: `calc(var(--vh, 1vh) * 100 / ${uiScale})`,
        width: `${100 / uiScale}vw`,
        transform: `scale(${uiScale})`,
        transformOrigin: "top left",
      }}
    >
      <Toaster position="top-center" />

      {/* SIDEBAR */}
      <Sidebar currentMenu={currentMenu} onMenuClick={handleMenuClick} />

      {/* MAIN */}
      <main className="flex flex-col flex-1 min-w-0 h-full">
        <Header
          currentMenu={currentMenu}
          windowWidth={windowWidth}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          globalResults={globalResults}
          showDropdown={showDropdown}
          setShowDropdown={setShowDropdown}
          onSelectResult={handleHeaderSelectResult}
          onToggleSidebar={() =>
            window.dispatchEvent(new CustomEvent("toggleSidebar"))
          }
        />

        {/* PAGE BODY */}
        <div className="flex-1 min-h-0 bg-white flex flex-col">
          {/* TASK MANAGEMENT PAGE */}
          {activeSubPage === "TaskManagement" && (
            <section className="p-8 space-y-5">
              <TaskSearchCard
                onSearch={handleSearch}
                onClear={handleClear}
                onCopy={handleCopyAll}
                onExport={handleExportCSV}
                canCopy={canCopy}
              />

              {!dataLoaded ? (
                <div className="p-10 text-center text-gray-500">
                  Loading task data...
                </div>
              ) : rows.length > 0 ? (
                <TaskTable_Advanced
                  rows={rows}
                  headerNames={headerNames}
                  onOpenPopout={handleOpenPopout}
                  onOpenCalloutIncident={handleOpenCalloutIncident}
                />
              ) : (
                <div className="p-10 text-center text-gray-500 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                  No tasks loaded yet. Please apply filters and press{" "}
                  <b>Search</b>.
                </div>
              )}
            </section>
          )}

          {/* NEW PAGE: SCHEDULE LIVE */}
          {activeSubPage === "ScheduleLive" && <ScheduleLivePage />}

          {/* DEFAULT HOMEPAGE (cards grid) */}
          {!activeSubPage && (
            <MainContent
              currentMenu={currentMenu}
              filteredItems={cards}
              windowWidth={windowWidth}
              onCardClick={handleCardClick}
            />
          )}
        </div>
      </main>

      {/* ---------------------------------------------------------
    CALLOUT LANDING PAGE (NEW)
---------------------------------------------------------- */}

      {calloutLandingOpen && (
        <CalloutLandingPage
          allResources={resources}
          calloutGroups={calloutGroups} // << DYNAMIC LIST HERE
          onStart={(group: string) => {
            // auto-load all resources belonging to that group
            const list = resources.filter((r) => r.calloutGroup === group);
            const mainList = list.slice(0, 6);

            setSelectedCalloutResources(mainList);
            setSelectedCalloutGroup(group);
            setCalloutLandingOpen(false);
            setIncidentOpen(true);
          }}
        />
      )}

      {/* ---------------------------------------------------------
    CALLOUT INCIDENT PANEL (UPDATED)
--------------------------------------------------------- */}
      <CalloutIncidentPanel
        open={incidentOpen}
        task={incidentTask}
        resources={resources}
        primaryResourceIds={selectedCalloutResources.map((r) => r.resourceId)}
        selectedGroup={selectedCalloutGroup}
        onOpenResourcePopout={handleOpenResourcePopout}
        onClose={() => {
          setIncidentOpen(false);
          setSelectedCalloutResources([]);
          setSelectedCalloutGroup(null);
        }}
        history={calloutHistory}
        historyLoading={calloutHistoryLoading}
        historyError={calloutHistoryError}
        onRefreshHistory={refreshCalloutHistory}
        onSaveRow={handleCalloutRowSave}
      />

      {/* EXTERNAL WINDOW PORTAL */}
      {externalContainer &&
        externalTasks &&
        externalTasks.length > 0 &&
        createPortal(
          <TaskPopoutPanel
            open={true}
            tasks={externalTasks}
            expanded={externalExpandedSections}
            onToggleSection={handleExternalToggleSection}
            onExpandAll={handleExternalExpandAll}
            onCollapseAll={handleExternalCollapseAll}
            onClose={closeExternalWindow}
          />,
          externalContainer
        )}
    </div>
  );
}
