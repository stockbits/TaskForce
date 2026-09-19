import { useId } from "react";
import { Autocomplete, TextField } from "@mui/material";
import type { SelectionOption } from "./SelectionField";
interface MultipleSelectionFieldProperties {
  label: string;
  options: SelectionOption[];
  value: SelectionOption[];
  onChange: (value: SelectionOption[]) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}
export default function MultipleSelectionField({
  label,
  options,
  value,
  onChange,
  disabled,
  error,
  helperText,
}: MultipleSelectionFieldProperties) {
  const identifier = useId();
  return (
    <Autocomplete
      id={identifier}
      multiple
      fullWidth
      options={options}
      value={value}
      disabled={disabled}
      onChange={(_event, selection) => onChange(selection)}
      isOptionEqualToValue={(option, selection) =>
        option.identifier === selection.identifier
      }
      getOptionLabel={(option) => option.label}
      sx={{
        "& .MuiChip-root": { maxWidth: "100%", height: "auto", minHeight: 32 },
        "& .MuiChip-label": {
          whiteSpace: "normal",
          overflowWrap: "anywhere",
          py: 1,
        },
      }}
      renderInput={(parameters) => (
        <TextField
          {...parameters}
          label={label}
          error={error}
          helperText={helperText}
        />
      )}
    />
  );
}
