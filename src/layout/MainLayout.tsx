import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AppBar,
  Avatar,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Fade,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  TextField,
  Toolbar,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { CalloutLandingPage } from "@/callout/CalloutLandingPage";
import mockTasks from "@/data/mockTasks.json";
import ResourceMock from "@/data/ResourceMock.json";
import ScheduleLivePage from "@/schedule/ScheduleLivePage";
import {
  CalloutIncidentPanel,
  CalloutOutcome,
  CalloutOutcomeConfig,
  ResourceRecord,
} from "@/callout/CalloutIncidentPanel";
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
import { toast } from "react-hot-toast";
import { createPortal } from "react-dom";

import { SidebarNavigation as Sidebar } from "./SidebarNavigation";
import TaskSearchCard from "@/tasks/TaskSearchCardClean";
import TaskTableAdvanced from "@/tasks/TaskTableAdvanced";
import TaskPopoutPanel from "@/tasks/TaskPopoutPanel";

import { cardMap } from "@/shared-config/menuRegistry";
import { TaskDetails, ProgressNoteEntry } from "@/types";
import { useExternalWindow } from "@/hooks/useExternalWindow";
import { useCalloutHistory } from "@/hooks/useCalloutHistory";
import type { CalloutHistoryEntry } from "@/hooks/useCalloutHistory";

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

const MotionCard = motion(Card);

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
    searchQuery,
    setSearchQuery,
    globalResults,
    showDropdown,
    setShowDropdown,
    onSelectResult,
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
                bgcolor: whiteBackground ? alpha(theme.palette.text.primary, 0.06) : alpha(theme.palette.common.white, 0.12),
                color: whiteBackground ? theme.palette.text.primary : theme.palette.common.white,
                '&:hover': {
                  bgcolor: whiteBackground ? alpha(theme.palette.text.primary, 0.08) : alpha(theme.palette.common.white, 0.2),
                },
              }}
            >
              <Menu size={26} strokeWidth={3} />
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
            <Box sx={{ position: "relative", minWidth: { xs: theme.spacing(20), sm: theme.spacing(24) } }}>
              <TextField
                value={searchQuery}
                size="small"
                onChange={(event) => setSearchQuery(event.target.value)}
                onFocus={() => setShowDropdown(globalResults.length > 0)}
                placeholder="Search anywhere..."
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search
                        size={18}
                        color={whiteBackground ? alpha(theme.palette.text.primary, 0.45) : alpha(theme.palette.common.white, 0.75)}
                      />
                    </InputAdornment>
                  ),
                  sx: {
                    color: whiteBackground ? theme.palette.text.primary : theme.palette.common.white,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: whiteBackground ? alpha(theme.palette.text.primary, 0.12) : alpha(theme.palette.common.white, 0.3),
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: whiteBackground ? alpha(theme.palette.text.primary, 0.2) : alpha(theme.palette.common.white, 0.5),
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: whiteBackground ? alpha(theme.palette.primary.main, 0.32) : alpha(theme.palette.common.white, 0.6),
                    },
                    "& input::placeholder": {
                      color: whiteBackground ? alpha(theme.palette.text.primary, 0.45) : alpha(theme.palette.common.white, 0.7),
                    },
                    backgroundColor: whiteBackground ? alpha(theme.palette.background.paper, 0.92) : alpha(theme.palette.common.white, 0.1),
                    borderRadius: 2,
                  },
                }}
                sx={{
                  width: { xs: 210, sm: 260 },
                }}
              />

              <Fade in={showDropdown && globalResults.length > 0} timeout={120} unmountOnExit>
                <Paper
                  elevation={8}
                  sx={{
                    position: "absolute",
                    right: 0,
                    left: 0,
                    mt: 1,
                    borderRadius: 2,
                    overflow: "hidden",
                    zIndex: theme.zIndex.tooltip,
                  }}
                >
                  <List dense disablePadding>
                    {globalResults.map((item: any, idx: number) => (
                      <ListItemButton
                        key={idx}
                        onMouseDown={() => onSelectResult(item)}
                        sx={{ alignItems: "flex-start" }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" fontWeight={600}>
                              {item.name}
                            </Typography>
                          }
                          secondary={
                            <Typography
                              component="span"
                              variant="caption"
                              sx={{ color: "text.secondary" }}
                            >
                              {item.category}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Paper>
              </Fade>
            </Box>

            <Avatar
              sx={{
                width: theme.spacing(5.25), // 42px
                height: theme.spacing(5.25),
                bgcolor: alpha(theme.palette.common.black, 0.85),
                border: `1px solid ${alpha(theme.palette.common.white, 0.25)}`,
                boxShadow: '0px 0px 0px 2px rgba(255,255,255,0.08)',
              }}
            >
              <Users size={18} color="#FFFFFF" />
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

        <AnimatePresence mode="wait">
          <motion.div
            key={currentMenu?.label || "default"}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <Grid container spacing={{ xs: 3, md: 4 }} justifyContent="center">
              {filteredItems.length ? (
                filteredItems.map((item: any, idx: number) => (
                  <Grid item xs={12} sm={6} md={4} key={idx}>
                    <MotionCard
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                      elevation={3}
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
                    </MotionCard>
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
          </motion.div>
        </AnimatePresence>
      </Box>
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
  const [selectedRows, setSelectedRows] = useState<Record<string, any>[]>([]);
  

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
      {/* Global Toaster provided by AppLayout */}

      {/* SIDEBAR */}
      <Sidebar
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
        }}
      >
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
          overrideTitle={activeSubPage === "TaskManagement" ? "Task Management" : undefined}
          whiteBackground={activeSubPage === "TaskManagement"}
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
                py: { xs: 4, md: 6 },
                px: { xs: 3, md: 6 },
                display: "flex",
                flexDirection: "column",
                gap: 3,
                flex: 1,
                minHeight: 0,
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
                  onSelectionChange={(rows: Record<string, any>[]) => {
                    try { console.log('MainLayout selection:', (rows||[]).length); } catch (e) {}
                    setSelectedRows(rows);
                  }}
                  sx={{ borderRadius: '0 0 12px 12px', mt: 0, borderTop: 'none' }}
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
        </Box>
      </Box>

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
          onDismiss={() => {
            setCalloutLandingOpen(false);
            setSelectedCalloutResources([]);
            setSelectedCalloutGroup(null);
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
        onOpenTaskPopout={handleOpenIncidentTaskPopout}
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
    </Box>
  );
}
