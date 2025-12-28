// ===============================================================
// Task Popout Panel - Component.tsx — Dynamic Compare Layout (Card-centred)
// - Single-task: 720px centre card
// - Multi-task: 520px cards, gap-4, px-6 outer padding
// - 3 tasks: one row, centred, no wrap
// - 4+ tasks: horizontal scroll (scrollbar outside cards)
// ===============================================================

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Paper, Stack, Typography, Chip, IconButton } from "@mui/material";
import { AppButton } from '@/shared-components';
import { alpha, useTheme } from "@mui/material/styles";
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import X from '@mui/icons-material/Close';
import TaskDetailsModal from "@/Task Resource Components/Inline Window/Task Information Card - Component";
import { PillGroup } from '@/shared-components';
import type { TaskDetails } from "@/shared-types";

interface TaskPopoutPanelProps {
  open: boolean;
  tasks: TaskDetails[];
  expanded: string[];
  onToggleSection: (section: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onClose: () => void;
}

export default function TaskPopoutPanel({
  open,
  tasks,
  expanded,
  onToggleSection,
  onExpandAll,
  onCollapseAll,
  onClose: _onClose,
}: TaskPopoutPanelProps) {
  const theme = useTheme();
  const pillRailRef = useRef<HTMLDivElement | null>(null);

  const [activePills, setActivePills] = useState<string[]>(() =>
    tasks.map((task) => task.taskId)
  );

  useEffect(() => {
    setActivePills((previous) => {
      const next = tasks
        .map((task) => task.taskId)
        .filter((taskId) => previous.includes(taskId));

      if (next.length > 0) return next;
      if (tasks.length === 0) return [];
      return [tasks[0].taskId];
    });
  }, [tasks]);

  const visibleTasks = useMemo<TaskDetails[]>(() => {
    if (tasks.length === 0) return [];
    const ids = activePills.length > 0 ? activePills : [tasks[0].taskId];
    return tasks.filter((task) => ids.includes(task.taskId));
  }, [activePills, tasks]);

  const singleTaskMode = visibleTasks.length <= 1;
  const showSelectionControls = tasks.length > 1;
  const allSelected = activePills.length === tasks.length && tasks.length > 0;

  const selectAll = () => {
    setActivePills(tasks.map((task) => task.taskId));
  };

  const unselectAll = () => {
    if (tasks.length === 0) {
      setActivePills([]);
      return;
    }

    setActivePills([tasks[0].taskId]);
  };

  const handlePillClick = (taskId: string) => {
    setActivePills((previous) => {
      const alreadyActive = previous.includes(taskId);

      if (alreadyActive) {
        const remaining = previous.filter((id) => id !== taskId);
        if (remaining.length === 0 && tasks.length > 0) {
          return [tasks[0].taskId];
        }
        return remaining;
      }

      return [...previous, taskId];
    });
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
              Task Details {tasks.length > 1 ? `(${tasks.length})` : ''}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {tasks.length === 1 
                ? "Explore task details and current status." 
                : "Compare multiple tasks and their details."
              }
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <AppButton
              variant="contained"
              color="primary"
              size="small"
              onClick={() =>
                expanded.length > 0 ? onCollapseAll() : onExpandAll()
              }
              startIcon={expanded.length ? <ExpandLess style={{ fontSize: 14 }} /> : <ExpandMore style={{ fontSize: 14 }} />}
              sx={{
                fontWeight: 600,
              }}
            >
              {expanded.length > 0 ? "Collapse All" : "Expand All"}
            </AppButton>

            {showSelectionControls && (
              allSelected ? (
                <AppButton
                  size="small"
                  variant="outlined"
                  onClick={unselectAll}
                  sx={{ fontWeight: 600 }}
                >
                  Unselect All
                </AppButton>
              ) : (
                <AppButton
                  size="small"
                  variant="contained"
                  onClick={selectAll}
                  sx={{ boxShadow: "none", fontWeight: 600 }}
                >
                  Select All
                </AppButton>
              )
            )}

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
              onClick={_onClose}
              sx={{
                color: theme.palette.mode === 'dark' ? theme.palette.common.white : alpha(theme.palette.text.primary, 0.9),
                bgcolor: 'transparent',
                '&:hover': { bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.06) : alpha(theme.palette.text.primary, 0.06) },
              }}
              aria-label="Close task panel"
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
            {tasks.length === 1 ? (
              <>
                <Chip
                  label={tasks[0].taskId}
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
                {tasks[0].taskType && (
                  <Chip
                    label={tasks[0].taskType}
                    size="small"
                    variant="outlined"
                    sx={{
                      color: alpha(theme.palette.text.primary, 0.85),
                      borderColor: alpha(theme.palette.text.primary, 0.2),
                      bgcolor: theme.palette.background.paper,
                    }}
                  />
                )}
              </>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {tasks.length} tasks selected
              </Typography>
            )}
          </Stack>
        </Box>

        {showSelectionControls && (
          <Box
            sx={{
              px: { xs: 3, md: 6 },
              py: 1.5,
              backgroundColor: alpha(theme.palette.primary.main, 0.06),
              borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
            }}
          >
            <Stack
              ref={pillRailRef}
              direction="row"
              spacing={1.5}
              sx={{
                overflowX: "auto",
                pb: 0.5,
                alignItems: "center",
                '&::-webkit-scrollbar': { height: theme.spacing(0.75) }, // 6px
              }}
            >
              <PillGroup
                items={tasks.map((t) => ({ id: t.taskId, label: String(t.taskId) }))}
                activeIds={activePills}
                maxVisible={6}
                onToggle={(id: string) => handlePillClick(id)}
                onSelectAll={selectAll}
                onClearAll={unselectAll}
              />
            </Stack>
          </Box>
        )}

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
            <Box
              sx={{
                width: '100%',
                maxWidth: singleTaskMode ? 720 : '100%',
                display: "grid",
                gridTemplateColumns: singleTaskMode 
                  ? '1fr' 
                  : {
                      xs: '1fr', // 1 column on mobile
                      sm: 'repeat(auto-fit, minmax(320px, 1fr))', // 1-2 columns on tablet
                      md: 'repeat(auto-fit, minmax(400px, 1fr))', // 2-3 columns on desktop
                      lg: 'repeat(auto-fit, minmax(480px, 1fr))', // 2-3 columns on large desktop
                    },
                gap: 2.5,
                justifyContent: "center",
                alignItems: singleTaskMode ? "center" : "start",
                pb: 2,
              }}
            >
              {visibleTasks.map((task) => (
                <Paper
                  key={task.taskId}
                  elevation={10}
                  sx={{
                    borderRadius: 3,
                    width: '100%',
                    minHeight: singleTaskMode ? 'auto' : 400,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
                    boxShadow: theme.palette.mode === 'dark' ? theme.shadows[17] : theme.shadows[17],
                    bgcolor: alpha(theme.palette.background.paper, 0.98),
                    px: { xs: 3, md: 4 },
                    py: { xs: 3, md: 4 },
                  }}
                >
                  <TaskDetailsModal
                    task={task}
                    expanded={expanded}
                    onToggleSection={onToggleSection}
                  />
                </Paper>
              ))}
            </Box>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
