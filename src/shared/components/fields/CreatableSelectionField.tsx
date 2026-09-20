import { useId } from "react";
import { Autocomplete, TextField } from "@mui/material";

export interface CreatableSelectionFieldProperties {
  label: string;
  options: string[];
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;
}

export default function CreatableSelectionField({
  label,
  options,
  value,
  onChange,
  disabled,
  required,
  error,
  helperText,
}: CreatableSelectionFieldProperties) {
  const identifier = useId();

  return (
    <Autocomplete
      id={identifier}
      freeSolo
      fullWidth
      options={options}
      value={value}
      disabled={disabled}
      onChange={(_event, selection) => onChange(selection)}
      onInputChange={(_event, inputValue, reason) => {
        if (reason === "input") onChange(inputValue || null);
      }}
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
