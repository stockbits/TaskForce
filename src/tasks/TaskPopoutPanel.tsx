// ===============================================================
// TaskPopoutPanel.tsx — Dynamic Compare Layout (Card-centred)
// - Single-task: 720px centre card
// - Multi-task: 520px cards, gap-4, px-6 outer padding
// - 3 tasks: one row, centred, no wrap
// - 4+ tasks: horizontal scroll (scrollbar outside cards)
// ===============================================================

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Chip, Paper, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ChevronUp, ChevronDown } from "lucide-react";
import TaskDetailsModal from "./TaskDetailsModal";
import type { TaskDetails } from "@/types";

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
  onClose,
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

  // ======================================================
  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
        width: "100%",
        bgcolor: "background.default",
        color: "text.primary",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          bgcolor: "background.paper",
          overflow: "hidden",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={3}
          sx={{
            px: 4,
            py: 2.5,
            borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
            boxShadow: "0 8px 20px rgba(10, 74, 122, 0.08)",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Typography variant="h6" fontWeight={600} color="text.primary">
            Task Details ({tasks.length})
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              size="small"
              variant="contained"
              onClick={() =>
                expanded.length > 0 ? onCollapseAll() : onExpandAll()
              }
              startIcon={expanded.length > 0 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              sx={{ textTransform: "none", borderRadius: 2, boxShadow: "none" }}
            >
              {expanded.length > 0 ? "Collapse All" : "Expand All"}
            </Button>

            {showSelectionControls && (
              allSelected ? (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={unselectAll}
                  sx={{ textTransform: "none", borderRadius: 2 }}
                >
                  Unselect All
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="contained"
                  onClick={selectAll}
                  sx={{ textTransform: "none", borderRadius: 2, boxShadow: "none" }}
                >
                  Select All
                </Button>
              )
            )}

            <Button
              size="small"
              variant="outlined"
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              Edit
            </Button>
          </Stack>
        </Stack>

        <Box
          sx={{
            px: 4,
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
              '&::-webkit-scrollbar': { height: 6 },
            }}
          >
            {tasks.map((task) => {
              const isActive = activePills.includes(task.taskId);
              return (
                <Box key={task.taskId} data-pill={task.taskId} sx={{ flexShrink: 0 }}>
                  <Chip
                    label={task.taskId}
                    clickable
                    onClick={() => handlePillClick(task.taskId)}
                    variant="outlined"
                    sx={{
                      borderRadius: 999,
                      fontSize: "0.7rem",
                      px: 1.5,
                      py: 0.5,
                      bgcolor: isActive
                        ? alpha(theme.palette.primary.main, 0.15)
                        : theme.palette.background.paper,
                      color: isActive
                        ? theme.palette.primary.main
                        : theme.palette.text.secondary,
                      borderColor: isActive
                        ? alpha(theme.palette.primary.main, 0.6)
                        : alpha(theme.palette.text.primary, 0.2),
                    }}
                  />
                </Box>
              );
            })}
          </Stack>
        </Box>

        <Box
          sx={{
            flex: 1,
            px: 4,
            py: 4,
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            overflow: "auto",
          }}
        >
          <Stack
            direction="row"
            spacing={2.5}
            justifyContent={singleTaskMode ? "center" : "flex-start"}
            sx={{
              pb: 2,
              flexWrap: singleTaskMode ? "wrap" : "nowrap",
            }}
          >
            {visibleTasks.map((task) => (
              <Paper
                key={task.taskId}
                elevation={3}
                sx={{
                  borderRadius: 3,
                  minWidth: singleTaskMode ? 720 : 520,
                  maxWidth: singleTaskMode ? 720 : 520,
                  flexShrink: 0,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                }}
              >
                <Box sx={{ px: 4, pt: 4, pb: 4 }}>
                  <TaskDetailsModal
                    task={task}
                    expanded={expanded}
                    onToggleSection={onToggleSection}
                  />
                </Box>
              </Paper>
            ))}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
