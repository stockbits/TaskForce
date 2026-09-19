import { useMemo, useState } from "react";
import MenuOutlined from "@mui/icons-material/MenuOutlined";
import {
  AppBar,
  Box,
  IconButton,
  Stack,
  Toolbar,
  Typography
} from "@mui/material";
import NavigationSidebar, {
  navigationSidebarWidth
} from "@application/navigation/NavigationSidebar";
import { navigationItems } from "@application/navigation/navigationItems";
import DashboardPage from "@features/dashboard/pages/DashboardPage";
import LiveSchedulePage from "@features/live-schedule/pages/LiveSchedulePage";
import ApplicationSettingsPage from "@features/application-settings/pages/ApplicationSettingsPage";
import TaskManagementPage from "@features/task-management/pages/TaskManagementPage";
import type { NavigationIdentifier } from "@shared/types/navigation";

export default function ApplicationLayout() {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [selectedNavigationIdentifier, setSelectedNavigationIdentifier] =
    useState<NavigationIdentifier>("dashboard");

  const selectedNavigationItem = useMemo(
    () =>
      navigationItems.find(
        (item) => item.identifier === selectedNavigationIdentifier
      ),
    [selectedNavigationIdentifier]
  );

  const page = {
    dashboard: <DashboardPage />,
    "task-management": <TaskManagementPage />,
    "live-schedule": <LiveSchedulePage />,
    "application-settings": <ApplicationSettingsPage />
  }[selectedNavigationIdentifier];

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${navigationSidebarWidth}px)` },
          ml: { md: `${navigationSidebarWidth}px` },
          borderBottom: 1,
          borderColor: "divider"
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => setMobileNavigationOpen(true)}
            sx={{ display: { md: "none" }, mr: 2 }}
            aria-label="Open navigation"
          >
            <MenuOutlined />
          </IconButton>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {selectedNavigationItem?.icon}
            <Typography variant="h6" fontWeight={750}>
              {selectedNavigationItem?.label}
            </Typography>
          </Stack>
        </Toolbar>
      </AppBar>

      <NavigationSidebar
        mobileOpen={mobileNavigationOpen}
        selectedNavigationIdentifier={selectedNavigationIdentifier}
        onCloseMobileNavigation={() => setMobileNavigationOpen(false)}
        onSelectNavigation={setSelectedNavigationIdentifier}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          width: { md: `calc(100% - ${navigationSidebarWidth}px)` },
          pt: 8
        }}
      >
        {page}
      </Box>
    </Box>
  );
}
