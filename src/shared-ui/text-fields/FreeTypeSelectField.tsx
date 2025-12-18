import React, { useState, useMemo } from "react";
import { Autocomplete, Box, ListItem, ListItemText, TextField, Typography } from "@mui/material";
import useFieldSizes from './useFieldSizes';

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

const DEFAULT_FIELD_WRAPPER_BASE = {
  width: "fit-content",
  maxWidth: FIELD_WIDTH,
  px: 1,
  display: "flex",
  alignItems: "center",
  flex: "0 0 auto",
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
  const { INPUT_HEIGHT, CHIP_SIZE } = useFieldSizes();

  const DEFAULT_WRAPPER_SX = {
    ...DEFAULT_FIELD_WRAPPER_BASE,
    minHeight: INPUT_HEIGHT,
    '& .MuiInputBase-root': { minHeight: INPUT_HEIGHT },
    '& .MuiSelect-select': { display: 'flex', alignItems: 'center', minHeight: INPUT_HEIGHT },
  } as const;

  const [inputValue, setInputValue] = useState<string>(value ?? "");

  const normalizedQuery = inputValue.trim().toLowerCase();

  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) return options;
    return options.filter((opt) => opt.toLowerCase().includes(normalizedQuery));
  }, [normalizedQuery, options]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-start', ...(wrapperSx ?? DEFAULT_WRAPPER_SX) }}>
      <Typography variant="body2" sx={{ fontSize: 12, color: 'text.secondary' }}>{label}</Typography>
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
            placeholder=""
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

