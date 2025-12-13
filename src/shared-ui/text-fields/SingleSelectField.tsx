import React, { useState, useMemo } from "react";
import { Autocomplete, ListItem, ListItemText, TextField } from "@mui/material";

type OptionItem = string | { label: string; value: string };

interface SingleSelectFieldProps {
  label: string;
  options: OptionItem[];
  value: string | null;
  onChange: (value: string | null) => void;
  required?: boolean;
  inputValue?: string;
  onInputChange?: (value: string) => void;
  renderOption?: (props: any, option: OptionItem) => React.ReactNode;
}

const FIELD_WIDTH = { xs: '100%', sm: '30ch', md: '40ch' };

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
    return options.filter((opt) => {
      const label = typeof opt === 'string' ? opt : opt.label;
      return label.toLowerCase().includes(normalizedQuery);
    });
  }, [normalizedQuery, options]);

  const longestOption = useMemo(() => {
    if (!options || !options.length) return "";
    return options.reduce<string>((cur, s) => {
      const label = typeof s === 'string' ? s : s.label;
      return String(label).length > cur.length ? String(label) : cur;
    }, typeof options[0] === 'string' ? String(options[0]) : options[0].label);
  }, [options]);

  const handleInputChange = (_e: any, newInput: string) => {
    if (controlledInputValue === undefined) setInternalInput(newInput);
    onInputChange?.(newInput);
  };

  return (
    <Autocomplete
      options={filteredOptions}
      value={
        (() => {
          if (value == null) return null;
          const found = options.find((opt) => (typeof opt === 'string' ? opt === value : opt.value === value));
          return found ?? null;
        })()
      }
      onChange={(_e, newValue) => {
        if (newValue == null) {
          onChange(null);
          return;
        }
        const out = typeof newValue === 'string' ? newValue : newValue.value;
        onChange(out);
      }}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
      renderOption={renderOption ?? ((props, option: OptionItem) => (
        <ListItem {...props} dense>
          <ListItemText primary={typeof option === 'string' ? option : option.label} />
        </ListItem>
      ))}
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

export default SingleSelectField;
