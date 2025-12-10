export { Sidebar as SidebarNavigation };
import React, {
  memo,
  useMemo,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  ClipboardList,
  Globe,
  Calendar,
  Settings,
  Cog,
  Users,
  AlertTriangle,
  ListChecks,
  UserCog,
  LogOut,
} from "lucide-react";

const userMenus = [
  { label: "Operation Toolkit", icon: ClipboardList },
  { label: "General Settings", icon: Settings },
];

const taskAdminMenus = [
  { label: "Task Admin", icon: ListChecks },
  { label: "Jeopardy Admin", icon: AlertTriangle },
];

const peopleMenus = [
  { label: "Resource Admin", icon: Users },
  { label: "Self Service Admin", icon: Settings },
  { label: "User Admin", icon: UserCog },
];

const systemMenus = [
  { label: "Domain Admin", icon: Globe },
  { label: "Schedule Admin", icon: Calendar },
  { label: "System Admin", icon: Cog },
];

interface SidebarProps {
  currentMenu: { label: string; icon: any } | null;
  onMenuClick: (menu: any) => void;
  activeSubPage: string | null;
}

export const Sidebar = memo(function Sidebar({
  currentMenu,
  onMenuClick,
  activeSubPage,
}: SidebarProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [activeMenuLabel, setActiveMenuLabel] = useState<string | null>(null);
  const previousOpen = useRef(open);

  useEffect(() => {
    if (currentMenu?.label) {
      setActiveMenuLabel(currentMenu.label.trim());
    }
  }, [currentMenu]);

  const toggleSidebar = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    const handler = () => toggleSidebar();
    window.addEventListener("toggleSidebar", handler);
    return () => window.removeEventListener("toggleSidebar", handler);
  }, [toggleSidebar]);

  useEffect(() => {
    const reset = () => setActiveMenuLabel(null);
    window.addEventListener("resetSidebarSelection", reset);
    return () => window.removeEventListener("resetSidebarSelection", reset);
  }, []);

  useEffect(() => {
    if (open && !previousOpen.current) {
      document.body.classList.add("sidebar-open");
    }
    if (!open && previousOpen.current) {
      document.body.classList.remove("sidebar-open");
    }
    previousOpen.current = open;
    return () => {
      document.body.classList.remove("sidebar-open");
    };
  }, [open]);

  const sections = useMemo(
    () => [
      { title: "User Section", menus: userMenus },
      { title: "Task Admin", menus: taskAdminMenus },
      { title: "People Admin", menus: peopleMenus },
      { title: "System Admin", menus: systemMenus },
    ],
    []
  );

  const handleMenuSelect = useCallback(
    (menu: any) => {
      const label = menu.label.trim();
      const isSameMenu = activeMenuLabel === label;
      const insideTool = activeSubPage !== null;

      if (isSameMenu && !insideTool) {
        setOpen(false);
        return;
      }

      setActiveMenuLabel(label);
      onMenuClick({ ...menu, label });
      setOpen(false);
    },
    [activeMenuLabel, activeSubPage, onMenuClick]
  );

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={() => setOpen(false)}
      ModalProps={{ keepMounted: true }}
      PaperProps={{
        sx: {
          width: { xs: '80vw', sm: theme.spacing(40) }, // 320px at sm+, 80vw on xs
          maxWidth: theme.spacing(48), // 384px max
          backgroundColor: "background.paper",
          borderRight: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
          boxShadow: "8px 0 24px rgba(0,0,0,0.16)",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2.5,
          borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.12)}`,
        }}
      >
        <Typography variant="h6" fontWeight={600} color="text.primary">
          Navigation
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", py: 1 }}>
        {sections.map(({ title, menus }) => (
          <React.Fragment key={title}>
            <SectionBlock
              title={title}
              menus={menus}
              activeMenuLabel={activeMenuLabel}
              onMenuClick={handleMenuSelect}
            />
            <Divider sx={{ mx: 2, my: 2, borderColor: alpha(theme.palette.text.primary, 0.08) }} />
          </React.Fragment>
        ))}
      </Box>

      <Footer />
    </Drawer>
  );
});

interface SectionBlockProps {
  title: string;
  menus: Array<{ label: string; icon: any }>;
  activeMenuLabel: string | null;
  onMenuClick: (menu: any) => void;
}

const SectionBlock = memo(function SectionBlock({
  title,
  menus,
  activeMenuLabel,
  onMenuClick,
}: SectionBlockProps) {
  const theme = useTheme();

  return (
    <Box sx={{ px: 2, py: 1 }}>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{
          px: 1.5,
          mb: 1,
          letterSpacing: 1.4,
        }}
      >
        {title}
      </Typography>

      <List disablePadding>
        {menus.map((menu) => {
          const Icon = menu.icon;
          const isActive = activeMenuLabel === menu.label;

          return (
            <ListItemButton
              key={menu.label}
              onClick={() => onMenuClick(menu)}
              selected={isActive}
              sx={{
                borderRadius: 2,
                mb: 1,
                alignItems: "center",
                px: 2.5,
                py: 1.5,
                position: "relative",
                ...(isActive
                  ? {
                      backgroundColor: alpha(theme.palette.primary.main, 0.12),
                      color: theme.palette.primary.main,
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        left: 12,
                        top: 10,
                        bottom: 10,
                        width: 4,
                        borderRadius: 999,
                        backgroundColor: theme.palette.primary.main,
                      },
                    }
                  : {
                      color: theme.palette.text.primary,
                      "&:hover": {
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      },
                    }),
              }}
            >
              <ListItemIcon sx={{ minWidth: theme.spacing(4.5), color: "inherit" }}>
                {React.createElement(Icon, { size: 18, strokeWidth: 2.2 })}
              </ListItemIcon>
              <ListItemText
                primary={menu.label}
                primaryTypographyProps={{
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
});

const Footer = memo(function Footer() {
  const theme = useTheme();
  return (
    <Box
      sx={{
        px: 3,
        py: 2.5,
        borderTop: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
        backgroundColor: alpha(theme.palette.background.paper, 0.85),
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
        <Typography variant="subtitle2" fontWeight={600} color="text.primary">
          System Info
        </Typography>
        <Box sx={{ color: "text.secondary" }}>
          <LogOut size={16} />
        </Box>
      </Stack>

      <Stack spacing={0.5} sx={{ color: "text.secondary", fontSize: 12 }}>
        <span>
          <strong>Client Version:</strong> 1
        </span>
        <span>
          <strong>Build #:</strong> 11.11.2025
        </span>
        <span>
          <strong>Node:</strong> 20.0.0
        </span>
      </Stack>

      <Divider sx={{ my: 1.5, borderColor: alpha(theme.palette.text.primary, 0.08) }} />
      <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
        Brandon Virtual | © 2025
      </Typography>
    </Box>
  );
});
