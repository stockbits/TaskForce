import React from "react";
import TaskTableMUI from "@/shared-ui/ResponsiveTable/TaskTableMUI";

export interface TaskTableAdvancedProps {
  rows: Record<string, any>[];
  columns?: any[];
  loading?: boolean;
  onOpenPopout?: (tasks: Record<string, any>[], x: number, y: number) => void;
  onOpenCalloutIncident?: (task: Record<string, any>) => void;
  sx?: any;
}

const TaskTableAdvanced: React.FC<TaskTableAdvancedProps> = ({ rows, columns, loading, ...rest }) => {
  // Lightweight wrapper that forwards to the consolidated shared TaskTableMUI.
  return <TaskTableMUI rows={rows} columns={columns} loading={loading} {...rest} />;
};

export default TaskTableAdvanced;
