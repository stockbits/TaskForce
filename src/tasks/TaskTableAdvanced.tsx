import React, { useRef } from "react";
import { Paper, Box } from "@mui/material";
import TaskTableMUI from "@/shared-ui/ResponsiveTable/TaskTableMUI";

const TaskTableAdvanced: React.FC<any> = ({ rows, columns, loading, ...rest }) => {
  const containerRef = useRef<HTMLElement | null>(null);

  return (
    <Box sx={{ width: '100%', display: 'flex', flex: 1, minHeight: 0 }} ref={containerRef as any}>
      <TaskTableMUI
        rows={rows}
        headerNames={(rest && (rest as any).headerNames) || {}}
        loading={loading}
        containerRef={containerRef}
        {...rest}
      />
    </Box>
  );
};

export default TaskTableAdvanced;
