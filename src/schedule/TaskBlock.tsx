import React from "react";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { COMMIT_COLORS } from "../shared-config/pins";
import { TaskTooltip } from "@/shared-ui";

interface TaskBlockProps {
  leftPx: number;
  widthPx: number;
  task: any;
  type: 'task' | 'travel';
  rowHeight: number;
  lane?: number;
  totalLanes?: number;
  onClick?: (task: any) => void;
  onDoubleClick?: (task: any) => void;
}

export default function TaskBlock({ leftPx, widthPx, task, type, rowHeight, lane = -1, totalLanes = 1, onClick, onDoubleClick }: TaskBlockProps) {
  const theme = useTheme();

  const formatDuration = React.useCallback((mins: number) => {
    if (!Number.isFinite(mins) || mins <= 0) return '0m';
    if (mins < 60) return `${Math.round(mins)}m`;
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  }, []);

  // Get the commit type color for task blocks
  const getTaskColor = React.useCallback((task: any) => {
    const commitType = task.commitmentType || 'Future'; // Default to Future if no commitment type
    return COMMIT_COLORS[commitType] || COMMIT_COLORS.Future;
  }, []);

  // Darken the color for borders
  const darkenHex = React.useCallback((hex: string, percent: number) => {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent * 100);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }, []);

  const tooltipContent = React.useMemo(() => {
    if (type === 'travel') {
      const tStart = task?.debug?.travelStartMs;
      const tEnd = task?.debug?.travelEndMs;
      const mins = tStart && tEnd ? Math.round((tEnd - tStart) / 60000) : null;
      const startStr = tStart ? new Date(tStart).toLocaleTimeString() : '';
      const endStr = tEnd ? new Date(tEnd).toLocaleTimeString() : '';
      return mins != null ? `Travel: ${formatDuration(mins)} (${startStr}→${endStr})` : 'Travel';
    }

    const start = task.expectedStartDate || task.startDate || '';
    const end = task.expectedFinishDate || task.endDate || '';
    const onsiteMins = task.estimatedDuration != null
      ? Number(task.estimatedDuration)
      : (start && end ? (new Date(end).getTime() - new Date(start).getTime()) / 60000 : 0);

    // include travel-to-next if available
    const travelToNextMs = task?.debug?.travelToNextDurationMs ?? null;
    const travelToNextStr = travelToNextMs ? ` | Travel to next: ${formatDuration(travelToNextMs / 60000)}` : '';

    const parts = [] as string[];
    if (task.taskId) parts.push(task.taskId);
    if (task.taskType) parts.push(task.taskType);
    parts.push(`On-site: ${formatDuration(onsiteMins)}`);
    if (start) parts.push(`Start: ${new Date(start).toLocaleString()}`);
    if (end) parts.push(`Finish: ${new Date(end).toLocaleString()}`);

    return parts.join(' • ') + travelToNextStr;
  }, [type, task?.taskId, task?.taskType, task?.estimatedDuration, task?.expectedStartDate, task?.startDate, task?.expectedFinishDate, task?.endDate, task?.debug?.travelStartMs, task?.debug?.travelEndMs, task?.debug?.travelToNextDurationMs, formatDuration]);

  // Travel blocks should not show their own tooltip — travel info appears on the related task's tooltip.
  if (type === 'travel') {
    return (
      <Box
        sx={{
          position: "absolute",
          top: (rowHeight - 4) / 2,
          left: leftPx,
          width: Math.max(widthPx, 10),
          height: 4,
          borderRadius: 0,
          bgcolor: '#D97706', // Dark amber/yellow color
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.08)'}`,
          boxSizing: "border-box",
          cursor: "pointer",
        }}
      />
    );
  }

  return (
    <TaskTooltip title={tooltipContent}>
      <Box
        onClick={() => onClick?.(task)}
        onDoubleClick={() => onDoubleClick?.(task)}
        sx={{
          position: "absolute",
          top: (() => {
            const innerHeight = rowHeight - 8;
            const laneH = Math.max( Math.floor(innerHeight / totalLanes), 14 );
            const base = 4;
            return base + (lane >= 0 ? lane * laneH : 0);
          })(),
          left: leftPx,
          width: widthPx,
          height: (() => {
            const innerHeight = rowHeight - 8;
            const laneH = Math.max( Math.floor(innerHeight / totalLanes), 14 );
            return lane >= 0 ? Math.max(laneH - 4, 12) : innerHeight;
          })(),
          borderRadius: 0,
          bgcolor: getTaskColor(task),
          border: `1px solid ${darkenHex(getTaskColor(task), 0.35)}`,
          boxSizing: "border-box",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          px: 0.5,
        }}
      >
        <span style={{ fontSize: '10px', color: 'white', fontWeight: 'bold' }}>
          {''}
        </span>
      </Box>
    </TaskTooltip>
  );
}