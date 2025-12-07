import { useState, useCallback, useEffect, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import rawMockTasks from "@/data/mockTasks.json";
import TaskSearchCard from "@/features/tasks/components/TaskSearchCard";
import TaskTable_Advanced from "@/features/tasks/components/TaskTable_Advanced";

const mockTasks = rawMockTasks as Record<string, any>[];

const headerNames: Record<string, string> = {
  taskId: "Task ID",
  division: "Division",
  domainId: "Domain ID",
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
  const [filteredTasks, setFilteredTasks] = useState<Record<string, any>[]>([]);
  const [tableHeight, setTableHeight] = useState<number>(600);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current && searchRef.current) {
        const searchRect = searchRef.current.getBoundingClientRect();
        const paginationHeight = 56;
        const available =
          window.innerHeight - searchRect.bottom - paginationHeight - 24;
        const newHeight = Math.min(Math.max(350, available), 720);
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

  const applyFilters = useCallback((filters: Record<string, any> = {}) => {
      try {
        const {
          taskSearch = "",
          division = [],
          domainId = "",
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
        } = filters;

        let filtered = [...mockTasks];

        if (taskSearch.trim()) {
          const q = taskSearch.toLowerCase();
          filtered = filtered.filter((task) =>
            [
              task.taskId,
              task.workId,
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

        if (domainId.trim()) {
          const q = domainId.toLowerCase();
          filtered = filtered.filter((t) =>
            String(t.domainId || "").toLowerCase().includes(q)
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

      setFilteredTasks(filtered);

      filtered.length === 0
        ? toast.error("No matching tasks found.")
        : toast.success(`Found ${filtered.length} tasks`);
    } catch (err) {
      console.error("Filter error:", err);
      toast.error("Error applying filters.");
    }
  }, []);

  const handleClear = useCallback(() => {
    setFilteredTasks([]);
    toast("Filters cleared.", { icon: "🧹" });
  }, []);

  const canCopy = filteredTasks.length > 0;

  const copyAll = useCallback(async () => {
    if (!canCopy) return toast.error("No results to copy.");
    const headers = Object.keys(headerNames);
    const csv = toCSV(headers, filteredTasks);
    const ok = await writeToClipboard(csv);
    if (ok) toast.success("Copied to clipboard!");
  }, [canCopy, filteredTasks]);

  const exportCSV = useCallback(() => {
    if (!canCopy) return toast.error("No results to export.");
    const headers = Object.keys(headerNames);
    const csv = toCSV(headers, filteredTasks);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "FilteredTasks.csv";
    link.click();
    toast.success("Exported CSV file.");
  }, [canCopy, filteredTasks]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col p-4 w-full max-w-[97vw] mx-auto space-y-4 overflow-hidden"
    >
      <Toaster />

      <div ref={searchRef}>
        <TaskSearchCard
          onSearch={applyFilters}
          onClear={handleClear}
          onCopy={copyAll}
          onExport={exportCSV}
          canCopy={canCopy}
        />
      </div>

      {filteredTasks.length > 0 ? (
        <TaskTable_Advanced
          rows={filteredTasks}
          headerNames={headerNames}
          tableHeight={tableHeight}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center text-gray-500 flex-grow"
        >
          <p className="text-sm mb-2">No results yet</p>
          <p className="text-xs text-gray-400">
            Apply filters above to populate the table.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
