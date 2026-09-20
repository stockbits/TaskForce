import type { ActionMenuItem } from "@shared/components/menus/ActionMenu";
import {
  NotesIcon,
  TaskListIcon,
  ViewIcon,
  WarningIcon,
} from "@shared/icons/applicationIcons";
import type { TaskActionPermissions } from "../../types/taskActionPermissions";

export interface TaskActionHandlers<Task> {
  onViewTasks?: (tasks: Task[]) => void;
  onProgressTasks?: (tasks: Task[]) => void;
  onProgressNotes?: (tasks: Task[]) => void;
  onCreateCalloutIncident?: (task: Task) => void;
}

export interface CreateTaskActionItemsOptions<
  Task,
> extends TaskActionHandlers<Task> {
  tasks: Task[];
  permissions: TaskActionPermissions;
}

export function hasAvailableTaskActions<Task>({
  tasks,
  permissions,
  onViewTasks,
  onProgressTasks,
  onProgressNotes,
  onCreateCalloutIncident,
}: CreateTaskActionItemsOptions<Task>) {
  if (tasks.length === 0) return false;

  return Boolean(
    (permissions.canViewTasks && onViewTasks) ||
    (permissions.canProgressTasks && onProgressTasks) ||
    (permissions.canProgressNotes && onProgressNotes) ||
    (tasks.length === 1 &&
      permissions.canCreateCalloutIncident &&
      onCreateCalloutIncident),
  );
}

function countLabel(singular: string, plural: string, count: number) {
  return count === 1 ? singular : `${plural} (${count})`;
}

/**
 * Converts explicit page permissions and callbacks into visible task actions.
 * The UI never infers authorisation from whether a task happens to be selected.
 */
export default function createTaskActionItems<Task>({
  tasks,
  permissions,
  onViewTasks,
  onProgressTasks,
  onProgressNotes,
  onCreateCalloutIncident,
}: CreateTaskActionItemsOptions<Task>): ActionMenuItem[] {
  const items: ActionMenuItem[] = [];
  const count = tasks.length;

  if (permissions.canViewTasks && onViewTasks) {
    items.push({
      identifier: "view-tasks",
      label: countLabel("Open task", "Open tasks", count),
      icon: <ViewIcon fontSize="small" />,
      onSelect: () => onViewTasks(tasks),
    });
  }

  if (permissions.canProgressTasks && onProgressTasks) {
    items.push({
      identifier: "progress-tasks",
      label: countLabel("Progress task", "Progress tasks", count),
      icon: <TaskListIcon fontSize="small" />,
      onSelect: () => onProgressTasks(tasks),
    });
  }

  if (permissions.canProgressNotes && onProgressNotes) {
    items.push({
      identifier: "progress-notes",
      label: countLabel("Progress notes", "Progress notes", count),
      icon: <NotesIcon fontSize="small" />,
      onSelect: () => onProgressNotes(tasks),
    });
  }

  if (
    count === 1 &&
    permissions.canCreateCalloutIncident &&
    onCreateCalloutIncident
  ) {
    items.push({
      identifier: "create-callout-incident",
      label: "Create callout incident",
      icon: <WarningIcon fontSize="small" />,
      onSelect: () => onCreateCalloutIncident(tasks[0]),
    });
  }

  return items;
}
