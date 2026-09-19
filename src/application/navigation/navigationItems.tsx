import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import EventAvailableOutlined from "@mui/icons-material/EventAvailableOutlined";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import TaskAltOutlined from "@mui/icons-material/TaskAltOutlined";
import type { NavigationItem } from "@shared/types/navigation";

export const navigationItems: NavigationItem[] = [
  {
    identifier: "dashboard",
    label: "Dashboard",
    icon: <DashboardOutlined />
  },
  {
    identifier: "task-management",
    label: "Task Management",
    icon: <TaskAltOutlined />
  },
  {
    identifier: "live-schedule",
    label: "Live Schedule",
    icon: <EventAvailableOutlined />
  },
  {
    identifier: "application-settings",
    label: "Application Settings",
    icon: <SettingsOutlined />
  }
];
