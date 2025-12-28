// ===============================================
// Task Information Card - Component.tsx — CARD VERSION (RESTORED)
// ===============================================

import React, { useMemo } from "react";
import {
  Box,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import Person from '@mui/icons-material/Person';
import LocalShipping from '@mui/icons-material/LocalShipping';
import ThumbUp from '@mui/icons-material/ThumbUp';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Build from '@mui/icons-material/Build';
import Check from '@mui/icons-material/Check';
import type { TaskDetails, ProgressNoteEntry } from "@/shared-types";
import { ExpandableSectionCard } from '@/shared-components';

export interface TaskDetailsModalProps {
  task: TaskDetails;
  expanded: string[];
  onToggleSection: (section: string) => void;
}

const normalizeProgressNotes = (value: unknown): ProgressNoteEntry[] => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (!entry) return null;
        const text = typeof (entry as any).text === "string" ? (entry as any).text.trim() : "";
        if (!text) return null;
        const tsSource = (entry as any).ts;
        const ts = typeof tsSource === "string" && tsSource ? tsSource : new Date().toISOString();
        return {
          ts,
          status: typeof (entry as any).status === "string" ? (entry as any).status : "",
          text,
          source: typeof (entry as any).source === "string" ? (entry as any).source : undefined,
        } as ProgressNoteEntry;
      })
      .filter((entry): entry is ProgressNoteEntry => Boolean(entry));
  }

  if (typeof value === "string" && value.trim()) {
    return [
      {
        ts: new Date().toISOString(),
        status: "",
        text: value.trim(),
        source: "Imported",
      },
    ];
  }

  return [];
};



const FieldNotesView = ({ text }: { text?: string }) => {
  if (!text || !text.trim()) {
    return (
      <Typography variant="body2" color="text.secondary">
        No field notes recorded.
      </Typography>
    );
  }
  return (
    <Typography
      variant="body2"
      sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}
      color="text.primary"
    >
      {text}
    </Typography>
  );
};

const getStatusVisuals = (
  status: string,
  theme: Theme
): { icon: React.ReactElement; bg: string; color: string } => {
  const palette = theme.palette;
  switch (status) {
    case "Assigned":
      return {
        icon: <Person style={{ fontSize: 14 }} />,
        bg: alpha(palette.primary.main, 0.14),
        color: palette.primary.main,
      };
    case "Dispatched":
      return {
        icon: <LocalShipping style={{ fontSize: 14 }} />,
        bg: alpha(palette.warning.main, 0.18),
        color: palette.warning.dark,
      };
    case "Accepted":
      return {
        icon: <ThumbUp style={{ fontSize: 14 }} />,
        bg: alpha(palette.secondary.main, 0.16),
        color: palette.secondary.main,
      };
    case "In Progress":
      return {
        icon: <PlayArrow style={{ fontSize: 14 }} />,
        bg: alpha(palette.info.main, 0.18),
        color: palette.info.dark,
      };
    case "Incomplete":
      return {
        icon: <Build style={{ fontSize: 14 }} />,
        bg: alpha(palette.success.main, 0.14),
        color: palette.success.dark,
      };
    case "Complete":
      return {
        icon: <Check style={{ fontSize: 14 }} />,
        bg: alpha(palette.success.main, 0.20),
        color: palette.success.main,
      };
    default:
      return {
        icon: <Person style={{ fontSize: 14 }} />,
        bg: alpha(palette.text.primary, 0.08),
        color: palette.text.secondary,
      };
  }
};

const ProgressNotesList = ({ notes }: { notes: ProgressNoteEntry[] }) => {
  const theme = useTheme();

  if (!notes.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No progress notes captured yet.
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5} sx={{ maxHeight: theme.spacing(30), overflowY: 'auto', pr: 0.5 }}>
      {notes.map((note, index) => {
        const visuals = getStatusVisuals(note.status || "", theme);

        const formatted = (() => {
          try {
            return new Date(note.ts).toLocaleString("en-GB", {
              year: "numeric",
              month: "short",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            });
          } catch {
            return note.ts;
          }
        })();

        return (
          <Paper
            key={`${note.ts}-${index}`}
            variant="outlined"
            sx={{
              borderRadius: 2,
              px: 2.5,
              py: 1.75,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
              <Typography variant="body2" fontWeight={600} color="text.primary">
                {formatted}
              </Typography>
              <Chip
                size="small"
                icon={visuals.icon as React.ReactElement}
                label={note.status || "Logged"}
                sx={{
                  bgcolor: visuals.bg,
                  color: visuals.color,
                  fontWeight: 600,
                  '& .MuiChip-icon': {
                    color: visuals.color,
                  },
                }}
              />
            </Stack>
            {note.source && (
              <Typography
                variant="caption"
                sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
                color="text.secondary"
              >
                Source: {note.source}
              </Typography>
            )}
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }} color="text.primary">
              {note.text}
            </Typography>
          </Paper>
        );
      })}
    </Stack>
  );
};

