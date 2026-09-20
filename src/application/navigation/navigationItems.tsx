import {
  DashboardIcon,
  LiveScheduleIcon,
  ApplicationSettingsIcon,
  TaskManagementIcon,
  ComponentLibraryIcon,
} from "@shared/icons/applicationIcons";
import type { NavigationItem } from "@shared/types/navigation";

export const navigationItems: NavigationItem[] = [
  {
    identifier: "dashboard",
    label: "Dashboard",
    icon: <DashboardIcon />,
  },
  {
    identifier: "task-management",
    label: "Task Management",
    icon: <TaskManagementIcon />,
  },
  {
    identifier: "live-schedule",
    label: "Live Schedule",
    icon: <LiveScheduleIcon />,
  },
  {
    identifier: "application-settings",
    label: "Application Settings",
    icon: <ApplicationSettingsIcon />,
  },
  {
    identifier: "component-library",
    label: "Component Library",
    icon: <ComponentLibraryIcon />,
  },
];
