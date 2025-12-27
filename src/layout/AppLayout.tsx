import React, { useState, useEffect, useCallback, useMemo, memo, lazy, Suspense } from "react";
import { createPortal } from 'react-dom';
import {
  AppBar,
  Avatar,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Paper,
  Stack,
  Toolbar,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import mockTasks from "@/data/mockTasks.json";
import ResourceMock from "@/data/ResourceMock.json";
const ScheduleLivePage = lazy(() => import("@/schedule/scheduleLive - Page"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));

import {
  CalloutOutcome,
  CalloutOutcomeConfig,
  ResourceRecord,
} from '@/types';
import { Step1 } from "@/Callout Component/Step 1 - Select Group";
import { Step2 } from "@/Callout Component/Step 2 - Save outcome";
import { sharedStyles } from "@/Callout Component/sharedStyles";

import Menu from '@mui/icons-material/Menu';
import Folder from '@mui/icons-material/Folder';
import ClipboardList from '@mui/icons-material/ListAlt';
import Settings from '@mui/icons-material/Settings';
import ListChecks from '@mui/icons-material/ListAlt';
import AlertTriangle from '@mui/icons-material/WarningAmber';
import Users from '@mui/icons-material/People';
import User from '@mui/icons-material/Person';
import UserCog from '@mui/icons-material/AdminPanelSettings';
import Globe from '@mui/icons-material/Public';
import Calendar from '@mui/icons-material/CalendarMonth';
import Cog from '@mui/icons-material/Build';
import Engineering from '@mui/icons-material/Engineering';
import TaskPopoutPanel from "@/Task Resource Components/New Window/Task Popout Panel - Component";
import ProgressTasksDialog from '@/Task Resource Components/New Window/Progress Task - Component';
import TaskSearchCard from '@/tasks/TaskSearchCardClean';
import TaskTableAdvanced from '@/tasks/TaskTableAdvanced';
import { useAppSnackbar } from '@/shared-ui/SnackbarProvider';
import AppButton from '@/shared-ui/button';
import { Sidebar as SidebarNavigation } from '@/layout/SidebarNavigation';
import { cardMap } from "@/layout/menuRegistry";
import { TaskDetails, ProgressNoteEntry } from "@/types";
import { useExternalWindow } from "@/hooks/useExternalWindow";
import { useCalloutHistory } from "@/Callout Component/useCalloutHistory";
import { filterTasks } from "@/hooks/useTaskFilters";
import type { CalloutHistoryEntry } from "@/Callout Component/useCalloutHistory";

/* ========================================================= */
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

// motion-backed Card removed; use plain Card with hover styles instead

/* =========================================================
   HELPERS
========================================================= */

function buildClipboardHtml(
  headerKeys: string[],
  rows: Record<string, any>[]
): string {
  return `
    <table border="1" cellpadding="4" cellspacing="0">
      <thead><tr>${headerKeys.map((h) => `<th>${headerNames[h]}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${headerKeys.map((h) => `<td>${r[h] ?? ""}</td>`).join("")}</tr>`).join("")}</tbody>
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
  onToggleSidebar: () => void;
  overrideTitle?: string | null;
  whiteBackground?: boolean;
}

/* =========================================================
   HEADER COMPONENT (memoized) — Updated White Toolbar
========================================================= */

const Header: React.FC<HeaderProps> = memo(
  ({
    currentMenu,
    windowWidth,
    onToggleSidebar,
    overrideTitle,
    whiteBackground = false,
  }) => {
    const theme = useTheme();
    const displayLabel = useMemo(() => {
      if (overrideTitle) return overrideTitle;
      if (!currentMenu?.label) return "Dashboard";
      if (windowWidth < 950) {
        return currentMenu.label.split(" ")[0];
      }
      return currentMenu.label;
    }, [currentMenu, windowWidth]);

    return (
      <AppBar
        position="sticky"
        color={whiteBackground ? "default" : "primary"}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          boxShadow: whiteBackground ? "0 4px 10px rgba(2,6,23,0.06)" : "0 18px 35px rgba(0,0,0,0.22)",
          backgroundColor: whiteBackground ? theme.palette.background.paper : undefined,
          "&::after": whiteBackground
            ? undefined
            : {
                content: '""',
                position: "absolute",
                left: 0,
                right: 0,
                bottom: -10,
                height: 10,
                background: `linear-gradient(to bottom, ${alpha(
                  theme.palette.common.black,
                  0.18
                )}, transparent)`,
                pointerEvents: "none",
              },
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: 70,
            px: { xs: 2, sm: 3 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              edge="start"
              onClick={onToggleSidebar}
              sx={{
                width: theme.spacing(5.5), // 44px
                height: theme.spacing(5.5),
                borderRadius: 2,
                color: theme.palette.common.white,
              }}
            >
              <Menu sx={{ fontSize: 26 }} />
            </IconButton>

            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                letterSpacing: 0.2,
                display: { xs: "none", sm: "block" },
              }}
            >
              {displayLabel}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Avatar
              sx={{
                width: theme.spacing(5.25), // 42px
                height: theme.spacing(5.25),
                bgcolor: alpha(theme.palette.common.black, 0.85),
                border: `1px solid ${alpha(theme.palette.common.white, 0.25)}`,
                boxShadow: '0px 0px 0px 2px rgba(255,255,255,0.08)',
              }}
            >
              <User sx={{ fontSize: 20, color: "#FFFFFF" }} />
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>
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
    const theme = useTheme();
    const shortLabel = currentMenu?.label?.split(" ")[0] ?? "Dashboard";

    return (
      <Box
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', md: '1200px' },
          mx: 'auto',
          px: { xs: 3, sm: 6, md: 8 },
          py: { xs: 6, md: 8 },
        }}
      >
        <Box textAlign="center" mb={6}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              mb: 1.5,
            }}
          >
            {React.createElement(currentMenu?.icon || Folder, {
              size: 32,
              color: theme.palette.primary.main,
            })}
            <Typography component="h1" variant="h4" fontWeight={700}>
              {windowWidth < 950 ? shortLabel : currentMenu?.label}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {currentMenu?.label
              ? `${currentMenu.label} Overview`
              : "Overview of your workspace"}
          </Typography>
        </Box>

        <Box key={currentMenu?.label || "default"}>
          <Grid container spacing={{ xs: 3, md: 4 }} justifyContent="center">
            {filteredItems.length ? (
              filteredItems.map((item: any, idx: number) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Card
                    elevation={3}
                    sx={{ transition: 'transform .2s', '&:hover': { transform: 'scale(1.02)' } }}
                  >
                    <CardActionArea onClick={() => onCardClick(item)}>
                      <CardContent
                        sx={{
                          minHeight: 150,
                          display: "flex",
                          flexDirection: "column",
                          gap: 1.5,
                          textAlign: "center",
                          px: 4,
                          py: 3,
                        }}
                      >
                        <Typography variant="h6" fontWeight={600}>
                          {item.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.description}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Paper
                  variant="outlined"
                  sx={{
                    py: 8,
                    textAlign: "center",
                    color: "text.secondary",
                  }}
                >
                  <Typography variant="body2">No results found.</Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      </Box>
    );
  }
);

MainContent.displayName = "MainContent";

/* =========================================================
   MAIN APP CONTAINER
========================================================= */

export default function MainLayout() {
  const theme = useTheme();
  const snackbar = useAppSnackbar();
  /* ---------------------- Menu & layout ---------------------- */
  const defaultMenu = "Operation Toolkit";

  const [currentMenu, setCurrentMenu] = useState<any>({
    label: defaultMenu,
    icon: iconMap[defaultMenu] || Folder,
  });

  const [cards, setCards] = useState<any[]>(cardMap[defaultMenu] || []);
  const [activeSubPage, setActiveSubPage] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Record<string, any>[]>([]);

  const [searchQuery, setSearchQuery] = useState("");

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  /* ---------------------- Data ---------------------- */
  const [allRows, setAllRows] = useState<Record<string, any>[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Resources for callout
  const [resources, setResources] = useState<ResourceRecord[]>([]);

  // AUTO-GENERATE callout groups from resource dataset
  const calloutGroups = useMemo(() => {
    const groups = resources
      .map((r) => r.calloutGroup)
      .filter((g): g is string => Boolean(g)); // remove null/undefined

    return Array.from(new Set(groups)).sort(); // unique + alphabetical
  }, [resources]);

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
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [progressTasks, setProgressTasks] = useState<Record<string, any>[]>([]);
  const [targetStatus, setTargetStatus] = useState<string>('Completed');
  const [targetResourceId, setTargetResourceId] = useState<string>('');
  const [progressNote, setProgressNote] = useState<string>('');
  const [progressSaving, setProgressSaving] = useState<boolean>(false);
  // Inline popout state
  useEffect(() => {
    return () => closeExternalWindow();
  }, [closeExternalWindow]);

  // Legacy global context scrapers removed — rely on DataGrid's per-table context handlers.
  useEffect(() => {
    // listen for programmatic action events from anchored menus (e.g., SearchCard Actions)
    const openPopout = (ev: Event) => {
      try {
        const custom = ev as CustomEvent<any>;
        const tasks = custom.detail?.tasks ?? null;
        if (!tasks || !tasks.length) return;
        // open in external window centered
        const coordsX = window.innerWidth / 2;
        const coordsY = window.innerHeight / 2;
        openExternalWindow(tasks, coordsX, coordsY);
      } catch {}
    };

    const openCallout = (ev: Event) => {
      try {
        const custom = ev as CustomEvent<any>;
        const task = custom.detail?.task ?? null;
        if (!task) return;
        handleOpenCalloutIncident(task);
      } catch {}
    };

    window.addEventListener('taskforce:open-popout', openPopout as EventListener);
    window.addEventListener('taskforce:open-callout-incident', openCallout as EventListener);
    // copy/export handled via Actions menu removed — keep only open-popout/open-callout handlers
    return () => {
      window.removeEventListener('taskforce:open-popout', openPopout as EventListener);
      window.removeEventListener('taskforce:open-callout-incident', openCallout as EventListener);
    };
  }, []);
  

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

  // Open Progress Tasks dialog programmatically (used by Actions menu)
  const openProgressTasks = useCallback((tasks: any[]) => {
    if (!tasks || !tasks.length) {
      snackbar.error('No tasks selected');
      return;
    }
    setProgressTasks(tasks);
    setProgressDialogOpen(true);
  }, []);

  // Listen for progress-tasks events fired by Actions menu or row menu (backwards compatibility)
  useEffect(() => {
    const handler = (ev: Event) => {
      try {
        const custom = ev as CustomEvent<any>;
        openProgressTasks(custom.detail?.tasks ?? []);
      } catch {}
    };

    window.addEventListener('taskforce:progress-tasks', handler as EventListener);
    return () => window.removeEventListener('taskforce:progress-tasks', handler as EventListener);
  }, [openProgressTasks]);

  useEffect(() => {
    const handleTasksProgressed = (event: Event) => {
      const custom = event as CustomEvent<{
        items?: Array<{
          taskId: string;
          previousStatus?: string;
          nextStatus?: string;
          note: string;
          timestamp: string;
        }>;
      }>;

      const updates = custom.detail?.items ?? [];
      if (!updates.length) return;

      const updateMap = new Map<string, (typeof updates)[number]>();
      for (const update of updates) {
        if (!update?.taskId) continue;
        updateMap.set(String(update.taskId), update);
      }

      if (!updateMap.size) return;

      const appendQuickNote = (
        task: Record<string, any>,
        update: (typeof updates)[number]
      ): ProgressNoteEntry[] => {
        const entry: ProgressNoteEntry = {
          ts: update.timestamp,
          status: update.nextStatus || update.previousStatus || "Updated",
          text: update.note,
          source: "Quick Progress",
        };

        const existing = task.progressNotes;

        if (Array.isArray(existing)) {
          return [...existing, entry];
        }

        if (typeof existing === "string" && existing.trim()) {
          return [
            {
              ts:
                (task.taskCreated as string | undefined) ??
                update.timestamp,
              status: task.taskStatus ?? task.status ?? "",
              text: existing.trim(),
              source: "Imported",
            },
            entry,
          ];
        }

        return [entry];
      };

      const applyUpdates = (list: Record<string, any>[]) =>
        list.map((task) => {
          const rawId =
            task?.taskId ??
            task?.TaskID ??
            task?.TaskId ??
            task?.id ??
            task?.ID ??
            task?.Id ??
            null;

          if (rawId == null) return task;

          const match = updateMap.get(String(rawId));
          if (!match) return task;

          const nextStatus = match.nextStatus || task.taskStatus || task.status;

          return {
            ...task,
            taskStatus: nextStatus,
            lastProgression: nextStatus || task.lastProgression,
            updatedAt: match.timestamp,
            progressNotes: appendQuickNote(task, match),
          };
        });

      setAllRows((prev) => applyUpdates(prev));
      setRows((prev) => applyUpdates(prev));
    };

    document.addEventListener(
      "taskforce:tasks-progressed",
      handleTasksProgressed as EventListener
    );

    return () => {
      document.removeEventListener(
        "taskforce:tasks-progressed",
        handleTasksProgressed as EventListener
      );
    };
  }, [setAllRows, setRows]);

  // CALLOUT LANDING (NEW)
  const [calloutLandingOpen, setCalloutLandingOpen] = useState(false);
  const [selectedCalloutResources, setSelectedCalloutResources] = useState<
    ResourceRecord[]
  >([]);
  const [selectedCalloutGroup, setSelectedCalloutGroup] = useState<string | null>(
    null
  );
  // States for callout landing steps
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [isStarting, setIsStarting] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  const resourceCountByGroup = useMemo(() => {
    const countMap = new Map<string, number>();
    for (const resource of resources) {
      const key = resource.calloutGroup ?? "";
      if (!key) continue;
      countMap.set(key, (countMap.get(key) ?? 0) + 1);
    }
    return countMap;
  }, [resources]);

  const handleGroupSelect = useCallback((newValue: string | null) => {
    const next = newValue ?? "";
    if (!next) return;

    setSelectedGroup(next);
    setQuery(next);
    setCurrentStep(2); // Move to confirmation step
  }, []);

  const handleBack = useCallback(() => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else {
      setCalloutLandingOpen(false);
      setSelectedCalloutResources([]);
      setSelectedCalloutGroup(null);
      setSelectedGroup("");
      setQuery("");
      setIsStarting(false);
      setCurrentStep(1);
    }
  }, [currentStep]);

  const handleStartCallout = useCallback(async () => {
    if (!selectedGroup) return;

    setIsStarting(true);

    // Brief delay to show starting feedback before proceeding
    setTimeout(() => {
      // auto-load all resources belonging to that group
      const list = resources.filter((r) => r.calloutGroup === selectedGroup);
      const mainList = list.slice(0, 6);

      setSelectedCalloutResources(mainList);
      setSelectedCalloutGroup(selectedGroup);
      setCalloutLandingOpen(false);
      setIncidentOpen(true);
      // Reset states
      setSelectedGroup("");
      setQuery("");
      setIsStarting(false);
      setCurrentStep(1);
    }, 800);
  }, [selectedGroup, resources]);

  const {
    history: calloutHistory,
    refresh: refreshCalloutHistory,
    appendLocal: appendCalloutHistory,
  } = useCalloutHistory();

  const handleOpenCalloutIncident = useCallback((task: Record<string, any>) => {
    // First show the landing page to select callout configuration
    setIncidentTask(task);
    setCalloutLandingOpen(true);
    setIncidentOpen(false);
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
    } catch {
      snackbar.error("Error loading resource data.");
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
      setVh();

      // Compute a conservative UI scale based on height so smaller viewports
      // get a denser/compact UI automatically. Clamp between 0.75 and 1.
      const h = window.innerHeight;
      const computed = Math.max(0.75, Math.min(1, h / 900));
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
    document.documentElement.style.setProperty("--ui-scale", String(initScale));
    const initFont = Math.max(13, Math.min(16, Math.round(h0 / 60)));
    document.documentElement.style.fontSize = `${initFont}px`;

    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    const computeTop = () => {
      try {
        const el = document.querySelector('.MuiAppBar-root') as HTMLElement | null;
        if (el) {
          // toastTop was unused, removed rect calculation and setToastTop calls
          return;
        }
      } catch {}
      // Default toast top position was 72px
    };
    computeTop();
    window.addEventListener('resize', computeTop);
    return () => window.removeEventListener('resize', computeTop);
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
      return;
    }

    // Note: globalResults and showDropdown were unused, removed
    // Filtering logic was here but results were never used
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
  }, []);

  const handleCardClick = useCallback((item: any) => {
    if (item.name === "Task Management") {
      setActiveSubPage("TaskManagement");
      setRows([]);
    }

    if (item.name === "Schedule Live") {
      setActiveSubPage("ScheduleLive"); // ⭐ NEW PAGE ID
    }

    if (item.name === "System Preferences") {
      setActiveSubPage("Settings");
    }
  }, []);

  const handleSearch = useCallback(
    (filters: Record<string, any>) => {
      if (!dataLoaded) {
        snackbar.error("Data not loaded yet.");
        return;
      }

      const filtered = filterTasks(allRows, filters);

      if (filtered.length === 0) {
        setRows([]);
        snackbar.error("No matching tasks found.");
        return;
      }

      setRows(filtered);
    },
    [allRows, dataLoaded]
  );

  const handleClear = useCallback(() => {
    setRows([]);
    snackbar.info("Filters cleared.");
  }, []);

  const canCopy = rows.length > 0;

  const handleCopyAll = useCallback(async () => {
    if (!canCopy) {
      snackbar.error("No data to copy.");
      return;
    }

    const headers = Object.keys(headerNames);
    const html = buildClipboardHtml(headers, rows);
    await navigator.clipboard.writeText(html);
    snackbar.success("Copied");
  }, [rows, canCopy]);

  const handleExportCSV = useCallback(() => {
    if (!canCopy) {
      snackbar.error("No data to export.");
      return;
    }

    const headers = Object.keys(headerNames);
    const csv = buildCSV(headers, rows);

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "FilteredTasks.csv";
    link.click();

    snackbar.success("Exported");
  }, [rows, canCopy]);

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

  const handleOpenIncidentTaskPopout = useCallback(() => {
    if (!incidentTask) return;

    const coordsX = window.innerWidth / 2;
    const coordsY = window.innerHeight / 2;
    openExternalWindow([incidentTask as TaskDetails], coordsX, coordsY);
  }, [incidentTask, openExternalWindow]);

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
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        bgcolor: "background.default",
        color: "text.primary",
        fontFamily:
          '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        width: "100%",
        height: "100vh",
        minHeight: 0,
        minWidth: 0,
        display: "flex",
        flexDirection: "row",
        overflowX: "hidden",
      }}
    >
      {/* Snackbar provided at app root via AppSnackbarProvider */}

      {/* SIDEBAR */}
        <SidebarNavigation
        currentMenu={currentMenu}
        onMenuClick={handleMenuClick}
        activeSubPage={activeSubPage}
        />

      {/* MAIN */}
      <Box
        component="main"
        sx={{
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          height: "100%",
          width: "100%",
        }}
      >
        <Header
          currentMenu={currentMenu}
          windowWidth={windowWidth}
          onToggleSidebar={() =>
            window.dispatchEvent(new CustomEvent("toggleSidebar"))
          }
        />

        {/* PAGE BODY */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            bgcolor: "background.paper",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* TASK MANAGEMENT PAGE */}
          {activeSubPage === "TaskManagement" && (
            <Box
              component="section"
              sx={{
                py: { xs: 3, md: 5 },
                px: { xs: 2, md: 4 },
                display: "flex",
                flexDirection: "column",
                gap: 0,
              }}
            >
              <TaskSearchCard
                onSearch={handleSearch}
                onClear={handleClear}
                onCopy={handleCopyAll}
                onExport={handleExportCSV}
                canCopy={canCopy}
                hasResults={rows.length > 0}
                selectedRows={selectedRows}
                onOpenPopout={(tasks: any[]) => {
                  if (!tasks || !tasks.length) return;
                  const coordsX = window.innerWidth / 2;
                  const coordsY = window.innerHeight / 2;
                  handleOpenPopout(tasks, coordsX, coordsY);
                }}
                onProgressTasks={(tasks: any[]) => openProgressTasks(tasks)}
                onProgressNotes={(tasks: any[]) => window.dispatchEvent(new CustomEvent('taskforce:progress-notes', { detail: { tasks } }))}
                onOpenCalloutIncident={(task: any) => handleOpenCalloutIncident(task)}
              />

              {!dataLoaded ? (
                <Paper
                  variant="outlined"
                  sx={{ p: 6, textAlign: "center", color: "text.secondary" }}
                >
                  <Typography variant="body2">Loading task data...</Typography>
                </Paper>
              ) : rows.length > 0 ? (
                <TaskTableAdvanced
                  rows={rows}
                  headerNames={headerNames}
                  onOpenPopout={handleOpenPopout}
                  onOpenCalloutIncident={handleOpenCalloutIncident}
                  onProgressTasks={(tasks: any[]) => openProgressTasks(tasks)}
                  onProgressNotes={(tasks: any[]) => window.dispatchEvent(new CustomEvent('taskforce:progress-notes', { detail: { tasks } }))}
                  onSelectionChange={(rows: Record<string, any>[]) => {
                    setSelectedRows(rows);
                  }}
                  sx={{ borderRadius: '0 0 12px 12px', mt: 0 }}
                />
              ) : (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 6,
                    textAlign: "center",
                    borderStyle: "dashed",
                    borderColor: "divider",
                    bgcolor: "background.default",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No tasks loaded yet. Please apply filters and press <b>Search</b>.
                  </Typography>
                </Paper>
              )}
            </Box>
          )}

          {/* NEW PAGE: SCHEDULE LIVE */}
          {activeSubPage === "ScheduleLive" && (
            <Suspense fallback={<div>Loading...</div>}>
              <ScheduleLivePage />
            </Suspense>
          )}

          {/* NEW PAGE: SETTINGS */}
          {activeSubPage === "Settings" && (
            <Suspense fallback={<div>Loading...</div>}>
              <SettingsPage />
            </Suspense>
          )}

          {/* DEFAULT HOMEPAGE (cards grid) */}
          {!activeSubPage && (
                  <MainContent
                    currentMenu={currentMenu}
                    filteredItems={cards}
                    windowWidth={windowWidth}
                    onCardClick={handleCardClick}
                  />
          )}
        </Box>
      </Box>

      {/* ---------------------------------------------------------
    CALLOUT LANDING PAGE (NEW)
---------------------------------------------------------- */}

      {calloutLandingOpen && (
        <Dialog open fullWidth maxWidth="lg" onClose={handleBack} PaperProps={{
          sx: {
            width: '100%',
            maxWidth: { xs: '95%', sm: '90%', md: theme.spacing(140) },
            mx: 2,
            borderRadius: 3,
            p: { xs: 2, md: 3 },
            border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
            boxShadow: 'none',
            backgroundImage: 'none',
          }
        }}>
          <DialogTitle sx={{ px: { xs: 2, md: 4 }, py: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  height: theme.spacing(4.5),
                  width: theme.spacing(4.5),
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.primary.main,
                  color: theme.palette.mode === 'dark' ? theme.palette.common.black : theme.palette.primary.contrastText,
                }}
              >
                <Engineering sx={{ fontSize: 18 }} />
              </Box>

              <Stack spacing={0.5}>
                <Typography variant="h6" fontWeight={600} color="text.primary">
                  {currentStep === 1 ? 'Select Callout Group' : 'Confirm Callout Start'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Step {currentStep} of 2: {currentStep === 1 ? 'Choose the callout group to begin the resource allocation workflow.' : 'Review your selection and start the callout process.'}
                </Typography>
              </Stack>
            </Stack>
          </DialogTitle>

          <DialogContent dividers sx={{ px: { xs: 2, md: 4 }, py: { xs: 2, md: 3 } }}>
            {currentStep === 1 ? (
              <Step1
                task={incidentTask}
                calloutGroups={calloutGroups}
                resourceCountByGroup={resourceCountByGroup}
                selectedGroup={selectedGroup}
                query={query}
                isStarting={isStarting}
                onQueryChange={setQuery}
                onGroupSelect={handleGroupSelect}
              />
            ) : (
              <Step2
                selectedGroup={selectedGroup}
                resourceCountByGroup={resourceCountByGroup}
                isStarting={isStarting}
              />
            )}
          </DialogContent>

          <DialogActions sx={{ px: { xs: 2, md: 4 }, py: 2, justifyContent: 'space-between' }}>
            <AppButton
              onClick={handleBack}
              variant="outlined"
              disabled={isStarting}
              sx={{ minWidth: 100 }}
            >
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </AppButton>

            {currentStep === 1 ? (
              <AppButton
                onClick={() => setCurrentStep(2)}
                variant="contained"
                disabled={!selectedGroup}
                sx={{ minWidth: 140 }}
              >
                Next
              </AppButton>
            ) : (
              <AppButton
                onClick={handleStartCallout}
                variant="contained"
                disabled={!selectedGroup || isStarting}
                sx={{ minWidth: 140 }}
              >
                {isStarting ? 'Starting...' : 'Start Callout'}
              </AppButton>
            )}
          </DialogActions>
        </Dialog>
      )}

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

      {/* Global DOM-scraped row menu removed; rely on per-table context menus from DataGrid */}
      <ProgressTasksDialog
        open={progressDialogOpen}
        preview={progressTasks.map((t) => ({ id: String(t.taskId ?? t.id ?? t.TaskID ?? ''), currentStatus: t.taskStatus ?? t.status ?? '', nextStatus: targetStatus }))}
        tasksCount={progressTasks.length}
        targetStatus={targetStatus}
        setTargetStatus={(s) => setTargetStatus(s)}
        targetResourceId={targetResourceId}
        setTargetResourceId={(s) => setTargetResourceId(s)}
        progressNote={progressNote}
        setProgressNote={(s) => setProgressNote(s)}
        onClose={() => { setProgressDialogOpen(false); setProgressTasks([]); setProgressNote(''); }}
        progressSaving={progressSaving}
        onSave={async () => {
          try {
            setProgressSaving(true);
            const items = progressTasks.map((t) => ({
              taskId: t.taskId ?? t.id ?? t.TaskID ?? null,
              previousStatus: t.taskStatus ?? t.status ?? null,
              nextStatus: targetStatus,
              note: progressNote || '',
              timestamp: new Date().toISOString(),
            }));
            // simulate save
            window.dispatchEvent(new CustomEvent('taskforce:tasks-progressed', { detail: { items } }));
            snackbar.success(`Progressed ${items.length} task${items.length>1 ? 's' : ''}`);
            setProgressDialogOpen(false);
            setProgressTasks([]);
            setProgressNote('');
          } catch {
            snackbar.error('Progress failed');
          } finally {
            setProgressSaving(false);
          }
        }}
        coreStatuses={['Assigned','In Progress','Completed']}
        additionalStatuses={['Escalated','Cancelled']}
      />
    </Box>
  );
}
