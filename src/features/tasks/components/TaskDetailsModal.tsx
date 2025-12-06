// ===============================================
// TaskDetailsModal.tsx — CARD VERSION (RESTORED)
// ===============================================

import React from "react";
import {
  ChevronDown,
  ChevronUp,
  User,
  Truck,
  ThumbsUp,
  Play,
  Wrench,
  Check,
} from "lucide-react";

export interface TaskDetails {
  taskId: string;
  taskStatus: string;
  taskType: string;
  primarySkill: string;
  importanceScore: string | number;
  msc: string;
  taskCreated: string;
  groupCode: string;
  systemType: string;
  employeeId: string;
  resourceName: string;
  asset: string;
  assetName: string;
  commitmentDate: string;
  commitmentType: string;
  arrivedAtDate: string;
  domain: string;
  estimatedDuration: string | number;
  lastProgression: string;
  category: string;
  description: string;
  responseCode: string;
  postCode: string;
  appointmentStartDate: string;
  linkedTask: string;
  customerAddress: string;
  expectedStartDate: string;
  expectedFinishDate: string;
  externalQueueId: string;
  workId: string;
  estimateNumber: string;
  startDate: string;
}

export interface TaskDetailsModalProps {
  task: TaskDetails;
  expanded: string[];
  onToggleSection: (section: string) => void;
}

/* Status tag colours */
const statusStyles: Record<
  string,
  { icon: React.ReactNode; bg: string; text: string }
> = {
  Assigned: {
    icon: <User size={14} />,
    bg: "bg-blue-100",
    text: "text-blue-700",
  },
  Dispatched: {
    icon: <Truck size={14} />,
    bg: "bg-orange-100",
    text: "text-orange-700",
  },
  Accepted: {
    icon: <ThumbsUp size={14} />,
    bg: "bg-amber-100",
    text: "text-amber-700",
  },
  "In Progress": {
    icon: <Play size={14} />,
    bg: "bg-purple-100",
    text: "text-purple-700",
  },
  Incomplete: {
    icon: <Wrench size={14} />,
    bg: "bg-green-100",
    text: "text-green-700",
  },
  Complete: {
    icon: <Check size={14} />,
    bg: "bg-emerald-100",
    text: "text-emerald-700",
  },
};

/* LOG VIEW — clean but not borderless */
const LogView = ({ logs }: { logs: typeof exampleLogs }) => (
  <div
    className="border border-gray-300 rounded-md overflow-y-auto bg-white p-3"
    style={{ maxHeight: "calc(var(--vh, 1vh) * 40)" }}
  >
    <div className="space-y-3 text-sm text-gray-800 font-mono">
      {logs.map((log, i) => {
        const style = statusStyles[log.status] || {
          icon: <User size={14} />,
          bg: "bg-gray-200",
          text: "text-gray-800",
        };

        return (
          <div key={i} className="pb-3 border-b border-gray-200">
            <div className="flex justify-between items-center font-semibold">
              <span>{log.time}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${style.bg} ${style.text}`}
              >
                {style.icon}
                {log.status} ({log.code})
              </span>
            </div>

            <div className="text-xs text-gray-600 italic">
              Controller: {log.controller}
            </div>

            <div>{log.details}</div>
          </div>
        );
      })}
    </div>
  </div>
);

/* Example logs */
const exampleLogs = [
  {
    time: "12/10/2025 08:45",
    controller: "SYSTEM",
    status: "Assigned",
    code: "ACT",
    details: "Task assigned to resource pool.",
  },
  {
    time: "12/10/2025 09:30",
    controller: "AUTO",
    status: "Dispatched",
    code: "AWI",
    details: "System dispatched to engineer.",
  },
  {
    time: "12/10/2025 09:50",
    controller: "ENGINEER",
    status: "Accepted",
    code: "ISS",
    details: "Engineer accepted via mobile.",
  },
];

export default function TaskDetailsModal({
  task,
  expanded,
  onToggleSection,
}: TaskDetailsModalProps) {
  const sections = [
    {
      name: "Work Details",
      content: (
        <div className="grid grid-cols-2 gap-y-1 text-sm">
          <p>
            <b>Task ID:</b> {task.taskId}
          </p>
          <p>
            <b>Type:</b> {task.taskType}
          </p>
          <p>
            <b>Primary Skill:</b> {task.primarySkill}
          </p>
          <p>
            <b>Description:</b> {task.description}
          </p>
          <p>
            <b>Importance Score:</b> {task.importanceScore}
          </p>
          <p>
            <b>MSC:</b> {task.msc}
          </p>
          <p>
            <b>Category:</b> {task.category}
          </p>
        </div>
      ),
    },

    {
      name: "Commitments / Customer / Location",
      content: (
        <div className="grid grid-cols-2 gap-y-1 text-sm">
          <p>
            <b>Commitment Type:</b> {task.commitmentType}
          </p>
          <p>
            <b>Commitment Date:</b> {task.commitmentDate}
          </p>
          <p>
            <b>Appointment Start:</b> {task.appointmentStartDate}
          </p>
          <p>
            <b>Customer Address:</b> {task.customerAddress}
          </p>
          <p>
            <b>Postcode:</b> {task.postCode}
          </p>
        </div>
      ),
    },

    {
      name: "Scheduling / Resources",
      content: (
        <div className="grid grid-cols-2 gap-y-1 text-sm">
          <p>
            <b>Employee ID:</b> {task.employeeId}
          </p>
          <p>
            <b>Resource Name:</b> {task.resourceName}
          </p>
          <p>
            <b>Estimated Duration:</b> {task.estimatedDuration}
          </p>
          <p>
            <b>Domain:</b> {task.domain}
          </p>
        </div>
      ),
    },

    {
      name: "Access Restrictions",
      content: <p className="text-sm">No access restrictions detected.</p>,
    },

    { name: "Notes", content: <LogView logs={exampleLogs} /> },

    { name: "Progress Notes", content: <LogView logs={exampleLogs} /> },

    {
      name: "Closure",
      content: (
        <div className="grid grid-cols-2 gap-y-1 text-sm">
          <p>
            <b>Last Progression:</b> {task.lastProgression}
          </p>
          <p>
            <b>Expected Finish:</b> {task.expectedFinishDate}
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="p-1">
      <div className="space-y-3">
        {sections.map((section) => {
          const open = expanded.includes(section.name);

          return (
            <div
              key={section.name}
              className={`border border-gray-200 rounded-lg transition-all ${
                open ? "shadow-md" : "shadow-sm"
              }`}
            >
              {/* Section Header */}
              <button
                onClick={() => onToggleSection(section.name)}
                className="w-full flex justify-between items-center px-4 py-3 font-medium text-gray-900 hover:bg-gray-100"
              >
                {section.name}
                {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {/* Section Content */}
              {open && (
                <div className="px-4 py-3 bg-gray-50 text-sm">
                  {section.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
