import React, { useRef, memo } from "react";
import { Box } from "@mui/material";
import TaskTableMUI from "@/shared-ui/ResponsiveTable/TaskTableMUI";

const TaskTableAdvanced: React.FC<any> = memo(({ rows, columns: _columns, loading, disablePagination = false, ...rest }) => {
  const containerRef = useRef<HTMLElement | null>(null);

  return (
    <Box sx={{ width: '100%', display: 'flex', flex: 1, minHeight: 0 }} ref={containerRef as any}>
      <TaskTableMUI
        rows={rows}
        headerNames={(rest && (rest as any).headerNames) || {}}
        loading={loading}
        containerRef={containerRef}
        disablePagination={disablePagination}
        {...rest}
      />
    </Box>
  );
});

TaskTableAdvanced.displayName = "TaskTableAdvanced";

export default TaskTableAdvanced;
