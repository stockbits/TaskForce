import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Users, ChevronRight } from "lucide-react";
import { ResourceRecord } from "./CalloutIncidentPanel";

/* ------------------------------------------------------------------
   TYPES
------------------------------------------------------------------ */

interface CalloutLandingPageProps {
  allResources: ResourceRecord[];
  calloutGroups: string[];
  onStart: (group: string) => void;
  onDismiss: () => void;
}

/* ------------------------------------------------------------------
   COMPONENT
------------------------------------------------------------------ */

export const CalloutLandingPage: React.FC<CalloutLandingPageProps> = ({
  allResources,
  calloutGroups,
  onStart,
  onDismiss,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto-filter resources for selected group
  const resourcesForGroup: ResourceRecord[] = selectedGroup
    ? allResources.filter((r) => r.calloutGroup === selectedGroup)
    : [];

  const filteredGroups = useMemo(() => {
    if (!query.trim()) return calloutGroups;
    const q = query.toLowerCase();
    return calloutGroups.filter((group) =>
      group.toLowerCase().includes(q)
    );
  }, [calloutGroups, query]);

  const resourceCountByGroup = useMemo(() => {
    const countMap = new Map<string, number>();
    for (const resource of allResources) {
      const key = resource.calloutGroup ?? "";
      if (!key) continue;
      countMap.set(key, (countMap.get(key) ?? 0) + 1);
    }
    return countMap;
  }, [allResources]);

  useEffect(() => {
    if (!selectedGroup) {
      setQuery("");
      return;
    }

    setQuery(selectedGroup);
  }, [selectedGroup]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(event.target as Node)) return;
      onDismiss();
    };

    document.addEventListener("mousedown", handleClickOutside);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onDismiss();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onDismiss]);

  const startDisabled = !selectedGroup;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div
        ref={containerRef}
        className="w-full max-w-3xl mx-auto rounded-2xl bg-white shadow-[0_24px_55px_rgba(10,74,122,0.28)] border border-[#0A4A7A]/15 p-8"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 flex items-center justify-center rounded-full bg-[#0A4A7A] text-white shadow-sm">
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
          <label className="text-xs font-semibold text-[#0A4A7A] uppercase tracking-wide">
            Callout Group
          </label>

          <div className="mt-1 relative">
            <input
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A4A7A]/40"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onBlur={() => {
                window.setTimeout(() => {
                  setIsOpen(false);

                  const trimmed = query.trim().toLowerCase();
                  if (!trimmed) {
                    setSelectedGroup("");
                    return;
                  }

                  const exact = calloutGroups.find(
                    (group) => group.toLowerCase() === trimmed
                  );

                  if (exact) {
                    setSelectedGroup(exact);
                    setQuery(exact);
                  } else if (selectedGroup) {
                    setQuery(selectedGroup);
                  }
                }, 80);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  const first = filteredGroups[0];
                  if (first) {
                    setSelectedGroup(first);
                    setQuery(first);
                    setIsOpen(false);
                    onStart(first);
                  }
                }

                if (event.key === "Escape") {
                  setIsOpen(false);
                  if (selectedGroup) {
                    setQuery(selectedGroup);
                  }
                }
              }}
              placeholder="Select group…"
            />

            {isOpen && (
              <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {filteredGroups.length === 0 && (
                  <div className="px-3 py-2 text-xs text-gray-500">
                    No matches found.
                  </div>
                )}

                {filteredGroups.map((group) => {
                  const resourceCount = resourceCountByGroup.get(group) ?? 0;
                  const isSelected = group === selectedGroup;

                  return (
                    <button
                      key={group}
                      type="button"
                      className={`flex w-full items-center justify-between px-3 py-2 text-sm text-left hover:bg-[#0A4A7A]/10 ${
                        isSelected ? "bg-[#0A4A7A]/10 text-[#0A4A7A]" : ""
                      }`}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        setSelectedGroup(group);
                        setQuery(group);
                        setIsOpen(false);
                        onStart(group);
                      }}
                    >
                      <span>{group}</span>
                      <span className="text-xs text-gray-500">
                        {resourceCount} {resourceCount === 1 ? "resource" : "resources"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Resource count preview */}
        <div className="mb-6 min-h-[64px]">
          <AnimatePresence mode="wait">
            {selectedGroup && (
              <motion.div
                key={selectedGroup}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="text-sm text-[#0A4A7A] border border-[#0A4A7A]/25 rounded-lg bg-[#0A4A7A]/10 px-4 py-3"
              >
                <b>{resourcesForGroup.length}</b> {resourcesForGroup.length === 1 ? "resource" : "resources"} in this callout group.
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Continue Button */}
        <div className="flex justify-end">
          <button
            onClick={() => {
              setIsOpen(false);
              onStart(selectedGroup);
            }}
            disabled={startDisabled}
            className={`
              inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg 
              text-white bg-[#0A4A7A] hover:bg-[#0C5A97]
              disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed
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
