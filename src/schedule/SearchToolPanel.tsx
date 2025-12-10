import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, CheckSquare, XSquare } from "lucide-react";
import {
  Box,
  Button,
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

const MotionPaper = motion(Paper);

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

  const toggleArray = (field: keyof SearchToolFilters, value: string) => {
    setFilters((prev) => {
      const current = Array.isArray(prev[field])
        ? (prev[field] as string[])
        : [];
      const exists = current.includes(value);
      const next = exists
        ? current.filter((item) => item !== value)
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
      onToggle={(value) => toggleArray("statuses", value)}
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
      onToggle={(value) => toggleArray("pwa", value)}
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
      onToggle={(value) => toggleArray("capabilities", value)}
      onSelectAll={() =>
        handleSelectAll("capabilities", filtered.capabilities)
      }
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
      onToggle={(value) => toggleArray("commitmentTypes", value)}
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
      onToggle={(value) => toggleArray("responseCodes", value)}
      onSelectAll={() =>
        handleSelectAll("responseCodes", filtered.responseCodes)
      }
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
    <DropdownMultiSelect
      id="resourceStatuses"
      label="Status"
      options={filtered.resourceStatuses}
      selected={filters.statuses}
      openDropdown={openDropdown}
      setOpenDropdown={setOpenDropdown}
      query={query}
      setQuery={setQuery}
      onToggle={(value) => toggleArray("statuses", value)}
      onSelectAll={() =>
        handleSelectAll("statuses", safe(dropdownData.resourceStatuses))
      }
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
            onClick={onClear}
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
  const theme = useTheme();
  const isOpen = openDropdown === id;
  const q = query[id] ?? "";
  const allSelected = options.length > 0 && selected.length === options.length;
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const [menuWidth, setMenuWidth] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setMenuWidth(rect.width);
    }
    if (!isOpen) {
      setMenuWidth(null);
    }
  }, [isOpen]);

  const displayLabel =
    selected.length > 0 ? `${selected.length} selected` : label;

  const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setOpenDropdown(isOpen ? null : id);
  };

  const handleClose = () => setOpenDropdown(null);

  return (
    <Box sx={{ position: "relative" }}>
      <Button
        ref={anchorRef}
        onClick={handleToggle}
        variant="outlined"
        size="small"
        endIcon={<ChevronDown size={14} />}
        sx={{
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

      <Popper
        open={isOpen}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        transition
        modifiers={[{ name: "offset", options: { offset: [0, 8] } }]}
        sx={{ zIndex: 2000 }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={160}>
            <Box>
              <ClickAwayListener onClickAway={handleClose} mouseEvent="onMouseUp">
                <Paper
                  elevation={12}
                  sx={{
                    p: 1.5,
                    width: menuWidth ? Math.min(menuWidth, 380) : 320,
                    maxWidth: "90vw",
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                    boxShadow: "0 18px 46px rgba(8,58,97,0.18)",
                    backgroundImage: "none",
                  }}
                >
                  <Stack spacing={1.5}>
                    <TextField
                      size="small"
                      value={q}
                      autoFocus
                      onChange={(event) =>
                        setQuery((prev) => ({ ...prev, [id]: event.target.value }))
                      }
                      placeholder={`Filter ${label.toLowerCase()}…`}
                      fullWidth
                      inputProps={{
                        style: {
                          textAlign: "left",
                          fontSize: 12,
                          padding: "6px 10px",
                        },
                      }}
                    />

                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{
                        px: 1.5,
                        py: 0.75,
                        borderRadius: 1.5,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {allSelected ? "Clear All Results" : "Select All Results"}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(event) => {
                          event.preventDefault();
                          onSelectAll();
                        }}
                        sx={{
                          color: theme.palette.primary.main,
                        }}
                      >
                        {allSelected ? <XSquare size={16} /> : <CheckSquare size={16} />}
                      </IconButton>
                    </Stack>

                    <Divider sx={{ my: 0.5 }} />

                    <Stack spacing={0.5}>
                      {options.map((option) => (
                        <Box
                          key={option}
                          onClick={() => onToggle(option)}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            px: 1.5,
                            py: 0.75,
                            borderRadius: 1.5,
                            cursor: "pointer",
                            transition: "background-color 0.2s ease",
                            "&:hover": {
                              backgroundColor: alpha(theme.palette.primary.main, 0.08),
                            },
                          }}
                        >
                          <Checkbox
                            size="small"
                            checked={selected.includes(option)}
                            onChange={(event) => {
                              event.stopPropagation();
                              onToggle(option);
                            }}
                            sx={{
                              padding: 0,
                              color: alpha(theme.palette.primary.main, 0.6),
                              "&.Mui-checked": {
                                color: theme.palette.primary.main,
                              },
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{ fontSize: 12, color: theme.palette.text.primary }}
                          >
                            {option}
                          </Typography>
                        </Box>
                      ))}

                      {options.length === 0 && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ px: 1.5, py: 0.5, fontStyle: "italic" }}
                        >
                          No results
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </Paper>
              </ClickAwayListener>
            </Box>
          </Fade>
        )}
      </Popper>
    </Box>
  );
}

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
