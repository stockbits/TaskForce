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

const FIELD_WIDTH = { xs: '100%', sm: '26ch', md: '32ch' };

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

  const prefillPrompt = useMemo(() => {
    if (!options || !options.length) return label;
    const first = typeof options[0] === 'string' ? options[0] : options[0].label;
    const firstWord = String(first).trim().split(/\s+/)[0] || String(first);
    return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
  }, [options, label]);

  const handleInputChange = (_e: any, newInput: string) => {
    if (controlledInputValue === undefined) setInternalInput(newInput);
    onInputChange?.(newInput);
  };

  return (
    <Autocomplete
      componentsProps={{ popper: { style: { zIndex: 2000 } } }}
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
          placeholder={value || prefillPrompt || label}
          size="small"
          required={required}
          aria-label={label}
          InputProps={{
            ...params.InputProps,
            sx: { '& .MuiInputBase-input': { paddingRight: '56px' } },
          }}
        />
      )}
      ListboxProps={{ sx: { zIndex: 2000, maxHeight: 320 } }}
      sx={{ width: FIELD_WIDTH }}
    />
  );
};

export default SingleSelectField;
