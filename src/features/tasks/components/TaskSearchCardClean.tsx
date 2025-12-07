import React, { useState, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckSquare, XSquare, Star, Eye, EyeOff, Search } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import mockTasks from "@/data/mockTasks.json";

type Filters = {
  taskSearch: string;
  division: string[];
  domainId: string[];
  taskStatuses: string[];
  requester: string;
  responseCode: string[];
  commitType: string[];
  capabilities: string[];
  pwa: string[];
  jobType: string;
  scoreCondition: string;
  scoreValue: string;
  locationType: string;
  locationValue: string;
  fromDate: string;
  fromTime: string;
  toDate: string;
  toTime: string;
};

type Props = {
  onSearch: (filters: Record<string, any>) => void;
  onClear: () => void;
  onCopy?: () => void;
  onExport?: () => void;
  canCopy?: boolean;
};

const inputBase = "border border-gray-200 rounded-md text-[12px] px-2 h-[36px] shadow-sm bg-white focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500";
const selectBase = "border border-gray-200 rounded-md text-[12px] px-2 h-[36px] shadow-sm bg-white focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500";

export default function TaskSearchCard({ onSearch, onClear, onCopy, onExport, canCopy = false }: Props) {
  const [filters, setFilters] = useState<Filters>({
    taskSearch: "",
    division: [],
    domainId: [],
    taskStatuses: [],
    requester: "",
    responseCode: [],
    commitType: [],
    capabilities: [],
    pwa: [],
    jobType: "",
    scoreCondition: "",
    scoreValue: "",
    locationType: "",
    locationValue: "",
    fromDate: "",
    fromTime: "",
    toDate: "",
    toTime: "",
  });

  const [cardCollapsed, setCardCollapsed] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
  const [showTimeInputs, setShowTimeInputs] = useState(true);
  
  const [openDropdown, setOpenDropdown] = useState<null | string>(null);
  const [queries, setQueries] = useState<Record<string, string>>({
    division: "",
    domainId: "",
    taskStatuses: "",
    responseCode: "",
    commitType: "",
    capabilities: "",
    pwa: "",
  });

  const setQuery = (key: string, value: string) => setQueries((q) => ({ ...q, [key]: value }));

  const uniq = (arr: (string | undefined | null)[]) => Array.from(new Set(arr.filter(Boolean) as string[])).sort();
  const uniqNoSort = (arr: (string | undefined | null)[]) => Array.from(new Set(arr.filter(Boolean) as string[]));
  const divisionOptions: string[] = uniq(mockTasks.map((t) => t.division));
  const domainOptions: string[] = uniq(mockTasks.map((t) => t.domain));
  const statusOptionsRaw: string[] = uniqNoSort(mockTasks.map((t) => t.taskStatus));
  const statusOptions: string[] = statusOptionsRaw.sort((a, b) => {
    const ra = a.match(/\(([^)]+)\)\s*$/);
    const rb = b.match(/\(([^)]+)\)\s*$/);
    const ca = (ra && ra[1]) ? ra[1] : a;
    const cb = (rb && rb[1]) ? rb[1] : b;
    return ca.localeCompare(cb);
  });
  const responseOptions: string[] = uniq(mockTasks.map((t) => t.responseCode));
  const commitOptions: string[] = uniq(mockTasks.map((t) => t.commitmentType));
  const capabilityOptions: string[] = uniq(mockTasks.flatMap((t) => t.capabilities || []));
  const pwaOptions: string[] = uniq(mockTasks.map((t) => t.pwa));
  const requesterOptions: string[] = uniq(mockTasks.map((t) => t.resourceName));
  const jobTypeOptions: string[] = uniq(mockTasks.map((t) => t.taskType));

  const divisionRef = useRef<HTMLDivElement | null>(null);
  const domainRef = useRef<HTMLDivElement | null>(null);
  const statusRef = useRef<HTMLDivElement | null>(null);
  const responseRef = useRef<HTMLDivElement | null>(null);
  const commitRef = useRef<HTMLDivElement | null>(null);
  const capabilityRef = useRef<HTMLDivElement | null>(null);
  const pwaRef = useRef<HTMLDivElement | null>(null);

  const filteredDivisions = useMemo(() => divisionOptions.filter((o) => o.toLowerCase().includes(queries.division.toLowerCase())), [queries.division]);
  const filteredDomains = useMemo(() => domainOptions.filter((o) => o.toLowerCase().includes(queries.domainId.toLowerCase())), [queries.domainId, domainOptions]);
  const filteredStatuses = useMemo(() => statusOptions.filter((o) => o.toLowerCase().includes(queries.taskStatuses.toLowerCase())), [queries.taskStatuses]);
  const filteredResponses = useMemo(() => responseOptions.filter((o) => o.toLowerCase().includes(queries.responseCode.toLowerCase())), [queries.responseCode]);
  const filteredCommits = useMemo(() => commitOptions.filter((o) => o.toLowerCase().includes(queries.commitType.toLowerCase())), [queries.commitType]);
  const filteredCapabilities = useMemo(() => capabilityOptions.filter((o) => o.toLowerCase().includes(queries.capabilities.toLowerCase())), [queries.capabilities]);
  const filteredPwa = useMemo(() => pwaOptions.filter((o) => o.toLowerCase().includes(queries.pwa.toLowerCase())), [queries.pwa]);

  const toggleArrayValue = (key: keyof Filters, value: string) => {
    setFilters((prev) => {
      const arr = new Set<string>(prev[key] as unknown as string[]);
      if (arr.has(value)) arr.delete(value); else arr.add(value);
      return { ...prev, [key]: Array.from(arr) } as Filters;
    });
  };

  const handleSelectAll = (key: keyof Filters, options: string[]) => {
    setFilters((prev) => ({ ...prev, [key]: options }) as Filters);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value } as Filters));
  };

  const handleSearch = useCallback(() => {
    onSearch(filters);
  }, [filters, onSearch]);

  const handleClearLocal = () => {
    setFilters({
      taskSearch: "",
      division: [],
      domainId: [],
      taskStatuses: [],
      requester: "",
      responseCode: [],
      commitType: [],
      capabilities: [],
      pwa: [],
      jobType: "",
      scoreCondition: "",
      scoreValue: "",
      locationType: "",
      locationValue: "",
      fromDate: "",
      fromTime: "",
      toDate: "",
      toTime: "",
    });
    onClear();
  };

  const canSearch = filters.taskSearch.trim().length > 0 || (filters.division.length > 0 && filters.domainId.length > 0);

  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="relative bg-white border border-gray-200 rounded-xl shadow-sm p-0">
      <Toaster />
      {/* Header */}
      <div className="bg-[#0A4A7A] text-white px-5 pt-4 pb-3 rounded-t-xl shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight">Search Tasks</h2>
            <p className="text-[11px] text-white/80">Use global search or set Division + Domain.</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Inline compact Date/Time on right side */}
            <div className="hidden md:flex items-end gap-3">
              <div className="flex flex-col">
                <label className="text-[10px] font-semibold text-white mb-[2px]">From</label>
                <div className="flex items-center gap-1">
                  <input type="date" name="fromDate" value={filters.fromDate} onChange={handleChange as any} className="border border-white/30 rounded-md text-[11px] px-2 h-[30px] shadow-sm bg-white/15 text-white placeholder:text-white/70 focus:ring-2 focus:ring-white/40 focus:border-white" style={{ width: "clamp(110px,12vw,140px)" }} />
                  <input type="time" name="fromTime" value={filters.fromTime} onChange={handleChange as any} className="border border-white/30 rounded-md text-[11px] px-2 h-[30px] shadow-sm bg-white/15 text-white placeholder:text-white/70 focus:ring-2 focus:ring-white/40 focus:border-white" style={{ width: "clamp(70px,7vw,90px)" }} />
                </div>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-semibold text-white mb-[2px]">To</label>
                <div className="flex items-center gap-1">
                  <input type="date" name="toDate" value={filters.toDate} onChange={handleChange as any} className="border border-white/30 rounded-md text-[11px] px-2 h-[30px] shadow-sm bg-white/15 text-white placeholder:text-white/70 focus:ring-2 focus:ring-white/40 focus:border-white" style={{ width: "clamp(110px,12vw,140px)" }} />
                  <input type="time" name="toTime" value={filters.toTime} onChange={handleChange as any} className="border border-white/30 rounded-md text-[11px] px-2 h-[30px] shadow-sm bg-white/15 text-white placeholder:text-white/70 focus:ring-2 focus:ring-white/40 focus:border-white" style={{ width: "clamp(70px,7vw,90px)" }} />
                </div>
              </div>
            </div>
            {/* Header actions */}
            <button onClick={() => setIsFavourite((p) => !p)} aria-label="Toggle favorite" className="text-white hover:text-white/90 transition"><Star size={18} fill={isFavourite ? "#facc15" : "none"} /></button>
            <button onClick={() => setCardCollapsed((p) => !p)} aria-label="Collapse filters" className="text-white hover:text-white/90 transition">{cardCollapsed ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
        </div>
        <div className="relative mt-3">
          <input
            type="text"
            name="taskSearch"
            value={filters.taskSearch}
            onChange={handleChange}
            placeholder="Search by Work ID, Resource ID, or Task ID"
            className="w-full h-[42px] border border-white/25 rounded-md pl-9 pr-3 text-[13px] bg-white/15 text-white placeholder:text-white/70 shadow-inner focus:ring-2 focus:ring-white/40 focus:border-white"
          />
          <Search size={16} className="absolute left-2.5 top-2.5 text-white/80" />
        </div>
        {/* Quick presets */}
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { label: "My Tasks", onClick: () => toast("Preset: My Tasks") },
            { label: "Due Today", onClick: () => toast("Preset: Due Today") },
            { label: "High IMP", onClick: () => setFilters((f) => ({ ...f, scoreCondition: "greater", scoreValue: "80" })) },
          ].map((p) => (
            <button key={p.label} type="button" onClick={p.onClick} className="text-[11px] px-2 py-1 rounded-full bg-white/15 text-white border border-white/25 hover:bg-white/25">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence initial={false}>
        {!cardCollapsed && (
          <motion.div initial="collapsed" animate="open" exit="collapsed" variants={{ open: { opacity: 1, height: "auto" }, collapsed: { opacity: 0, height: 0 } }} transition={{ duration: 0.25 }} className={`px-5 pt-4 pb-5 space-y-5`}>
            {/* Chips under header */}
            <div className="flex gap-2 items-center min-h-[32px] h-[32px] overflow-hidden">
              {(() => {
                const chips: Array<{ label: string; key: keyof Filters; value?: string; valueArr?: string[] }> = [];
                (["taskSearch","requester","jobType","scoreValue","locationValue"] as Array<keyof Filters>).forEach((k) => {
                  const v = (filters as any)[k] as string; if (v && v.trim()) chips.push({ label: String(k), key: k, value: v });
                });
                if (filters.scoreCondition) chips.push({ label: "scoreCondition", key: "scoreCondition", value: filters.scoreCondition });
                if (filters.locationType) chips.push({ label: "locationType", key: "locationType", value: filters.locationType });
                (["division","domainId","taskStatuses","responseCode","commitType","capabilities"] as Array<keyof Filters>).forEach((k) => {
                  const arr = (filters as any)[k] as string[]; if (Array.isArray(arr) && arr.length) chips.push({ label: String(k), key: k, valueArr: arr });
                });
                if (filters.fromDate) chips.push({ label: "fromDate", key: "fromDate", value: filters.fromDate });
                if (filters.toDate) chips.push({ label: "toDate", key: "toDate", value: filters.toDate });
                const friendly: Record<string,string> = {
                  taskSearch: "Search",
                  requester: "Requester",
                  jobType: "Job Type",
                  scoreValue: "IMP Score",
                  locationValue: "Location Value",
                  scoreCondition: "IMP Cond",
                  locationType: "Location Type",
                  division: "Division",
                  domainId: "Domain",
                  taskStatuses: "Task Status",
                  responseCode: "Response",
                  commitType: "Commitment",
                  capabilities: "Capabilities",
                  fromDate: "From",
                  toDate: "To",
                };
                return chips.map((c, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] bg-slate-100/80 text-gray-800 border border-gray-200 whitespace-nowrap">
                    <span className="font-medium">{friendly[c.label] ?? c.label}:</span>
                    <span className="truncate max-w-[220px]">{c.value ?? (c.valueArr || []).join(', ')}</span>
                    <button type="button" className="ml-1 text-gray-500 hover:text-gray-700" onClick={() => { setFilters((prev) => { const next = { ...prev } as any; if (c.value !== undefined) { next[c.key] = ''; } else { next[c.key] = []; } return next as Filters; }); }}>×</button>
                  </span>
                ));
              })()}
            </div>
            {/* Tabs */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 border-b border-gray-200">
                <button type="button" onClick={() => { setActiveTab('basic'); setShowAdvanced(false); }} className={`px-3 py-1.5 text-[12px] rounded-t-md ${activeTab === 'basic' ? 'bg-slate-100 text-gray-900 border-b-2 border-[#0A4A7A]' : 'text-gray-700 hover:bg-slate-50'}`}>Basic</button>
                <button type="button" onClick={() => { setActiveTab('advanced'); setShowAdvanced(true); }} className={`px-3 py-1.5 text-[12px] rounded-t-md ${activeTab === 'advanced' ? 'bg-slate-100 text-gray-900 border-b-2 border-[#0A4A7A]' : 'text-gray-700 hover:bg-slate-50'}`}>Advanced</button>
              </div>
              {/* helper text shown only in header; intentionally omitted here */}
            </div>

            {/* Basic section */}
            {activeTab === 'basic' && (
            <div className={`space-y-3`}>
              <div className={`grid grid-cols-12 gap-2 items-end`}>
                <div className="col-span-12 sm:col-span-6 md:col-span-1 flex flex-col">
                  <label className="text-[11px] font-semibold text-gray-800 mb-[2px] leading-tight">Division</label>
                  <DropdownMultiSelect refObj={divisionRef} open={openDropdown === 'division'} setOpen={(o) => setOpenDropdown(o ? 'division' : null)} query={queries.division} setQuery={(v) => setQuery('division', v)} label="Division *" options={filteredDivisions} selected={filters.division} toggle={(v: string) => toggleArrayValue('division', v)} handleSelectAll={() => handleSelectAll('division', filteredDivisions)} />
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-1 flex flex-col">
                  <label className="text-[11px] font-semibold text-gray-800 mb-[2px] leading-tight">Domain ID</label>
                  <DropdownMultiSelect refObj={domainRef} open={openDropdown === 'domainId'} setOpen={(o) => setOpenDropdown(o ? 'domainId' : null)} query={queries.domainId} setQuery={(v) => setQuery('domainId', v)} label="Domain ID *" options={filteredDomains} selected={filters.domainId} toggle={(v: string) => toggleArrayValue('domainId', v)} handleSelectAll={() => handleSelectAll('domainId', filteredDomains)} />
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-1 flex flex-col">
                  <label className="text-[11px] font-semibold text-gray-800 mb-[2px] leading-tight">Task Status</label>
                  <DropdownMultiSelect refObj={statusRef} open={openDropdown === 'taskStatuses'} setOpen={(o) => setOpenDropdown(o ? 'taskStatuses' : null)} query={queries.taskStatuses} setQuery={(v) => setQuery('taskStatuses', v)} label="Task Status" options={filteredStatuses} selected={filters.taskStatuses} toggle={(v: string) => toggleArrayValue('taskStatuses', v)} handleSelectAll={() => handleSelectAll('taskStatuses', filteredStatuses)} />
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-1 flex flex-col">
                  <label className="text-[11px] font-semibold text-gray-800 mb-[2px] leading-tight">Commit Type</label>
                  <DropdownMultiSelect refObj={commitRef} open={openDropdown === 'commitType'} setOpen={(o) => setOpenDropdown(o ? 'commitType' : null)} query={queries.commitType} setQuery={(v) => setQuery('commitType', v)} label="Commit Type" options={filteredCommits} selected={filters.commitType} toggle={(v: string) => toggleArrayValue('commitType', v)} handleSelectAll={() => handleSelectAll('commitType', filteredCommits)} />
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-2 flex flex-col">
                  <label className="text-[11px] font-semibold text-gray-800 mb-[2px] leading-tight">PWA Selector</label>
                  <DropdownMultiSelect refObj={pwaRef} open={openDropdown === 'pwa'} setOpen={(o) => setOpenDropdown(o ? 'pwa' : null)} query={queries.pwa} setQuery={(v) => setQuery('pwa', v)} label="PWA Selector" options={filteredPwa} selected={filters.pwa} toggle={(v: string) => toggleArrayValue('pwa', v)} handleSelectAll={() => handleSelectAll('pwa', filteredPwa)} />
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-2 flex flex-col">
                  <label className="text-[11px] font-semibold text-gray-800 mb-[2px] leading-tight">Capabilities</label>
                  <DropdownMultiSelect refObj={capabilityRef} open={openDropdown === 'capabilities'} setOpen={(o) => setOpenDropdown(o ? 'capabilities' : null)} query={queries.capabilities} setQuery={(v) => setQuery('capabilities', v)} label="Select Capabilities" options={filteredCapabilities} selected={filters.capabilities} toggle={(v: string) => toggleArrayValue('capabilities', v)} handleSelectAll={() => handleSelectAll('capabilities', filteredCapabilities)} />
                </div>
                
              </div>
            </div>
            )}

            {activeTab === 'advanced' && (
              <div className={`space-y-3`}>
                <div className={`grid grid-cols-12 lg:grid-cols-16 gap-2 items-end`}>
                  <div className="col-span-12 sm:col-span-6 md:col-span-2 lg:col-span-2 flex flex-col">
                    <label className="text-[11px] font-semibold text-gray-800 mb-[2px] leading-tight">Requester</label>
                    <FilterInput name="requester" value={filters.requester} onChange={handleChange as any} placeholder="Type to match requester (partial)" />
                  </div>
                  <div className="col-span-12 sm:col-span-6 md:col-span-2 lg:col-span-2 flex flex-col">
                    <label className="text-[11px] font-semibold text-gray-800 mb-[2px] leading-tight">Job Type</label>
                    <FilterInput name="jobType" value={filters.jobType} onChange={handleChange as any} placeholder="Type to match job type (partial)" />
                  </div>
                  <div className="col-span-12 sm:col-span-6 md:col-span-1 lg:col-span-1 flex flex-col">
                    <label className="text-[11px] font-semibold text-gray-800 mb-[2px] leading-tight">Location Type</label>
                    <FilterSelect name="locationType" value={filters.locationType} onChange={handleChange} placeholder="Type" options={[{ value: 'postCode', label: 'Postcode' }, { value: 'location', label: 'Location' }, { value: 'groupCode', label: 'Group Code' }]} />
                  </div>
                  <div className="col-span-12 sm:col-span-6 md:col-span-1 lg:col-span-1 flex flex-col">
                    <label className="text-[11px] font-semibold text-gray-800 mb-[2px] leading-tight">Location Value</label>
                    <FilterInput name="locationValue" value={filters.locationValue} onChange={handleChange} placeholder="Value" />
                  </div>
                  <div className="col-span-12 sm:col-span-6 md:col-span-1 lg:col-span-1 flex flex-col">
                    <label className="text-[11px] font-semibold text-gray-800 mb-[2px] leading-tight">IMP Condition</label>
                    <FilterSelect name="scoreCondition" value={filters.scoreCondition} onChange={handleChange} placeholder="Condition" options={[{ value: 'greater', label: 'Greater Than' }, { value: 'less', label: 'Less Than' }]} />
                  </div>
                  <div className="col-span-12 sm:col-span-6 md:col-span-1 lg:col-span-1 flex flex-col">
                    <label className="text-[11px] font-semibold text-gray-800 mb-[2px] leading-tight">IMP Value</label>
                    <FilterInput name="scoreValue" value={filters.scoreValue} onChange={handleChange} placeholder="Value" />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className={`sticky bottom-0 z-20 flex justify-between items-center pt-2 border-t border-gray-200 px-4 pb-3 bg-slate-50 rounded-b-xl`}>
        <div className="relative flex items-center gap-2">
          {/* More menu styled like dropdown */}
          <div className="relative">
            <button type="button" onClick={() => setOpenDropdown(openDropdown === 'more' ? null : 'more')} className="w-full h-[30px] px-3 text-[12px] border border-gray-300 rounded-md bg-white text-gray-900 shadow-sm cursor-pointer flex items-center justify-between hover:border-gray-400">
              <span>More</span>
              <ChevronDown size={14} className="text-gray-600" />
            </button>
            <AnimatePresence>
              {openDropdown === 'more' && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="absolute z-30 mt-1 p-2 text-[12px] bg-white border border-gray-300 rounded-lg shadow-2xl min-w-[180px]">
                  <button onClick={() => canCopy && onCopy ? onCopy() : toast.error('No data to copy')} disabled={!canCopy} className={`w-full text-left px-2 py-1 rounded ${canCopy ? 'hover:bg-gray-100' : 'opacity-50 cursor-not-allowed'}`}>Copy</button>
                  <button onClick={() => canCopy && onExport ? onExport() : toast.error('No data to export')} disabled={!canCopy} className={`w-full text-left px-2 py-1 rounded ${canCopy ? 'hover:bg-gray-100' : 'opacity-50 cursor-not-allowed'}`}>Export</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {!canSearch && (<span className="text-[11px] text-gray-500">Select Division and Domain ID, or type in the global search.</span>)}
          <button onClick={handleSearch} className={`text-xs px-3 py-1.5 border border-[#0A4A7A] bg-[#0A4A7A] text-white rounded-md hover:bg-[#08385E] shadow-sm disabled:opacity-50`} disabled={!canSearch}>Search</button>
          <button onClick={handleClearLocal} className={`text-xs px-3 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-100 shadow-sm`}>Clear</button>
        </div>
      </div>
    </motion.div>
  );
}

interface FilterInputProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

const FilterInput = ({ name, value, onChange, placeholder, className = "", style }: FilterInputProps) => (
  <input type="text" name={name} value={value} onChange={onChange} placeholder={placeholder} className={`${inputBase} ${className}`} style={style} aria-label={placeholder || name} />
);

interface FilterSelectProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  className?: string;
  style?: React.CSSProperties;
}

const FilterSelect = ({ name, value, onChange, placeholder, options, className = "", style }: FilterSelectProps) => (
  <select name={name} value={value} onChange={onChange} className={`${selectBase} ${className}`} style={style} aria-label={placeholder}>
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
  handleSelectAll: () => void; // legacy, not used; kept for compat
  className?: string;
  style?: React.CSSProperties;
}

const DropdownMultiSelect = ({ refObj, open, setOpen, query, setQuery, label, options, selected, toggle, handleSelectAll, className = "", style }: DropdownMultiSelectProps) => {
  const filteredOptions = (query || "")
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;
  const allSelectedFiltered = filteredOptions.length > 0 && filteredOptions.every((o) => selected.includes(o));
  const preview = selected.slice(0, 2);
  const moreCount = selected.length - preview.length;
  const [openUp, setOpenUp] = React.useState(false);

  // click-away close
  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const el = refObj?.current;
      if (!el) return;
      if (open && !el.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open, setOpen, refObj]);

  // auto-flip dropdown upwards if not enough space below
  React.useEffect(() => {
    if (!open) return;
    const el = refObj?.current;
    if (!el) return;
    const triggerRect = el.getBoundingClientRect();
    const viewportH = window.innerHeight || document.documentElement.clientHeight;
    const estimatedMenuH = Math.min(viewportH * 0.35, 320); // matches maxHeight logic below (smaller for more scrolling)
    const spaceBelow = viewportH - triggerRect.bottom;
    setOpenUp(spaceBelow < estimatedMenuH + 16); // include margins
  }, [open, refObj]);

  function handleSelectAllFiltered() {
    if (allSelectedFiltered) {
      // Clear only the currently filtered items
      filteredOptions.forEach((o) => {
        if (selected.includes(o)) toggle(o);
      });
    } else {
      // Add all filtered items
      filteredOptions.forEach((o) => {
        if (!selected.includes(o)) toggle(o);
      });
    }
  }

  return (
    <div ref={refObj} className={`relative ${className}`} style={style}>
      <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)} className="w-full min-h-[36px] px-3 text-[12px] border border-gray-300 rounded-lg bg-white text-gray-900 shadow-sm cursor-pointer flex items-center justify-between hover:border-gray-400 focus:ring-2 focus:ring-blue-500/60">
        <div className="flex items-center gap-1 min-w-0">
          {selected.length === 0 ? (
            <span className="text-gray-500">{label}</span>
          ) : (
            <div className="flex flex-nowrap items-center gap-1 overflow-hidden">
              {preview.map((v) => (
                <span key={v} className="px-2 py-0.5 rounded-full bg-slate-100 text-gray-800 border border-gray-200 whitespace-nowrap">{v}</span>
              ))}
              {moreCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-gray-700 border border-gray-200 whitespace-nowrap">+{moreCount}</span>
              )}
            </div>
          )}
        </div>
        <ChevronDown size={14} className="text-gray-600 flex-shrink-0" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="absolute z-[9999] p-2 text-[12px] bg-white border border-gray-300 rounded-lg shadow-2xl w-full"
            style={openUp ? { bottom: 'calc(100% + 4px)', minWidth: 'min(90vw,320px)' } : { marginTop: '4px', minWidth: 'min(90vw,320px)' }}
          >
            <input type="text" placeholder={`Filter ${label.toLowerCase()}...`} value={query} onChange={(e) => setQuery(e.target.value)} autoFocus className="w-full mb-2 px-2 py-1 text-[12px] border border-gray-300 rounded-md shadow-sm bg-white focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500 text-center placeholder:text-center" />
            <div className="sticky top-0 px-2 py-1 mb-1 text-[12px] bg-slate-50 border border-gray-200 rounded-md flex justify-between items-center font-medium shadow-sm">
              <span className="text-gray-800">{allSelectedFiltered ? "Clear All" : "Select All"}</span>
              {allSelectedFiltered ? (
                <XSquare size={16} className="text-[#0A4A7A] cursor-pointer" onClick={handleSelectAllFiltered} />
              ) : (
                <CheckSquare size={16} className="text-[#0A4A7A] cursor-pointer" onClick={handleSelectAllFiltered} />
              )}
            </div>
            <div className="overflow-y-auto pb-3" style={{ maxHeight: "calc(var(--vh, 1vh) * 35)", scrollbarWidth: "thin", scrollbarColor: "#9ca3af #e5e7eb" }}>
              {filteredOptions.length === 0 ? (
                <div className="px-2 py-3 text-gray-500 text-center">No results</div>
              ) : (
                filteredOptions.map((o) => (
                  <label key={o} className="flex items-center gap-2 px-2 py-1 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                    <input type="checkbox" checked={selected.includes(o)} onChange={() => toggle(o)} className="accent-[#0A4A7A]" />
                    <span className="text-gray-900">{o}</span>
                  </label>
                ))
              )}
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
  <div className="flex items-start gap-4">
    <div className="flex flex-col">
      <label className="text-[11px] font-semibold text-gray-800 mb-[3px]">Date From</label>
      <div className="flex items-center gap-2">
        <input type="date" name="fromDate" value={filters.fromDate} onChange={handleChange} className="border border-gray-300 rounded-md text-[12px] px-2 h-[36px] shadow-sm bg-white focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500" style={{ width: "clamp(120px,12vw,150px)" }} />
        <input type="time" name="fromTime" value={filters.fromTime} onChange={handleChange} className="border border-gray-300 rounded-md text-[12px] px-2 h-[36px] shadow-sm bg-white focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500" style={{ width: "clamp(80px,7vw,110px)" }} />
      </div>
    </div>
    <div className="flex flex-col">
      <label className="text-[11px] font-semibold text-gray-800 mb-[3px]">Date To</label>
      <div className="flex items-center gap-2">
        <input type="date" name="toDate" value={filters.toDate} onChange={handleChange} className="border border-gray-300 rounded-md text-[12px] px-2 h-[36px] shadow-sm bg-white focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500" style={{ width: "clamp(120px,12vw,150px)" }} />
        <input type="time" name="toTime" value={filters.toTime} onChange={handleChange} className="border border-gray-300 rounded-md text-[12px] px-2 h-[36px] shadow-sm bg-white focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500" style={{ width: "clamp(80px,7vw,110px)" }} />
      </div>
    </div>
  </div>
);

interface HeaderDateRangeInputsProps {
  filters: Filters;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const HeaderDateRangeInputs = ({ filters, handleChange }: HeaderDateRangeInputsProps) => (
  <div className="flex items-start gap-4">
    <div className="flex flex-col">
      <label className="text-[11px] font-semibold text-white mb-[3px]">Date From</label>
      <div className="flex items-center gap-2">
        <input type="date" name="fromDate" value={filters.fromDate} onChange={handleChange} className="border border-white/30 rounded-md text-[12px] px-2 h-[34px] shadow-sm bg-white/15 text-white placeholder:text-white/70 focus:ring-2 focus:ring-white/40 focus:border-white" style={{ width: "clamp(120px,12vw,150px)" }} />
        <input type="time" name="fromTime" value={filters.fromTime} onChange={handleChange} className="border border_white/30 rounded-md text-[12px] px-2 h-[34px] shadow-sm bg-white/15 text-white placeholder:text-white/70 focus:ring-2 focus:ring-white/40 focus:border-white" style={{ width: "clamp(80px,7vw,110px)" }} />
      </div>
    </div>
    <div className="flex flex-col">
      <label className="text-[11px] font-semibold text-white mb-[3px]">Date To</label>
      <div className="flex items-center gap-2">
        <input type="date" name="toDate" value={filters.toDate} onChange={handleChange} className="border border-white/30 rounded-md text-[12px] px-2 h-[34px] shadow-sm bg-white/15 text-white placeholder:text-white/70 focus:ring-2 focus:ring-white/40 focus:border-white" style={{ width: "clamp(120px,12vw,150px)" }} />
        <input type="time" name="toTime" value={filters.toTime} onChange={handleChange} className="border border_white/30 rounded-md text-[12px] px-2 h-[34px] shadow-sm bg-white/15 text-white placeholder:text-white/70 focus:ring-2 focus:ring-white/40 focus:border-white" style={{ width: "clamp(80px,7vw,110px)" }} />
      </div>
    </div>
  </div>
);