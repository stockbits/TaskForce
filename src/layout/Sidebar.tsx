import React, {
  memo,
  useMemo,
  useRef,
  useEffect,
  useState,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

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

/* =========================================
   MENU CONFIGURATION
========================================= */
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

/* =========================================
   SIDEBAR COMPONENT
========================================= */
export const Sidebar = memo(function Sidebar({
  currentMenu,
  onMenuClick,
  activeSubPage,
}: any) {
  const [open, setOpen] = useState(false);
  const [activeMenuLabel, setActiveMenuLabel] = useState<string | null>(null);

  const sidebarRef = useRef<HTMLDivElement>(null);

  /* Sync highlight with AppContainer */
  useEffect(() => {
    if (currentMenu?.label) {
      setActiveMenuLabel(currentMenu.label.trim());
    }
  }, [currentMenu]);

  /* Clean open/close toggle */
  const toggleSidebar = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  /* Listen for global toggle request */
  useEffect(() => {
    const handler = () => toggleSidebar();
    window.addEventListener("toggleSidebar", handler);
    return () => window.removeEventListener("toggleSidebar", handler);
  }, [toggleSidebar]);

  /* Close sidebar when clicking outside */
  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick, true);
    return () =>
      document.removeEventListener("mousedown", handleOutsideClick, true);
  }, [open]);

  /* Reset highlight if needed */
  useEffect(() => {
    const reset = () => setActiveMenuLabel(null);
    window.addEventListener("resetSidebarSelection", reset);
    return () => window.removeEventListener("resetSidebarSelection", reset);
  }, []);

  /* Menu sections */
  const sections = useMemo(
    () => [
      { title: "User Section", menus: userMenus },
      { title: "Task Admin", menus: taskAdminMenus },
      { title: "People Admin", menus: peopleMenus },
      { title: "System Admin", menus: systemMenus },
    ],
    []
  );

  /* Handle menu click */
  const handleMenuSelect = useCallback(
    (menu: any) => {
      const label = menu.label.trim();
      const isSameMenu = activeMenuLabel === label;
      const insideTool = activeSubPage !== null;

      // If same menu & we are in the main page -> close sidebar
      if (isSameMenu && !insideTool) {
        setOpen(false);
        return;
      }

      // Navigate
      setActiveMenuLabel(label);
      onMenuClick({ ...menu, label });
    },
    [activeMenuLabel, activeSubPage, onMenuClick]
  );

  return (
    <>
      {/* BACKDROP */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR PANEL */}
      <AnimatePresence>
        {open && (
          <motion.aside
            ref={sidebarRef}
            key="sidebar"
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
            className="fixed top-0 left-0 bottom-0 w-[280px] flex flex-col justify-between
            bg-white
            border-r border-black/10
            shadow-[4px_0_16px_rgba(0,0,0,0.18)]
            z-50 rounded-none select-none"
          >
            {/* HEADER */}
            <div className="flex items-center border-b border-black/10 h-[60px] px-5 bg-white">
              <h1 className="text-lg font-semibold text-gray-900 tracking-tight">
                Navigation
              </h1>
            </div>

            {/* MENU LIST */}
            <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
              {sections.map(({ title, menus }) => (
                <React.Fragment key={title}>
                  <SectionBlock
                    title={title}
                    menus={menus}
                    activeMenuLabel={activeMenuLabel}
                    onMenuClick={handleMenuSelect}
                  />
                  <Divider />
                </React.Fragment>
              ))}
            </div>

            {/* FOOTER */}
            <Footer />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
});

/* =========================================
   SECTION BLOCK
========================================= */
const SectionBlock = memo(function SectionBlock({
  title,
  menus,
  activeMenuLabel,
  onMenuClick,
}: any) {
  return (
    <div className="mt-2 px-2">
      <h2 className="text-xs font-semibold text-gray-700 uppercase px-4 mb-2 tracking-wide">
        {title}
      </h2>

      <nav className="flex flex-col space-y-1">
        {menus.map((m: any) => {
          const Icon = m.icon;
          const isActive = activeMenuLabel === m.label;

          return (
            <motion.div
              key={m.label}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              onClick={() => onMenuClick(m)}
              className={`relative flex items-center cursor-pointer py-3 pl-5 pr-3 rounded-md text-sm font-medium
                ${
                  isActive
                    ? "bg-gradient-to-r from-blue-100 to-blue-50 text-[#0A4A7A] border border-blue-300 shadow-inner"
                    : "text-gray-900 hover:bg-gray-200/60"
                }`}
            >
              {isActive && (
                <div className="absolute left-0 top-0 h-full w-[4px] bg-[#0A4A7A] rounded-r-md shadow-[0_0_8px_rgba(10,74,122,0.7)]" />
              )}

              {/* icons now match your black profile theme */}
              <Icon size={18} strokeWidth={2.4} className="text-black/80" />
              <span className="ml-3">{m.label}</span>
            </motion.div>
          );
        })}
      </nav>
    </div>
  );
});

/* =========================================
   FOOTER
========================================= */
const Footer = memo(function Footer() {
  return (
    <div className="p-4 border-t border-black/10 text-xs text-gray-700 bg-white/60 backdrop-blur-md">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-gray-900">System Info</span>
        <LogOut size={14} className="text-gray-600" />
      </div>

      <div className="space-y-1">
        <p>
          <b>Client Version:</b> 1
        </p>
        <p>
          <b>Build #:</b> 11.11.2025
        </p>
        <p>
          <b>Node:</b> 20.0.0
        </p>
      </div>

      <p className="text-center text-gray-500 text-[10px] mt-3 border-t border-black/10 pt-2">
        Brandon Virtual | © 2025
      </p>
    </div>
  );
});

const Divider = memo(() => (
  <div className="my-3 mx-4 border-t border-black/10" />
));
