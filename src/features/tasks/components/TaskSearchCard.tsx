import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Star,
  Eye,
  EyeOff,
  Search,
  CheckSquare,
  XSquare,
} from "lucide-react";
import { toast } from "react-hot-toast";

// 🔥 IMPORT YOUR TASK JSON
import mockTasks from "@/data/mockTasks.json";

/* ============================================================
   TYPES
============================================================ */

interface TaskSearchCardProps {
  onSearch: (filters: Filters) => void;
  onClear: () => void;
  onCopy?: () => void;
  onExport?: () => void;
  canCopy?: boolean;
}

type OptionList = string[];

type Filters = {
  taskSearch: string;
  division: string[];
  domainId: string[];
  taskStatuses: string[];
  requester: string;
  responseCode: string[];
  commitType: string[];
  capabilities: string[];
  jobType: string;
  scoreCondition: string;
  scoreValue: string;
  locationType: string;
  locationValue: string;
  pwa: string[];
  fromDate: string;
  fromTime: string;
  toDate: string;
  toTime: string;
};

type DropdownId =
  | "division"
  | "domainId"
  | "taskStatuses"
  | "commitType"
  | "responseCode"
  | "capabilities"
  | "pwa";

type QueryState = Record<DropdownId, string>;

/* ============================================================
   CONSTANTS
============================================================ */

const initialFilters: Filters = {
  taskSearch: "",
  division: [],
  domainId: [],
  taskStatuses: [],
  requester: "",
  responseCode: [],
  commitType: [],
  capabilities: [],
  jobType: "",
  scoreCondition: "",
  scoreValue: "",
  locationType: "",
  locationValue: "",
  pwa: [],
  fromDate: "",
  fromTime: "",
  toDate: "",
  toTime: "",
};

const initialQueries: QueryState = {
  division: "",
  domainId: "",
  taskStatuses: "",
  commitType: "",
  responseCode: "",
  capabilities: "",
  pwa: "",
};

const statusOptions: OptionList = [
  "Assigned (ACT)",
  "Not Assigned (ACT)",
  "Dispatched (AWI)",
  "Accepted (ISS)",
  "In Progress (EXC)",
];

const divisionOptions: OptionList = [
  "Admin Team",
  "CE Build & MDU Build",
  "CE NS/NED",
  "CE PPO & Power",
  "CE PoleTest & Poling",
  "Complex Engineering",
  "Service Delivery",
].sort();

const responseOptions: OptionList = ["SH01", "SH02", "SH03", "SH04", "NONE"];

const commitOptions: OptionList = ["Appointment", "Start By", "Complete By"];

const capabilityOptions: OptionList = [
  "RFJBAS",
  "RISDN1",
  "RISDN2",
  "RISDN3",
  "RFTTP1",
  "RFTTP2",
  "SOGEA",
  "OGGA1",
  "OGGA2",
  "FED",
].sort();

const pwaOptions: OptionList = [
  "ZB-TEST-19",
  "ZB-ALPHA-02",
  "ZB-BETA-03",
  "ZB-DELTA-07",
  "ZB-GAMMA-09",
];

// Shared input base classes to keep styling consistent but easier to tweak
const inputBase =
  "border border-gray-300 rounded-md text-[12px] px-2 h-[32px] " +
  "bg-white shadow-sm focus:ring-2 focus:ring-[#0A4A7A]/70 " +
  "focus:border-[#0A4A7A] text-center placeholder:text-center text-gray-900";

