import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Box,
  Tab,
  Tabs,
  Grid,
  Fade,
} from "@mui/material";
import { MultiSelectField, FreeTypeSelectField, CombinedLocationField, ImpScoreField } from "@/shared-components";

export interface ScheduleLiveSearchFilters {
  taskSearch: string;
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
  calloutGroup: string;
}

export interface ScheduleLiveSearchProps {
  mode?: "task" | "resource";
  onSearch: (filters: ScheduleLiveSearchFilters) => void;
  onTabChange?: (tab: "task" | "resource") => void;
  dropdownData: {
    division?: string[];
    domainId?: string[];
    statuses?: string[];
    pwa?: string[];
    capabilities?: string[];
    commitmentTypes?: string[];
    responseCodes?: string[];
    resourceStatuses?: string[];
    requester?: string[];
    jobType?: string[];
  };
  resetKey?: number;
  clearKey?: number;
  hideActions?: boolean;
}

function extractBracketCode(label: string): string {
  const match = label.match(/\(([^)]+)\)/);
  return match ? match[1] : "";
}

function sortByBracketCode(list: string[]): string[] {
  return [...list].sort((a, b) => {
    const ca = extractBracketCode(a);
    const cb = extractBracketCode(b);
    if (ca === cb) return a.localeCompare(b);
    return ca.localeCompare(cb);
  });
}

const emptyFilters = (): ScheduleLiveSearchFilters => ({
  taskSearch: "",
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
  calloutGroup: "",
});

