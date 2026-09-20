import { MenuItem } from "@mui/material";
import TextInputField, {
  type TextInputFieldProperties,
} from "./TextInputField";
import type { SelectionOption } from "./SelectionField";

export interface DropdownFieldProperties extends Omit<
  TextInputFieldProperties,
  "children" | "onChange" | "select"
> {
  options: SelectionOption[];
  value: string;
  onChange: (value: string) => void;
}

/** Use for a short, fixed option list. Use SelectionField for searchable lists. */
export default function DropdownField({
  options,
  value,
  onChange,
  ...properties
}: DropdownFieldProperties) {
  return (
    <TextInputField
      {...properties}
      select
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <MenuItem
          key={option.identifier}
          value={option.identifier}
          disabled={option.disabled}
        >
          {option.label}
        </MenuItem>
      ))}
    </TextInputField>
  );
}
