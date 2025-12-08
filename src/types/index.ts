/* ============================================================
   Centralized Type Definitions
   All shared types across the application
============================================================ */

/* Task Types */
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
  fieldNotes?: string;
  progressNotes?: ProgressNoteEntry[] | string;
}

export interface ProgressNoteEntry {
  ts: string;
  status?: string;
  text: string;
  source?: string;
}

/* Callout Types */
export type CalloutOutcome =
  | "AssignDispatchedAWI"
  | "CalloutDispatchedAWI"
  | "PendingACT"
  | "Disturbance"
  | "NoReply"
  | "Refusal"
  | "Unavailable";

export const CalloutOutcomeConfig: Record<
  CalloutOutcome,
  { label: string; requiresAvailabilityTime?: boolean }
> = {
  AssignDispatchedAWI: { label: "Assignment → Dispatched (AWI)" },
  CalloutDispatchedAWI: { label: "Callout → Dispatched (AWI)" },
  PendingACT: { label: "Pending Callout → Assigned (ACT)" },
  Disturbance: { label: "Disturbance" },
  NoReply: { label: "No Reply" },
  Refusal: { label: "Refusal" },
  Unavailable: { label: "Unavailable", requiresAvailabilityTime: true },
};

export interface ResourceHistoryEntry {
  previousOutcome: string | null;
  previousAvailableAgainAt: string | null;
  changedAt: string; // ISO timestamp
  taskIdUsed: string | number | null;
  outcomeApplied: CalloutOutcome;
}

export interface ResourceRecord {
  resourceId: string;
  name: string;
  calloutGroup?: string;
  status?: string | null;
  lastOutcome?: CalloutOutcome | string | null;
  availableAgainAt?: string | null;
  contactNumber?: string;
  notes?: string;
  history?: ResourceHistoryEntry[];
}

/* Schedule/Panel Types */
export type PanelKey = "timeline" | "map" | "resources" | "tasks";

/* Menu Types */
export interface MenuCard {
  name: string;
  description: string;
}
