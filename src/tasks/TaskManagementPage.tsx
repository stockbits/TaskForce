import { useState, useCallback, useEffect, useRef } from "react";
import { useAppSnackbar } from '@/shared-ui/SnackbarProvider';
import rawMockTasks from "@/Database Models/Task - Model.json";
import TaskSearchCard from "@/tasks/TaskSearchCardClean";
import TaskTableMUI from "@/shared-ui/ResponsiveTable/TaskTableMUI";
import ProgressTasksDialog, { ProgressPreview } from "@/Task Resource Components/Inline Window/Multi Task Progress - Component";
import { useExternalWindow } from "@/Custom React - Hooks/Popup window - component";
import { Box, Paper, Typography } from "@mui/material";

const mockTasks = rawMockTasks as Record<string, any>[];

const headerNames: Record<string, string> = {
  taskId: "Task ID",
  division: "Division",
  domainId: "Domain ID",
  taskStatus: "Task Status",
  employeeId: "Employee ID",
  taskType: "Task Type",
  primarySkill: "Primary Skill",
  importanceScore: "Importance Score",
  msc: "MSC",
  taskCreated: "Task Created",
  groupCode: "Group Code",
  systemType: "System Type",
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
  location: "Location",
  requester: "Requester",
};

function toCSV(headers: string[], rows: Array<Record<string, unknown>>) {
  const q = (v: unknown) => {
    const s = String(v ?? "");
    const safe = s.replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${safe}"` : safe;
  };

  const head = headers.map((h) => q(headerNames[h] || h)).join(",");
  const body = rows.map((r) => headers.map((h) => q((r as any)[h])).join(","));
  return [head, ...body].join("\n");
}

