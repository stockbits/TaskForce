import React from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

interface TaskBlockProps {
  leftPx: number;
  widthPx: number;
  task: any;
  type: 'task' | 'travel';
  rowHeight: number;
}

export default function TaskBlock({ leftPx, widthPx, task, type, rowHeight }: TaskBlockProps) {
  const theme = useTheme();

  return (
    <Tooltip
      title={type === 'travel' ? 'Travel Time' : `${task.taskId}: ${task.taskType} - ${task.expectedStartDate} to ${task.expectedFinishDate}`}
      placement="top"
    >
      <Box
        sx={{
          position: "absolute",
          top: type === 'travel' ? 4 : 2,
          left: leftPx,
          width: widthPx,
          height: type === 'travel' ? rowHeight - 8 : rowHeight - 4,
          borderRadius: 2,
          bgcolor: type === 'travel' ? (theme.palette.mode === 'dark' ? '#666' : '#ccc') : theme.palette.secondary.main,
          border: type === 'travel' ? 'none' : `1px solid ${theme.palette.secondary.dark}`,
          boxSizing: "border-box",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          px: 0.5,
        }}
      >
        {type === 'task' && (
          <Typography variant="caption" noWrap sx={{ color: "white", fontSize: 10 }}>
            {task.taskId}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
}