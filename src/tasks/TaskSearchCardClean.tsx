import React, { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import mockTasks from "@/data/mockTasks.json";
import {
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
  ListItem,
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
import { Bookmark, ChevronDown, Eye, EyeOff, Search } from "lucide-react";
import FilterListIcon from '@mui/icons-material/FilterList';
import MultiSelectField from '@/shared-ui';
import { FreeTypeSelectField } from '@/shared-ui';

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

  // helper: get the maximum option string length for a given field key
  const getMaxOptionLength = (key: string) => {
    const arrFor = (k: string): string[] | undefined => {
      switch (k) {
        case "division":
          return divisionOptions;
        case "domainId":
          return domainOptions;
        case "taskStatuses":
          return statusOptions;
        case "responseCode":
          return responseOptions;
        case "commitType":
          return commitOptions;
        case "capabilities":
          return capabilityOptions;
        case "pwa":
          return pwaOptions;
        case "requester":
          return requesterOptions;
        case "jobType":
          return jobTypeOptions;
        default:
          return undefined;
      }
    };

    const arr = arrFor(key);
    if (!arr || !arr.length) return 0;
    return arr.reduce((max, s) => Math.max(max, String(s).length), 0);
  };

  // Use a responsive standard width for all boxes, but allow per-field
  // expansion based on the measured DB values (or overrides) so default
  // prompt/placeholder values (plus breathing room and the select-all icon)
  // are visible on load without forcing the control to resize later.
  // Measured pixel widths (client-only). We'll compute these on mount so the
  // box widths match the actual rendered prompt text + icon precisely.
  const [measuredPx, setMeasuredPx] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const bodyStyle = getComputedStyle(document.body);
      ctx.font = bodyStyle.font || "14px Roboto, sans-serif";

      const keys = [
        "division",
        "domainId",
        "taskStatuses",
        "commitType",
        "responseCode",
        "pwa",
        "capabilities",
        "requester",
        "jobType",
        "locationValue",
      ];

      const ICON_CHARS = 6; // spacing reserved for icon
      const extra = 6; // breathing room in characters

      const measureFor = (k: string) => {
        const override = expectedMaxCharsOverrides[k];
        // prefer an explicit override numeric width if provided (in chars)
        if (override) {
          const sample = "0".repeat(override + ICON_CHARS + extra);
          return Math.ceil(ctx.measureText(sample).width);
        }

        // otherwise pick a representative string from options or label
        const arrFor = (kk: string): string[] | undefined => {
          switch (kk) {
            case "division":
              return divisionOptions;
            case "domainId":
              return domainOptions;
            case "taskStatuses":
              return statusOptions;
            case "responseCode":
              return responseOptions;
            case "commitType":
              return commitOptions;
            case "capabilities":
              return capabilityOptions;
            case "pwa":
              return pwaOptions;
            case "requester":
              return requesterOptions;
            case "jobType":
              return jobTypeOptions;
            default:
              return undefined;
          }
        };

        const arr = arrFor(k);
        let sampleText = (friendlyNames as Record<string, string>)[k] ?? k;
        if (arr && arr.length) {
          // choose the longest option as representative
          sampleText = arr.reduce((cur, s) => (String(s).length > cur.length ? String(s) : cur), sampleText);
        }

        const sample = sampleText + " ".repeat(ICON_CHARS + extra);
        return Math.ceil(ctx.measureText(sample).width);
      };

      const result: Record<string, number> = {};
      keys.forEach((k) => {
        try {
          result[k] = measureFor(k);
        } catch (e) {
          // ignore
        }
      });

      setMeasuredPx(result);
    } catch (e) {
      // ignore measurement errors
    }
  }, [divisionOptions, domainOptions, statusOptions, responseOptions, commitOptions, capabilityOptions, pwaOptions, requesterOptions, jobTypeOptions]);

  const maxWidthFor = (key: string) => {
    const extra = 6; // breathing room in characters
    const labelPadding = 4; // extra chars to ensure label/placeholder fits

    const override = expectedMaxCharsOverrides[key];
    const measured = getMaxOptionLength(key);

    const label = (friendlyNames as Record<string, string>)[key] ?? "";
    const labelLen = label.length;

    const toNum = (s: string) => parseInt(String(s).replace(/[^0-9]/g, ""), 10) || 0;

    const baseXs = toNum(STANDARD_BOX.xs);
    const baseSm = toNum(STANDARD_BOX.sm);
    const baseMd = toNum(STANDARD_BOX.md);

    const ICON_CHARS = 6; // reserve ~6ch for the select-all icon + spacing

    // If we have a measured pixel width for this key, prefer it (client-only).
    if (measuredPx && measuredPx[key]) {
      const px = measuredPx[key];
      // cap by STANDARD_BOX converted to px using approximate 'ch' -> px via body font
      if (typeof window !== "undefined") {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const bodyStyle = getComputedStyle(document.body);
        ctx && (ctx.font = bodyStyle.font || "14px Roboto, sans-serif");
        const chWidth = ctx ? ctx.measureText("0").width : 8;
        const capPx = Math.max(baseXs, baseSm, baseMd) * chWidth;
        const finalPx = Math.min(capPx, px);
        return { xs: `${Math.round(finalPx)}px`, sm: `${Math.round(finalPx)}px`, md: `${Math.round(finalPx)}px` };
      }
    }

    const source = override ?? (measured ? measured : labelLen);
    const desired = Math.max(source + extra + ICON_CHARS, labelLen + labelPadding + ICON_CHARS);

    const xs = Math.min(baseMd, Math.max(desired, baseXs));
    const sm = Math.min(baseMd, Math.max(desired, baseSm));
    const md = Math.min(baseMd, Math.max(desired, baseMd));

    return { xs: `${xs}ch`, sm: `${sm}ch`, md: `${md}ch` };
  };

  // Standard box width used across filter controls to keep consistent sizing.
  // Increased responsive values to give more breathing room so pills/numbers
  // and default placeholder text don't feel cramped.
  const STANDARD_BOX = { xs: "24ch", sm: "36ch", md: "48ch" };
  // We'll compute per-field widths after we have the options loaded so we can
  // measure the prompt/DB-derived values. `expectedMaxCharsOverrides` is for
  // manual tweaks; measurements from options will be used as the primary
  // driver for prompt width.
  const expectedMaxCharsOverrides: Record<string, number> = {
    division: 36,
    domainId: 14,
    taskStatuses: 24,
    commitType: 22,
    responseCode: 10,
    pwa: 20,
    capabilities: 28,
    requester: 28,
    jobType: 22,
    locationValue: 32,
    locationType: 16,
    scoreValue: 6,
  };

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

  // removed handleChipDelete — top prefill chips were removed per UX request

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
          {/* top prefill chips removed — not providing value in this UI */}

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
                <Grid container spacing={1.5} alignItems="center">
                  <Grid item xs={12} sm="auto" md="auto">
                          <Box sx={{ width: '100%', maxWidth: maxWidthFor('division'), px: 1, display: 'flex', alignItems: 'center', minHeight: 40, flex: '0 0 auto', '& .MuiInputBase-root': { minHeight: 36 }, '& .MuiSelect-select': { display: 'flex', alignItems: 'center', minHeight: 36 }, '& .MuiAutocomplete-inputRoot': { paddingTop: 0, paddingBottom: 0 } }}>
                      <MultiSelectField
                        label="Division"
                        options={divisionOptions}
                        value={filters.division}
                          onChange={(value: string[]) => handleMultiChange("division", value)}
                          showSelectAllIcon
                        required
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm="auto" md="auto">
                    <Box sx={{ width: '100%', maxWidth: maxWidthFor('domainId'), px: 1, display: 'flex', alignItems: 'center', minHeight: 40, flex: '0 0 auto', '& .MuiInputBase-root': { minHeight: 36 }, '& .MuiSelect-select': { display: 'flex', alignItems: 'center', minHeight: 36 }, '& .MuiAutocomplete-inputRoot': { paddingTop: 0, paddingBottom: 0 } }}>
                      <MultiSelectField
                        label="Domain ID"
                        options={domainOptions}
                        value={filters.domainId}
                        onChange={(value: string[]) => handleMultiChange("domainId", value)}
                        showSelectAllIcon
                        required
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm="auto" md="auto">
                    <Box sx={{ width: '100%', maxWidth: maxWidthFor('taskStatuses'), px: 1, display: 'flex', alignItems: 'center', minHeight: 40, flex: '0 0 auto', '& .MuiInputBase-root': { minHeight: 36 }, '& .MuiSelect-select': { display: 'flex', alignItems: 'center', minHeight: 36 }, '& .MuiAutocomplete-inputRoot': { paddingTop: 0, paddingBottom: 0 } }}>
                      <MultiSelectField
                        label="Task Status"
                        options={statusOptions}
                        value={filters.taskStatuses}
                        onChange={(value: string[]) => handleMultiChange("taskStatuses", value)}
                        showSelectAllIcon
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm="auto" md="auto">
                    <Box sx={{ width: '100%', maxWidth: maxWidthFor('commitType'), px: 1, display: 'flex', alignItems: 'center', minHeight: 40, flex: '0 0 auto', '& .MuiInputBase-root': { minHeight: 36 }, '& .MuiSelect-select': { display: 'flex', alignItems: 'center', minHeight: 36 }, '& .MuiAutocomplete-inputRoot': { paddingTop: 0, paddingBottom: 0 } }}>
                      <MultiSelectField
                        label="Commit Type"
                        options={commitOptions}
                        value={filters.commitType}
                        onChange={(value: string[]) => handleMultiChange("commitType", value)}
                        showSelectAllIcon
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm="auto" md="auto">
                    <Box sx={{ width: '100%', maxWidth: maxWidthFor('responseCode'), px: 1, display: 'flex', alignItems: 'center', minHeight: 40, flex: '0 0 auto', '& .MuiInputBase-root': { minHeight: 36 }, '& .MuiSelect-select': { display: 'flex', alignItems: 'center', minHeight: 36 }, '& .MuiAutocomplete-inputRoot': { paddingTop: 0, paddingBottom: 0 } }}>
                      <MultiSelectField
                        label="Response Code"
                        options={responseOptions}
                        value={filters.responseCode}
                        onChange={(value: string[]) => handleMultiChange("responseCode", value)}
                        showSelectAllIcon
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm="auto" md="auto">
                    <Box sx={{ width: '100%', maxWidth: maxWidthFor('pwa'), px: 1, display: 'flex', alignItems: 'center', minHeight: 40, flex: '0 0 auto', '& .MuiInputBase-root': { minHeight: 36 }, '& .MuiSelect-select': { display: 'flex', alignItems: 'center', minHeight: 36 }, '& .MuiAutocomplete-inputRoot': { paddingTop: 0, paddingBottom: 0 } }}>
                      <MultiSelectField
                        label="PWA Selector"
                        options={pwaOptions}
                        value={filters.pwa}
                        onChange={(value: string[]) => handleMultiChange("pwa", value)}
                        showSelectAllIcon
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm="auto" md="auto">
                    <Box sx={{ width: '100%', maxWidth: maxWidthFor('capabilities'), px: 1, display: 'flex', alignItems: 'center', minHeight: 40, flex: '0 0 auto', '& .MuiInputBase-root': { minHeight: 36 }, '& .MuiSelect-select': { display: 'flex', alignItems: 'center', minHeight: 36 }, '& .MuiAutocomplete-inputRoot': { paddingTop: 0, paddingBottom: 0 } }}>
                      <MultiSelectField
                        label="Capabilities"
                        options={capabilityOptions}
                        value={filters.capabilities}
                        onChange={(value: string[]) => handleMultiChange("capabilities", value)}
                        showSelectAllIcon
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Box>
          )}

          {activeTab === "advanced" && (
            <Box mt={1}>
                <Grid container spacing={1.5} alignItems="center">
                <Grid item xs={12} sm="auto" md="auto">
                  <Box sx={{ width: '100%', maxWidth: maxWidthFor('requester'), px: 1, display: 'flex', alignItems: 'center', minHeight: 40, '& .MuiInputBase-root': { minHeight: 36 }, '& .MuiSelect-select': { display: 'flex', alignItems: 'center', minHeight: 36 }, '& .MuiAutocomplete-inputRoot': { paddingTop: 0, paddingBottom: 0 } }}>
                    <FreeTypeSelectField
                      label="Requester"
                      options={requesterOptions}
                      value={filters.requester}
                      onChange={(next: string) => setFilters((prev) => ({ ...prev, requester: next }))}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} sm="auto" md="auto">
                  <Box sx={{ width: '100%', maxWidth: maxWidthFor('jobType'), px: 1, display: 'flex', alignItems: 'center', minHeight: 40, '& .MuiInputBase-root': { minHeight: 36 }, '& .MuiSelect-select': { display: 'flex', alignItems: 'center', minHeight: 36 }, '& .MuiAutocomplete-inputRoot': { paddingTop: 0, paddingBottom: 0 } }}>
                    <FreeTypeSelectField
                      label="Job Type"
                      options={jobTypeOptions}
                      value={filters.jobType}
                      onChange={(next: string) => setFilters((prev) => ({ ...prev, jobType: next }))}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} sm="auto" md="auto">
                  <Box sx={{ width: '100%', maxWidth: maxWidthFor('locationType'), px: 1, display: 'flex', alignItems: 'center', minHeight: 40, '& .MuiInputBase-root': { minHeight: 36 }, '& .MuiSelect-select': { display: 'flex', alignItems: 'center', minHeight: 36 }, '& .MuiAutocomplete-inputRoot': { paddingTop: 0, paddingBottom: 0 } }}>
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
                  <Box sx={{ width: '100%', maxWidth: maxWidthFor('locationValue'), px: 1, display: 'flex', alignItems: 'center', minHeight: 40, '& .MuiInputBase-root': { minHeight: 36 }, '& .MuiSelect-select': { display: 'flex', alignItems: 'center', minHeight: 36 }, '& .MuiAutocomplete-inputRoot': { paddingTop: 0, paddingBottom: 0 } }}>
                    <TextField
                      name="locationValue"
                      value={filters.locationValue}
                      onChange={handleFieldChange}
                      size="small"
                      fullWidth
                      placeholder={filters.locationValue ? "" : "Location Value"}
                      aria-label="Location Value"
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} sm="auto" md="auto">
                  <Box sx={{ width: '100%', maxWidth: maxWidthFor('scoreValue'), px: 1, display: 'flex', alignItems: 'center', minHeight: 40, '& .MuiInputBase-root': { minHeight: 36 }, '& .MuiSelect-select': { display: 'flex', alignItems: 'center', minHeight: 36 }, '& .MuiAutocomplete-inputRoot': { paddingTop: 0, paddingBottom: 0 } }}>
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
                  <Box sx={{ width: '100%', maxWidth: maxWidthFor('scoreValue'), px: 1, display: 'flex', alignItems: 'center', minHeight: 40, '& .MuiInputBase-root': { minHeight: 36 }, '& .MuiSelect-select': { display: 'flex', alignItems: 'center', minHeight: 36 }, '& .MuiAutocomplete-inputRoot': { paddingTop: 0, paddingBottom: 0 } }}>
                    <TextField
                      name="scoreValue"
                      value={filters.scoreValue}
                      onChange={handleFieldChange}
                      size="small"
                      fullWidth
                      placeholder={filters.scoreValue ? "" : "IMP Value"}
                      aria-label="IMP Value"
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

/* MultiSelectField moved to src/shared-ui/MultiSelectField.tsx */