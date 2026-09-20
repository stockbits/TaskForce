import ActionMenu from "@shared/components/menus/ActionMenu";
import createTaskActionItems, {
  type TaskActionHandlers,
} from "./createTaskActionItems";
import type { TaskActionPermissions } from "../../types/taskActionPermissions";

export interface TaskActionsMenuProperties<
  Task,
> extends TaskActionHandlers<Task> {
  anchorElement: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  tasks: Task[];
  permissions: TaskActionPermissions;
  label?: string;
}

export default function TaskActionsMenu<Task>({
  anchorElement,
  open,
  onClose,
  tasks,
  permissions,
  label = "Task actions",
  ...handlers
}: TaskActionsMenuProperties<Task>) {
  const items = createTaskActionItems({ tasks, permissions, ...handlers });

  return (
    <ActionMenu
      anchorElement={anchorElement}
      open={open && items.length > 0}
      onClose={onClose}
      items={items}
      label={label}
    />
  );
}
