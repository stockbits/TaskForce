import React, { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  Clock,
  Search,
  Copy,
} from "lucide-react";
import type { ResourceRecord } from "./CalloutIncidentPanel";
import { CalloutOutcomeConfig } from "./CalloutIncidentPanel";
import type { CalloutHistoryEntry } from "@/lib/hooks/useCalloutHistory";

interface ResourcePopoutPanelProps {
  open: boolean;
  resource: ResourceRecord;
  history: CalloutHistoryEntry[];
  expanded: string[];
  onToggleSection: (section: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onClose: () => void;
}

const DEFAULT_SECTIONS = [
  "Resource Summary",
  "Availability",
  "Callout History",
  "Capabilities",
];

const DEFAULT_CAPABILITIES: Array<{
  skill: string;
  preference: string;
  efficiency: string;
  group: string;
}> = [
  { skill: "RSFVAF", preference: "5", efficiency: "—", group: "Group B" },
  { skill: "RFJBAS", preference: "10", efficiency: "—", group: "Group B" },
  { skill: "RBTFC1", preference: "1", efficiency: "—", group: "Group B" },
  { skill: "SDRIVE", preference: "4", efficiency: "—", group: "Group A" },
  { skill: "SVEHW", preference: "4", efficiency: "—", group: "Group A" },
];

function formatUkDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

function groupBadgeColor(group: string) {
  const key = group.trim().split(" ").pop() ?? "";
  switch (key) {
    case "A":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "B":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "C":
      return "bg-amber-100 text-amber-800 border-amber-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export default function ResourcePopoutPanel({
  open,
  resource,
  history,
  expanded,
  onToggleSection,
  onExpandAll,
  onCollapseAll,
  onClose,
}: ResourcePopoutPanelProps) {
  const [capabilitySearch, setCapabilitySearch] = useState("");

  const capabilityRows = useMemo(() => {
    if (!capabilitySearch.trim()) return DEFAULT_CAPABILITIES;
    const q = capabilitySearch.trim().toLowerCase();
    return DEFAULT_CAPABILITIES.filter((entry) =>
      [entry.skill, entry.preference, entry.group]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [capabilitySearch]);

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => {
      const aTime = Date.parse(a.timestamp);
      const bTime = Date.parse(b.timestamp);
      if (!Number.isNaN(aTime) && !Number.isNaN(bTime)) return bTime - aTime;
      if (!Number.isNaN(aTime)) return -1;
      if (!Number.isNaN(bTime)) return 1;
      return 0;
    });
  }, [history]);

  if (!open) return null;

  const details: Array<{ label: string; value: string | null | undefined }> = [
    { label: "Resource ID", value: resource.resourceId },
    { label: "Name", value: resource.name },
    { label: "Division", value: resource.division },
    { label: "Callout Group", value: resource.calloutGroup },
    { label: "Primary Skill", value: resource.primarySkill },
    { label: "Secondary Skill", value: resource.secondarySkill },
    { label: "Patch (PWA)", value: (resource as any).pwa },
    { label: "Dispatch Mode", value: (resource as any).dispatchMode },
  ];

  const availabilityNotes: Array<{ label: string; value: string | null | undefined }> = [
    { label: "Current Status", value: resource.status },
    {
      label: "Last Outcome",
      value: resource.lastOutcome
        ? CalloutOutcomeConfig[resource.lastOutcome as keyof typeof CalloutOutcomeConfig]?.label ??
          String(resource.lastOutcome)
        : "",
    },
    {
      label: "Available Again",
      value: resource.availableAgainAt
        ? formatUkDateTime(resource.availableAgainAt)
        : "",
    },
    {
      label: "Last Updated",
      value: resource.updatedAt ? formatUkDateTime(resource.updatedAt) : "",
    },
  ];

  const contactDetails: Array<{ label: string; value: string | null | undefined }> = [
    { label: "Contact Number", value: resource.contactNumber },
    { label: "Notes", value: resource.notes },
  ];