const ScheduleLiveSearch: React.FC<ScheduleLiveSearchProps> = ({
  mode = "task",
  onSearch,
  onTabChange,
  dropdownData,
  resetKey,
  clearKey,
  hideActions,
}) => {
  const [activeTab, setActiveTab] = useState<"task" | "resource">(mode === 'resource' ? 'resource' : 'task');

  const safe = (arr: string[] | undefined) => arr ?? [];
  const makeFilter = (list: string[], q?: string) =>
    list.filter((option) => (option ?? "").toLowerCase().includes((q ?? "").toLowerCase()));

  const filtered = useMemo(() => ({
    division: makeFilter(safe(dropdownData.division), ""),
    domainId: makeFilter(safe(dropdownData.domainId), ""),
    taskStatuses: makeFilter(
      sortByBracketCode(safe(dropdownData.statuses)),
      ""
    ),
    pwa: makeFilter(safe(dropdownData.pwa), ""),
    capabilities: makeFilter(
      safe(dropdownData.capabilities),
      ""
    ),
    commitType: makeFilter(
      safe(dropdownData.commitmentTypes),
      ""
    ),
    responseCode: makeFilter(
      safe(dropdownData.responseCodes),
      ""
    ),
    resourceStatuses: makeFilter(
      sortByBracketCode(safe(dropdownData.resourceStatuses)),
      ""
    ),
    requester: safe(dropdownData.requester),
    jobType: safe(dropdownData.jobType),
  }), [dropdownData]);

  type FI = { key?: string; node: React.ReactNode; xs?: number; sm?: number; md?: number };
  const renderFieldGrid = (fields: FI[]) => (
    <Grid container spacing={2} sx={{ width: '100%' }}>
      {fields.map((f, i) => (
        <Grid item key={f.key ?? i} xs={f.xs ?? 12} sm={f.sm ?? 6} md={f.md ?? 4} sx={{ minWidth: 0 }}>
          <Box sx={{ width: '100%' }}>{f.node}</Box>
        </Grid>
      ))}
    </Grid>
  );

  // local per-tab states
  const [filtersTask, setFiltersTask] = useState<ScheduleLiveSearchFilters>(() => {
    try {
      const stored = localStorage.getItem('scheduleLiveSearchFiltersTask');
      return stored ? { ...emptyFilters(), ...JSON.parse(stored) } : emptyFilters();
    } catch {
      return emptyFilters();
    }
  });
  const [filtersResource, setFiltersResource] = useState<ScheduleLiveSearchFilters>(() => {
    try {
      const stored = localStorage.getItem('scheduleLiveSearchFiltersResource');
      return stored ? { ...emptyFilters(), ...JSON.parse(stored) } : emptyFilters();
    } catch {
      return emptyFilters();
    }
  });

  // Save filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('scheduleLiveSearchFiltersTask', JSON.stringify(filtersTask));
  }, [filtersTask]);

  useEffect(() => {
    localStorage.setItem('scheduleLiveSearchFiltersResource', JSON.stringify(filtersResource));
  }, [filtersResource]);

  useEffect(() => {
    if (resetKey === 0) return; // Skip reset on initial mount to preserve loaded filters
    setFiltersTask(emptyFilters());
    setFiltersResource(emptyFilters());
    setActiveTab(mode === 'resource' ? 'resource' : 'task');
  }, [resetKey]);

  useEffect(() => {
    if (clearKey && clearKey > 0) {
      setFiltersTask(emptyFilters());
      setFiltersResource(emptyFilters());
    }
  }, [clearKey]);

  useEffect(() => setActiveTab(mode === 'resource' ? 'resource' : 'task'), [mode]);

  useEffect(() => {
    onTabChange?.(activeTab);
  }, [activeTab, onTabChange]);

  const getCurrent = () => (activeTab === 'resource' ? filtersResource : filtersTask);
  const setCurrent = (patch: Partial<ScheduleLiveSearchFilters>) => {
    if (activeTab === 'resource') setFiltersResource(prev => ({ ...prev, ...patch }));
    else setFiltersTask(prev => ({ ...prev, ...patch }));
  };

  const handlePwaChange = (next: string[]) => {
    setFiltersTask(prev => ({ ...prev, pwa: next }));
    setFiltersResource(prev => ({ ...prev, pwa: next }));
  };

  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (hideActions) {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      const current = getCurrent();
      debounceRef.current = window.setTimeout(() => onSearch(current), 300);
    }
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [filtersTask, filtersResource, activeTab, hideActions, onSearch]);

  // Define fields based on tab
  const getFields = () => {
    const cur = getCurrent();
    if (activeTab === 'resource') {
      return [
        { key: 'status', node: (
          <MultiSelectField label="Resource Status" options={filtered.resourceStatuses} value={cur.taskStatuses} onChange={(next) => setCurrent({ taskStatuses: next })} showSelectAll />
        ), md: 4 },
        { key: 'pwa', node: (
          <MultiSelectField label="PWA Selector" options={filtered.pwa} value={cur.pwa} onChange={(next) => handlePwaChange(next)} showSelectAll />
        ), md: 4 },
        { key: 'location', node: (
          <CombinedLocationField label="Location" locationType={cur.locationType} locationValue={cur.locationValue} onTypeChange={(v) => setCurrent({ locationType: v })} onValueChange={(v) => setCurrent({ locationValue: v })} />
        ), md: 4 },
        { key: 'calloutGroup', node: (
          <FreeTypeSelectField label="Callout Group" options={[]} value={cur.calloutGroup} onChange={(next) => setCurrent({ calloutGroup: next })} />
        ), md: 4 },
      ];
    } else {
      // Task tab
      return [
        { key: 'status', node: (
          <MultiSelectField label="Task Status" options={filtered.taskStatuses} value={cur.taskStatuses} onChange={(next) => setCurrent({ taskStatuses: next })} showSelectAll />
        ), md: 4 },
        { key: 'pwa', node: (
          <MultiSelectField label="PWA Selector" options={filtered.pwa} value={cur.pwa} onChange={(next) => handlePwaChange(next)} showSelectAll />
        ), md: 4 },
        { key: 'commitType', node: (
          <MultiSelectField label="Commit Type" options={filtered.commitType} value={cur.commitType} onChange={(next) => setCurrent({ commitType: next })} showSelectAll />
        ), md: 4 },
        { key: 'responseCode', node: (
          <MultiSelectField label="Response Code" options={filtered.responseCode} value={cur.responseCode} onChange={(next) => setCurrent({ responseCode: next })} showSelectAll />
        ), md: 4 },
        { key: 'capabilities', node: (
          <MultiSelectField label="Capabilities" options={filtered.capabilities} value={cur.capabilities} onChange={(next) => setCurrent({ capabilities: next })} showSelectAll />
        ), md: 4 },
        { key: 'requester', node: (
          <FreeTypeSelectField label="Requester" options={filtered.requester} value={cur.requester} onChange={(next) => setCurrent({ requester: next })} />
        ), md: 4 },
        { key: 'jobType', node: (
          <FreeTypeSelectField label="Job Type" options={filtered.jobType} value={cur.jobType} onChange={(next) => setCurrent({ jobType: next })} />
        ), md: 4 },
        { key: 'location', node: (
          <CombinedLocationField label="Location" locationType={cur.locationType} locationValue={cur.locationValue} onTypeChange={(v) => setCurrent({ locationType: v })} onValueChange={(v) => setCurrent({ locationValue: v })} />
        ), md: 4 },
        { key: 'impScore', node: (
          <ImpScoreField label="IMP Score" condition={(cur.scoreCondition as any) || ''} value={cur.scoreValue} onConditionChange={(next) => setCurrent({ scoreCondition: next })} onValueChange={(next) => setCurrent({ scoreValue: next })} />
        ), md: 4 },
      ];
    }
  };

  const fields = getFields();

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 }, minWidth: 0, m: 0, width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_e, v) => setActiveTab(v as any)}
          variant="standard"
          sx={{
            minHeight: 36,
            '& .MuiTabs-indicator': (theme) => ({
              backgroundColor: theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.primary.main,
            }),
          }}
        >
          <Tab value="task" label="Task" sx={{ minHeight: 36, px: 1 }} />
          <Tab value="resource" label="Resource" sx={{ minHeight: 36, px: 1 }} />
        </Tabs>
      </Box>

      <Fade in={true} key={activeTab} timeout={300}>
        {renderFieldGrid(fields)}
      </Fade>
    </Box>
  );
};

export default ScheduleLiveSearch;
