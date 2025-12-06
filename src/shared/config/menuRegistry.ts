/* ============================================================================
   Shared configuration registry for menu cards and navigation
============================================================================ */

import { MenuCard } from "@/types";

/**
 * The master registry for all menu groups and their cards.
 * This is consumed by Sidebar, Global Search, and Task Management navigation.
 */
export const cardMap: Record<string, MenuCard[]> = {
  "Operation Toolkit": [
    {
      name: "Resource Management",
      description: "Manage all available resources, teams, and assets.",
    },
    {
      name: "Task Management",
      description: "Oversee and assign operational tasks efficiently.",
    },
    {
      name: "Schedule Live",
      description: "Monitor and adjust live schedules in real-time.",
    },
    {
      name: "Schedule Explorer",
      description: "Browse and analyze upcoming schedules and plans.",
    },
    {
      name: "Callout Overview",
      description: "Review all ongoing and past callout events.",
    },
    {
      name: "Callout Launch",
      description: "Initiate and configure new callout operations.",
    },
  ],

  "General Settings": [
    {
      name: "System Preferences",
      description: "Modify user-level settings, preferences, and themes.",
    },
    {
      name: "API Keys",
      description: "Manage access tokens and integrations securely.",
    },
  ],

  "Task Admin": [
    {
      name: "Task Type",
      description: "Define and manage task categories and types.",
    },
    {
      name: "Task Routing",
      description: "Configure task routing and escalation rules.",
    },
    {
      name: "Task Importance",
      description: "Set and manage task priority and importance levels.",
    },
  ],

  "Jeopardy Admin": [
    {
      name: "Alert Definitions",
      description: "Define and manage all alert templates.",
    },
    {
      name: "Alert Action Definition",
      description: "Configure automated or manual alert responses.",
    },
    {
      name: "Alert Parameter Definition",
      description: "Set up variable parameters and alert thresholds.",
    },
    {
      name: "Alert Ranking",
      description: "Prioritize and rank alerts by severity or impact.",
    },
    {
      name: "Alert Exclusion",
      description: "Manage exceptions and exclusion rules for alerts.",
    },
  ],

  "Resource Admin": [
    {
      name: "Rota Day Record",
      description: "Manage and track individual rota day records.",
    },
    {
      name: "Rota Week Record",
      description: "Oversee weekly rota summaries and status tracking.",
    },
    {
      name: "Resource Skill",
      description: "Define and assign resource skills and competencies.",
    },
    {
      name: "Resource Holidays",
      description: "Manage resource holiday schedules and time off.",
    },
    {
      name: "Resource Group",
      description: "Create and manage resource groupings for allocation.",
    },
  ],

  "Configuration": [
    {
      name: "Service Catalog",
      description: "Maintain the master list of available services.",
    },
    {
      name: "Geo Mapping",
      description: "Configure geographic areas and service territories.",
    },
    {
      name: "System Configuration",
      description: "Adjust system-wide settings and integrations.",
    },
  ],
};
