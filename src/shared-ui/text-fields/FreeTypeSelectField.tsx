import React, { useState, useMemo, useEffect } from "react";
import { Autocomplete, ListItem, ListItemText, TextField } from "@mui/material";

interface FreeTypeSelectFieldProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const FreeTypeSelectField: React.FC<FreeTypeSelectFieldProps> = ({
  label,
  options,
  value,
  onChange,
  required = false,
}) => {
  const [inputValue, setInputValue] = useState(value || "");

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  const normalizedQuery = inputValue.trim().toLowerCase();

  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) return options;
    return options.filter((option) =>
      option.toLowerCase().includes(normalizedQuery)
    );
  }, [normalizedQuery, options]);

  const longestOption = useMemo(() => {
    if (!options || !options.length) return "";
    return options.reduce((cur, s) =>
      String(s).length > cur.length ? String(s) : cur,
      String(options[0])
    );
  }, [options]);

  const FIELD_WIDTH = { xs: '100%', sm: '28ch', md: '36ch' };

  return (
    <Autocomplete
      freeSolo
      options={filteredOptions}
      value={value || ""}
      onChange={(_e, newValue) => {
        const v = typeof newValue === "string" ? newValue : String(newValue ?? "");
        onChange(v);
      }}
      inputValue={inputValue}
      onInputChange={(_e, newInput) => {
        setInputValue(newInput);
        onChange(newInput);
      }}
      getOptionLabel={(option) => option}
      renderOption={(props, option) => (
        <ListItem {...props} dense>
          <ListItemText primary={option} />
        </ListItem>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={value || longestOption || label}
          size="small"
          required={required}
          aria-label={label}
          InputProps={{
            ...params.InputProps,
            sx: { '& .MuiInputBase-input': { paddingRight: '56px' } },
          }}
        />
      )}
      sx={{ width: FIELD_WIDTH }}
    />
  );
};

export default FreeTypeSelectField;
