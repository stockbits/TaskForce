import { useId } from "react";
import { Autocomplete, TextField } from "@mui/material";
export interface SelectionOption {
  identifier: string;
  label: string;
  disabled?: boolean;
}
export interface SelectionFieldProperties {
  label: string;
  options: SelectionOption[];
  value: SelectionOption | null;
  onChange: (value: SelectionOption | null) => void;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;
}
export default function SelectionField({
  label,
  options,
  value,
  onChange,
  disabled,
  required,
  error,
  helperText,
}: SelectionFieldProperties) {
  const identifier = useId();
  return (
    <Autocomplete
      id={identifier}
      fullWidth
      options={options}
      value={value}
      disabled={disabled}
      onChange={(_event, selection) => onChange(selection)}
      isOptionEqualToValue={(option, selection) =>
        option.identifier === selection.identifier
      }
      getOptionLabel={(option) => option.label}
      getOptionDisabled={(option) => Boolean(option.disabled)}
      renderInput={(parameters) => (
        <TextField
          {...parameters}
          label={label}
          required={required}
          error={error}
          helperText={helperText}
        />
      )}
    />
  );
}
