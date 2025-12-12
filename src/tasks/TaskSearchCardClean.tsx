import React, { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import mockTasks from "@/data/mockTasks.json";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  Chip,
  Collapse,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Grid,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  Tooltip,
  useTheme,
} from "@mui/material";
import type {
  AutocompleteChangeDetails,
  AutocompleteChangeReason,
} from "@mui/material/Autocomplete";
import { Bookmark, ChevronDown, Eye, EyeOff, Search } from "lucide-react";
import FilterListIcon from '@mui/icons-material/FilterList';

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
  forceCollapsed?: boolean;
};

type ArrayFilterKey =
  | "division"
  | "domainId"
  | "taskStatuses"
  | "responseCode"
  | "commitType"
  | "capabilities"
  | "pwa";

type ChipDescriptor = {
  key: keyof Filters;
  label: string;
  displayValue: string;
  isArray: boolean;
};

const MotionCard = motion(Card);
const SELECT_ALL_VALUE = "__SELECT_ALL__";

const INITIAL_FILTERS: Filters = {
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
};

const friendlyNames: Record<keyof Filters, string> = {
  taskSearch: "Search",
  division: "Division",
  domainId: "Domain",
  taskStatuses: "Task Status",
  requester: "Requester",
  responseCode: "Response",
  commitType: "Commitment",
  capabilities: "Capabilities",
  pwa: "PWA",
  jobType: "Job Type",
  scoreCondition: "IMP Condition",
  scoreValue: "IMP Value",
  locationType: "Location Type",
  locationValue: "Location Value",
  fromDate: "From Date",
  fromTime: "From Time",
  toDate: "To Date",
  toTime: "To Time",
};

