import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckSquare, XSquare } from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

export interface SearchToolFilters {
  statuses: string[];
  pwa: string[];
  capabilities: string[];
  commitmentTypes: string[];
  responseCodes?: string[];
  impCondition?: string;
  impValue?: string;
}

export interface SearchToolPanelProps {
  mode?: string;
  onSearch: (filters: SearchToolFilters) => void;
  onClear: () => void;
  dropdownData: {
    statuses?: string[];
    pwa?: string[];
    capabilities?: string[];
    commitmentTypes?: string[];
    responseCodes?: string[];
    resourceStatuses?: string[];
  };
  resetKey?: number;
  hideActions?: boolean;
}

/* ============================================================
   HELPERS
============================================================ */

// Extract code inside parentheses e.g. "Not Assigned (ACT)" → "ACT"
function extractBracketCode(label: string): string {
  const match = label.match(/\(([^)]+)\)/);
  return match ? match[1] : "";
}

// Sort alphabetically by bracket code
function sortByBracketCode(list: string[]): string[] {
  return [...list].sort((a, b) => {
    const ca = extractBracketCode(a);
    const cb = extractBracketCode(b);
    if (ca === cb) return a.localeCompare(b); // fallback
    return ca.localeCompare(cb);
  });
}

/* ============================================================
   MAIN PANEL
============================================================ */

