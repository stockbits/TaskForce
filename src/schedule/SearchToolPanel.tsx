import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, CheckSquare, XSquare } from "lucide-react";
import {
  Box,
  Button,
  Chip,
  Checkbox,
  ClickAwayListener,
  Divider,
  Fade,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Popper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MultiSelectField from "@/shared-ui";

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

const SearchToolPanel: React.FC<SearchToolPanelProps> = ({
  mode = "task-default",
  onSearch,
  onClear,
  dropdownData,
  resetKey,
  hideActions,
}) => {
  const theme = useTheme();
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

  const [query, setQuery] = useState<Record<string, string>>({
    statuses: "",
    pwa: "",
    capabilities: "",
    commitmentTypes: "",
    responseCodes: "",
    resourceStatuses: "",
  });

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

  const handleClear = () => {
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
    resourceStatuses: makeFilter(
      sortByBracketCode(safe(dropdownData.resourceStatuses)),
      query.resourceStatuses
    ),
  };

  // Use MultiSelectField's internal filtering and select-all behavior.

  const StatusBlock = (
    <MultiSelectField
      label="Task Status"
      options={filtered.statuses}
      value={filters.statuses}
      onChange={(next: string[]) => setFilters((prev) => ({ ...prev, statuses: next }))}
    />
  );

  const PwaBlock = (
    <MultiSelectField
      label="PWA"
      options={filtered.pwa}
      value={filters.pwa}
      onChange={(next: string[]) => setFilters((prev) => ({ ...prev, pwa: next }))}
    />
  );

  const CapBlock = (
    <MultiSelectField
      label="Capabilities"
      options={filtered.capabilities}
      value={filters.capabilities}
      onChange={(next: string[]) => setFilters((prev) => ({ ...prev, capabilities: next }))}
    />
  );

  const CommitBlock = (
    <MultiSelectField
      label="Commit Type"
      options={filtered.commitmentTypes}
      value={filters.commitmentTypes}
      onChange={(next: string[]) => setFilters((prev) => ({ ...prev, commitmentTypes: next }))}
    />
  );

  const ResponseBlock = (
    <MultiSelectField
      label="Response Code"
      options={filtered.responseCodes}
      value={filters.responseCodes ?? []}
      onChange={(next: string[]) => setFilters((prev) => ({ ...prev, responseCodes: next }))}
    />
  );

  const ImpBlock = (
    <ImpConditionControl
      condition={filters.impCondition ?? ""}
      value={filters.impValue ?? ""}
      openDropdown={openDropdown}
      setOpenDropdown={setOpenDropdown}
      onConditionChange={(next) =>
        setFilters((prev) => ({ ...prev, impCondition: next }))
      }
      onValueChange={(next) =>
        setFilters((prev) => ({ ...prev, impValue: next }))
      }
    />
  );

  const ResourceStatusBlock = (
    <MultiSelectField
      label="Status"
      options={filtered.resourceStatuses}
      value={filters.statuses}
      onChange={(next: string[]) => setFilters((prev) => ({ ...prev, statuses: next }))}
    />
  );

  const effectiveMode =
    mode === "resource-active" ? "resource-active" : "task-default";

  const renderMode = () => {
    if (effectiveMode === "task-default") {
      return (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            {StatusBlock}
          </Grid>
          <Grid item xs={12} sm={6}>
            {PwaBlock}
          </Grid>
          <Grid item xs={12} sm={6}>
            {CapBlock}
          </Grid>
          <Grid item xs={12} sm={6}>
            {CommitBlock}
          </Grid>
          <Grid item xs={12} sm={6}>
            {ResponseBlock}
          </Grid>
          <Grid item xs={12}>
            {ImpBlock}
          </Grid>
        </Grid>
      );
    }

    if (effectiveMode === "resource-active") {
      return (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            {ResourceStatusBlock}
          </Grid>
          <Grid item xs={12} sm={6}>
            {PwaBlock}
          </Grid>
        </Grid>
      );
    }

    return null;
  };

  return (
    <MotionPaper
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      elevation={0}
      sx={{
        width: '100%',
        maxWidth: { xs: '95vw', sm: theme.spacing(100) }, // 800px at sm+
        borderRadius: 3,
        px: 3,
        py: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
        boxShadow: '0 18px 46px rgba(8,58,97,0.18)',
        backgroundImage: 'none',
        overflowX: 'hidden',
      }}
    >
      {renderMode()}

      {!hideActions && (
        <Stack
          direction="row"
          justifyContent="flex-end"
          spacing={1.5}
          pt={2}
          mt={2}
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
              boxShadow: "none",
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
    </MotionPaper>
  );
};

export default SearchToolPanel;



interface ImpConditionControlProps {
  condition: string;
  value: string;
  openDropdown: string | null;
  setOpenDropdown: (id: string | null) => void;
  onConditionChange: (value: string) => void;
  onValueChange: (value: string) => void;
}

function ImpConditionControl({
  condition,
  value,
  openDropdown,
  setOpenDropdown,
  onConditionChange,
  onValueChange,
}: ImpConditionControlProps) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const isOpen = openDropdown === "imp";

  useEffect(() => {
    if (!isOpen) {
      setAnchorEl(null);
    }
  }, [isOpen]);

  const displayLabel =
    condition === "greater"
      ? "Greater Than"
      : condition === "less"
      ? "Less Than"
      : "IMP Score";

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isOpen) {
      setOpenDropdown(null);
    } else {
      setAnchorEl(event.currentTarget);
      setOpenDropdown("imp");
    }
  };

  const handleClose = () => setOpenDropdown(null);

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      alignItems={{ xs: "stretch", sm: "flex-start" }}
    >
      <Button
        variant="outlined"
        size="small"
        endIcon={<ChevronDown size={14} />}
        onClick={handleOpen}
        sx={{
          maxWidth: 240,
          width: "100%",
          justifyContent: "space-between",
          textTransform: "none",
          fontSize: 12,
          fontWeight: 500,
          height: 36,
          borderRadius: 1.5,
          borderColor: alpha(theme.palette.primary.main, 0.22),
          color: theme.palette.text.primary,
          px: 2,
          "&:hover": {
            borderColor: theme.palette.primary.main,
            backgroundColor: alpha(theme.palette.primary.main, 0.06),
          },
        }}
      >
        <Typography
          variant="caption"
          component="span"
          sx={{
            flexGrow: 1,
            textAlign: "left",
            pr: 1.5,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {displayLabel}
        </Typography>
      </Button>

      <TextField
        type="number"
        size="small"
        value={value}
        onChange={(event) => {
          const digits = (event.target.value || "")
            .replace(/\D/g, "")
            .slice(0, 3);
          onValueChange(digits);
        }}
        placeholder="Value"
        inputProps={{
          min: 0,
          max: 999,
          style: {
            fontSize: 12,
            padding: "6px 10px",
            width: "clamp(64px, 6vw, 90px)",
          },
        }}
      />

      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        MenuListProps={{
          dense: true,
          sx: { fontSize: 12 },
        }}
        slotProps={{
          paper: {
            elevation: 12,
            sx: {
              minWidth: 180,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
              boxShadow: "0 18px 46px rgba(8,58,97,0.18)",
              backgroundImage: "none",
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            onConditionChange("greater");
            handleClose();
          }}
        >
          Greater Than
        </MenuItem>
        <MenuItem
          onClick={() => {
            onConditionChange("less");
            handleClose();
          }}
        >
          Less Than
        </MenuItem>
      </Menu>
    </Stack>
  );
}
