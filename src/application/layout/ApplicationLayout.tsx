import { lazy, Suspense, useState } from "react";
import { AppBar, Box, Stack, Toolbar, Typography } from "@mui/material";
import NavigationSidebar from "@application/navigation/NavigationSidebar";
import { navigationItems } from "@application/navigation/navigationItems";
import DashboardPage from "@features/dashboard/pages/DashboardPage";
import LiveSchedulePage from "@features/live-schedule/pages/LiveSchedulePage";
import ApplicationSettingsPage from "@features/application-settings/pages/ApplicationSettingsPage";
import TaskManagementPage from "@features/task-management/pages/TaskManagementPage";
import ApplicationIconButton from "@shared/components/buttons/ApplicationIconButton";
import { NavigationMenuIcon } from "@shared/icons/applicationIcons";
import type { NavigationIdentifier } from "@shared/types/navigation";
const ComponentLibraryPage = lazy(
  () => import("@features/component-library/pages/ComponentLibraryPage"),
);

export default function ApplicationLayout() {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [selectedNavigationIdentifier, setSelectedNavigationIdentifier] =
    useState<NavigationIdentifier>("dashboard");
  const selectedNavigationItem = navigationItems.find(
    (item) => item.identifier === selectedNavigationIdentifier,
  );
  const page = {
    dashboard: <DashboardPage />,
    "task-management": <TaskManagementPage />,
    "live-schedule": <LiveSchedulePage />,
    "application-settings": <ApplicationSettingsPage />,
    "component-library": <ComponentLibraryPage />,
  }[selectedNavigationIdentifier];
  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100dvh",
        bgcolor: "background.default",
      }}
    >
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <NavigationSidebar
        mobileOpen={mobileNavigationOpen}
        selectedNavigationIdentifier={selectedNavigationIdentifier}
        onCloseMobileNavigation={() => setMobileNavigationOpen(false)}
        onSelectNavigation={setSelectedNavigationIdentifier}
      />
      <Box sx={{ flex: "1 1 0%", minWidth: 0 }}>
        {/* Normal flow prevents overlap even when enlarged text wraps. */}
        <AppBar
          position="static"
          color="inherit"
          elevation={0}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Toolbar sx={{ gap: 3, py: 2, minWidth: 0 }}>
            <ApplicationIconButton
              label="Open navigation"
              onClick={() => setMobileNavigationOpen(true)}
              aria-expanded={mobileNavigationOpen}
              aria-controls={
                mobileNavigationOpen ? "mobile-navigation" : undefined
              }
              sx={{ display: { md: "none" }, flexShrink: 0 }}
            >
              <NavigationMenuIcon />
            </ApplicationIconButton>
            <Stack
              direction="row"
              spacing={3}
              alignItems="center"
              sx={{ minWidth: 0 }}
            >
              <Box aria-hidden="true" sx={{ display: "flex", flexShrink: 0 }}>
                {selectedNavigationItem?.icon}
              </Box>
              <Typography
                component="p"
                variant="h6"
                fontWeight={750}
                sx={{ minWidth: 0, overflowWrap: "anywhere" }}
              >
                {selectedNavigationItem?.label}
              </Typography>
            </Stack>
          </Toolbar>
        </AppBar>
        <Box
          component="main"
          id="main-content"
          tabIndex={-1}
          sx={{ minWidth: 0 }}
        >
          <Suspense
            fallback={
              <Box role="status" sx={{ p: 4 }}>
                Loading page…
              </Box>
            }
          >
            {page}
          </Suspense>
        </Box>
      </Box>
    </Box>
  );
}