async function writeToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function TaskManagementPage() {
  const snackbar = useAppSnackbar();
    const [filteredTasks, setFilteredTasks] = useState<Record<string, any>[]>([]);
    const [selectedRows, setSelectedRows] = useState<Record<string, any>[]>([]);
    const [tableHeight, setTableHeight] = useState<number>(600);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const searchRef = useRef<HTMLDivElement | null>(null);

  const { openExternalWindow, closeExternalWindow } = useExternalWindow();

  // Progress dialog state (for batch progress / quick notes)
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [progressPreview, setProgressPreview] = useState<ProgressPreview[]>([]);
  const [progressTargetStatus, setProgressTargetStatus] = useState<string>("Pending");
  const [progressTargetResourceId, setProgressTargetResourceId] = useState<string>("");
  const [progressNote, setProgressNote] = useState<string>("");
  const [progressSaving, setProgressSaving] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [progressSuccess, setProgressSuccess] = useState<string | null>(null);

  useEffect(() => {
    return () => closeExternalWindow();
  }, [closeExternalWindow]);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current && searchRef.current) {
        const searchRect = searchRef.current.getBoundingClientRect();
        const paginationHeight = 56;
        const available =
          window.innerHeight - searchRect.bottom - paginationHeight - 24;
        const newHeight = Math.min(Math.max(220, available), 900);
        setTableHeight(newHeight);
      }
    };

    updateHeight();
    const resizeObs = new ResizeObserver(updateHeight);
    resizeObs.observe(document.body);
    window.addEventListener("resize", updateHeight);

    return () => {
      window.removeEventListener("resize", updateHeight);
      resizeObs.disconnect();
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("taskTableDensity", "compact");
    } catch {
      // ignore
    }
  }, []);

  const applyFilters = useCallback((filters: Record<string, any> = {}) => {
      try {
        const {
          taskSearch = "",
          division = [],
          domainId = [],
          taskStatuses = [],
          requester = "",
          responseCode = [],
          commitType = [],
          capabilities = [],
          jobType = "",
          scoreCondition = "",
          scoreValue = "",
          locationType = "",
          locationValue = "",
          fromDate = "",
          fromTime = "",
          toDate = "",
          toTime = "",
        } = filters;

        // Enforce search rule: Global search OR both Division and Domain
        const hasGlobal = Boolean(taskSearch.trim());
        const hasDivision = Array.isArray(division) && division.length > 0;
        const hasDomain = Array.isArray(domainId) && domainId.length > 0;
        if (!hasGlobal && !(hasDivision && hasDomain)) {
          snackbar.error("Select Division and Domain, or use Global search.");
          setFilteredTasks([]);
          return;
        }

        let filtered = [...mockTasks];

        if (taskSearch.trim()) {
          const q = taskSearch.toLowerCase();
          filtered = filtered.filter((task) =>
            [
              task.taskId,
              task.workId,
              task.estimateNumber,
              task.employeeId,
              task.resourceName,
              task.assetName,
              task.description,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(q)
          );
        }

        if (Array.isArray(division) && division.length > 0) {
          filtered = filtered.filter((t) => division.includes(t.division));
        }

        // DOMAIN ID (multi-select)
        if (Array.isArray(domainId) && domainId.length > 0) {
          const lowerSet = new Set(domainId.map((d: string) => d.toLowerCase()));
          filtered = filtered.filter((t) =>
            lowerSet.has(String(t.domain || t.domainId || "").toLowerCase())
          );
        }

        if (Array.isArray(taskStatuses) && taskStatuses.length > 0) {
          filtered = filtered.filter((t) => taskStatuses.includes(t.taskStatus));
        }

        if (requester.trim()) {
          const q = requester.toLowerCase();
          filtered = filtered.filter((t) =>
            String(t.resourceName || "").toLowerCase().includes(q)
          );
        }

        if (Array.isArray(responseCode) && responseCode.length > 0) {
          filtered = filtered.filter((t) => responseCode.includes(t.responseCode));
        }

        if (Array.isArray(commitType) && commitType.length > 0) {
          filtered = filtered.filter((t) => commitType.includes(t.commitmentType));
        }

        if (Array.isArray(capabilities) && capabilities.length > 0) {
          filtered = filtered.filter((t) => capabilities.includes(t.primarySkill));
        }

        // PWA selector (optional field)
        if (Array.isArray(filters.pwa) && filters.pwa.length > 0) {
          const pwaSet = new Set(filters.pwa.map((p: string) => p.toLowerCase()));
          filtered = filtered.filter((t) =>
            pwaSet.has(String(t.pwa || t.externalQueueId || "").toLowerCase())
          );
        }

        if (jobType.trim()) {
          const q = jobType.toLowerCase();
          filtered = filtered.filter((t) =>
            String(t.taskType || "").toLowerCase().includes(q)
          );
        }

        if (scoreValue && !isNaN(Number(scoreValue))) {
          const val = Number(scoreValue);
          if (scoreCondition === "greater") {
            filtered = filtered.filter((t) => Number(t.importanceScore) > val);
          } else if (scoreCondition === "less") {
            filtered = filtered.filter((t) => Number(t.importanceScore) < val);
          }
        }

        if (locationType && locationValue.trim()) {
          const q = locationValue.toLowerCase();
          filtered = filtered.filter((t) =>
            String(t[locationType] || "").toLowerCase().includes(q)
          );
        }

        // Date range filter
        const buildDate = (dateStr: string, timeStr: string, endOfDay = false) => {
          if (!dateStr) return null;
          if (!timeStr) return new Date(dateStr + (endOfDay ? "T23:59:59" : "T00:00:00"));
          return new Date(`${dateStr}T${timeStr}`);
        };

        const from = buildDate(fromDate, fromTime, false);
        const to = buildDate(toDate, toTime, true);
        if (from || to) {
          filtered = filtered.filter((t) => {
            const d = new Date(t.startDate || t.taskCreated);
            if (Number.isNaN(d.getTime())) return false;
            if (from && d < from) return false;
            if (to && d > to) return false;
            return true;
          });
        }

      setFilteredTasks(filtered);

      filtered.length === 0
        ? snackbar.error("No matching tasks found.")
        : snackbar.success(`Found ${filtered.length} tasks`);
    } catch (err) {
      console.error("Filter error:", err);
      snackbar.error("Error applying filters.");
    }
  }, []);

  const handleClear = useCallback(() => {
    setFilteredTasks([]);
    snackbar.info("Filters cleared.");
  }, []);

  const canCopy = filteredTasks.length > 0;

  const copyAll = useCallback(async () => {
    if (!canCopy) return snackbar.error("No results to copy.");
    const headers = Object.keys(headerNames);
    const csv = toCSV(headers, filteredTasks);
    const ok = await writeToClipboard(csv);
    if (ok) snackbar.success("Copied to clipboard!");
  }, [canCopy, filteredTasks]);

  // Open progress dialog (used by table/search actions)
  const openProgressTasks = useCallback((tasks: any[]) => {
    if (!tasks || !tasks.length) return snackbar.error("No tasks selected");
    const preview = tasks.map((t) => ({ id: String(t.taskId ?? t.workId ?? t.id ?? ""), currentStatus: t.taskStatus ?? t.status ?? null, nextStatus: null }));
    setProgressPreview(preview);
    setProgressDialogOpen(true);
    setProgressError(null);
    setProgressSuccess(null);
    setProgressNote("");
  }, []);

  const closeProgress = useCallback(() => {
    setProgressDialogOpen(false);
  }, []);

  const saveProgress = useCallback(async () => {
    try {
      setProgressSaving(true);
      // simulate save
      await new Promise((res) => setTimeout(res, 500));
      setProgressSuccess("Progress saved");
      setTimeout(() => { setProgressSaving(false); setProgressDialogOpen(false); }, 600);
    } catch {
      setProgressError("Failed to save progress");
      setProgressSaving(false);
    }
  }, []);

  // Callout handler: only allow when exactly one task selected
  const handleOpenCalloutIncident = useCallback((task: Record<string, any> | null) => {
    if (!task) return;
    // dispatch to app-level listener (AppLayout) which manages callout modal
    window.dispatchEvent(new CustomEvent('taskforce:open-callout-incident', { detail: { task } }));
  }, []);

  const exportCSV = useCallback(() => {
    if (!canCopy) return snackbar.error("No results to export.");
    const headers = Object.keys(headerNames);
    const csv = toCSV(headers, filteredTasks);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "FilteredTasks.csv";
    link.click();
    snackbar.success("Exported CSV file.");
  }, [canCopy, filteredTasks]);

  // Use DataGrid's native/client-side sorting — no parent-side sorting required

  return (
    <>
    <Box
      ref={containerRef}
      sx={{
        display: "flex",
        flexDirection: "column",
        p: 4,
        width: "100%",
        maxWidth: "100%",
        height: "100%",
        minHeight: 0,
        mx: "auto",
        gap: 3,
        overflow: "hidden",
        flex: 1,
      }}
    >
      {/* Toaster provided at Layout level */}

      <Box ref={searchRef}>
        <TaskSearchCard
          onSearch={applyFilters}
          onClear={handleClear}
          onCopy={copyAll}
          onExport={exportCSV}
          canCopy={canCopy}
          forceCollapsed={filteredTasks.length > 0}
          hasResults={filteredTasks.length > 0}
          selectedRows={selectedRows}
          onOpenPopout={(tasks) => {
            if (!tasks || !tasks.length) return;
            openExternalWindow(tasks as any, window.innerWidth / 2, window.innerHeight / 2);
          }}
          onProgressTasks={(tasks) => openProgressTasks(tasks)}
          onProgressNotes={(tasks) => openProgressTasks(tasks)}
          onOpenCalloutIncident={(task) => handleOpenCalloutIncident(task)}
        />
      </Box>

      {filteredTasks.length > 0 ? (
        <TaskTableMUI
          rows={filteredTasks}
          headerNames={headerNames}
          tableHeight={tableHeight}
          
          onOpenPopout={(tasks: any[], mX: number, mY: number) => {
            if (!tasks || tasks.length === 0) return;
            openExternalWindow(tasks as any, mX, mY);
          }}
          onSelectionChange={(rows: Record<string, any>[]) => {
            setSelectedRows(rows);
          }}
          onProgressTasks={(tasks: any[]) => openProgressTasks(tasks)}
          onProgressNotes={(tasks: any[]) => openProgressTasks(tasks)}
          onOpenCalloutIncident={(task: any) => {
            // TaskRowContextMenu already ensures single-click for clickedRow; here we validate selection
            try {
              if (!task) return;
              // if task is array (from some callers), handle accordingly
              if (Array.isArray(task)) {
                if (task.length !== 1) return snackbar.error('Callout Incident requires exactly one selected task');
                handleOpenCalloutIncident(task[0]);
              } else {
                handleOpenCalloutIncident(task);
              }
            } catch {}
          }}
          
        />
      ) : (
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 8,
            textAlign: "center",
            color: (theme) => theme.palette.text.secondary,
            flexGrow: 1,
          }}
        >
          <Typography variant="body2" sx={{ mb: 1 }}>
            No results yet
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Apply filters above to populate the table.
          </Typography>
        </Paper>
      )}
    </Box>
      <ProgressTasksDialog
        open={progressDialogOpen}
        preview={progressPreview}
        tasksCount={progressPreview.length}
        targetStatus={progressTargetStatus}
        setTargetStatus={setProgressTargetStatus}
        targetResourceId={progressTargetResourceId}
        setTargetResourceId={setProgressTargetResourceId}
        progressNote={progressNote}
        setProgressNote={setProgressNote}
        onSave={saveProgress}
        onClose={closeProgress}
        progressError={progressError}
        progressSuccess={progressSuccess}
        progressSaving={progressSaving}
        coreStatuses={["Open", "Assigned", "In Progress", "Completed"]}
        additionalStatuses={[]}
      />
      </>
    );
}
