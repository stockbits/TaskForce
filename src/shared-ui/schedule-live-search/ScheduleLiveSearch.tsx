import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Tab,
  Tabs,
  Grid,
} from "@mui/material";
import { MultiSelectField, FreeTypeSelectField, CombinedLocationField } from "@/shared-ui";
import ImpScoreField from '@/shared-ui/text-fields/ImpScoreField';

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
  onClear: () => void;
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

const ScheduleLiveSearch: React.FC<ScheduleLiveSearchProps> = ({
  mode = "task",
  onSearch,
  onClear: _onClear,
  dropdownData,
  resetKey,
  hideActions,
}) => {
  const [activeTab, setActiveTab] = useState<"basic" | "advanced">("basic");
  const [filters, setFilters] = useState<ScheduleLiveSearchFilters>({
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

  const [query, setQuery] = useState<Record<string, string>>({
    division: "",
    domainId: "",
    taskStatuses: "",
    responseCode: "",
    commitType: "",
    capabilities: "",
    pwa: "",
  });

  useEffect(() => {
    setFilters({
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
    setActiveTab("basic");
    setQuery({
      taskStatuses: "",
      responseCode: "",
      commitType: "",
      capabilities: "",
      pwa: "",
    });
  }, [resetKey]);

  useEffect(() => {
    if (mode === "resource") {
      setActiveTab("basic");
    }
    // Reset filters when mode changes to keep searches independent
    setFilters({
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
  }, [mode]);

  useEffect(() => {
    if (hideActions) {
      onSearch(filters);
    }
  }, [filters, hideActions, onSearch]);

  const safe = (arr: string[] | undefined) => arr ?? [];
  const makeFilter = (list: string[], q?: string) =>
    list.filter((option) => (option ?? "").toLowerCase().includes((q ?? "").toLowerCase()));

  const filtered = useMemo(() => ({
    division: makeFilter(safe(dropdownData.division), query.division),
    domainId: makeFilter(safe(dropdownData.domainId), query.domainId),
    taskStatuses: makeFilter(
      sortByBracketCode(safe(dropdownData.statuses)),
      query.taskStatuses
    ),
    pwa: makeFilter(safe(dropdownData.pwa), query.pwa),
    capabilities: makeFilter(
      safe(dropdownData.capabilities),
      query.capabilities
    ),
    commitType: makeFilter(
      safe(dropdownData.commitmentTypes),
      query.commitType
    ),
    responseCode: makeFilter(
      safe(dropdownData.responseCodes),
      query.responseCode
    ),
    resourceStatuses: makeFilter(
      sortByBracketCode(safe(dropdownData.resourceStatuses)),
      ""
    ),
    requester: safe(dropdownData.requester),
    jobType: safe(dropdownData.jobType),
  }), [dropdownData, query]);

  const renderFieldGrid = (fields: React.ReactNode[]) => (
    <Grid container spacing={3}>
      {fields.map((field, index) => (
        <Grid item xs={12} md={fields.length === 1 ? 12 : 6} key={index}>
          {field}
        </Grid>
      ))}
    </Grid>
  );

  const basicFields = [
    <MultiSelectField
      key="status"
      label={mode === "resource" ? "Resource Status" : "Task Status"}
      options={mode === "resource" ? filtered.resourceStatuses : filtered.taskStatuses}
      value={filters.taskStatuses}
      onChange={(next: string[]) => setFilters((prev) => ({ ...prev, taskStatuses: next }))}
      showSelectAllIcon
    />,
    ...(mode === "resource" ? [
      <MultiSelectField
        key="pwa"
        label="PWA Selector"
        options={filtered.pwa}
        value={filters.pwa}
        onChange={(next: string[]) => setFilters((prev) => ({ ...prev, pwa: next }))}
        showSelectAllIcon
      />
    ] : [
      <MultiSelectField
        key="commitType"
        label="Commit Type"
        options={filtered.commitType}
        value={filters.commitType}
        onChange={(next: string[]) => setFilters((prev) => ({ ...prev, commitType: next }))}
        showSelectAllIcon
      />,
      <MultiSelectField
        key="responseCode"
        label="Response Code"
        options={filtered.responseCode}
        value={filters.responseCode}
        onChange={(next: string[]) => setFilters((prev) => ({ ...prev, responseCode: next }))}
        showSelectAllIcon
      />,
      <MultiSelectField
        key="pwa"
        label="PWA Selector"
        options={filtered.pwa}
        value={filters.pwa}
        onChange={(next: string[]) => setFilters((prev) => ({ ...prev, pwa: next }))}
        showSelectAllIcon
      />,
      <MultiSelectField
        key="capabilities"
        label="Capabilities"
        options={filtered.capabilities}
        value={filters.capabilities}
        onChange={(next: string[]) => setFilters((prev) => ({ ...prev, capabilities: next }))}
        showSelectAllIcon
      />
    ])
  ];

  let advancedFields = [
    <CombinedLocationField
      key="location"
      locationType={filters.locationType}
      locationValue={filters.locationValue}
      onTypeChange={(val) => setFilters((prev) => ({ ...prev, locationType: val }))}
      onValueChange={(val) => setFilters((prev) => ({ ...prev, locationValue: val }))}
    />,
    <ImpScoreField
      key="impScore"
      label="IMP Score"
      condition={(filters.scoreCondition as any) || ''}
      value={filters.scoreValue}
      onConditionChange={(next) => setFilters((prev) => ({ ...prev, scoreCondition: next }))}
      onValueChange={(next) => setFilters((prev) => ({ ...prev, scoreValue: next }))}
    />,
    <FreeTypeSelectField
      key="requester"
      label="Requester"
      options={filtered.requester}
      value={filters.requester}
      onChange={(next: string) => setFilters((prev) => ({ ...prev, requester: next }))}
    />,
    <FreeTypeSelectField
      key="jobType"
      label="Job Type"
      options={filtered.jobType}
      value={filters.jobType}
      onChange={(next: string) => setFilters((prev) => ({ ...prev, jobType: next }))}
    />,
  ];

  if (mode === "resource") {
    advancedFields.push(
      <FreeTypeSelectField
        key="calloutGroup"
        label="Callout Group"
        options={[]}
        value={filters.calloutGroup}
        onChange={(next: string) => setFilters((prev) => ({ ...prev, calloutGroup: next }))}
      />
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, minWidth: 0, m: 0 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={activeTab} 
            onChange={(_e, v) => setActiveTab(v)} 
            variant="standard"
            sx={{
              '& .MuiTabs-indicator': (theme) => ({
                backgroundColor: theme.palette.mode === 'dark' ? '#ffffff' : theme.palette.primary.main,
              }),
            }}
          >
            <Tab value="basic" label="Basic" />
            <Tab value="advanced" label="Advanced" />
          </Tabs>
      </Box>

      {activeTab === "basic" && renderFieldGrid(basicFields)}

        {activeTab === "advanced" && renderFieldGrid(advancedFields)}
    </Box>
  );
};

export default ScheduleLiveSearch;