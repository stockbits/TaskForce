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
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import ClipboardList from '@mui/icons-material/ListAlt';
import Globe from '@mui/icons-material/Public';
import Calendar from '@mui/icons-material/CalendarMonth';
import Settings from '@mui/icons-material/Settings';
import Cog from '@mui/icons-material/Build';
import Users from '@mui/icons-material/People';
import AlertTriangle from '@mui/icons-material/WarningAmber';
import ListChecks from '@mui/icons-material/ListAlt';
import UserCog from '@mui/icons-material/AdminPanelSettings';
import LogOut from '@mui/icons-material/Logout';
import Folder from '@mui/icons-material/Folder';
import Search from '@mui/icons-material/Search';
import Clear from '@mui/icons-material/Clear';
import { cardMap } from "./Navigation Menu Registry";

const userMenus = [
  { label: "Operation Toolkit", icon: ClipboardList, children: cardMap["Operation Toolkit"] || [] },
  { label: "General Settings", icon: Settings, children: cardMap["General Settings"] || [] },
];

const taskAdminMenus = [
  { label: "Task Admin", icon: ListChecks, children: cardMap["Task Admin"] || [] },
  { label: "Jeopardy Admin", icon: AlertTriangle, children: cardMap["Jeopardy Admin"] || [] },
];

const peopleMenus = [
  { label: "Resource Admin", icon: Users, children: cardMap["Resource Admin"] || [] },
  { label: "Self Service Admin", icon: Settings, children: cardMap["Self Service Admin"] || [] },
  { label: "User Admin", icon: UserCog, children: cardMap["User Admin"] || [] },
];

const systemMenus = [
  { label: "Domain Admin", icon: Globe, children: cardMap["Domain Admin"] || [] },
  { label: "Schedule Admin", icon: Calendar, children: cardMap["Schedule Admin"] || [] },
  { label: "System Admin", icon: Cog, children: cardMap["System Admin"] || [] },
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
  const [filterText, setFilterText] = useState("");
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
      { title: "Task Section", menus: taskAdminMenus },
      { title: "People Section", menus: peopleMenus },
      { title: "System Section", menus: systemMenus },
    ],
    []
  );

  const allMenus = useMemo(() => sections.flatMap(section => section.menus), [sections]);

  // Filter menus based on filter text
  const filteredMenus = useMemo(() => {
    if (!filterText.trim()) return [];

    return allMenus.filter(menu =>
      menu.label.toLowerCase().includes(filterText.toLowerCase()) ||
      menu.children.some(child => child.name.toLowerCase().includes(filterText.toLowerCase()))
    );
  }, [allMenus, filterText]);

  const handleMenuSelect = useCallback(
    (menu: any) => {
      // If this is a card selection, navigate to the menu that contains it
      if (menu.cardData) {
        const cardMenu = menu.cardData.menuLabel;
        const menuWithIcon = { label: cardMenu, icon: Folder };
        setActiveMenuLabel(cardMenu);
        onMenuClick(menuWithIcon);
        setOpen(false);
        return;
      }

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
          width: { xs: '80vw', sm: theme.spacing(40) },
          maxWidth: '100vw',
          minWidth: 0,
          minHeight: 0,
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

      {/* Quick Search Filter */}
      <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.08)}` }}>
        <TextField
          value={filterText}
          onChange={(event) => setFilterText(event.target.value)}
          placeholder="Filter navigation..."
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 16, color: alpha(theme.palette.text.primary, 0.6) }} />
              </InputAdornment>
            ),
            endAdornment: filterText && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setFilterText("")}
                  sx={{ mr: 0.5 }}
                  aria-label="clear search"
                >
                  <Clear sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              fontSize: 14,
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: alpha(theme.palette.text.primary, 0.2),
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: alpha(theme.palette.text.primary, 0.3),
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.mode === 'dark' ? '#3BE089' : theme.palette.primary.main,
              },
            },
          }}
        />

        {/* Tree View Filter Results moved to main content */}
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", py: 1 }}>
        {filterText.trim() ? (
          <Box sx={{ px: 2, py: 1 }}>
            <SimpleTreeView
              expandedItems={filteredMenus.map((_, index) => `menu-${index}`)}
              sx={{
                '& .MuiTreeItem-root': {
                  '& .MuiTreeItem-content': {
                    py: 0.5,
                    px: 1,
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.16 : 0.08),
                    },
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.24 : 0.12),
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.32 : 0.16),
                      },
                    },
                  },
                  '& .MuiTreeItem-iconContainer': {
                    display: 'none', // Hide chevron icons
                  },
                },
                '& .MuiTreeItem-group': {
                  ml: 3, // Increase indentation for sub-menus
                },
                '& .MuiTreeItem-root .MuiTreeItem-root .MuiTreeItem-content': {
                  pl: 3, // Additional padding for child items
                },
              }}
            >
              {filteredMenus.map((menu, index) => {
                const IconComponent = menu.icon;
                return (
                  <TreeItem
                    key={menu.label}
                    itemId={`menu-${index}`}
                    label={
                      <Box sx={{ py: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <IconComponent sx={{ fontSize: 18, mr: 1, color: alpha(theme.palette.text.primary, 0.7) }} />
                          <Typography variant="body2" fontWeight={500}>{menu.label}</Typography>
                        </Box>
                      </Box>
                    }
                    onClick={() => handleMenuSelect(menu)}
                  >
                    {menu.children.map((child, childIndex) => (
                      <TreeItem
                        key={`${menu.label}-${childIndex}`}
                        itemId={`menu-${index}-${childIndex}`}
                        label={
                          <Typography variant="body2" sx={{ py: 0.5, pl: 2 }}>{child.name}</Typography>
                        }
                        onClick={() => handleMenuSelect(menu)}
                      />
                    ))}
                  </TreeItem>
                );
              })}
            </SimpleTreeView>
          </Box>
        ) : (
          <Box sx={{ px: 2, py: 1 }}>
            <List disablePadding>
              {allMenus.map((menu) => {
                const IconComponent = menu.icon;
                const isActive = activeMenuLabel === menu.label;

                return (
                  <ListItemButton
                    key={menu.label}
                    onClick={() => handleMenuSelect(menu)}
                    selected={isActive}
                    sx={{
                      borderRadius: 1.5,
                      mb: 0.5,
                      alignItems: "center",
                      px: 2,
                      py: 1,
                      position: "relative",
                      minHeight: 40,
                      ...(isActive
                        ? {
                            backgroundColor: theme.palette.mode === 'dark' 
                              ? alpha(theme.palette.grey[100], 0.2) 
                              : alpha(theme.palette.primary.main, 0.12),
                            color: theme.palette.mode === 'dark' 
                              ? theme.palette.common.white 
                              : theme.palette.primary.main,
                            "&::before": {
                              content: '""',
                              position: "absolute",
                              left: 8,
                              top: 8,
                              bottom: 8,
                              width: 3,
                              borderRadius: 999,
                              backgroundColor: theme.palette.mode === 'dark' 
                                ? theme.palette.common.white 
                                : theme.palette.primary.main,
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
                    <ListItemIcon sx={{ minWidth: theme.spacing(4), color: "inherit" }}>
                      <IconComponent sx={{ fontSize: 16 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={menu.label}
                      primaryTypographyProps={{
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 500,
                      }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        )}
      </Box>

      <Footer />
    </Drawer>
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
          <LogOut sx={{ fontSize: 16 }} />
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
