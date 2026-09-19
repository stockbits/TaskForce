import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import ApplicationIconButton from "@shared/components/buttons/ApplicationIconButton";
import { CloseIcon } from "@shared/icons/applicationIcons";
import { navigationItems } from "@application/navigation/navigationItems";
import type { NavigationIdentifier } from "@shared/types/navigation";

export const navigationSidebarWidth = 272;

interface NavigationSidebarProperties {
  mobileOpen: boolean;
  selectedNavigationIdentifier: NavigationIdentifier;
  onCloseMobileNavigation: () => void;
  onSelectNavigation: (identifier: NavigationIdentifier) => void;
}

export default function NavigationSidebar({
  mobileOpen,
  selectedNavigationIdentifier,
  onCloseMobileNavigation,
  onSelectNavigation,
}: NavigationSidebarProperties) {
  const navigationContent = (
    <Box sx={{ height: "100%", bgcolor: "background.paper" }}>
      <Toolbar sx={{ px: 4, py: 2, gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" fontWeight={800} letterSpacing="-0.03em">
            TaskForce
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Operational workspace
          </Typography>
        </Box>
        <ApplicationIconButton
          label="Close navigation"
          onClick={onCloseMobileNavigation}
          sx={{ display: { md: "none" } }}
        >
          <CloseIcon />
        </ApplicationIconButton>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1.5, py: 2 }}>
        {navigationItems.map((item) => (
          <ListItemButton
            key={item.identifier}
            selected={selectedNavigationIdentifier === item.identifier}
            aria-current={
              selectedNavigationIdentifier === item.identifier
                ? "page"
                : undefined
            }
            onClick={() => {
              onSelectNavigation(item.identifier);
              onCloseMobileNavigation();
            }}
            sx={{ borderRadius: 2, mb: 0.5, minHeight: 48 }}
          >
            <ListItemIcon sx={{ minWidth: 42 }}>{item.icon}</ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontWeight: 650,
                sx: { overflowWrap: "anywhere" },
              }}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      aria-label="Application navigation"
      sx={{ width: { md: navigationSidebarWidth }, flexShrink: 0 }}
    >
      <Drawer
        variant="temporary"
        id="mobile-navigation"
        open={mobileOpen}
        onClose={onCloseMobileNavigation}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: navigationSidebarWidth,
            maxWidth: "calc(100vw - 24px)",
            height: "100dvh",
          },
        }}
      >
        {navigationContent}
      </Drawer>
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            width: navigationSidebarWidth,
            borderRightColor: "divider",
          },
        }}
      >
        {navigationContent}
      </Drawer>
    </Box>
  );
}