const formatDuration = (mins: number | undefined) => {
  if (!Number.isFinite(Number(mins)) || (mins || 0) <= 0) return '0m';
  const m = Number(mins);
  if (m < 60) return `${Math.round(m)}m`;
  const h = Math.floor(m / 60);
  const rm = Math.round(m % 60);
  return rm === 0 ? `${h}h` : `${h}h ${rm}m`;
};

interface InfoGridProps {
  items: Array<{ label: string; value: React.ReactNode }>;
}

const InfoGrid = ({ items }: InfoGridProps) => (
  <Grid container spacing={2} columns={{ xs: 4, sm: 8 }}>
    {items.map(({ label, value }) => (
      <Grid item xs={4} sm={4} key={label}>
        <Typography
          variant="caption"
          sx={{
            textTransform: "uppercase",
            letterSpacing: 0.6,
            fontWeight: 600,
            color: "text.secondary",
            display: "block",
            mb: 0.5,
          }}
        >
          {label}
        </Typography>
        <Typography variant="body2" color="text.primary">
          {value ?? "—"}
        </Typography>
      </Grid>
    ))}
  </Grid>
);

export default function TaskDetailsModal({
  task,
  expanded,
  onToggleSection,
}: TaskDetailsModalProps) {
  const theme = useTheme();
  const baseProgressNotes = useMemo(() => normalizeProgressNotes(task.progressNotes), [task]);

  const allNotes = useMemo(() => baseProgressNotes, [baseProgressNotes]);

  const sections = [
    {
      name: "Work Details",
      content: (
        <InfoGrid
          items={[
            { label: "Task ID", value: task.taskId },
            { label: "Type", value: task.taskType },
            { label: "Primary Skill", value: task.primarySkill },
            { label: "Description", value: task.description },
            { label: "Importance Score", value: task.importanceScore },
            { label: "MSC", value: task.msc },
            { label: "Category", value: task.category },
          ]}
        />
      ),
    },
    {
      name: "Commitments / Customer / Location",
      content: (
        <InfoGrid
          items={[
            { label: "Commitment Type", value: task.commitmentType },
            { label: "Commitment Date", value: task.commitmentDate },
            { label: "Appointment Start", value: task.appointmentStartDate },
            { label: "Customer Address", value: task.customerAddress || "—" },
            { label: "Postcode", value: task.postCode || "—" },
          ]}
        />
      ),
    },
    {
      name: "Scheduling / Resources",
      content: (
        <InfoGrid
          items={[
            { label: "Employee ID", value: task.employeeId || "—" },
            { label: "Resource Name", value: task.resourceName || "—" },
            { label: "Estimated Duration", value: task.estimatedDuration ? formatDuration(Number(task.estimatedDuration)) : '—' },
            { label: "Domain", value: task.domain || "—" },
          ]}
        />
      ),
    },
    {
      name: "Access Restrictions",
      content: (
        <Typography variant="body2" color="text.secondary">
          No access restrictions detected.
        </Typography>
      ),
    },
    {
      name: "Job Notes",
      content: <FieldNotesView text={task.fieldNotes} />,
    },
    {
      name: "Progress Notes",
      content: (
        <Stack spacing={2.5}>
          {/* Resource pin input removed — pins are shown at the top of the callout UI */}
          {/* Quick progress action removed — use Progress Notes or batch actions instead */}
          <ProgressNotesList notes={allNotes} />
        </Stack>
      ),
    },
    {
      name: "Closure",
      content: (
        <InfoGrid
          items={[
            { label: "Last Progression", value: task.lastProgression || "—" },
            { label: "Expected Start", value: task.expectedStartDate || "—" },
            { label: "Expected Finish", value: task.expectedFinishDate || "—" },
          ]}
        />
      ),
    },
  ];

  return (
    <Box sx={{ p: 1, backdropFilter: 'none !important' }}>
      <Stack spacing={2.5}>
        {sections.map((section) => {
          const open = expanded.includes(section.name);

          return (
            <ExpandableSectionCard
              key={section.name}
              title={section.name}
              expanded={open}
              onToggle={() => onToggleSection(section.name)}
              contentSx={{
                py: 2.5,
                bgcolor: alpha(theme.palette.primary.main, 0.02),
              }}
              paperProps={{
                sx: {
                  borderRadius: 2,
                  borderColor: alpha(theme.palette.primary.main, 0.14),
                  boxShadow: open
                    ? "0 18px 40px rgba(8,58,97,0.16)"
                    : "0 6px 18px rgba(8,58,97,0.08)",
                  bgcolor: open
                    ? alpha(theme.palette.primary.main, 0.04)
                    : theme.palette.background.paper,
                },
              }}
            >
              {section.content}
            </ExpandableSectionCard>
          );
        })}
      </Stack>
    </Box>
  );
}