export default function TaskSearchCard({
  onSearch,
  onClear,
  onCopy,
  onExport,
  canCopy = false,
  forceCollapsed = false,
}: Props) {
  const theme = useTheme();
  const [filters, setFilters] = useState<Filters>(() => ({ ...INITIAL_FILTERS }));
  const [cardCollapsed, setCardCollapsed] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "advanced">("basic");
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [dateMenuAnchor, setDateMenuAnchor] = useState<null | HTMLElement>(null);

  const uniq = (arr: (string | null | undefined)[]) =>
    Array.from(new Set(arr.filter(Boolean) as string[]));

  const divisionOptions = useMemo(
    () => uniq(mockTasks.map((t) => t.division)).sort(),
    []
  );
  const domainOptions = useMemo(
    () => uniq(mockTasks.map((t) => t.domain)).sort(),
    []
  );
  const statusOptions = useMemo(() => {
    const raw = uniq(mockTasks.map((t) => t.taskStatus));
    return raw.sort((a, b) => {
      const matchA = a.match(/\(([^)]+)\)\s*$/);
      const matchB = b.match(/\(([^)]+)\)\s*$/);
      const labelA = matchA?.[1] ?? a;
      const labelB = matchB?.[1] ?? b;
      return labelA.localeCompare(labelB);
    });
  }, []);
  const responseOptions = useMemo(
    () => uniq(mockTasks.map((t) => t.responseCode)).sort(),
    []
  );
  const commitOptions = useMemo(
    () => uniq(mockTasks.map((t) => t.commitmentType)).sort(),
    []
  );
  const capabilityOptions = useMemo(
    () => uniq(mockTasks.flatMap((t) => t.capabilities || [])).sort(),
    []
  );
  const pwaOptions = useMemo(
    () => uniq(mockTasks.map((t) => t.pwa)).sort(),
    []
  );
  const requesterOptions = useMemo(
    () => uniq(mockTasks.map((t) => t.resourceName)).sort(),
    []
  );
  const jobTypeOptions = useMemo(
    () => uniq(mockTasks.map((t) => t.taskType)).sort(),
    []
  );

  // Standard box width (in `ch`) used across filter controls to keep consistent sizing.
  // If you later want per-field sizing, adjust `STANDARD_BOX_CH` or replace with
  // a mapping derived from server-side metadata.
  const STANDARD_BOX_CH = 18;

  const expectedMaxChars: Record<string, number> = {
    division: 30,
    domainId: 8,
    taskStatuses: 20,
    commitType: 18,
    responseCode: 8,
    pwa: 18,
    capabilities: 24,
    requester: 28,
    jobType: 22,
    locationValue: 32,
    locationType: 16,
    scoreValue: 6,
  };

  // Use a single standard width for all boxes so they align uniformly.
  const maxWidthFor = (_key: string) => `${STANDARD_BOX_CH}ch`;

  const canSearch = useMemo(() => {
    if (filters.taskSearch.trim().length > 0) return true;
    return filters.division.length > 0 && filters.domainId.length > 0;
  }, [filters.division.length, filters.domainId.length, filters.taskSearch]);

  const activeChips = useMemo<ChipDescriptor[]>(() => {
    const chips: ChipDescriptor[] = [];

    const singleKeys: Array<keyof Filters> = [
      "taskSearch",
      "requester",
      "jobType",
      "scoreCondition",
      "scoreValue",
      "locationType",
      "locationValue",
    ];

    singleKeys.forEach((key) => {
      const value = filters[key];
      if (typeof value === "string" && value.trim()) {
        chips.push({
          key,
          label: friendlyNames[key],
          displayValue: value,
          isArray: false,
        });
      }
    });

    const arrayKeys: ArrayFilterKey[] = [
      "division",
      "domainId",
      "taskStatuses",
      "responseCode",
      "commitType",
      "capabilities",
      "pwa",
    ];

    arrayKeys.forEach((key) => {
      const value = filters[key];
      if (value.length) {
        chips.push({
          key,
          label: friendlyNames[key],
          displayValue: value.join(", "),
          isArray: true,
        });
      }
    });

    if (filters.fromDate) {
      chips.push({
        key: "fromDate",
        label: friendlyNames.fromDate,
        displayValue: filters.fromDate,
        isArray: false,
      });
    }

    if (filters.toDate) {
      chips.push({
        key: "toDate",
        label: friendlyNames.toDate,
        displayValue: filters.toDate,
        isArray: false,
      });
    }

    return chips;
  }, [filters]);

  const handleFieldChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;
      setFilters((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleMultiChange = useCallback(
    (key: ArrayFilterKey, value: string[]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleChipDelete = useCallback((key: keyof Filters) => {
    setFilters((prev) => {
      const next: Filters = { ...prev };
      const current = next[key];
      if (Array.isArray(current)) {
        (next[key] as unknown as string[]) = [];
      } else {
        (next[key] as string) = "";
      }

      if (key === "fromDate") {
        next.fromTime = "";
      }

      if (key === "toDate") {
        next.toTime = "";
      }

      return next;
    });
  }, []);

  const handleSearch = useCallback(() => {
    onSearch(filters);
  }, [filters, onSearch]);

  const handleClear = useCallback(() => {
    setFilters({ ...INITIAL_FILTERS });
    onClear();
  }, [onClear]);

  // auto-collapse when parent requests it (e.g., results visible)
  React.useEffect(() => {
    if (forceCollapsed) setCardCollapsed(true);
  }, [forceCollapsed]);

  const handleMenuOpen = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setMenuAnchorEl(event.currentTarget);
    },
    []
  );

  const handleMenuClose = useCallback(() => {
    setMenuAnchorEl(null);
  }, []);

  const handleCopy = useCallback(() => {
    if (canCopy && onCopy) {
      onCopy();
    } else {
      toast.error("No data to copy");
    }
    handleMenuClose();
  }, [canCopy, handleMenuClose, onCopy]);

  const handleExport = useCallback(() => {
    if (canCopy && onExport) {
      onExport();
    } else {
      toast.error("No data to export");
    }
    handleMenuClose();
  }, [canCopy, handleMenuClose, onExport]);

  const quickPresets = useMemo(
    () => [
      {
        label: "My Tasks",
        action: () => toast("Preset: My Tasks"),
      },
      {
        label: "Due Today",
        action: () => toast("Preset: Due Today"),
      },
      {
        label: "High IMP",
        action: () =>
          setFilters((prev) => ({
            ...prev,
            scoreCondition: "greater",
            scoreValue: "80",
          })),
      },
    ],
    []
  );

  return (
    <MotionCard
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      sx={{
        borderRadius: '12px 12px 0 0',
        boxShadow: "0 18px 35px rgba(10, 74, 122, 0.12)",
        overflow: "hidden",
        width: "100%",
        maxWidth: '100%',
        mx: 0,
      }}
    >
      <Box sx={{ px: { xs: 2, md: 3 }, py: 0.5, bgcolor: 'transparent' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tabs
            value={activeTab}
            onChange={(_e, v) => setActiveTab(v)}
            variant="standard"
            sx={{ minHeight: 36 }}
          >
            <Tab value="basic" label="Basic" sx={{ minHeight: 36, px: 1 }} />
            <Tab value="advanced" label="Advanced" sx={{ minHeight: 36, px: 1 }} />
          </Tabs>

          <Box sx={{ flex: 1 }} />

          <Box sx={{ width: { xs: 140, sm: 260, md: 360 } }}>
            <TextField
              name="taskSearch"
              value={filters.taskSearch}
              onChange={handleFieldChange}
              placeholder="Global search"
              size="small"
              fullWidth
              InputProps={{ startAdornment: (<InputAdornment position="start"><Search size={16} /></InputAdornment>) }}
            />
          </Box>

          <IconButton
            onClick={(e) => setDateMenuAnchor(e.currentTarget)}
            size="small"
            sx={{ ml: 1 }}
            aria-label="date-filter"
          >
            <FilterListIcon fontSize="small" />
          </IconButton>

          <IconButton onClick={() => setIsFavourite((p) => !p)} size="small" sx={{ ml: 1 }} aria-label="favourite">
            <Bookmark size={16} fill={isFavourite ? "#facc15" : "none"} />
          </IconButton>
        </Box>
      </Box>

        <CardContent
          sx={{
            pt: 0.5,
            pb: 0,
            px: 2,
            maxHeight: 'none',
            overflowY: 'visible',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, maxHeight: 40, overflow: 'hidden', py: 0.5 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {(() => {
                const maxVisible = 1;
                const visible = activeChips.slice(0, maxVisible);
                const hidden = activeChips.slice(maxVisible);
                return (
                  <>
                    {visible.map((chip) => (
                      <Chip
                        key={`${chip.key}-${chip.displayValue}`}
                        label={`${chip.label}: ${chip.displayValue}`}
                        onDelete={() => handleChipDelete(chip.key)}
                        size="small"
                        variant="outlined"
                        sx={{ height: 28, fontSize: '0.75rem', '& .MuiChip-label': { px: 1 } }}
                      />
                    ))}

                    {hidden.length > 0 && (
                      <Tooltip
                        title={
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, p: 0.25 }}>
                            {hidden.map((c) => (
                              <Box key={`${c.key}-${c.displayValue}`} sx={{ px: 0.5 }}>
                                <Typography variant="caption">{`${c.label}: ${c.displayValue}`}</Typography>
                              </Box>
                            ))}
                          </Box>
                        }
                        arrow
                        placement="bottom"
                      >
                        <Chip label={`+${hidden.length}`} size="small" sx={{ height: 28 }} />
                      </Tooltip>
                    )}
                  </>
                );
              })()}
            </Box>
          </Box>

          {/* Tabs moved to top compact header row */}

          {activeTab === "basic" && (
            <Box mt={1}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.25 }}>
                  <Menu
                    anchorEl={dateMenuAnchor}
                    open={Boolean(dateMenuAnchor)}
                    onClose={() => setDateMenuAnchor(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  >
                    <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 220 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TextField
                          type="date"
                          name="fromDate"
                          label="From"
                          value={filters.fromDate}
                          onChange={handleFieldChange}
                          size="small"
                          InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                          type="time"
                          name="fromTime"
                          value={filters.fromTime}
                          onChange={handleFieldChange}
                          size="small"
                        />
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TextField
                          type="date"
                          name="toDate"
                          label="To"
                          value={filters.toDate}
                          onChange={handleFieldChange}
                          size="small"
                          InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                          type="time"
                          name="toTime"
                          value={filters.toTime}
                          onChange={handleFieldChange}
                          size="small"
                        />
                      </Stack>
                      <Button variant="contained" size="small" onClick={() => setDateMenuAnchor(null)}>
                        Apply
                      </Button>
                    </Box>
                  </Menu>
                </Box>
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={12} sm="auto" md="auto">
                    <Box sx={{ width: '100%', maxWidth: maxWidthFor('division'), px: 0.5, py: 0.25 }}>
                      <MultiSelectField
                        label="Division"
                        options={divisionOptions}
                        value={filters.division}
                        onChange={(value) => handleMultiChange("division", value)}
                        required
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm="auto" md="auto">
                    <Box sx={{ width: '100%', maxWidth: maxWidthFor('domainId'), px: 0.5, py: 0.25 }}>
                      <MultiSelectField
                        label="Domain ID"
                        options={domainOptions}
                        value={filters.domainId}
                        onChange={(value) => handleMultiChange("domainId", value)}
                        required
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm="auto" md="auto">
                    <Box sx={{ width: '100%', maxWidth: maxWidthFor('taskStatuses'), px: 0.5, py: 0.25 }}>
                      <MultiSelectField
                        label="Task Status"
                        options={statusOptions}
                        value={filters.taskStatuses}
                        onChange={(value) => handleMultiChange("taskStatuses", value)}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm="auto" md="auto">
                    <Box sx={{ width: '100%', maxWidth: maxWidthFor('commitType'), px: 0.5, py: 0.25 }}>
                      <MultiSelectField
                        label="Commit Type"
                        options={commitOptions}
                        value={filters.commitType}
                        onChange={(value) => handleMultiChange("commitType", value)}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm="auto" md="auto">
                    <Box sx={{ width: '100%', maxWidth: maxWidthFor('responseCode'), px: 0.5, py: 0.25 }}>
                      <MultiSelectField
                        label="Response Code"
                        options={responseOptions}
                        value={filters.responseCode}
                        onChange={(value) => handleMultiChange("responseCode", value)}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm="auto" md="auto">
                    <Box sx={{ width: '100%', maxWidth: maxWidthFor('pwa'), px: 0.5, py: 0.25 }}>
                      <MultiSelectField
                        label="PWA Selector"
                        options={pwaOptions}
                        value={filters.pwa}
                        onChange={(value) => handleMultiChange("pwa", value)}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm="auto" md="auto">
                    <Box sx={{ width: '100%', maxWidth: maxWidthFor('capabilities'), px: 0.5, py: 0.25 }}>
                      <MultiSelectField
                        label="Capabilities"
                        options={capabilityOptions}
                        value={filters.capabilities}
                        onChange={(value) => handleMultiChange("capabilities", value)}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Box>
          )}

          {activeTab === "advanced" && (
            <Box mt={1}>
                <Grid container spacing={1} alignItems="center">
                <Grid item xs={12} sm="auto" md="auto">
                  <Box sx={{ width: '100%', maxWidth: maxWidthFor('requester') }}>
                    <Autocomplete
                    options={requesterOptions}
                    value={filters.requester}
                    inputValue={filters.requester}
                    onChange={(_event, value) =>
                      setFilters((prev) => ({ ...prev, requester: value ?? "" }))
                    }
                    onInputChange={(_event, input) =>
                      setFilters((prev) => ({ ...prev, requester: input }))
                    }
                    freeSolo
                    renderInput={(params) => (
                      <TextField {...params} label="Requester" size="small" fullWidth />
                    )}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} sm="auto" md="auto">
                  <Box sx={{ width: '100%', maxWidth: maxWidthFor('jobType') }}>
                    <Autocomplete
                    options={jobTypeOptions}
                    value={filters.jobType}
                    inputValue={filters.jobType}
                    onChange={(_event, value) =>
                      setFilters((prev) => ({ ...prev, jobType: value ?? "" }))
                    }
                    onInputChange={(_event, input) =>
                      setFilters((prev) => ({ ...prev, jobType: input }))
                    }
                    freeSolo
                    renderInput={(params) => (
                      <TextField {...params} label="Job Type" size="small" fullWidth />
                    )}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} sm="auto" md="auto">
                  <Box sx={{ width: '100%', maxWidth: maxWidthFor('locationType') }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel id="location-type-label">Location Type</InputLabel>
                    <Select
                      labelId="location-type-label"
                      label="Location Type"
                      value={filters.locationType}
                      onChange={(event) =>
                        setFilters((prev) => ({
                          ...prev,
                          locationType: event.target.value,
                        }))
                      }
                    >
                      <MenuItem value="" disabled>
                        Select type
                      </MenuItem>
                      <MenuItem value="postCode">Postcode</MenuItem>
                      <MenuItem value="location">Location</MenuItem>
                      <MenuItem value="groupCode">Group Code</MenuItem>
                    </Select>
                  </FormControl>
                  </Box>
                </Grid>

                <Grid item xs={12} sm="auto" md="auto">
                  <Box sx={{ width: '100%', maxWidth: maxWidthFor('locationValue') }}>
                    <TextField
                      label="Location Value"
                      name="locationValue"
                      value={filters.locationValue}
                      onChange={handleFieldChange}
                      size="small"
                      fullWidth
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} sm="auto" md="auto">
                  <Box sx={{ width: '100%', maxWidth: maxWidthFor('scoreValue') }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel id="imp-condition-label">IMP Condition</InputLabel>
                    <Select
                      labelId="imp-condition-label"
                      label="IMP Condition"
                      value={filters.scoreCondition}
                      onChange={(event) =>
                        setFilters((prev) => ({
                          ...prev,
                          scoreCondition: event.target.value,
                        }))
                      }
                    >
                      <MenuItem value="" disabled>
                        Select condition
                      </MenuItem>
                      <MenuItem value="greater">Greater Than</MenuItem>
                      <MenuItem value="less">Less Than</MenuItem>
                    </Select>
                  </FormControl>
                  </Box>
                </Grid>

                <Grid item xs={12} sm="auto" md="auto">
                  <Box sx={{ width: '100%', maxWidth: maxWidthFor('scoreValue') }}>
                    <TextField
                      label="IMP Value"
                      name="scoreValue"
                      value={filters.scoreValue}
                      onChange={handleFieldChange}
                      size="small"
                      fullWidth
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>

      <Divider />

      <CardActions
        sx={{
          px: 2,
          py: 1,
          bgcolor: theme.palette.grey[50],
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Button
            variant="outlined"
            size="small"
            onClick={handleMenuOpen}
            endIcon={<ChevronDown size={16} />}
            sx={{
              borderRadius: 2,
              textTransform: "none",
            }}
          >
            More
          </Button>
          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: "top", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
          >
            <MenuItem onClick={handleCopy}>{canCopy ? "Copy" : "Copy (empty)"}</MenuItem>
            <MenuItem onClick={handleExport}>{canCopy ? "Export" : "Export (empty)"}</MenuItem>
          </Menu>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          {!canSearch && (
            <Typography variant="caption" color="text.secondary">
              Select Division and Domain ID, or type in the global search.
            </Typography>
          )}
          <Button
            variant="outlined"
            size="small"
            onClick={handleClear}
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            Clear
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={handleSearch}
            disabled={!canSearch}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              boxShadow: "none",
            }}
          >
            Search
          </Button>
        </Stack>
      </CardActions>
    </MotionCard>
  );
}

interface MultiSelectFieldProps {
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  required?: boolean;
}

const MultiSelectField: React.FC<MultiSelectFieldProps> = ({
  label,
  options,
  value,
  onChange,
  required = false,
}) => {
  const [inputValue, setInputValue] = useState("");
  const normalizedQuery = inputValue.trim().toLowerCase();

  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) return options;
    return options.filter((option) =>
      option.toLowerCase().includes(normalizedQuery)
    );
  }, [normalizedQuery, options]);

  const filteredSelectionCount = filteredOptions.filter((option) =>
    value.includes(option)
  ).length;

  const allFilteredSelected =
    filteredOptions.length > 0 &&
    filteredSelectionCount === filteredOptions.length;

  const partiallyFilteredSelected =
    filteredSelectionCount > 0 && !allFilteredSelected;

  const handleChange = (
    _event: React.SyntheticEvent,
    newValue: string[],
    _reason: AutocompleteChangeReason,
    details?: AutocompleteChangeDetails<string>
  ) => {
    if (details?.option === SELECT_ALL_VALUE) {
      if (!filteredOptions.length) {
        return;
      }

      const next = allFilteredSelected
        ? value.filter((option) => !filteredOptions.includes(option))
        : Array.from(new Set([...value, ...filteredOptions]));

      onChange(next);
      return;
    }

    const cleaned = newValue.filter((option) => option !== SELECT_ALL_VALUE);
    onChange(cleaned);
  };

  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      options={[SELECT_ALL_VALUE, ...options]}
      value={value}
      inputValue={inputValue}
      onInputChange={(_event, newInput) => setInputValue(newInput)}
      filterOptions={(opts) =>
        opts.filter(
          (option) =>
            option === SELECT_ALL_VALUE ||
            option.toLowerCase().includes(normalizedQuery)
        )
      }
      onChange={handleChange}
      getOptionLabel={(option) =>
        option === SELECT_ALL_VALUE ? "Select Filtered" : option
      }
      renderOption={(props, option) => {
        if (option === SELECT_ALL_VALUE) {
          return (
            <li {...props}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Checkbox
                  edge="start"
                  checked={allFilteredSelected}
                  indeterminate={partiallyFilteredSelected}
                  size="small"
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  allFilteredSelected ? "Clear Filtered" : "Select Filtered"
                }
              />
            </li>
          );
        }

        return (
          <li {...props}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <Checkbox
                edge="start"
                checked={value.includes(option)}
                size="small"
              />
            </ListItemIcon>
            <ListItemText primary={option} />
          </li>
        );
      }}
      renderTags={(tagValue, getTagProps) => {
        const visible = tagValue.slice(0, 1);
        const chips = visible.map((option, index) => (
          <Chip
            {...getTagProps({ index })}
            key={option}
            label={option}
            size="small"
          />
        ));

        if (tagValue.length > 1) {
          chips.push(
            <Chip key="more" label={`+${tagValue.length - 1}`} size="small" />
          );
        }

        return chips;
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={label}
          size="small"
          required={required}
        />
      )}
      ListboxProps={{
        sx: { maxHeight: 320 },
      }}
    />
  );
};