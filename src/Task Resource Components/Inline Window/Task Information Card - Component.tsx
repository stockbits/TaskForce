// ===============================================
// Task Information Card - Component.tsx — CARD VERSION (RESTORED)
// ===============================================

import React, { useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  Paper,
  Chip,
  Tabs,
  Tab,
  Theme,
  useTheme,
  alpha,
  Divider,
  Grid,
} from "@mui/material";
import { Build, Check, Person } from "@mui/icons-material";
import type { TaskDetails, ProgressNoteEntry } from "@/shared-types";

const getStatusVisuals = (status: string, theme: Theme) => {
  const { palette } = theme;
  switch (status) {
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`task-tabpanel-${index}`}
      aria-labelledby={`task-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `task-tab-${index}`,
    'aria-controls': `task-tabpanel-${index}`,
  };
}


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
    <Stack spacing={{ xs: 1, sm: 1.5 }} sx={{ maxHeight: theme.spacing(25), overflowY: 'auto', pr: 0.5 }}>
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
              borderRadius: { xs: 1.5, sm: 2 },
              px: { xs: 1.5, sm: 2, md: 2.5 },
              py: { xs: 1.25, sm: 1.5, md: 1.75 },
              display: "flex",
              flexDirection: "column",
              gap: { xs: 0.75, sm: 1 },
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={{ xs: 1, sm: 2 }}>
              <Typography
                variant="body2"
                fontWeight={600}
                color="text.primary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem', md: '0.875rem' } }}
              >
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
                  fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                  height: { xs: 24, sm: 28 },
                  '& .MuiChip-icon': {
                    color: visuals.color,
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  },
                }}
              />
            </Stack>
            {note.source && (
              <Typography
                variant="caption"
                sx={{
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  fontSize: { xs: '0.625rem', sm: '0.6875rem' }
                }}
                color="text.secondary"
              >
                Source: {note.source}
              </Typography>
            )}
            <Typography
              variant="body2"
              sx={{
                whiteSpace: "pre-wrap",
                fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                lineHeight: 1.4
              }}
              color="text.primary"
            >
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
  items: Array<{ label: string; value?: React.ReactNode; field?: string }>;
  editing?: boolean;
  editValues?: Record<string, any>;
  onFieldChange?: (field: string, value: any) => void;
}

const InfoGrid = ({ items, editing, editValues, onFieldChange }: InfoGridProps) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.5, sm: 0.75 } }}>
    {items.map(({ label, value, field }) => (
      <Box key={label} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, py: 0.5 }}>
        <Typography
          variant="caption"
          sx={{
            width: { xs: '38%', sm: '30%' },
            textAlign: 'left',
            pr: 2,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            fontWeight: 700,
            color: 'text.secondary',
            fontSize: { xs: '0.6875rem', sm: '0.75rem' },
            lineHeight: 1.2,
          }}
        >
          {label}
        </Typography>

        <Box sx={{ width: { xs: '62%', sm: '70%' } }}>
          {editing && field ? (
            <TextField
              size="small"
              fullWidth
              value={editValues?.[field] ?? (typeof value === 'string' ? value : '')}
              onChange={(e) => onFieldChange?.(field, e.target.value)}
            />
          ) : (
            <Typography
              variant="body2"
              color="text.primary"
              sx={{
                fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                lineHeight: 1.3,
                wordBreak: 'break-word'
              }}
            >
              {value ?? '—'}
            </Typography>
          )}
        </Box>
      </Box>
    ))}
  </Box>
);

export interface TaskDetailsModalProps {
  task: TaskDetails;
  hideTabs?: boolean;
  activeTab?: number;
  onTabChange?: (newIndex: number) => void;
  editing?: boolean;
  onSave?: (updates: Partial<TaskDetails>) => void;
  onCancel?: () => void;
  // optional external edit state handlers
  externalEditValues?: Record<string, any> | null;
  onExternalFieldChange?: (field: string, value: any) => void;
}

export function createTaskSections(task: TaskDetails, opts?: {
  editing?: boolean;
  editValues?: Record<string, any>;
  onFieldChange?: (field: string, value: any) => void;
}) {
  // Merge sparser sections (Customer, Resources, Access) into a single 'Details' tab
  return [
    {
      name: "Work Details",
      shortName: "Work",
      content: (
        <Paper variant="outlined" sx={{ p: 0.5, borderRadius: 2 }}>
          <Stack spacing={1}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Work Information
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700, color: 'text.secondary', fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                  Task ID
                </Typography>
                <Typography variant="body2" color="text.primary" sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>
                  {task.taskId}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700, color: 'text.secondary', fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                  Type
                </Typography>
                <Typography variant="body2" color="text.primary" sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>
                  {task.taskType}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700, color: 'text.secondary', fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                  Primary Skill
                </Typography>
                {opts?.editing ? (
                  <Box sx={{ display: 'flex' }}>
                    <TextField
                      size="small"
                      fullWidth
                      value={opts.editValues?.primarySkill ?? task.primarySkill ?? ''}
                      onChange={(e) => opts.onFieldChange?.('primarySkill', e.target.value)}
                      sx={{ maxWidth: 220, alignSelf: 'flex-start' }}
                    />
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.primary" sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>
                    {task.primarySkill}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700, color: 'text.secondary', fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                  Importance Score
                </Typography>
                <Typography variant="body2" color="text.primary" sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>
                  {task.importanceScore}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700, color: 'text.secondary', fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                  MSC
                </Typography>
                <Typography variant="body2" color="text.primary" sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>
                  {task.msc}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700, color: 'text.secondary', fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                  Category
                </Typography>
                <Typography variant="body2" color="text.primary" sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>
                  {task.category}
                </Typography>
              </Grid>
            </Grid>

            <Divider />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
                Description
              </Typography>
                {opts?.editing ? (
                <TextField
                  size="small"
                  fullWidth
                  multiline
                  minRows={2}
                  value={opts.editValues?.description ?? task.description ?? ''}
                  onChange={(e) => opts.onFieldChange?.('description', e.target.value)}
                />
              ) : (
                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                  {task.description || 'No description provided.'}
                </Typography>
              )}
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
                Access Restrictions
              </Typography>
              {opts?.editing ? (
                <TextField
                  size="small"
                  fullWidth
                  multiline
                  minRows={1}
                  value={opts.editValues?.accessRestrictions ?? task.accessRestrictions ?? ''}
                  onChange={(e) => opts.onFieldChange?.('accessRestrictions', e.target.value)}
                />
              ) : (
                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                  {task.accessRestrictions || 'No access restrictions detected.'}
                </Typography>
              )}
            </Box>
          </Stack>
        </Paper>
      ),
    },
    {
      name: "Details",
      shortName: "Info",
      content: (
        <Paper variant="outlined" sx={{ p: 0.5, borderRadius: 2 }}>
          <Stack spacing={1}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Task Details
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700, color: 'text.secondary', fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                  Commitment Type
                </Typography>
                <Typography variant="body2" color="text.primary" sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>
                  {task.commitmentType}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700, color: 'text.secondary', fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                  Commitment Date
                </Typography>
                <Typography variant="body2" color="text.primary" sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>
                  {task.commitmentDate}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700, color: 'text.secondary', fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                  Appointment Start
                </Typography>
                <Typography variant="body2" color="text.primary" sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>
                  {task.appointmentStartDate}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700, color: 'text.secondary', fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                  Customer Address
                </Typography>
                <Typography variant="body2" color="text.primary" sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>
                  {task.customerAddress || "—"}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700, color: 'text.secondary', fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                  Postcode
                </Typography>
                <Typography variant="body2" color="text.primary" sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>
                  {task.postCode || "—"}
                </Typography>
              </Grid>
            </Grid>

            <Divider />

            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Resource Information
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700, color: 'text.secondary', fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                  Employee ID
                </Typography>
                <Typography variant="body2" color="text.primary" sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>
                  {task.employeeId || "—"}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700, color: 'text.secondary', fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                  Resource Name
                </Typography>
                <Typography variant="body2" color="text.primary" sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>
                  {task.resourceName || "—"}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700, color: 'text.secondary', fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                  Estimated Duration
                </Typography>
                <Typography variant="body2" color="text.primary" sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>
                  {task.estimatedDuration ? formatDuration(Number(task.estimatedDuration)) : '—'}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700, color: 'text.secondary', fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                  Domain
                </Typography>
                <Typography variant="body2" color="text.primary" sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>
                  {task.domain || "—"}
                </Typography>
              </Grid>
            </Grid>
          </Stack>
        </Paper>
      ),
    },
    {
      name: "Field Note",
      shortName: "Notes",
      content: (
        <Paper variant="outlined" sx={{ p: 0.5, borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.75 }}>
            Field Note
          </Typography>
          {opts?.editing ? (
            <TextField
              size="small"
              fullWidth
              multiline
              minRows={2}
              value={opts.editValues?.fieldNotes ?? task.fieldNotes ?? ''}
              onChange={(e) => opts.onFieldChange?.('fieldNotes', e.target.value)}
              placeholder="Enter job notes..."
            />
          ) : (
            <FieldNotesView text={task.fieldNotes} />
          )}
        </Paper>
      ),
    },
    {
      name: "Progress Note",
      shortName: "Progress",
      content: (
        <Paper variant="outlined" sx={{ p: 0.5, borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.75 }}>
            Progress Note
          </Typography>
          <ProgressNotesList notes={normalizeProgressNotes(task.progressNotes)} />
        </Paper>
      ),
    },
    {
      name: "Closure",
      shortName: "Closure",
      content: (
        <Paper variant="outlined" sx={{ p: 0.5, borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.75 }}>
            Closure Information
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={4}>
              <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700, color: 'text.secondary', fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                Last Progression
              </Typography>
              <Typography variant="body2" color="text.primary" sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>
                {task.lastProgression || "—"}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700, color: 'text.secondary', fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                Expected Start
              </Typography>
              <Typography variant="body2" color="text.primary" sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>
                {task.expectedStartDate || "—"}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700, color: 'text.secondary', fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                Expected Finish
              </Typography>
              <Typography variant="body2" color="text.primary" sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>
                {task.expectedFinishDate || "—"}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      ),
    },
  ];
}

function TaskDetailsModal(props: TaskDetailsModalProps) {
  const { task, hideTabs = false, activeTab: activeTabProp, onTabChange, editing = false, onSave, onCancel, externalEditValues = null, onExternalFieldChange } = props;
  const theme = useTheme();
  const [internalTab, setInternalTab] = useState(0);
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    if (onTabChange) onTabChange(newValue);
    setInternalTab(newValue);
  };

  // local edit state if external not provided
  const [internalEditValues, setInternalEditValues] = useState<Record<string, any>>({ ...task });

  React.useEffect(() => {
    if (!externalEditValues) setInternalEditValues({ ...task });
  }, [task, externalEditValues]);

  const onFieldChange = (field: string, value: any) => {
    if (onExternalFieldChange) return onExternalFieldChange(field, value);
    setInternalEditValues((s) => ({ ...s, [field]: value }));
  };

  const editValues = externalEditValues ?? internalEditValues;

  const sections = useMemo(() => createTaskSections(task, { editing, editValues, onFieldChange }), [task, editing, editValues]);

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {!hideTabs && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTabProp ?? internalTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              '& .MuiTabs-indicator': {
                height: 3,
                backgroundColor: theme.palette.primary.main,
              },
              '& .MuiTab-root': {
                minHeight: 44,
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.8125rem',
                minWidth: { xs: 80, sm: 100, md: 120 },
                px: { xs: 1, sm: 2 },
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                },
              },
              '& .MuiTabs-scrollButtons': {
                width: { xs: 24, sm: 32 },
                '&.Mui-disabled': {
                  opacity: 0.3,
                },
              },
              '& .MuiTabs-flexContainer': {
                gap: { xs: 0, sm: 0 },
              },
            }}
          >
            {sections.map((section, index) => (
              <Tab
                key={section.name}
                label={section.shortName}
                title={section.name}
                {...a11yProps(index)}
              />
            ))}
          </Tabs>
        </Box>
      )}

      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {sections.map((section, index) => (
          <TabPanel key={section.name} value={activeTabProp ?? internalTab} index={index}>
            <Box sx={{
                height: '100%',
                overflowY: 'auto',
                px: { xs: 2, sm: 3 },
                py: { xs: 2, sm: 3 },
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: alpha(theme.palette.background.paper, 0.1),
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: alpha(theme.palette.primary.main, 0.3),
                borderRadius: '3px',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.5),
                },
              },
            }}>
              {section.content}

              {/* Footer actions are handled by the outer dialog/footer; remove duplicated buttons here. */}
            </Box>
          </TabPanel>
        ))}
      </Box>
    </Box>
  );
}

export default TaskDetailsModal;
