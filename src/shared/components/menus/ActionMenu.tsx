import type { ReactNode } from "react";
import { ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";

export interface ActionMenuItem {
  identifier: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

export interface ActionMenuProperties {
  anchorElement: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  items: ActionMenuItem[];
  label: string;
}

/** Generic menu presentation only. Features own action names and permissions. */
export default function ActionMenu({
  anchorElement,
  open,
  onClose,
  items,
  label,
}: ActionMenuProperties) {
  function selectItem(item: ActionMenuItem) {
    item.onSelect();
    onClose();
  }

  return (
    <Menu
      anchorEl={anchorElement}
      open={open}
      onClose={onClose}
      MenuListProps={{ "aria-label": label }}
      slotProps={{
        paper: {
          sx: {
            minWidth: 200,
            maxWidth: "calc(100vw - 32px)",
          },
        },
      }}
    >
      {items.map((item) => (
        <MenuItem
          key={item.identifier}
          disabled={item.disabled}
          onClick={() => selectItem(item)}
          sx={{
            color: item.destructive ? "error.main" : undefined,
            whiteSpace: "normal",
          }}
        >
          {item.icon ? (
            <ListItemIcon sx={{ color: "inherit" }}>{item.icon}</ListItemIcon>
          ) : null}
          <ListItemText
            primary={item.label}
            slotProps={{
              primary: {
                sx: { overflowWrap: "anywhere" },
              },
            }}
          />
        </MenuItem>
      ))}
    </Menu>
  );
}
