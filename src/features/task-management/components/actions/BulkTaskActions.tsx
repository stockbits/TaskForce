import { useState, type MouseEvent } from "react";
import ApplicationButton from "@shared/components/buttons/ApplicationButton";
import { MoreActionsIcon } from "@shared/icons/applicationIcons";
import TaskActionsMenu from "./TaskActionsMenu";
import {
  hasAvailableTaskActions,
  type TaskActionHandlers,
} from "./createTaskActionItems";
import type { TaskActionPermissions } from "../../types/taskActionPermissions";

export interface BulkTaskActionsProperties<
  Task,
> extends TaskActionHandlers<Task> {
  selectedTasks: Task[];
  permissions: TaskActionPermissions;
}

export default function BulkTaskActions<Task>({
  selectedTasks,
  permissions,
  ...handlers
}: BulkTaskActionsProperties<Task>) {
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const hasAvailableActions = hasAvailableTaskActions({
    tasks: selectedTasks,
    permissions,
    ...handlers,
  });

  function openMenu(event: MouseEvent<HTMLButtonElement>) {
    setAnchorElement(event.currentTarget);
  }

  return (
    <>
      <ApplicationButton
        variant="outlined"
        endIcon={<MoreActionsIcon />}
        onClick={openMenu}
        disabled={!hasAvailableActions}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchorElement)}
      >
        Actions ({selectedTasks.length})
      </ApplicationButton>
      <TaskActionsMenu
        anchorElement={anchorElement}
        open={Boolean(anchorElement)}
        onClose={() => setAnchorElement(null)}
        tasks={selectedTasks}
        permissions={permissions}
        {...handlers}
      />
    </>
  );
}
