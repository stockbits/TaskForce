// ===============================================================
// Task Popout Panel - Component.tsx — Dynamic Compare Layout (Card-centred)
// - Single-task: 720px centre card
// - Multi-task: 520px cards, gap-4, px-6 outer padding
// - 3 tasks: one row, centred, no wrap
// - 4+ tasks: horizontal scroll (scrollbar outside cards)
// ===============================================================

import React, { useEffect, useMemo, useState, useRef } from "react";
import { Box, Stack, Typography, Chip, Tabs, Tab, Button, Menu, MenuItem, Tooltip, Slide, Divider } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { OpenInFull } from '@mui/icons-material';
// header handled by outer dialog
import TaskDetailsModal, { createTaskSections } from "@/Task Resource Components/Inline Window/Task Information Card - Component";
import type { TaskDetails } from "@/shared-types";

// Helper function to get task ID from various possible property names
const getTaskId = (task: any): string => {
  return task.taskId || task.TaskID || task.id || String(task);
};

interface TaskPopoutPanelProps {
  open: boolean;
  tasks: TaskDetails[];
  onClose: () => void;
  editing?: boolean;
  onEditToggle?: () => void;
  onRequestSave?: (updates: Partial<TaskDetails>) => void;
  onCreateNew?: () => void;
  // optional external minimize control (when panel is hosted by higher-level layout)
  externalMinimized?: boolean;
  setExternalMinimized?: (v: boolean) => void;
}

