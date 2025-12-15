import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Box,
  Button,
  Paper,
  Stack,
  Tab,
  Tabs,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { MultiSelectField, SingleSelectField, FreeTypeSelectField } from "@/shared-ui";

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

const MotionPaper = motion.create(Paper);

const ScheduleLiveSearch: React.FC<ScheduleLiveSearchProps> = ({
  mode = "task",
  onSearch,
  onClear,
  dropdownData,
  resetKey,
  hideActions,
}) => {
  const theme = useTheme();
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
  }, [mode]);

  const handleClear = () => {
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
    });
    setActiveTab("basic");
    setQuery({
      taskStatuses: "",
      responseCode: "",
      commitType: "",
      capabilities: "",
      pwa: "",
    });
    onClear();
  };

  useEffect(() => {
    if (hideActions) {
      onSearch(filters);
    }
  }, [filters, hideActions, onSearch]);

  const safe = (arr: string[] | undefined) => arr ?? [];
  const makeFilter = (list: string[], q: string) =>
    list.filter((option) => option.toLowerCase().includes(q.toLowerCase()));

  const filtered = {
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
  };

  const renderFieldGrid = (fields: React.ReactNode[]) => (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: {
        xs: '1fr',
        sm: mode === "resource" ? 'repeat(auto-fit, minmax(280px, 1fr))' : 'repeat(auto-fit, minmax(250px, 1fr))',
        md: mode === "resource" ? 'repeat(auto-fit, minmax(320px, 1fr))' : 'repeat(auto-fit, minmax(280px, 1fr))',
        lg: mode === "resource" ? 'repeat(auto-fit, minmax(350px, 1fr))' : 'repeat(auto-fit, minmax(300px, 1fr))',
        xl: mode === "resource" ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(320px, 1fr))'
      },
      gap: 2.5,
      alignItems: 'flex-start',
      width: 'fit-content',
      minWidth: '100%',
    }}>
      {fields}
    </Box>
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

  const advancedFields = [
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
    <SingleSelectField
      key="locationType"
      label="Location Type"
      options={[
        { label: 'Postcode', value: 'postCode' },
        { label: 'Location', value: 'location' },
        { label: 'Group Code', value: 'groupCode' },
      ]}
      value={filters.locationType || null}
      onChange={(val) => setFilters((prev) => ({ ...prev, locationType: val ?? '' }))}
    />,
    <FreeTypeSelectField
      key="locationValue"
      label="Location Value"
      options={[]}
      value={filters.locationValue}
      onChange={(next: string) => setFilters((prev) => ({ ...prev, locationValue: next }))}
    />,
    <SingleSelectField
      key="scoreCondition"
      label="IMP Condition"
      options={[
        { label: 'Greater Than', value: 'greater' },
        { label: 'Less Than', value: 'less' },
      ]}
      value={filters.scoreCondition || null}
      onChange={(val) => setFilters((prev) => ({ ...prev, scoreCondition: val ?? '' }))}
    />,
    <FreeTypeSelectField
      key="scoreValue"
      label="IMP Value"
      options={[]}
      value={filters.scoreValue}
      onChange={(next: string) => setFilters((prev) => ({ ...prev, scoreValue: next }))}
    />
  ];

  return (
    <MotionPaper
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      elevation={2}
      sx={{
        width: '100%',
        maxWidth: 'fit-content',
        minWidth: { xs: '100%', sm: '600px' },
        mx: 'auto',
        borderRadius: 3,
        display: 'inline-block',
      }}
    >
      <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, minWidth: 0 }}>
        <Box sx={{ borderBottom: mode === "resource" ? 0 : 1, borderColor: 'divider', mb: mode === "resource" ? 1 : 2 }}>
          {mode !== "resource" && (
            <Tabs value={activeTab} onChange={(_e, v) => setActiveTab(v)} variant="standard">
              <Tab value="basic" label="Basic" />
              <Tab value="advanced" label="Advanced" />
            </Tabs>
          )}
        </Box>

        {activeTab === "basic" && renderFieldGrid(basicFields)}

        {activeTab === "advanced" && mode !== "resource" && renderFieldGrid(advancedFields)}

        {!hideActions && (
          <Stack
            direction="row"
            justifyContent="flex-end"
            spacing={1.5}
            pt={1.5}
            mt={1.5}
            sx={{
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => onSearch(filters)}
              sx={{
                px: 3,
                fontWeight: 600,
                "&:hover": {
                  boxShadow: "0 12px 28px rgba(8,58,97,0.25)",
                },
              }}
            >
              Search
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleClear}
              sx={{
                px: 3,
                fontWeight: 600,
                borderColor: alpha(theme.palette.primary.main, 0.28),
                "&:hover": {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              Clear
            </Button>
          </Stack>
        )}
      </Box>
    </MotionPaper>
  );
};

export default ScheduleLiveSearch;