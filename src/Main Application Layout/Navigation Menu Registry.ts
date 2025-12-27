/* ============================================================================
   Shared configuration registry for menu cards and navigation
============================================================================ */

import { MenuCard } from "@/shared-types";

/**
 * The master registry for all menu groups and their cards.
 * This is consumed by Sidebar, Global Search, and Task Management navigation.
 */
export const cardMap: Record<string, MenuCard[]> = {
  "Operation Toolkit": [
    { name: "Resource Management", description: "Manage all available resources, teams, and assets." },
    { name: "Task Management", description: "Oversee and assign operational tasks efficiently." },
    { name: "Schedule Live", description: "Monitor and adjust live schedules in real-time." },
    { name: "Schedule Explorer", description: "Browse and analyze upcoming schedules and plans." },
    { name: "Callout Overview", description: "Review all ongoing and past callout events." },
    { name: "Callout Launch", description: "Initiate and configure new callout operations." },
  ],

  "General Settings": [
    { name: "System Preferences", description: "Modify user-level settings, preferences, and themes." },
    { name: "API Keys", description: "Manage access tokens and integrations securely." },
  ],

  "Task Admin": [
    { name: "Task Type", description: "Define and manage task categories and types." },
    { name: "Task Routing", description: "Configure task routing and escalation rules." },
    { name: "Task Importance", description: "Set and manage task priority and importance levels." },
  ],

  "Jeopardy Admin": [
    { name: "Alert Definitions", description: "Define and manage all alert templates." },
    { name: "Alert Action Definition", description: "Configure automated or manual alert responses." },
    { name: "Alert Parameter Definition", description: "Set up variable parameters and alert thresholds." },
    { name: "Alert Ranking", description: "Prioritize and rank alerts by severity or impact." },
    { name: "Alert Exclusion", description: "Manage exceptions and exclusion rules for alerts." },
  ],

  "Resource Admin": [
    { name: "Rota Day Record", description: "Manage and track individual rota day records." },
    { name: "Rota Week Record", description: "Oversee weekly rota summaries and status tracking." },
    { name: "Rota Template Record", description: "Design and configure rota templates for scheduling." },
    { name: "Closure User Group", description: "Administer closure groups for specific operations." },
    { name: "Access Restriction", description: "Set user and role-based access limitations." },
    { name: "Personal Overtime", description: "Monitor and manage personal overtime records." },
    { name: "Business Overtime", description: "Control and review business-wide overtime data." },
  ],

  "Self Service Admin": [
    { name: "Self Selection Settings Admin", description: "Configure system-wide self-selection settings." },
    { name: "Self Selection Task Rating Admin", description: "Manage task rating parameters." },
    { name: "Self Selection Patch Admin", description: "Handle patch management for self-selection." },
    { name: "Self Selection Work Type Admin", description: "Control available work types." },
  ],

  "User Admin": [
    { name: "User Account", description: "Create and manage system user accounts and credentials." },
    { name: "User ID", description: "View and assign unique user identification numbers." },
    { name: "Unbar User", description: "Unblock or reinstate restricted user accounts." },
    { name: "User Role Profile", description: "Define user roles and associated permissions." },
    { name: "Supervisor Change Password", description: "Allow supervisors to reset/change passwords." },
  ],

  "Domain Admin": [
    { name: "Domain Building", description: "Configure and structure operational domains." },
    { name: "Post Areas", description: "Define post boundaries, checkpoints, and zones." },
    { name: "Travel Areas", description: "Set travel regions and mobility zones." },
    { name: "Asset", description: "Manage fixed and movable assets." },
    { name: "Workforce", description: "Assign and monitor domain workforce allocations." },
    { name: "Division", description: "Oversee structural divisions." },
  ],

  "Schedule Admin": [
    { name: "MSS Admin", description: "Manage and configure the Master Schedule System." },
    { name: "SRM Admin", description: "Administer SRM modules & permissions." },
    { name: "SRM Audit", description: "Audit SRM changes and scheduling history." },
  ],

  "System Admin": [
    { name: "Algorithm Parameters", description: "Configure algorithm behaviors & weights." },
    { name: "System Code Editor", description: "Maintain scripts, triggers & automation." },
    { name: "Record Audit", description: "Review detailed audit trails." },
    { name: "Public Holiday", description: "Manage holiday dates affecting schedules." },
    { name: "General Travel Times", description: "Configure default travel time settings." },
  ],
};

/* ============================================================================
   FLAT SEARCH ARRAY — Used by Global Search
   Produces: [{ name, description, menuLabel }]
============================================================================ */
export interface FlattenedTile extends MenuCard {
  menuLabel: string;
}

export const allTiles: FlattenedTile[] = Object.entries(cardMap).flatMap(
  ([menuLabel, cards]) =>
    cards.map((card) => ({
      ...card,
      menuLabel,
    }))
);