export default function TaskPopoutPanel({
  open,
  tasks,
  onClose,
  editing = false,
  onEditToggle,
  onRequestSave,
  onCreateNew,
  externalMinimized,
  setExternalMinimized,
}: TaskPopoutPanelProps) {
  const theme = useTheme();

  const [activeTaskId, setActiveTaskId] = useState<string>(() =>
    tasks.length > 0 ? getTaskId(tasks[0]) : ''
  );

  useEffect(() => {
    if (tasks.length > 0 && !tasks.some(task => getTaskId(task) === activeTaskId)) {
      setActiveTaskId(getTaskId(tasks[0]));
    }
  }, [tasks, activeTaskId]);

  const activeTask = useMemo<TaskDetails | null>(() => {
    if (tasks.length === 0) return null;
    return tasks.find(task => getTaskId(task) === activeTaskId) || tasks[0];
  }, [activeTaskId, tasks]);

  const singleTaskMode = (tasks?.length ?? 0) <= 1; // single or multi task layout

  

  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    setActiveTab(0);
  }, [activeTaskId]);

  // menu state for chips with special content (contains '$' or too long)
  const [chipMenuAnchor, setChipMenuAnchor] = useState<HTMLElement | null>(null);
  const [chipMenuTaskId, setChipMenuTaskId] = useState<string | null>(null);

  // overflow menu state when there are more than maxVisibleChips
  const [overflowAnchor, setOverflowAnchor] = useState<HTMLElement | null>(null);
  const maxVisibleChips = 4;

  // minimized / compact state (can be controlled externally)
  const [internalMinimized, setInternalMinimized] = useState(false);
  const minimized = externalMinimized ?? internalMinimized;
  const setMinimized = setExternalMinimized ?? setInternalMinimized;

  // reset minimize when switching tasks
  useEffect(() => {
    setMinimized(false);
  }, [activeTaskId]);

  // external edit state for TaskDetailsModal when editing
  const [editValues, setEditValues] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (activeTask) {
      setEditValues({ ...activeTask });
    } else {
      setEditValues(null);
    }
  }, [activeTaskId, activeTask]);

  const onFieldChange = (field: string, value: any) => setEditValues((s) => ({ ...(s ?? {}), [field]: value }));

  // compact floating chip menu state
  const [compactAnchor, setCompactAnchor] = useState<HTMLElement | null>(null);
  const [compactDocked, setCompactDocked] = useState<boolean>(true);
  const [compactPos, setCompactPos] = useState<{ left: number; top: number } | null>(null);
  const draggingRef = useRef<{ startX: number; startY: number; origLeft: number; origTop: number } | null>(null);

  useEffect(() => {
    // initialize floating position near bottom-right if not docked
    if (!compactPos) {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const h = typeof window !== 'undefined' ? window.innerHeight : 800;
      setCompactPos({ left: Math.max(w - 160, 24), top: Math.max(h - 80, 24) });
    }
  }, [compactPos]);

  const onCompactPointerDown = (e: React.PointerEvent) => {
    if (compactDocked) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    draggingRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origLeft: compactPos?.left ?? 0,
      origTop: compactPos?.top ?? 0,
    };
  };

  const onCompactPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const d = draggingRef.current;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    setCompactPos({ left: Math.max(8, d.origLeft + dx), top: Math.max(8, d.origTop + dy) });
  };

  const onCompactPointerUp = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
    // snap to nearest edge: left or right
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const left = compactPos?.left ?? 0;
    const snappedToRight = left > w / 2;
    if (snappedToRight) {
      // dock to right
      setCompactDocked(true);
      setCompactPos(null);
    }
    draggingRef.current = null;
  };

  if (!open) return null;

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
        overflow: "visible",
      }}
    >
      {/* Main panel slides away when minimized - use GPU-accelerated transforms and smoother timing */}
          <Slide in={!minimized} direction="down" mountOnEnter unmountOnExit timeout={{ enter: 320, exit: 200 }}>
            <Stack
              sx={{
                flex: 1,
                bgcolor: theme.palette.background.paper,
                overflow: "visible",
                transform: 'translateZ(0)',
                willChange: 'transform, opacity',
                transition: 'transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 220ms ease',
                backfaceVisibility: 'hidden',
              }}
            >
        {/* Header moved to outer dialog to avoid duplication */}

        <Box
          sx={{
            px: { xs: 1, md: 2 },
            py: { xs: 0.75, md: 1 },
            borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            bgcolor: theme.palette.mode === 'dark'
              ? alpha(theme.palette.primary.main, 0.08)
              : alpha(theme.palette.primary.main, 0.04),
            transform: 'translateZ(0)',
          }}
        >
            <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', overflowX: 'auto', py: 0.1 }}>
              {tasks && tasks.length > 0 ? (
                (() => {
                  const visible = tasks.slice(0, maxVisibleChips);
                  const overflow = tasks.length > maxVisibleChips ? tasks.slice(maxVisibleChips) : [];

                  return (
                    <>
                      {visible.map((t) => {
                        const id = getTaskId(t);
                        const selected = id === activeTaskId;
                        const hasDollar = id.includes('$');

                        return (
                          <Tooltip key={id} title={id} arrow>
                            <span>
                              <Chip
                                label={
                                  <Box component="span" sx={{ display: 'inline-block', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center', width: '100%' }}>
                                    {id}
                                  </Box>
                                }
                                size="small"
                                clickable
                                onClick={(e) => {
                                  if (hasDollar) {
                                    setChipMenuTaskId(id);
                                    setChipMenuAnchor(e.currentTarget);
                                  } else {
                                    setActiveTaskId(id);
                                  }
                                }}
                                variant={selected ? 'filled' : 'outlined'}
                                sx={{
                                  borderRadius: 2,
                                  px: 1,
                                  py: 0.25,
                                  minHeight: 32,
                                  fontSize: '0.8rem',
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  bgcolor: selected ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.05),
                                  color: selected ? theme.palette.common.white : theme.palette.text.primary,
                                  borderColor: selected ? theme.palette.primary.main : alpha(theme.palette.divider, 0.5),
                                  '&:hover': {
                                    bgcolor: selected ? theme.palette.primary.dark : alpha(theme.palette.primary.main, 0.1),
                                  },
                                  boxShadow: selected ? theme.shadows[2] : 'none',
                                }}
                              />
                            </span>
                          </Tooltip>
                        );
                      })}

                      {overflow.length > 0 && (
                        <Chip
                          label={`+${overflow.length}`}
                          size="small"
                          clickable
                          onClick={(e) => setOverflowAnchor(e.currentTarget)}
                          variant="outlined"
                          sx={{ borderRadius: 1, px: 0.75, py: 0.15, minHeight: 28, fontSize: '0.75rem' }}
                        />
                      )}

                      {/* chip menu for '$' or special chips */}
                      <Menu anchorEl={chipMenuAnchor} open={Boolean(chipMenuAnchor)} onClose={() => { setChipMenuAnchor(null); setChipMenuTaskId(null); }}>
                        {chipMenuTaskId && (() => {
                          const full = chipMenuTaskId;
                          if (full.includes('$')) {
                            return full.split('$').map((part, i) => (
                              <MenuItem key={i} onClick={() => { setActiveTaskId(chipMenuTaskId); setChipMenuAnchor(null); setChipMenuTaskId(null); }}>
                                {part}
                              </MenuItem>
                            ));
                          }
                          return <MenuItem onClick={() => { setActiveTaskId(chipMenuTaskId); setChipMenuAnchor(null); setChipMenuTaskId(null); }}>{full}</MenuItem>;
                        })()}
                      </Menu>

                      {/* overflow menu showing remaining tasks */}
                      <Menu anchorEl={overflowAnchor} open={Boolean(overflowAnchor)} onClose={() => setOverflowAnchor(null)}>
                        {overflow.map((t) => {
                          const id = getTaskId(t);
                          return (
                            <MenuItem key={id} onClick={() => { setActiveTaskId(id); setOverflowAnchor(null); }}>{id}</MenuItem>
                          );
                        })}
                      </Menu>
                    </>
                  );
                })()
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  No task selected
                </Typography>
              )}
            </Box>

            {/* removed duplicate bottom close button — use dialog title close instead */}
          </Stack>

          {/* External Tabs that fill the available width */}
          {activeTask && (
              <Box sx={{ mt: 0.2 }}>
                <Tabs
                value={activeTab}
                onChange={(_, nv) => setActiveTab(nv)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  '& .MuiTabs-indicator': { height: 3, backgroundColor: theme.palette.primary.main },
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 1,
                    flex: '1 1 auto',
                    minWidth: { xs: 64, sm: 84 },
                  },
                  '& .MuiTabs-flexContainer': { justifyContent: 'space-between' }
                }}
              >
                {createTaskSections(activeTask).map((s) => (
                  <Tab key={s.name} label={s.shortName} />
                ))}
              </Tabs>
            </Box>
          )}
        </Box>

        {/* BODY */}
        <Box
          sx={{
            flex: 1,
            px: { xs: 0.5, md: 1 },
            py: { xs: 0.5, md: 1 },
            bgcolor: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.grey[100], 0.03) 
              : alpha(theme.palette.primary.main, 0.01),
            overflowY: "auto",
            transform: 'translateZ(0)',
            willChange: 'transform, scroll-position',
          }}
        >
              <Box sx={{ display: "flex", justifyContent: "flex-start", pt: 0.5, pb: 0.5 }}>
                <Box
                  sx={{
                    width: '100%',
                    maxWidth: singleTaskMode ? 720 : '100%',
                    minWidth: singleTaskMode ? 600 : '100%',
                    minHeight: 500,
                    gap: 1,
                    justifyContent: "flex-start",
                    alignItems: 'stretch',
                    pb: 0,
                  }}
                >
                  {!tasks || tasks.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                      <Typography variant="body1">No task selected</Typography>
                      <Typography variant="body2">Please select a task from the sidebar</Typography>
                    </Box>
                  ) : singleTaskMode ? (
                    <Box
                      sx={{
                        borderRadius: 1,
                        width: '100%',
                        maxHeight: 'none',
                        bgcolor: 'transparent',
                        px: { xs: 1, md: 1 },
                        py: { xs: 0.5, md: 1 },
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                      }}
                    >
                      <Box sx={{ flex: 1, overflowY: 'visible', pr: 0.5 }}>
                        <TaskDetailsModal
                          task={activeTask ?? tasks[0]}
                          hideTabs
                          editing={editing}
                          externalEditValues={editValues}
                          onExternalFieldChange={onFieldChange}
                          onTabChange={(n) => setActiveTab(n)}
                          activeTab={activeTab}
                          onSave={(updates) => onRequestSave?.(updates)}
                          onCancel={() => { /* noop - parent may toggle editing */ }}
                        />
                      </Box>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        borderRadius: 1,
                        width: '100%',
                        maxHeight: 'none',
                        bgcolor: 'transparent',
                        px: { xs: 1, md: 1 },
                        py: { xs: 0.5, md: 1 },
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <Box sx={{ flex: 1, overflowY: 'visible', pr: 0.5 }}>
                        <TaskDetailsModal
                          task={activeTask ?? tasks[0]}
                          hideTabs
                          editing={editing}
                          externalEditValues={editValues}
                          onExternalFieldChange={onFieldChange}
                          onTabChange={(n) => setActiveTab(n)}
                          activeTab={activeTab}
                          onSave={(updates) => onRequestSave?.(updates)}
                          onCancel={() => { /* noop - parent may toggle editing */ }}
                        />
                      </Box>
                    </Box>
                  )}
                </Box>
          </Box>

          {/* Sticky footer so at least one action is visible on load and reduces free space */}
          <Box
            sx={{
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
              px: { xs: 2, md: 3 },
              py: { xs: 1, md: 1 },
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 1,
              bgcolor: theme.palette.background.paper,
              position: 'sticky',
              bottom: 0,
              zIndex: 10,
            }}
          >
            {onEditToggle && !editing && (
              <Button size="small" variant="contained" onClick={onEditToggle}>Edit</Button>
            )}

            {onEditToggle && editing && (
              <>
                <Button size="small" onClick={() => {
                  // revert external edits to the current active task and exit edit mode
                  setEditValues(activeTask ? { ...activeTask } : null);
                  onEditToggle();
                }}>Cancel</Button>
                <Button size="small" variant="contained" onClick={() => {
                  // save current edits then exit edit mode
                  if (editValues) onRequestSave?.(editValues as Partial<TaskDetails>);
                  onEditToggle();
                }}>Save</Button>
              </>
            )}
          </Box>
        </Box>
      </Stack>
      </Slide>

      {/* Compact floating restore chip when minimized */}
          {minimized && activeTask && !externalMinimized && (
            <Slide in={minimized} direction="up" mountOnEnter unmountOnExit>
              <Box
                sx={{ position: 'fixed', bottom: compactDocked ? 16 : 'auto', right: compactDocked ? 16 : 'auto', zIndex: 1400 }}
                style={!compactDocked && compactPos ? { left: compactPos.left, top: compactPos.top } : undefined}
                onPointerDown={onCompactPointerDown}
                onPointerMove={onCompactPointerMove}
                onPointerUp={onCompactPointerUp}
              >
                <Chip
                  label={getTaskId(activeTask)}
                  icon={<OpenInFull />}
                  clickable
                  onClick={(e) => setCompactAnchor(e.currentTarget as HTMLElement)}
                  sx={{ boxShadow: 3, cursor: compactDocked ? 'pointer' : 'move' }}
                />

                <Menu anchorEl={compactAnchor} open={Boolean(compactAnchor)} onClose={() => setCompactAnchor(null)}>
                  <MenuItem onClick={() => { setMinimized(false); setCompactAnchor(null); }}>Open panel</MenuItem>
                  <MenuItem onClick={() => { onCreateNew?.(); setCompactAnchor(null); }}>Create new task</MenuItem>
                  <MenuItem onClick={() => { setCompactDocked((s) => !s); setCompactAnchor(null); }}>{compactDocked ? 'Undock (move)' : 'Dock to right'}</MenuItem>
                  <Divider />
                  {tasks.slice(0, 8).map((t) => {
                    const id = getTaskId(t);
                    return (
                      <MenuItem key={id} onClick={() => { setActiveTaskId(id); setMinimized(false); setCompactAnchor(null); }}>{id}</MenuItem>
                    );
                  })}
                </Menu>
              </Box>
            </Slide>
          )}
    </Box>
  );
}
