import { useState, type MouseEvent } from "react";
import { Box, Stack, Typography } from "@mui/material";
import BulkTaskActions from "@features/task-management/components/actions/BulkTaskActions";
import TaskRowActions from "@features/task-management/components/actions/TaskRowActions";
import type { TaskActionPermissions } from "@features/task-management/types/taskActionPermissions";
import ApplicationButton from "@shared/components/buttons/ApplicationButton";
import ApplicationIconButton from "@shared/components/buttons/ApplicationIconButton";
import ActionMenu, {
  type ActionMenuItem,
} from "@shared/components/menus/ActionMenu";
import {
  InformationIcon,
  MoreActionsIcon,
  WarningIcon,
} from "@shared/icons/applicationIcons";

interface ExampleTask {
  identifier: string;
  title: string;
}

const exampleTasks: ExampleTask[] = [
  { identifier: "task-101", title: "Review access request" },
  { identifier: "task-102", title: "Confirm planned work" },
];

const examplePermissions: TaskActionPermissions = {
  canViewTasks: true,
  canProgressTasks: true,
  canProgressNotes: true,
  canCreateCalloutIncident: true,
};

export default function ActionExamples() {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [lastAction, setLastAction] = useState("No action selected.");

  function openMenu(event: MouseEvent<HTMLButtonElement>) {
    setMenuAnchor(event.currentTarget);
  }

  function recordAction(action: string, tasks: ExampleTask[]) {
    setLastAction(`${action}: ${tasks.map((task) => task.title).join(", ")}`);
  }

  const genericMenuItems: ActionMenuItem[] = [
    {
      identifier: "information",
      label: "View information",
      icon: <InformationIcon fontSize="small" />,
      onSelect: () => setLastAction("Viewed example information."),
    },
    {
      identifier: "unavailable",
      label: "Unavailable action",
      onSelect: () => undefined,
      disabled: true,
    },
    {
      identifier: "destructive",
      label: "Remove example",
      icon: <WarningIcon fontSize="small" />,
      onSelect: () => setLastAction("Removed the disposable example."),
      destructive: true,
    },
  ];

  return (
    <Stack spacing={4}>
      <Box>
        <Typography component="h2" variant="h5" gutterBottom>
          Buttons and actions
        </Typography>
        <Typography color="text.secondary">
          Shared controls provide accessible presentation. Features decide which
          actions exist and pass explicit permissions and callbacks.
        </Typography>
      </Box>

      <Stack direction="row" useFlexGap flexWrap="wrap" spacing={2}>
        <ApplicationButton variant="contained">
          Primary action
        </ApplicationButton>
        <ApplicationButton variant="outlined">
          Secondary action
        </ApplicationButton>
        <ApplicationButton variant="text">Text action</ApplicationButton>
        <ApplicationButton disabled>Disabled action</ApplicationButton>
        <ApplicationIconButton label="Example information">
          <InformationIcon />
        </ApplicationIconButton>
        <ApplicationButton
          variant="outlined"
          endIcon={<MoreActionsIcon />}
          onClick={openMenu}
          aria-haspopup="menu"
          aria-expanded={Boolean(menuAnchor)}
        >
          Generic menu
        </ApplicationButton>
      </Stack>

      <ActionMenu
        anchorElement={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        items={genericMenuItems}
        label="Example actions"
      />

      <Box>
        <Typography component="h3" variant="h6" gutterBottom>
          Task-management actions
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Bulk and row menus share one typed action builder. The visible row
          button replaces the previous right-click-only interaction.
        </Typography>
        <Stack direction="row" useFlexGap flexWrap="wrap" spacing={2}>
          <BulkTaskActions
            selectedTasks={exampleTasks}
            permissions={examplePermissions}
            onViewTasks={(tasks) => recordAction("Opened", tasks)}
            onProgressTasks={(tasks) => recordAction("Progressed", tasks)}
            onProgressNotes={(tasks) => recordAction("Updated notes", tasks)}
            onCreateCalloutIncident={(task) =>
              recordAction("Created callout", [task])
            }
          />
          <TaskRowActions
            task={exampleTasks[0]}
            taskLabel={exampleTasks[0].title}
            permissions={examplePermissions}
            onViewTasks={(tasks) => recordAction("Opened", tasks)}
            onProgressTasks={(tasks) => recordAction("Progressed", tasks)}
            onProgressNotes={(tasks) => recordAction("Updated notes", tasks)}
            onCreateCalloutIncident={(task) =>
              recordAction("Created callout", [task])
            }
          />
        </Stack>
      </Box>

      <Typography
        component="output"
        color="text.secondary"
        sx={{ overflowWrap: "anywhere" }}
      >
        {lastAction}
      </Typography>
    </Stack>
  );
}