const selectBase =
  "border border-gray-300 rounded-md text-[12px] px-2 h-[32px] " +
  "bg-white shadow-sm focus:ring-2 focus:ring-[#0A4A7A]/70 " +
  "focus:border-[#0A4A7A] text-center text-gray-900";

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function TaskSearchCard({
  onSearch,
  onClear,
  onCopy,
  onExport,
  canCopy,
}: TaskSearchCardProps) {
  /* ============================================================
     STATE
  ============================================================ */
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [cardCollapsed, setCardCollapsed] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);

  // Single dropdown open state
  const [openDropdown, setOpenDropdown] = useState<DropdownId | null>(null);

  // Single state object for all search queries
  const [queries, setQueries] = useState<QueryState>(initialQueries);

  /* ============================================================
     DROPDOWN REFS
  ============================================================ */
  const statusRef = useRef<HTMLDivElement>(null);
  const divisionRef = useRef<HTMLDivElement>(null);
  const capabilityRef = useRef<HTMLDivElement>(null);
  const pwaRef = useRef<HTMLDivElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);
  const commitRef = useRef<HTMLDivElement>(null);
  const domainRef = useRef<HTMLDivElement>(null);

  const dropdownRefs: Record<
    DropdownId,
    React.RefObject<HTMLDivElement | null>
  > = {
    division: divisionRef,
    domainId: domainRef,
    taskStatuses: statusRef,
    commitType: commitRef,
    responseCode: responseRef,
    capabilities: capabilityRef,
    pwa: pwaRef,
  };

  /* ============================================================
     DYNAMIC DOMAIN LIST FROM JSON
  ============================================================ */
  const domainOptions: OptionList = useMemo(() => {
    const unique = new Set<string>();

    (mockTasks as any[]).forEach((task) => {
      if (task?.domain) {
        unique.add(task.domain.toString().toUpperCase());
      }
    });

    return Array.from(unique).sort();
  }, []);

  /* ============================================================
     OUTSIDE CLICK HANDLER (ALL DROPDOWNS)
  ============================================================ */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!openDropdown) return;
      const target = e.target as Node;

      const refsToCheck = Object.values(dropdownRefs);
      const clickedInside = refsToCheck.some(
        (ref) => ref.current && ref.current.contains(target)
      );

      if (!clickedInside) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openDropdown, dropdownRefs]);

  /* ============================================================
     HELPERS
  ============================================================ */

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const setQuery = (key: DropdownId, value: string) => {
    setQueries((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleArrayValue = (field: keyof Filters, value: string) => {
    setFilters((prev) => {
      const existing = Array.isArray(prev[field])
        ? (prev[field] as string[])
        : [];
      const newArr = existing.includes(value)
        ? existing.filter((v) => v !== value)
        : [...existing, value];
      return { ...prev, [field]: newArr };
    });
  };

  const handleSelectAll = (field: keyof Filters, options: string[]) => {
    setFilters((prev) => {
      const existing = Array.isArray(prev[field])
        ? (prev[field] as string[])
        : [];
      const allSelected = options.every((v) => existing.includes(v));
      return { ...prev, [field]: allSelected ? [] : [...options] };
    });
  };

  /* ============================================================
     SEARCH / CLEAR
  ============================================================ */
  const handleSearch = useCallback(() => {
    onSearch(filters);
  }, [filters, onSearch]);

  const handleClear = useCallback(() => {
    setFilters(initialFilters);
    setQueries(initialQueries);
    setOpenDropdown(null);
    onClear();
  }, [onClear]);

  /* ============================================================
     FILTERED OPTION LISTS
  ============================================================ */

  const filteredStatuses = useMemo(
    () =>
      statusOptions.filter((o) =>
        o.toLowerCase().includes(queries.taskStatuses.toLowerCase())
      ),
    [queries.taskStatuses]
  );

  const filteredDivisions = useMemo(
    () =>
      divisionOptions.filter((o) =>
        o.toLowerCase().includes(queries.division.toLowerCase())
      ),
    [queries.division]
  );

  const filteredCapabilities = useMemo(
    () =>
      capabilityOptions.filter((o) =>
        o.toLowerCase().includes(queries.capabilities.toLowerCase())
      ),
    [queries.capabilities]
  );

  const filteredPwa = useMemo(
    () =>
      pwaOptions.filter((o) =>
        o.toLowerCase().includes(queries.pwa.toLowerCase())
      ),
    [queries.pwa]
  );

  const filteredResponses = useMemo(
    () =>
      responseOptions.filter((o) =>
        o.toLowerCase().includes(queries.responseCode.toLowerCase())
      ),
    [queries.responseCode]
  );

  const filteredCommits = useMemo(
    () =>
      commitOptions.filter((o) =>
        o.toLowerCase().includes(queries.commitType.toLowerCase())
      ),
    [queries.commitType]
  );

  const filteredDomains = useMemo(
    () =>
      domainOptions.filter((o) =>
        o.toLowerCase().includes(queries.domainId.toLowerCase())
      ),
    [domainOptions, queries.domainId]
  );

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white border border-gray-200 rounded-xl shadow-md p-0"
    >
      {/* ------------------------------------------------------------------ */}
      {/* HEADER */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="flex items-center justify-between gap-4 
    bg-[#0A4A7A] text-white px-5 py-3 
    border-b border-black/20 rounded-t-xl shadow-sm"
      >
        <h2 className="text-sm font-semibold text-white tracking-tight">
          Search Tasks
        </h2>

        <div className="relative flex-1 max-w-[420px]">
          <input
            type="text"
            name="taskSearch"
            value={filters.taskSearch}
            onChange={handleChange}
            placeholder="Search by Work ID, Resource ID, or Task ID"
            className="w-full h-[36px] border border-white/20 rounded-lg px-9 text-sm text-center 
            bg-white/15 text-white placeholder:text-white/70
            shadow-inner focus:ring-2 focus:ring-white/40 focus:border-white"
          />
          <Search
            size={16}
            className="absolute left-2.5 top-2.5 text-white/80"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFavourite((p) => !p)}
            className="text-white hover:text-white/90 transition"
          >
            <Star size={18} fill={isFavourite ? "#facc15" : "none"} />
          </button>

          <button
            onClick={() => setCardCollapsed((p) => !p)}
            className="text-white hover:text-white/90 transition"
          >
            {cardCollapsed ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* FILTER GRID */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence initial={false}>
        {!cardCollapsed && (
          <motion.div
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: "auto" },
              collapsed: { opacity: 0, height: 0 },
            }}
            transition={{ duration: 0.25 }}
            className="px-4 pb-3 pt-3 space-y-4"
          >
            {/* Row 1 */}
            <div className="flex flex-wrap justify-start gap-3 bg-white py-3 px-4 border border-gray-200 shadow-sm rounded-lg">
              {/* DIVISION */}
              <DropdownMultiSelect
                refObj={divisionRef}
                open={openDropdown === "division"}
                setOpen={(isOpen) =>
                  setOpenDropdown(isOpen ? "division" : null)
                }
                query={queries.division}
                setQuery={(value) => setQuery("division", value)}
                label="Division"
                options={filteredDivisions}
                selected={filters.division}
                toggle={(v: string) => toggleArrayValue("division", v)}
                handleSelectAll={() =>
                  handleSelectAll("division", filteredDivisions)
                }
                style={{ width: "clamp(160px,20vw,190px)" }}
              />

              {/* DOMAIN ID */}
              <DropdownMultiSelect
                refObj={domainRef}
                open={openDropdown === "domainId"}
                setOpen={(isOpen) =>
                  setOpenDropdown(isOpen ? "domainId" : null)
                }
                query={queries.domainId}
                setQuery={(value) => setQuery("domainId", value)}
                label="Domain ID"
                options={filteredDomains}
                selected={filters.domainId}
                toggle={(v: string) => toggleArrayValue("domainId", v)}
                handleSelectAll={() =>
                  handleSelectAll("domainId", filteredDomains)
                }
                style={{ width: "clamp(160px,20vw,190px)" }}
              />

              {/* TASK STATUS */}
              <DropdownMultiSelect
                refObj={statusRef}
                open={openDropdown === "taskStatuses"}
                setOpen={(isOpen) =>
                  setOpenDropdown(isOpen ? "taskStatuses" : null)
                }
                query={queries.taskStatuses}
                setQuery={(value) => setQuery("taskStatuses", value)}
                label="Task Status"
                options={filteredStatuses}
                selected={filters.taskStatuses}
                toggle={(v: string) => toggleArrayValue("taskStatuses", v)}
                handleSelectAll={() =>
                  handleSelectAll("taskStatuses", filteredStatuses)
                }
                style={{ width: "clamp(160px,22vw,210px)" }}
              />

              {/* REQUESTER */}
              <FilterInput
                name="requester"
                value={filters.requester}
                onChange={handleChange}
                placeholder="Requester"
                style={{ width: "clamp(160px,20vw,190px)" }}
              />

              {/* JOB TYPE */}
              <FilterInput
                name="jobType"
                value={filters.jobType}
                onChange={handleChange}
                placeholder="Job Type"
                style={{ width: "clamp(160px,20vw,190px)" }}
              />

              {/* COMMIT */}
              <DropdownMultiSelect
                refObj={commitRef}
                open={openDropdown === "commitType"}
                setOpen={(isOpen) =>
                  setOpenDropdown(isOpen ? "commitType" : null)
                }
                query={queries.commitType}
                setQuery={(value) => setQuery("commitType", value)}
                label="Commit Type"
                options={filteredCommits}
                selected={filters.commitType}
                toggle={(v: string) => toggleArrayValue("commitType", v)}
                handleSelectAll={() =>
                  handleSelectAll("commitType", filteredCommits)
                }
                style={{ width: "clamp(160px,22vw,210px)" }}
              />

              {/* RESPONSE CODE */}
              <DropdownMultiSelect
                refObj={responseRef}
                open={openDropdown === "responseCode"}
                setOpen={(isOpen) =>
                  setOpenDropdown(isOpen ? "responseCode" : null)
                }
                query={queries.responseCode}
                setQuery={(value) => setQuery("responseCode", value)}
                label="Response Code"
                options={filteredResponses}
                selected={filters.responseCode}
                toggle={(v: string) => toggleArrayValue("responseCode", v)}
                handleSelectAll={() =>
                  handleSelectAll("responseCode", filteredResponses)
                }
                style={{ width: "clamp(160px,20vw,190px)" }}
              />
            </div>

            {/* Row 2 - Aligned inputs */}
            <div className="flex flex-wrap items-end justify-start gap-4 bg-white py-3 px-4 border border-gray-200 shadow-sm rounded-lg">
              {/* IMP Score */}
              <div className="flex flex-col" style={{ width: "clamp(160px,16vw,200px)" }}>
                <label className="text-[11px] font-semibold text-gray-800 mb-[3px]">
                  IMP Score
                </label>
                <div className="flex items-center gap-2">
                  <FilterSelect
                    name="scoreCondition"
                    value={filters.scoreCondition}
                    onChange={handleChange}
                    placeholder="Condition"
                    options={[
                      { value: "greater", label: "Greater Than" },
                      { value: "less", label: "Less Than" },
                    ]}
                    style={{ width: "clamp(100px,10vw,140px)" }}
                  />
                  <FilterInput
                    name="scoreValue"
                    value={filters.scoreValue}
                    onChange={handleChange}
                    placeholder="Value"
                    style={{ width: "clamp(50px,5vw,70px)" }}
                  />
                </div>
              </div>

              {/* PWA Selector */}
              <div className="flex flex-col" style={{ width: "clamp(150px,18vw,220px)" }}>
                <label className="text-[11px] font-semibold text-gray-800 mb-[3px]">
                  PWA Selector
                </label>
                <DropdownMultiSelect
                  refObj={pwaRef}
                  open={openDropdown === "pwa"}
                  setOpen={(isOpen) => setOpenDropdown(isOpen ? "pwa" : null)}
                  query={queries.pwa}
                  setQuery={(value) => setQuery("pwa", value)}
                  label="Select PWA"
                  options={filteredPwa}
                  selected={filters.pwa}
                  toggle={(v: string) => toggleArrayValue("pwa", v)}
                  handleSelectAll={() => handleSelectAll("pwa", filteredPwa)}
                  style={{ width: "clamp(150px,18vw,220px)" }}
                />
              </div>

              {/* Location */}
              <div className="flex flex-col" style={{ width: "clamp(160px,18vw,220px)" }}>
                <label className="text-[11px] font-semibold text-gray-800 mb-[3px]">
                  Location Fields
                </label>
                <div className="flex items-center gap-2">
                  <FilterSelect
                    name="locationType"
                    value={filters.locationType}
                    onChange={handleChange}
                    placeholder="Type"
                    options={[
                      { value: "Postcode", label: "Postcode" },
                      { value: "Exchange", label: "Exchange" },
                      { value: "1141", label: "1141" },
                      { value: "GroupCode", label: "Group Code" },
                    ]}
                    className=""
                    style={{ width: "clamp(100px,10vw,140px)" }}
                  />
                  <FilterInput
                    name="locationValue"
                    value={filters.locationValue}
                    onChange={handleChange}
                    placeholder="Value"
                    style={{ width: "clamp(50px,6vw,70px)" }}
                  />
                </div>
              </div>

              {/* Capabilities */}
              <div className="flex flex-col" style={{ width: "clamp(150px,18vw,220px)" }}>
                <label className="text-[11px] font-semibold text-gray-800 mb-[3px]">
                  Capabilities
                </label>
                <DropdownMultiSelect
                  refObj={capabilityRef}
                  open={openDropdown === "capabilities"}
                  setOpen={(isOpen) =>
                    setOpenDropdown(isOpen ? "capabilities" : null)
                  }
                  query={queries.capabilities}
                  setQuery={(value) => setQuery("capabilities", value)}
                  label="Select Capabilities"
                  options={filteredCapabilities}
                  selected={filters.capabilities}
                  toggle={(v: string) => toggleArrayValue("capabilities", v)}
                  handleSelectAll={() =>
                    handleSelectAll("capabilities", filteredCapabilities)
                  }
                  style={{ width: "clamp(150px,18vw,220px)" }}
                />
              </div>

              {/* Date Range - Always at end */}
              <div className="flex flex-col ml-auto" style={{ width: "clamp(240px,28vw,380px)" }}>
                <label className="text-[11px] font-semibold text-gray-800 mb-[3px]">
                  Date Range
                </label>
                <DateRangeInputs filters={filters} handleChange={handleChange} />
              </div>
            </div>

            {/* Row 3 removed — DateRangeInputs moved into Row 2 */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <div className="flex justify-between items-center pt-2 border-t border-gray-200 px-4 pb-3 bg-slate-50 rounded-b-xl">
        <div className="flex gap-2">
          <button
            onClick={() =>
              canCopy && onCopy ? onCopy() : toast.error("No data to copy")
            }
            disabled={!canCopy}
            className={`text-xs px-3 py-1.5 border rounded-md shadow-sm transition
              ${
                canCopy
                  ? "border-gray-300 bg-white hover:bg-gray-100 text-gray-700"
                  : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
          >
            Copy
          </button>

          <button
            onClick={() =>
              canCopy && onExport
                ? onExport()
                : toast.error("No data to export")
            }
            disabled={!canCopy}
            className={`text-xs px-3 py-1.5 border rounded-md shadow-sm transition
              ${
                canCopy
                  ? "border-gray-300 bg-white hover:bg-gray-100 text-gray-700"
                  : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
          >
            CSV
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            className="text-xs px-3 py-1.5 border border-[#0A4A7A] bg-[#0A4A7A] text-white rounded-md hover:bg-[#08385E] shadow-sm"
          >
            Search
          </button>

          <button
            onClick={handleClear}
            className="text-xs px-3 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-100 shadow-sm"
          >
            Clear
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------
   SHARED COMPONENTS
------------------------------------------------------------ */

interface FilterInputProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

const FilterInput = ({
  name,
  value,
  onChange,
  placeholder,
  className = "",
  style,
}: FilterInputProps) => (
  <input
    type="text"
    name={name}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`${inputBase} ${className}`}
    style={style}
  />
);

interface FilterSelectProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  className?: string;
}

const FilterSelect = ({
  name,
  value,
  onChange,
  placeholder,
  options,
  className = "",
  style,
}: FilterSelectProps & { style?: React.CSSProperties }) => (
  <select
    name={name}
    value={value}
    onChange={onChange}
    className={`${selectBase} ${className}`}
    style={style}
  >
    <option value="" disabled hidden>
      {placeholder}
    </option>
    {options.map((opt) => (
      <option key={opt.value} value={opt.value} className="text-center">
        {opt.label}
      </option>
    ))}
  </select>
);

interface DropdownMultiSelectProps {
  refObj: React.RefObject<HTMLDivElement | null>;
  open: boolean;
  setOpen: (open: boolean) => void;
  query: string;
  setQuery: (value: string) => void;
  label: string;
  options: string[];
  selected: string[];
  toggle: (v: string) => void;
  handleSelectAll: () => void;
  className?: string;
}

const DropdownMultiSelect = ({
  refObj,
  open,
  setOpen,
  query,
  setQuery,
  label,
  options,
  selected,
  toggle,
  handleSelectAll,
  className = "",
  style,
}: DropdownMultiSelectProps & { style?: React.CSSProperties }) => {
  const allSelected =
    options.length > 0 && options.every((o) => selected.includes(o));

  return (
    <div ref={refObj} className={`relative ${className}`} style={style}>
      <div
        onClick={() => setOpen(!open)}
        className="w-full h-[34px] px-3 text-[12px] border border-gray-300 rounded-md bg-white text-gray-900 shadow-sm cursor-pointer flex items-center justify-between hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500/70"
      >
        <span className="truncate w-full text-center pr-4">
          {selected.length > 0 ? `${selected.length} selected` : label}
        </span>
        <ChevronDown size={14} className="text-gray-600 flex-shrink-0" />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="absolute z-[9999] mt-1 p-2 text-[12px] bg-white border border-gray-300 rounded-lg shadow-2xl w-full"
            style={{ minWidth: "min(90vw,320px)" }}
          >
            <input
              type="text"
              placeholder={`Filter ${label.toLowerCase()}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full mb-2 px-2 py-1 text-[12px] border border-gray-300 rounded-md shadow-sm bg-white focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500 text-center placeholder:text-center"
            />

            <div className="sticky top-0 px-2 py-1 mb-1 text-[12px] bg-slate-50 border border-gray-200 rounded-md flex justify-between items-center font-medium shadow-sm">
              <span className="text-gray-800">
                {allSelected ? "Clear All Results" : "Select All Results"}
              </span>
              {allSelected ? (
                <XSquare
                  size={16}
                  className="text-[#0A4A7A] cursor-pointer"
                  onClick={handleSelectAll}
                />
              ) : (
                <CheckSquare
                  size={16}
                  className="text-[#0A4A7A] cursor-pointer"
                  onClick={handleSelectAll}
                />
              )}
            </div>

            <div
              className="overflow-y-auto"
              style={{
                maxHeight: "calc(var(--vh, 1vh) * 45)",
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
                    onChange={() => toggle(o)}
                    className="accent-[#0A4A7A]"
                  />
                  <span className="text-gray-900">{o}</span>
                </label>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface DateRangeInputsProps {
  filters: Filters;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const DateRangeInputs = ({ filters, handleChange }: DateRangeInputsProps) => (
  <div className="flex flex-col">
    <div className="flex items-end gap-3">
      <div className="flex flex-col">
        <label className="text-[10px] font-medium text-gray-700 mb-[2px]">
          Date From
        </label>
        <div className="flex items-center gap-2">
          <input
            type="date"
            name="fromDate"
            value={filters.fromDate}
            onChange={handleChange}
            className="border border-gray-300 rounded-md text-[11px] px-2 h-[32px] shadow-sm bg-white focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
            style={{ width: "clamp(100px,12vw,120px)" }}
          />
          <input
            type="time"
            name="fromTime"
            value={filters.fromTime}
            onChange={handleChange}
            className="border border-gray-300 rounded-md text-[11px] px-2 h-[32px] shadow-sm bg-white focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
            style={{ width: "clamp(64px,6vw,80px)" }}
          />
        </div>
      </div>

      <div className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-700 text-xs font-bold shadow-sm mb-1">
        →
      </div>

      <div className="flex flex-col">
        <label className="text-[10px] font-medium text-gray-700 mb-[2px]">
          Date To
        </label>
        <div className="flex items-center gap-2">
          <input
            type="date"
            name="toDate"
            value={filters.toDate}
            onChange={handleChange}
            className="border border-gray-300 rounded-md text-[11px] px-2 h-[32px] shadow-sm bg-white focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
            style={{ width: "clamp(100px,12vw,120px)" }}
          />
          <input
            type="time"
            name="toTime"
            value={filters.toTime}
            onChange={handleChange}
            className="border border-gray-300 rounded-md text-[11px] px-2 h-[32px] shadow-sm bg-white focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
            style={{ width: "clamp(64px,6vw,80px)" }}
          />
        </div>
      </div>
    </div>
  </div>
);
