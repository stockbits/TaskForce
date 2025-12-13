import React, { useState, useMemo } from "react";
import { Autocomplete, ListItem, ListItemText, TextField } from "@mui/material";

interface FreeTypeSelectFieldProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const FIELD_WIDTH = { xs: "100%", sm: "24ch", md: "30ch" };

const FreeTypeSelectField: React.FC<FreeTypeSelectFieldProps> = ({
  label,
  options,
  value,
  onChange,
  required = false,
}) => {
  const [inputValue, setInputValue] = useState<string>(value ?? "");

  const normalizedQuery = inputValue.trim().toLowerCase();

  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) return options;
    return options.filter((opt) => opt.toLowerCase().includes(normalizedQuery));
  }, [normalizedQuery, options]);

  return (
    <Autocomplete
      freeSolo
      disableClearable
      componentsProps={{ popper: { style: { zIndex: 2000 } } }}
      options={filteredOptions}
      value={value || ""}
      inputValue={inputValue}
      onInputChange={(_e, newInput) => setInputValue(newInput)}
      onChange={(_e, newValue) => onChange(String(newValue ?? ""))}
      getOptionLabel={(option) => (typeof option === "string" ? option : String(option))}
      renderOption={(props, option) => (
        <ListItem {...props} dense>
          <ListItemText primary={option} />
        </ListItem>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={label}
          size="small"
          required={required}
          aria-label={label}
          InputProps={{
            ...params.InputProps,
            sx: { "& .MuiInputBase-input": { paddingRight: "56px" } },
          }}
        />
      )}
      ListboxProps={{ sx: { zIndex: 2000, maxHeight: 320 } }}
      sx={{ width: FIELD_WIDTH }}
    />
  );
};

export default FreeTypeSelectField;

