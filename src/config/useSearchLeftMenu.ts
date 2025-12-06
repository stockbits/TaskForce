import { useState } from "react";

export type SearchMenuGroup = "task" | "resource";

export interface SearchMenuItem {
  id: string;
  label: string;
  group: SearchMenuGroup;
}

/* ------------------------------------------------------------
   STATIC MENU DEFINITIONS (CLEANED + SAFE)
------------------------------------------------------------ */
export const SEARCH_MENU_ITEMS: readonly SearchMenuItem[] = [
  // ----- TASK SEARCHES -----
  { id: "tasksByCommit", label: "Tasks by Commit", group: "task" },
  { id: "notAssigned", label: "Not Assigned Tasks", group: "task" },
  {
    id: "earliestResource",
    label: "Earliest Resource for Task",
    group: "task",
  },
  { id: "closeResource", label: "Close Resource for Tasks", group: "task" },

  // ----- RESOURCE SEARCHES (ONLY ACTIVE FOR NOW) -----
  {
    id: "resource-active",
    label: "Active Resources",
    group: "resource",
  },
] as const;

/* ------------------------------------------------------------
   HOOK FOR LEFT-MENU STATE + BEHAVIOUR
------------------------------------------------------------ */
export function useSearchLeftMenu() {
  // Default tab = task
  const [activeTab, setActiveTab] = useState<SearchMenuGroup>("task");

  // Default selected mode = first task item
  const [selectedMode, setSelectedMode] = useState<string>(
    SEARCH_MENU_ITEMS.find((m) => m.group === "task")?.id ??
      SEARCH_MENU_ITEMS[0].id
  );

  /* -----------------------------
     TAB SWITCH HANDLER
  ----------------------------- */
  const selectTab = (group: SearchMenuGroup) => {
    setActiveTab(group);

    const firstItem = SEARCH_MENU_ITEMS.find((m) => m.group === group);
    if (firstItem) {
      setSelectedMode(firstItem.id);
    }
  };

  const isTab = (group: SearchMenuGroup) => activeTab === group;

  /* -----------------------------
     MENU ITEM SELECT
  ----------------------------- */
  const select = (mode: string) => {
    setSelectedMode(mode);

    const item = SEARCH_MENU_ITEMS.find((m) => m.id === mode);
    if (item) setActiveTab(item.group);
  };

  const isActive = (id: string) => id === selectedMode;

  /* -----------------------------
     FILTERED GROUP LISTS
  ----------------------------- */
  const taskItems = SEARCH_MENU_ITEMS.filter((m) => m.group === "task");
  const resourceItems = SEARCH_MENU_ITEMS.filter((m) => m.group === "resource");

  return {
    MENU: SEARCH_MENU_ITEMS,
    activeTab,
    selectedMode,
    selectTab,
    isTab,
    select,
    isActive,
    taskItems,
    resourceItems,
  };
}
