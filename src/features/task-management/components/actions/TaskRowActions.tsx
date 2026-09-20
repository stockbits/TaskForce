import { useState, type MouseEvent } from "react";
import ApplicationIconButton from "@shared/components/buttons/ApplicationIconButton";
import { MoreActionsIcon } from "@shared/icons/applicationIcons";
import TaskActionsMenu from "./TaskActionsMenu";
import {
  hasAvailableTaskActions,
  type TaskActionHandlers,
} from "./createTaskActionItems";
import type { TaskActionPermissions } from "../../types/taskActionPermissions";

export interface TaskRowActionsProperties<
  Task,
> extends TaskActionHandlers<Task> {
  task: Task;
  permissions: TaskActionPermissions;
  taskLabel?: string;
}

/** Visible row action trigger that works with touch, keyboard, and pointer. */
export default function TaskRowActions<Task>({
  task,
  permissions,
  taskLabel = "task",
  ...handlers
}: TaskRowActionsProperties<Task>) {
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const hasAvailableActions = hasAvailableTaskActions({
    tasks: [task],
    permissions,
    ...handlers,
  });

  function openMenu(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setAnchorElement(event.currentTarget);
  }

  return (
    <>
      <ApplicationIconButton
        label={`Actions for ${taskLabel}`}
        onClick={openMenu}
        disabled={!hasAvailableActions}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchorElement)}
      >
        <MoreActionsIcon />
      </ApplicationIconButton>
      <TaskActionsMenu
        anchorElement={anchorElement}
        open={Boolean(anchorElement)}
        onClose={() => setAnchorElement(null)}
        tasks={[task]}
        permissions={permissions}
        label={`Actions for ${taskLabel}`}
        {...handlers}
      />
    </>
  );
}
