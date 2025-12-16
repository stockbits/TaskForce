// ===============================================
// TaskDetailsModal.tsx — CARD VERSION (RESTORED)
// ===============================================

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import AppButton from '@/shared-ui/button';
import { alpha } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import { User, Truck, ThumbsUp, Play, Wrench, Check } from "lucide-react";
import type { TaskDetails, ProgressNoteEntry } from "@/types";
import ResourceMock from "@/data/ResourceMock.json";
import ExpandableSectionCard from "@/shared-ui/ExpandableSectionCard";

export interface TaskDetailsModalProps {
  task: TaskDetails;
  expanded: string[];
  onToggleSection: (section: string) => void;
}

const isBrowser = typeof window !== "undefined";

const storageKeyForNotes = (taskId: string) => `task:${taskId}:progressNotes`;
const draftKeyForNotes = (taskId: string) => `taskProgressNotes:${taskId}:draft`;

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

const mergeNotes = (base: ProgressNoteEntry[], extras: ProgressNoteEntry[]) => {
  const map = new Map<string, ProgressNoteEntry>();
  [...base, ...extras].forEach((entry) => {
    if (!entry?.text?.trim()) return;
    const key = `${entry.ts}-${entry.text}`;
    map.set(key, entry);
  });
  return Array.from(map.values()).sort((a, b) => {
    const aTime = new Date(a.ts).getTime();
    const bTime = new Date(b.ts).getTime();
    return bTime - aTime;
  });
};

const loadLocalNotes = (taskId: string): ProgressNoteEntry[] => {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(storageKeyForNotes(taskId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return normalizeProgressNotes(parsed);
  } catch (err) {
    console.warn("Failed to read local progress notes", err);
    return [];
  }
};

const persistLocalNotes = (taskId: string, notes: ProgressNoteEntry[]) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(storageKeyForNotes(taskId), JSON.stringify(notes));
  } catch (err) {
    console.warn("Unable to persist progress notes", err);
  }
};

interface ProgressNotesEditorProps {
  taskId: string;
  taskStatus?: string;
  onAdd: (entry: ProgressNoteEntry) => void;
}

function ProgressNotesEditor({ taskId, taskStatus, onAdd }: ProgressNotesEditorProps) {
  const theme = useTheme();
  const draftKey = draftKeyForNotes(taskId);
  const [text, setText] = useState<string>(() => {
    if (!isBrowser) return "";
    try {
      return window.localStorage.getItem(draftKey) || "";
    } catch {
      return "";
    }
  });
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serverReachable, setServerReachable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isBrowser) return;
    let mounted = true;
    fetch("http://localhost:5179/health")
      .then(() => mounted && setServerReachable(true))
      .catch(() => mounted && setServerReachable(false));
    return () => {
      mounted = false;
    };
  }, [taskId]);

  useEffect(() => {
    if (!isBrowser || !statusMessage) return;
    const timeout = window.setTimeout(() => setStatusMessage(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [statusMessage]);

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const entry: ProgressNoteEntry = {
      ts: new Date().toISOString(),
      status: taskStatus || "",
      text: trimmed,
      source: "Agent",
    };

    setSaving(true);
    setError(null);
    onAdd(entry);

    try {
      const resp = await fetch("http://localhost:5179/progress-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, text: trimmed, taskStatus }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setStatusMessage("Saved & synced");
    } catch (err: any) {
      console.warn("Progress notes sync failed", err);
      setStatusMessage("Saved locally (offline)");
      setError(serverReachable === false ? null : err?.message || "Sync failed");
    } finally {
      setSaving(false);
      setText("");
      if (isBrowser) {
        try {
          window.localStorage.removeItem(draftKey);
        } catch {
          /* ignore */
        }
      }
    }
  };

  const handleChange = (value: string) => {
    setText(value);
    if (!isBrowser) return;
    try {
      if (value.trim()) {
        window.localStorage.setItem(draftKey, value);
      } else {
        window.localStorage.removeItem(draftKey);
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <Stack spacing={1.5}>
      <Typography
        variant="overline"
        sx={{ color: theme.palette.text.secondary, letterSpacing: 0.6 }}
      >
        Add Progress Note
      </Typography>
      <TextField
        value={text}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="Summarise field actions, blockers, or next steps…"
        multiline
        minRows={4}
        size="small"
        sx={{
          '& .MuiOutlinedInput-root': {
            alignItems: "flex-start",
          },
        }}
      />
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <AppButton
          type="button"
          onClick={handleSave}
          disabled={!text.trim() || saving}
          variant="contained"
        >
          {saving ? "Saving…" : "Save Note"}
        </AppButton>
        <Stack spacing={1} direction="row" flexWrap="wrap" useFlexGap>
          {statusMessage && (
            <Alert severity="success" variant="outlined" sx={{ py: 0.5 }}>
              {statusMessage}
            </Alert>
          )}
          {error && !statusMessage && (
            <Alert severity="error" variant="outlined" sx={{ py: 0.5 }}>
              {error}
            </Alert>
          )}
          {serverReachable === false && (
            <Typography variant="caption" color="text.secondary">
              Offline mode
            </Typography>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
}

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
        icon: <User size={14} />,
        bg: alpha(palette.primary.main, 0.14),
        color: palette.primary.main,
      };
    case "Dispatched":
      return {
        icon: <Truck size={14} />,
        bg: alpha(palette.warning.main, 0.18),
        color: palette.warning.dark,
      };
    case "Accepted":
      return {
        icon: <ThumbsUp size={14} />,
        bg: alpha(palette.secondary.main, 0.16),
        color: palette.secondary.main,
      };
    case "In Progress":
      return {
        icon: <Play size={14} />,
        bg: alpha(palette.info.main, 0.18),
        color: palette.info.dark,
      };
    case "Incomplete":
      return {
        icon: <Wrench size={14} />,
        bg: alpha(palette.success.main, 0.14),
        color: palette.success.dark,
      };
    case "Complete":
      return {
        icon: <Check size={14} />,
        bg: alpha(palette.success.main, 0.20),
        color: palette.success.main,
      };
    default:
      return {
        icon: <User size={14} />,
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
  const [customNotes, setCustomNotes] = useState<ProgressNoteEntry[]>([]);

  useEffect(() => {
    setCustomNotes(loadLocalNotes(task.taskId));
  }, [task.taskId]);

  const allNotes = useMemo(
    () => mergeNotes(baseProgressNotes, customNotes),
    [baseProgressNotes, customNotes]
  );

  const handleAddNote = useCallback(
    (entry: ProgressNoteEntry) => {
      setCustomNotes((prev) => {
        const next = [...prev, entry];
        persistLocalNotes(task.taskId, next);
        return next;
      });
    },
    [task.taskId]
  );

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
            { label: "Estimated Duration", value: task.estimatedDuration || "—" },
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
          <ProgressNotesEditor
            taskId={task.taskId}
            taskStatus={task.taskStatus}
            onAdd={handleAddNote}
          />
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
