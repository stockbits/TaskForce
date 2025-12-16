import React, { useState, useMemo } from "react";
import { Autocomplete, Box, ListItem, ListItemText, TextField } from "@mui/material";

interface FreeTypeSelectFieldProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  wrapperSx?: any;
  placeholder?: string;
}

const FIELD_WIDTH = { xs: "100%", sm: "22ch", md: "28ch" };

const CHIP_SIZE = 28;
const INPUT_HEIGHT = 40;

const DEFAULT_WRAPPER_SX = {
  width: "100%",
  maxWidth: FIELD_WIDTH,
  px: 1,
  display: "flex",
  alignItems: "center",
  minHeight: INPUT_HEIGHT,
  flex: "0 0 auto",
  '& .MuiInputBase-root': { minHeight: INPUT_HEIGHT },
  '& .MuiSelect-select': { display: 'flex', alignItems: 'center', minHeight: INPUT_HEIGHT },
  '& .MuiAutocomplete-inputRoot': { paddingTop: 0, paddingBottom: 0, transition: 'all 120ms ease' },
} as const;

const FreeTypeSelectField: React.FC<FreeTypeSelectFieldProps> = ({
  label,
  options,
  value,
  onChange,
  required = false,
  wrapperSx,
  placeholder,
}) => {
  const [inputValue, setInputValue] = useState<string>(value ?? "");

  const normalizedQuery = inputValue.trim().toLowerCase();

  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) return options;
    return options.filter((opt) => opt.toLowerCase().includes(normalizedQuery));
  }, [normalizedQuery, options]);

  return (
    <Box sx={wrapperSx ?? DEFAULT_WRAPPER_SX}>
      <Autocomplete
      freeSolo
      disableClearable
      componentsProps={{ popper: { style: { zIndex: 13000 } } }}
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
      renderInput={(params) => {
        const endAdornment = <>{params.InputProps.endAdornment}</>;

        return (
          <TextField
            {...params}
            placeholder={value ? "" : (placeholder ?? label)}
            size="small"
            required={required}
            aria-label={label}
            InputProps={{
              ...params.InputProps,
              endAdornment,
              sx: { height: INPUT_HEIGHT, transition: 'all 120ms ease', "& .MuiInputBase-input": { paddingTop: 0, paddingBottom: 0, paddingRight: "56px", fontSize: 13, lineHeight: `${CHIP_SIZE}px` } },
            }}
          />
        );
      }}
      ListboxProps={{ sx: { zIndex: 13000, maxHeight: 320 } }}
      sx={{ width: FIELD_WIDTH, '& .MuiAutocomplete-inputRoot': { minHeight: INPUT_HEIGHT, maxHeight: INPUT_HEIGHT, alignItems: 'center', transition: 'all 120ms ease', '& .MuiInputBase-input': { paddingTop: 0, paddingBottom: 0, paddingRight: '56px', fontSize: 13, lineHeight: `${CHIP_SIZE}px` } } }}
    />
    </Box>
  );
};

export default FreeTypeSelectField;