const SearchToolPanel: React.FC<SearchToolPanelProps> = ({
  mode = "task-default",
  onSearch,
  onClear,
  dropdownData,
  resetKey,
  hideActions,
}) => {
  const [filters, setFilters] = useState<SearchToolFilters>({
    statuses: [],
    pwa: [],
    capabilities: [],
    commitmentTypes: [],
    responseCodes: [],
    impCondition: "",
    impValue: "",
  });

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [query, setQuery] = useState<Record<string, string>>({
    statuses: "",
    pwa: "",
    capabilities: "",
    commitmentTypes: "",
    responseCodes: "",
    resourceStatuses: "",
  });

  /* ---------------- RESET ON resetKey ---------------- */
  useEffect(() => {
    setFilters({
      statuses: [],
      pwa: [],
      capabilities: [],
      commitmentTypes: [],
      responseCodes: [],
      impCondition: "",
      impValue: "",
    });

    setQuery({
      statuses: "",
      pwa: "",
      capabilities: "",
      commitmentTypes: "",
      responseCodes: "",
      resourceStatuses: "",
    });

    setOpenDropdown(null);
  }, [resetKey]);

  /* ---------------- CLOSE DROPDOWN ON OUTSIDE CLICK ---------------- */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current) return;

      if (!containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ---------------- AUTO SEARCH (embedded mode) ---------------- */
  useEffect(() => {
    if (hideActions) onSearch(filters);
  }, [filters, hideActions, onSearch]);

  /* ---------------- OPTION HELPERS ---------------- */
  const safe = (arr: string[] | undefined) => arr ?? [];

  const makeFilter = (list: string[], q: string) =>
    list.filter((o) => o.toLowerCase().includes(q.toLowerCase()));

  /* ---------------- APPLY SORTING BY CODE ---------------- */
  const filtered = {
    statuses: makeFilter(
      sortByBracketCode(safe(dropdownData.statuses)),
      query.statuses
    ),
    pwa: makeFilter(safe(dropdownData.pwa), query.pwa),
    capabilities: makeFilter(
      safe(dropdownData.capabilities),
      query.capabilities
    ),
    commitmentTypes: makeFilter(
      safe(dropdownData.commitmentTypes),
      query.commitmentTypes
    ),
    responseCodes: makeFilter(
      safe(dropdownData.responseCodes),
      query.responseCodes
    ),

    // resource statuses also sorted by bracket code
    resourceStatuses: makeFilter(
      sortByBracketCode(safe(dropdownData.resourceStatuses)),
      query.resourceStatuses
    ),
  };

  /* ---------------- STATE HELPERS ---------------- */
  const toggleArray = (field: keyof SearchToolFilters, value: string) => {
    setFilters((prev) => {
      const current = Array.isArray(prev[field])
        ? (prev[field] as string[])
        : [];
      const exists = current.includes(value);
      const next = exists
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [field]: next };
    });
  };

  const handleSelectAll = (field: keyof SearchToolFilters, list: string[]) => {
    setFilters((prev) => {
      const current = Array.isArray(prev[field])
        ? (prev[field] as string[])
        : [];
      const allSelected = current.length === list.length && list.length > 0;
      return { ...prev, [field]: allSelected ? [] : [...list] };
    });
  };

  const blockTitle = (title: string) => (
    <div className="font-semibold text-[11px] text-gray-700 mb-1">{title}</div>
  );

  /* ============================================================
     BLOCKS
  ============================================================ */

  const StatusBlock = (
    <DropdownMultiSelect
      id="statuses"
      label="Task Status"
      options={filtered.statuses}
      selected={filters.statuses}
      openDropdown={openDropdown}
      setOpenDropdown={setOpenDropdown}
      query={query}
      setQuery={setQuery}
      onToggle={(v) => toggleArray("statuses", v)}
      onSelectAll={() => handleSelectAll("statuses", filtered.statuses)}
    />
  );

  const PwaBlock = (
    <DropdownMultiSelect
      id="pwa"
      label="PWA"
      options={filtered.pwa}
      selected={filters.pwa}
      openDropdown={openDropdown}
      setOpenDropdown={setOpenDropdown}
      query={query}
      setQuery={setQuery}
      onToggle={(v) => toggleArray("pwa", v)}
      onSelectAll={() => handleSelectAll("pwa", filtered.pwa)}
    />
  );

  const CapBlock = (
    <DropdownMultiSelect
      id="capabilities"
      label="Capabilities"
      options={filtered.capabilities}
      selected={filters.capabilities}
      openDropdown={openDropdown}
      setOpenDropdown={setOpenDropdown}
      query={query}
      setQuery={setQuery}
      onToggle={(v) => toggleArray("capabilities", v)}
      onSelectAll={() => handleSelectAll("capabilities", filtered.capabilities)}
    />
  );

  const CommitBlock = (
    <DropdownMultiSelect
      id="commitmentTypes"
      label="Commit Type"
      options={filtered.commitmentTypes}
      selected={filters.commitmentTypes}
      openDropdown={openDropdown}
      setOpenDropdown={setOpenDropdown}
      query={query}
      setQuery={setQuery}
      onToggle={(v) => toggleArray("commitmentTypes", v)}
      onSelectAll={() =>
        handleSelectAll("commitmentTypes", filtered.commitmentTypes)
      }
    />
  );

  const ResponseBlock = (
    <DropdownMultiSelect
      id="responseCodes"
      label="Response Code"
      options={filtered.responseCodes}
      selected={filters.responseCodes ?? []}
      openDropdown={openDropdown}
      setOpenDropdown={setOpenDropdown}
      query={query}
      setQuery={setQuery}
      onToggle={(v) => toggleArray("responseCodes", v)}
      onSelectAll={() =>
        handleSelectAll("responseCodes", filtered.responseCodes)
      }
    />
  );

  const ImpBlock = (
    <div className="flex flex-col">
      {blockTitle("IMP Score")}
      <div className="flex gap-2">
        <select
          className="border border-gray-300 rounded-md text-[12px] px-2 h-[32px] bg-white"
          value={filters.impCondition ?? ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, impCondition: e.target.value }))
          }
        >
          <option value="">Condition</option>
          <option value="greater">Greater Than</option>
          <option value="less">Less Than</option>
        </select>

        <input
          type="number"
          className="border border-gray-300 rounded-md text-[12px] px-2 h-[32px] w-[100px] bg-white"
          value={filters.impValue ?? ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, impValue: e.target.value }))
          }
          placeholder="Value"
        />
      </div>
    </div>
  );

  const ResourceStatusBlock = (
    <DropdownMultiSelect
      id="resourceStatuses"
      label="Status"
      options={filtered.resourceStatuses}
      selected={filters.statuses} // uses same field
      openDropdown={openDropdown}
      setOpenDropdown={setOpenDropdown}
      query={query}
      setQuery={setQuery}
      onToggle={(v) => toggleArray("statuses", v)}
      onSelectAll={() =>
        handleSelectAll("statuses", safe(dropdownData.resourceStatuses))
      }
    />
  );

  /* ============================================================
     MODE LAYOUT
  ============================================================ */

  const effectiveMode =
    mode === "resource-active" ? "resource-active" : "task-default";

  const renderMode = () => {
    if (effectiveMode === "task-default") {
      return (
        <div className="grid grid-cols-2 gap-4">
          {StatusBlock}
          {PwaBlock}
          {CapBlock}
          {CommitBlock}
          {ResponseBlock}
          {ImpBlock}
        </div>
      );
    }

    if (effectiveMode === "resource-active") {
      return (
        <div className="grid grid-cols-2 gap-4">
          {ResourceStatusBlock}
          {PwaBlock}
        </div>
      );
    }

    return null;
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3 w-full"
    >
      {renderMode()}

      {!hideActions && (
        <div className="flex justify-end pt-2 border-t border-gray-200 mt-2">
          <button
            className="px-4 py-1.5 text-sm bg-[#0A4A7A] text-white rounded-md mr-2 hover:bg-[#08385E]"
            onClick={() => onSearch(filters)}
          >
            Search
          </button>
          <button
            className="px-4 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            onClick={onClear}
          >
            Clear
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default SearchToolPanel;

/* ============================================================
   DROPDOWN MULTISELECT
============================================================ */

interface DropdownMultiSelectProps {
  id: string;
  label: string;
  options: string[];
  selected: string[];
  openDropdown: string | null;
  setOpenDropdown: (id: string | null) => void;
  query: Record<string, string>;
  setQuery: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onToggle: (value: string) => void;
  onSelectAll: () => void;
}

function DropdownMultiSelect({
  id,
  label,
  options,
  selected,
  openDropdown,
  setOpenDropdown,
  query,
  setQuery,
  onToggle,
  onSelectAll,
}: DropdownMultiSelectProps) {
  const isOpen = openDropdown === id;
  const q = query[id] ?? "";
  const allSelected = options.length > 0 && selected.length === options.length;

  // Fix: show label instead of "0 selected"
  const displayLabel =
    selected.length > 0 ? `${selected.length} selected` : label;

  return (
    <div className="relative">
      {/* DROPDOWN BUTTON */}
      <div
        onClick={() => setOpenDropdown(isOpen ? null : id)}
        className="w-full h-[34px] px-3 text-[12px] border border-gray-300 rounded-md
                   bg-white text-gray-900 shadow-sm cursor-pointer flex items-center justify-between
                   hover:border-gray-400"
      >
        <span className="truncate w-full pr-3">{displayLabel}</span>
        <ChevronDown size={14} className="text-gray-600 flex-shrink-0" />
      </div>

      {/* MENU */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="absolute z-[9999] mt-1 p-2 text-[12px] bg-white border border-gray-300
                       rounded-lg shadow-2xl w-full min-w-[220px]"
          >
            {/* SEARCH BOX */}
            <input
              type="text"
              placeholder={`Filter ${label.toLowerCase()}…`}
              value={q}
              onChange={(e) =>
                setQuery((prev) => ({ ...prev, [id]: e.target.value }))
              }
              autoFocus
              className="w-full mb-2 px-2 py-1 text-[12px] border border-gray-300 rounded-md
                         bg-white focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500
                         text-center placeholder:text-center"
            />

            {/* SELECT ALL */}
            <div className="sticky top-0 flex justify-between bg-slate-50 px-2 py-1 border border-gray-200 rounded mt-1 mb-1 text-[12px] items-center">
              <span>
                {allSelected ? "Clear All Results" : "Select All Results"}
              </span>
              {allSelected ? (
                <XSquare
                  size={16}
                  onClick={onSelectAll}
                  className="cursor-pointer text-[#0A4A7A]"
                />
              ) : (
                <CheckSquare
                  size={16}
                  onClick={onSelectAll}
                  className="cursor-pointer text-[#0A4A7A]"
                />
              )}
            </div>

            {/* LIST */}
            <div
              className="max-h-[220px] overflow-y-auto"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#9ca3af #e5e7eb",
              }}
            >
              {options.map((o) => (
                <label
                  key={o}
                  className="flex items-center gap-2 px-2 py-1 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(o)}
                    onChange={() => onToggle(o)}
                    className="accent-[#0A4A7A]"
                  />
                  <span className="text-gray-900">{o}</span>
                </label>
              ))}

              {options.length === 0 && (
                <div className="px-2 py-1 text-gray-500 italic">No results</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