  return (
    <div className="flex h-full w-full bg-[#F5F7FA] text-gray-900">
      <div className="flex h-full w-full flex-col overflow-hidden bg-white">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Resource Details</h2>
            <p className="text-xs text-gray-500">Explore current status, contact details, and callout history.</p>
          </div>
          <button
            onClick={() => (expanded.length ? onCollapseAll() : onExpandAll())}
            className="px-3 py-1.5 rounded-md text-sm flex items-center gap-2 bg-[#0A4A7A] text-white shadow-sm transition hover:bg-[#0C5A97]"
          >
            {expanded.length ? (
              <>
                <ChevronUp size={14} /> Collapse All
              </>
            ) : (
              <>
                <ChevronDown size={14} /> Expand All
              </>
            )}
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 px-6 py-6 bg-gray-200/40 overflow-y-auto">
          <div className="flex justify-center">
            <div className="w-full max-w-[720px] bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
              <div className="px-6 pt-6 pb-6 space-y-5">
                {/* Resource Summary */}
                <section className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => onToggleSection("Resource Summary")}
                    className="w-full flex justify-between items-center px-5 py-3 text-left font-semibold text-gray-900 bg-gray-50 hover:bg-gray-100"
                  >
                    Resource Summary
                    {expanded.includes("Resource Summary") ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {expanded.includes("Resource Summary") && (
                    <div className="px-5 py-4 border-t border-gray-100 text-sm text-gray-700 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-semibold text-gray-900">{resource.name}</p>
                          <p className="text-sm text-gray-500">{resource.resourceId}</p>
                        </div>
                        <button
                          onClick={() => navigator.clipboard.writeText(resource.resourceId)}
                          className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-[#0A4A7A]/30 text-[#0A4A7A] rounded-md hover:bg-[#0A4A7A]/10"
                        >
                          <Copy size={12} /> Copy ID
                        </button>
                      </div>

                      <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                        {details.map(({ label, value }) => (
                          <div key={label}>
                            <dt className="text-[11px] uppercase tracking-wide text-gray-400">{label}</dt>
                            <dd className="text-sm text-gray-800">{value || "—"}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </section>

                {/* Availability */}
                <section className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => onToggleSection("Availability")}
                    className="w-full flex justify-between items-center px-5 py-3 text-left font-semibold text-gray-900 bg-gray-50 hover:bg-gray-100"
                  >
                    Availability & Contact
                    {expanded.includes("Availability") ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {expanded.includes("Availability") && (
                    <div className="px-5 py-4 border-t border-gray-100 text-sm text-gray-700 space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        {availabilityNotes.map(({ label, value }) => (
                          <div key={label} className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                            <span className="text-[11px] uppercase tracking-wide text-gray-400">{label}</span>
                            <div className="mt-1 text-sm text-gray-800">{value || "—"}</div>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {contactDetails.map(({ label, value }) => (
                          <div key={label} className="rounded-lg border border-gray-200 px-4 py-3">
                            <span className="text-[11px] uppercase tracking-wide text-gray-400">{label}</span>
                            <div className="mt-1 text-sm text-gray-800">{value || "—"}</div>
                          </div>
                        ))}
                        <div className="rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-3 text-sm text-gray-700">
                          <Clock size={16} className="text-[#0A4A7A]" />
                          <div>
                            <div className="text-[11px] uppercase tracking-wide text-gray-400">Sign-on</div>
                            <div>{(resource as any).signOn || "—"}</div>
                          </div>
                        </div>
                        <div className="rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-3 text-sm text-gray-700">
                          <MapPin size={16} className="text-[#0A4A7A]" />
                          <div>
                            <div className="text-[11px] uppercase tracking-wide text-gray-400">Home Postcode</div>
                            <div>{(resource as any).homePostCode || "—"}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                {/* History */}
                <section className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => onToggleSection("Callout History")}
                    className="w-full flex justify-between items-center px-5 py-3 text-left font-semibold text-gray-900 bg-gray-50 hover:bg-gray-100"
                  >
                    Callout History
                    {expanded.includes("Callout History") ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {expanded.includes("Callout History") && (
                    <div className="px-5 py-4 border-t border-gray-100 space-y-3 max-h-[320px] overflow-y-auto">
                      {sortedHistory.length === 0 && (
                        <div className="text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-300 rounded-lg px-4 py-6 text-center">
                          No history recorded for this resource yet.
                        </div>
                      )}

                      {sortedHistory.map((entry) => {
                        const outcomeLabel =
                          (entry.outcome &&
                            typeof entry.outcome === "string" &&
                            CalloutOutcomeConfig[entry.outcome as keyof typeof CalloutOutcomeConfig]?.label) ||
                          String(entry.outcome ?? "");

                        return (
                          <div
                            key={entry.id}
                            className="border border-gray-200 rounded-lg px-4 py-3 bg-white shadow-sm"
                          >
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span className="font-semibold text-gray-700">{outcomeLabel || "Outcome"}</span>
                              <span>{formatUkDateTime(entry.timestamp) || "—"}</span>
                            </div>
                            {entry.note && (
                              <p className="mt-2 text-sm text-gray-700 leading-snug">{entry.note}</p>
                            )}
                            {entry.availableAgainAt && (
                              <p className="mt-2 text-xs text-gray-500">
                                Return {formatUkDateTime(entry.availableAgainAt)}
                              </p>
                            )}
                            <div className="mt-2 text-[11px] uppercase tracking-wide text-gray-400">
                              {entry.status || ""}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Capabilities */}
                <section className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => onToggleSection("Capabilities")}
                    className="w-full flex justify-between items-center px-5 py-3 text-left font-semibold text-gray-900 bg-gray-50 hover:bg-gray-100"
                  >
                    Capabilities
                    {expanded.includes("Capabilities") ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {expanded.includes("Capabilities") && (
                    <div className="px-5 py-4 border-t border-gray-100 space-y-4 text-sm text-gray-700">
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                        <input
                          type="text"
                          value={capabilitySearch}
                          onChange={(event) => setCapabilitySearch(event.target.value)}
                          placeholder="Filter by skill, preference, or group…"
                          className="w-full rounded-md border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0A4A7A]"
                        />
                      </div>

                      <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[280px] overflow-y-auto">
                        <table className="w-full text-sm text-gray-700">
                          <thead className="bg-gray-100 border-b border-gray-200">
                            <tr>
                              <th className="text-left px-3 py-2">Skill</th>
                              <th className="text-left px-3 py-2">Preference</th>
                              <th className="text-left px-3 py-2">Efficiency</th>
                              <th className="text-left px-3 py-2">Group</th>
                            </tr>
                          </thead>
                          <tbody>
                            {capabilityRows.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="text-center py-6 text-sm text-gray-500">
                                  No matching capability entries.
                                </td>
                              </tr>
                            ) : (
                              capabilityRows.map((row) => (
                                <tr key={`${row.skill}-${row.group}`} className="even:bg-gray-50">
                                  <td className="px-3 py-2 font-medium text-gray-800">{row.skill}</td>
                                  <td className="px-3 py-2">{row.preference}</td>
                                  <td className="px-3 py-2">{row.efficiency}</td>
                                  <td className="px-3 py-2">
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${groupBadgeColor(
                                        row.group
                                      )}`}
                                    >
                                      {row.group}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-gray-200 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border border-[#0A4A7A]/30 text-[#0A4A7A] hover:bg-[#0A4A7A]/10"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
