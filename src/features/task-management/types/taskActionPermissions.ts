export interface TaskActionPermissions {
  canViewTasks: boolean;
  canProgressTasks: boolean;
  canProgressNotes: boolean;
  canCreateCalloutIncident: boolean;
}

export const noTaskActionPermissions: TaskActionPermissions = {
  canViewTasks: false,
  canProgressTasks: false,
  canProgressNotes: false,
  canCreateCalloutIncident: false,
};
