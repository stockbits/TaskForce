import type { ReactNode } from "react";

export type NavigationIdentifier =
  | "dashboard"
  | "task-management"
  | "live-schedule"
  | "application-settings";

export interface NavigationItem {
  identifier: NavigationIdentifier;
  label: string;
  icon: ReactNode;
}
