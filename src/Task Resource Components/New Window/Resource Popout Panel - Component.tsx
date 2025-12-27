import React, { useMemo, useState } from "react";
import {
  Box,
  Chip,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { AppButton } from '@/shared-components';
import { alpha, useTheme } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import { InputAdornment } from "@mui/material";
import ChevronDown from '@mui/icons-material/ExpandMore';
import ChevronUp from '@mui/icons-material/ExpandLess';
import MapPin from '@mui/icons-material/Place';
import Clock from '@mui/icons-material/AccessTime';
import Search from '@mui/icons-material/Search';
import Copy from '@mui/icons-material/ContentCopy';
import X from '@mui/icons-material/Close';
import type { ResourceRecord } from '@/types';
import { CalloutOutcomeConfig } from '@/types';
import type { CalloutHistoryEntry } from "@/Callout Component/useCalloutHistory";
import { ExpandableSectionCard } from '@/shared-components';

interface ResourcePopoutPanelProps {
  open: boolean;
  resource: ResourceRecord;
  history: CalloutHistoryEntry[];
  expanded: string[];
  onToggleSection: (section: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onClose: () => void;
}

const DEFAULT_CAPABILITIES: Array<{
  skill: string;
  preference: string;
  efficiency: string;
  group: string;
}> = [
  { skill: "RSFVAF", preference: "5", efficiency: "—", group: "Group B" },
  { skill: "RFJBAS", preference: "10", efficiency: "—", group: "Group B" },
  { skill: "RBTFC1", preference: "1", efficiency: "—", group: "Group B" },
  { skill: "SDRIVE", preference: "4", efficiency: "—", group: "Group A" },
  { skill: "SVEHW", preference: "4", efficiency: "—", group: "Group A" },
];

function formatUkDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

function groupBadgeStyles(theme: Theme, group: string) {
  const key = group.trim().split(" ").pop() ?? "";
  switch (key) {
    case "A":
      return {
        color: theme.palette.mode === 'dark' ? theme.palette.common.white : alpha(theme.palette.primary.main, 0.95),
        bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.grey[100], 0.12) : alpha(theme.palette.primary.main, 0.12),
        borderColor: theme.palette.mode === 'dark' ? alpha(theme.palette.grey[100], 0.35) : alpha(theme.palette.primary.main, 0.35),
      };
    case "B":
      return {
        color: alpha(theme.palette.success.dark, 0.95),
        bgcolor: alpha(theme.palette.success.light, 0.2),
        borderColor: alpha(theme.palette.success.main, 0.35),
      };
    case "C":
      return {
        color: alpha(theme.palette.warning.dark, 0.95),
        bgcolor: alpha(theme.palette.warning.light, 0.25),
        borderColor: alpha(theme.palette.warning.main, 0.35),
      };
    default:
      return {
        color: alpha(theme.palette.text.primary, 0.8),
        bgcolor: alpha(theme.palette.text.primary, 0.08),
        borderColor: alpha(theme.palette.text.primary, 0.18),
      };
  }
}

export default function ResourcePopoutPanel({
  open,
  resource,
  history,
  expanded,
  onToggleSection,
  onExpandAll,
  onCollapseAll,
  onClose,
}: ResourcePopoutPanelProps) {
  const theme = useTheme();
  const [capabilitySearch, setCapabilitySearch] = useState("");

  const capabilityRows = useMemo(() => {
    if (!capabilitySearch.trim()) return DEFAULT_CAPABILITIES;
    const q = capabilitySearch.trim().toLowerCase();
    return DEFAULT_CAPABILITIES.filter((entry) =>
      [entry.skill, entry.preference, entry.group]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [capabilitySearch]);

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => {
      const aTime = Date.parse(a.timestamp);
      const bTime = Date.parse(b.timestamp);
      if (!Number.isNaN(aTime) && !Number.isNaN(bTime)) return bTime - aTime;
      if (!Number.isNaN(aTime)) return -1;
      if (!Number.isNaN(bTime)) return 1;
      return 0;
    });
  }, [history]);

  if (!open) return null;

  const details: Array<{ label: string; value: string | null | undefined }> = [
    { label: "Resource ID", value: resource.resourceId },
    { label: "Name", value: resource.name },
    { label: "Division", value: resource.division },
    { label: "Callout Group", value: resource.calloutGroup },
    { label: "Primary Skill", value: resource.primarySkill },
    { label: "Secondary Skill", value: resource.secondarySkill },
    { label: "Patch (PWA)", value: (resource as any).pwa },
    { label: "Dispatch Mode", value: (resource as any).dispatchMode },
  ];

  const availabilityNotes: Array<{ label: string; value: string | null | undefined }> = [
    { label: "Current Status", value: resource.status },
    {
      label: "Last Outcome",
      value: resource.lastOutcome
        ? CalloutOutcomeConfig[resource.lastOutcome as keyof typeof CalloutOutcomeConfig]?.label ??
          String(resource.lastOutcome)
        : "",
    },
    {
      label: "Available Again",
      value: resource.availableAgainAt
        ? formatUkDateTime(resource.availableAgainAt)
        : "",
    },
    {
      label: "Last Updated",
      value: resource.updatedAt ? formatUkDateTime(resource.updatedAt) : "",
    },
  ];

  const contactDetails: Array<{ label: string; value: string | null | undefined }> = [
    { label: "Contact Number", value: resource.contactNumber },
    { label: "Notes", value: resource.notes },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        height: '100%',
        width: '100%',
        bgcolor: theme.palette.mode === 'dark' 
          ? alpha(theme.palette.primary.main, 0.12) 
          : alpha(theme.palette.primary.main, 0.06),
        color: "text.primary",
        overflow: "hidden",
      }}
    >
      <Stack
        sx={{
          flex: 1,
          bgcolor: theme.palette.background.paper,
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: { xs: 3, md: 6 },
            py: 3,
            borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
            bgcolor: alpha(theme.palette.background.paper, 0.96),
            backdropFilter: "blur(6px)",
          }}
        >
          <Stack spacing={0.5}>
            <Typography variant="h6" fontWeight={600} color="text.primary">
              Resource Details
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Explore current status, contact details, and callout history.
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
              <AppButton
                variant="contained"
                color="primary"
                size="small"
                onClick={() => (expanded.length ? onCollapseAll() : onExpandAll())}
                startIcon={expanded.length ? <ChevronUp style={{ fontSize: 14 }} /> : <ChevronDown style={{ fontSize: 14 }} />}
                sx={{
                  fontWeight: 600,
                }}
              >
              {expanded.length ? "Collapse All" : "Expand All"}
            </AppButton>
            <AppButton
              variant="outlined"
              color="primary"
              size="small"
                sx={{ fontWeight: 600 }}
            >
              Edit
            </AppButton>
              <IconButton
                size="small"
                onClick={onClose}
                sx={{
                  color: theme.palette.mode === 'dark' ? theme.palette.common.white : alpha(theme.palette.text.primary, 0.9),
                  bgcolor: 'transparent',
                  '&:hover': { bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.06) : alpha(theme.palette.text.primary, 0.06) },
                }}
                aria-label="Close resource panel"
              >
                <X style={{ fontSize: 16 }} />
              </IconButton>
          </Stack>
        </Box>

        <Box
          sx={{
            px: { xs: 3, md: 6 },
            py: 2,
            borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            bgcolor: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.primary.main, 0.08) 
              : alpha(theme.palette.primary.main, 0.04),
          }}
        >
          <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center">
            <Chip
              label={resource.resourceId}
              size="small"
              sx={{
                fontWeight: 700,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                color: theme.palette.mode === 'dark' 
                  ? theme.palette.common.white 
                  : theme.palette.primary.main,
                borderColor: alpha(theme.palette.primary.main, 0.4),
                bgcolor: alpha(theme.palette.primary.main, 0.16),
              }}
              variant="outlined"
            />
            {resource.name && (
              <Chip
                label={resource.name}
                size="small"
                variant="outlined"
                sx={{
                  color: alpha(theme.palette.text.primary, 0.85),
                  borderColor: alpha(theme.palette.text.primary, 0.2),
                  bgcolor: theme.palette.background.paper,
                }}
              />
            )}
          </Stack>
        </Box>

        {/* BODY */}
        <Box
          sx={{
            flex: 1,
            px: { xs: 2.5, md: 6 },
            py: { xs: 3, md: 5 },
            bgcolor: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.grey[100], 0.04) 
              : alpha(theme.palette.primary.main, 0.02),
            overflowY: "auto",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "center", pb: 3 }}>
            <Paper
              elevation={10}
              sx={{
                width: { xs: '100%', sm: 'min(100%, 720px)' },
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
                boxShadow: "0 24px 48px rgba(8,58,97,0.18)",
                bgcolor: alpha(theme.palette.background.paper, 0.98),
                px: { xs: 3, md: 4 },
                py: { xs: 3, md: 4 },
              }}
            >
              <Stack spacing={3}>
                <ExpandableSectionCard
                  key="Resource Summary"
                  title="Resource Summary"
                  expanded={expanded.includes("Resource Summary")}
                  onToggle={() => onToggleSection("Resource Summary")}
                >
                  <Stack spacing={3}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={2}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                    >
                      <Stack spacing={0.5}>
                        <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                          {resource.name || "—"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {resource.resourceId}
                        </Typography>
                      </Stack>
                        <AppButton
                          variant="outlined"
                          size="small"
                          startIcon={<Copy style={{ fontSize: 14 }} />}
                          onClick={() => navigator.clipboard.writeText(resource.resourceId)}
                          sx={{ textTransform: "none", fontWeight: 600 }}
                        >
                          Copy ID
                        </AppButton>
                    </Stack>
                    <Grid container spacing={2.5}>
                      {details.map(({ label, value }) => (
                        <Grid item xs={12} sm={6} key={label}>
                          <Typography
                            variant="overline"
                            sx={{
                              letterSpacing: 1.2,
                              fontWeight: 600,
                              color: alpha(theme.palette.text.secondary, 0.9),
                            }}
                          >
                            {label}
                          </Typography>
                          <Typography variant="body2" color="text.primary">
                            {value || "—"}
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </Stack>
                </ExpandableSectionCard>

                <ExpandableSectionCard
                  key="Availability"
                  title="Availability & Contact"
                  expanded={expanded.includes("Availability")}
                  onToggle={() => onToggleSection("Availability")}
                >
                  <Stack spacing={3}>
                    <Grid container spacing={2.5}>
                      {availabilityNotes.map(({ label, value }) => (
                        <Grid item xs={12} sm={6} key={label}>
                          <Paper
                            variant="outlined"
                            sx={{
                              px: 2.5,
                              py: 2,
                              borderRadius: 2,
                              borderColor: alpha(theme.palette.primary.main, 0.1),
                              bgcolor: alpha(theme.palette.primary.main, 0.04),
                            }}
                          >
                            <Typography
                              variant="overline"
                              sx={{ letterSpacing: 1.1, color: alpha(theme.palette.text.secondary, 0.9) }}
                            >
                              {label}
                            </Typography>
                            <Typography variant="body2" color="text.primary">
                              {value || "—"}
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>

                    <Grid container spacing={2.5}>
                      {contactDetails.map(({ label, value }) => (
                        <Grid item xs={12} sm={6} key={label}>
                          <Paper
                            variant="outlined"
                            sx={{ px: 2.5, py: 2, borderRadius: 2, borderColor: alpha(theme.palette.primary.main, 0.1) }}
                          >
                            <Typography
                              variant="overline"
                              sx={{ letterSpacing: 1.1, color: alpha(theme.palette.text.secondary, 0.9) }}
                            >
                              {label}
                            </Typography>
                            <Typography variant="body2" color="text.primary">
                              {value || "—"}
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                      <Grid item xs={12} sm={6}>
                        <Paper
                          variant="outlined"
                          sx={{
                            px: 2.5,
                            py: 2,
                            borderRadius: 2,
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 1.5,
                            borderColor: alpha(theme.palette.primary.main, 0.12),
                          }}
                        >
                          <Clock style={{ fontSize: 18, color: theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.primary.main }} />
                          <Box>
                            <Typography
                              variant="overline"
                              sx={{ letterSpacing: 1.1, color: alpha(theme.palette.text.secondary, 0.9) }}
                            >
                              Sign-on
                            </Typography>
                            <Typography variant="body2" color="text.primary">
                              {(resource as any).signOn || "—"}
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper
                          variant="outlined"
                          sx={{
                            px: 2.5,
                            py: 2,
                            borderRadius: 2,
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 1.5,
                            borderColor: alpha(theme.palette.primary.main, 0.12),
                          }}
                        >
                          <MapPin sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                          <Box>
                            <Typography
                              variant="overline"
                              sx={{ letterSpacing: 1.1, color: alpha(theme.palette.text.secondary, 0.9) }}
                            >
                              Home Postcode
                            </Typography>
                            <Typography variant="body2" color="text.primary">
                              {(resource as any).homePostCode || "—"}
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Stack>
                </ExpandableSectionCard>

                <ExpandableSectionCard
                  key="Callout History"
                  title="Callout History"
                  expanded={expanded.includes("Callout History")}
                  onToggle={() => onToggleSection("Callout History")}
                >
                  <Stack spacing={2.5} sx={{ maxHeight: theme.spacing(40), overflowY: 'auto', pr: 1 }}>
                    {sortedHistory.length === 0 && (
                      <Paper
                        variant="outlined"
                        sx={{
                          borderRadius: 2,
                          borderStyle: "dashed",
                          borderColor: alpha(theme.palette.primary.main, 0.25),
                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                          textAlign: "center",
                          px: 3,
                          py: 4,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          No history recorded for this resource yet.
                        </Typography>
                      </Paper>
                    )}

                    {sortedHistory.map((entry) => {
                      const outcomeLabel =
                        (entry.outcome &&
                          typeof entry.outcome === "string" &&
                          CalloutOutcomeConfig[entry.outcome as keyof typeof CalloutOutcomeConfig]?.label) ||
                        String(entry.outcome ?? "");

                      return (
                        <Paper
                          key={entry.id}
                          variant="outlined"
                          sx={{
                            borderRadius: 2,
                            borderColor: alpha(theme.palette.primary.main, 0.12),
                            px: 2.5,
                            py: 2,
                            boxShadow: "0 10px 24px rgba(8,58,97,0.08)",
                            bgcolor: theme.palette.background.paper,
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" fontWeight={600} color="text.primary">
                              {outcomeLabel || "Outcome"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatUkDateTime(entry.timestamp) || "—"}
                            </Typography>
                          </Stack>
                          {entry.note && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.6 }}>
                              {entry.note}
                            </Typography>
                          )}
                          {entry.availableAgainAt && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
                              Return {formatUkDateTime(entry.availableAgainAt)}
                            </Typography>
                          )}
                          <Typography
                            variant="overline"
                            sx={{ mt: 2, letterSpacing: 1, color: alpha(theme.palette.text.secondary, 0.7) }}
                          >
                            {entry.status || ""}
                          </Typography>
                        </Paper>
                      );
                    })}
                  </Stack>
                </ExpandableSectionCard>

                <ExpandableSectionCard
                  key="Capabilities"
                  title="Capabilities"
                  expanded={expanded.includes("Capabilities")}
                  onToggle={() => onToggleSection("Capabilities")}
                >
                  <Stack spacing={3}>
                    <TextField
                      value={capabilitySearch}
                      onChange={(event) => setCapabilitySearch(event.target.value)}
                      placeholder="Filter by skill, preference, or group…"
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search sx={{ fontSize: 16, color: alpha(theme.palette.text.secondary, 0.7) }} />
                          </InputAdornment>
                        ),
                        sx: {
                          borderRadius: 2,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: alpha(theme.palette.primary.main, 0.22),
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: alpha(theme.palette.primary.main, 0.45),
                          },
                        },
                      }}
                    />

                    <TableContainer
                      component={Paper}
                      variant="outlined"
                      sx={{
                        maxHeight: theme.spacing(35), // 280px
                        borderRadius: 2,
                        borderColor: alpha(theme.palette.primary.main, 0.12),
                      }}
                    >
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>Skill</TableCell>
                            <TableCell>Preference</TableCell>
                            <TableCell>Efficiency</TableCell>
                            <TableCell>Group</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {capabilityRows.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                No matching capability entries.
                              </TableCell>
                            </TableRow>
                          ) : (
                            capabilityRows.map((row) => (
                              <TableRow key={`${row.skill}-${row.group}`} hover>
                                <TableCell sx={{ fontWeight: 600 }}>{row.skill}</TableCell>
                                <TableCell>{row.preference}</TableCell>
                                <TableCell>{row.efficiency}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={row.group}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      borderRadius: 999,
                                      fontWeight: 600,
                                      px: 1,
                                      ...groupBadgeStyles(theme, row.group),
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Stack>
                </ExpandableSectionCard>
              </Stack>
            </Paper>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
