import React, { useState, useMemo } from "react";
import { Autocomplete, ListItem, ListItemText, TextField } from "@mui/material";

interface SingleSelectFieldProps {
  label: string;
  options: string[];
  value: string | null;
  onChange: (value: string | null) => void;
  required?: boolean;
  inputValue?: string;
  onInputChange?: (value: string) => void;
  renderOption?: (props: any, option: string) => React.ReactNode;
}

const SingleSelectField: React.FC<SingleSelectFieldProps> = ({
  label,
  options,
  value,
  onChange,
  required = false,
  inputValue: controlledInputValue,
  onInputChange,
  renderOption,
}) => {
  const [internalInput, setInternalInput] = useState("");
  const inputValue = controlledInputValue !== undefined ? controlledInputValue : internalInput;

  const normalizedQuery = inputValue.trim().toLowerCase();

  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) return options;
    return options.filter((option) => option.toLowerCase().includes(normalizedQuery));
  }, [normalizedQuery, options]);

  const longestOption = useMemo(() => {
    if (!options || !options.length) return "";
    return options.reduce((cur, s) => (String(s).length > cur.length ? String(s) : cur), String(options[0]));
  }, [options]);

  const handleInputChange = (_e: any, newInput: string) => {
    if (controlledInputValue === undefined) setInternalInput(newInput);
    onInputChange?.(newInput);
  };

  return (
    <Autocomplete
      options={filteredOptions}
      value={value}
      onChange={(_e, newValue) => onChange(newValue)}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      getOptionLabel={(option) => option}
      renderOption={renderOption ?? ((props, option) => (
        <ListItem {...props} dense>
          <ListItemText primary={option} />
        </ListItem>
      ))}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={value || longestOption || label}
          size="small"
          required={required}
          aria-label={label}
        />
      )}
      sx={{ width: "100%" }}
    />
  );
};

export default SingleSelectField;
