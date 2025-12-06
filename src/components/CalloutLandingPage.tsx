import React, { useState } from "react";
import { motion } from "framer-motion";
import { Users, ChevronRight } from "lucide-react";
import { ResourceRecord } from "./CalloutIncidentPanel";

/* ------------------------------------------------------------------
   TYPES
------------------------------------------------------------------ */

interface CalloutLandingPageProps {
  allResources: ResourceRecord[];
  calloutGroups: string[];
  onStart: (group: string) => void; // << simplified
}

/* ------------------------------------------------------------------
   COMPONENT
------------------------------------------------------------------ */

export const CalloutLandingPage: React.FC<CalloutLandingPageProps> = ({
  allResources,
  calloutGroups,
  onStart,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>("");

  // Auto-filter resources for selected group
  const resourcesForGroup: ResourceRecord[] = selectedGroup
    ? allResources.filter((r) => r.calloutGroup === selectedGroup)
    : [];

  const startDisabled = !selectedGroup;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="w-full max-w-3xl mx-auto rounded-2xl bg-white shadow-2xl border border-gray-200 p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-600 text-white">
            <Users size={20} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Select Callout List
            </h2>
            <p className="text-xs text-gray-600">
              Choose a callout group to begin the workflow.
            </p>
          </div>
        </div>

        {/* Group selector */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-gray-700">
            Callout Group
          </label>

          <select
            className="mt-1 w-full px-3 py-2 text-sm border rounded-lg"
            value={selectedGroup}
            onChange={(e) => {
              setSelectedGroup(e.target.value);
            }}
          >
            <option value="">Select group…</option>

            {calloutGroups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Resource count preview */}
        {selectedGroup && (
          <div className="mb-6 text-sm text-gray-700 border rounded-lg bg-gray-50 px-4 py-3">
            <b>{resourcesForGroup.length}</b> resources in this callout group.
          </div>
        )}

        {/* Continue Button */}
        <div className="flex justify-end">
          <button
            onClick={() => onStart(selectedGroup)}
            disabled={startDisabled}
            className={`
              inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg 
              text-white bg-blue-600 hover:bg-blue-700
              disabled:bg-gray-300 disabled:cursor-not-allowed
            `}
          >
            Continue
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
