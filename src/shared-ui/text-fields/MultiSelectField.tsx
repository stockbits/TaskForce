import React, { useState, useMemo } from "react";
import {
  Autocomplete,
  Box,
  Chip,
  Checkbox,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Tooltip,
  IconButton as MuiIconButton,
} from "@mui/material";
import type {
  AutocompleteChangeDetails,
  AutocompleteChangeReason,
} from "@mui/material/Autocomplete";
import DoneAllIcon from "@mui/icons-material/DoneAll";

const SELECT_ALL_VALUE = "__SELECT_ALL__";

interface MultiSelectFieldProps {
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  required?: boolean;
  showSelectAllIcon?: boolean;
}

const MultiSelectField: React.FC<MultiSelectFieldProps> = ({
  label,
  options,
  value,
  onChange,
  required = false,
  showSelectAllIcon = true,
}) => {
  const [inputValue, setInputValue] = useState("");
  const normalizedQuery = inputValue.trim().toLowerCase();

  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) return options;
    return options.filter((option) =>
      option.toLowerCase().includes(normalizedQuery)
    );
  }, [normalizedQuery, options]);

  const longestOption = useMemo(() => {
    if (!options || !options.length) return "";
    return options.reduce((cur, s) => (String(s).length > cur.length ? String(s) : cur), String(options[0]));
  }, [options]);

  const filteredSelectionCount = filteredOptions.filter((option) =>
    value.includes(option)
  ).length;

  const allFilteredSelected =
    filteredOptions.length > 0 &&
    filteredSelectionCount === filteredOptions.length;

  const partiallyFilteredSelected =
    filteredSelectionCount > 0 && !allFilteredSelected;

  const handleChange = (
    _event: React.SyntheticEvent,
    newValue: string[],
    _reason: AutocompleteChangeReason,
    details?: AutocompleteChangeDetails<string>
  ) => {
    if (details?.option === SELECT_ALL_VALUE) {
      if (!filteredOptions.length) {
        return;
      }

      const next = allFilteredSelected
        ? value.filter((option) => !filteredOptions.includes(option))
        : Array.from(new Set([...value, ...filteredOptions]));

      onChange(next);
      return;
    }

    const cleaned = newValue.filter((option) => option !== SELECT_ALL_VALUE);
    onChange(cleaned);
  };

  const toggleSelectAll = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!filteredOptions.length) return;

    if (allFilteredSelected) {
      const next = value.filter((option) => !filteredOptions.includes(option));
      onChange(next);
    } else {
      const next = Array.from(new Set([...value, ...filteredOptions]));
      onChange(next);
    }
  };

  const FIELD_WIDTH = { xs: '100%', sm: '26ch', md: '32ch' };

  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      componentsProps={{ popper: { style: { minWidth: '32ch' } } }}
      sx={{
        width: FIELD_WIDTH,
        '& .MuiAutocomplete-inputRoot': {
          minHeight: 36,
          maxHeight: 36,
          overflow: 'hidden',
          alignItems: 'center',
          // reserve space on the right for the select-all icon
          '& .MuiInputBase-input': { paddingRight: '56px' },
        },
        '& .MuiAutocomplete-tag': {
          maxWidth: '100%',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
        '& .MuiInputBase-root': { minHeight: 36 },
      }}
      options={[SELECT_ALL_VALUE, ...options]}
      value={value}
      inputValue={inputValue}
      onInputChange={(_event, newInput) => setInputValue(newInput)}
      filterOptions={(opts) =>
        opts.filter(
          (option) =>
            option === SELECT_ALL_VALUE ||
            option.toLowerCase().includes(normalizedQuery)
        )
      }
      onChange={handleChange}
      getOptionLabel={(option) =>
        option === SELECT_ALL_VALUE ? "Select Filtered" : option
      }
      renderOption={(props, option) => {
        if (option === SELECT_ALL_VALUE) {
          return (
            <ListItem {...props} dense>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Checkbox
                  edge="start"
                  checked={allFilteredSelected}
                  indeterminate={partiallyFilteredSelected}
                  size="small"
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  allFilteredSelected ? "Clear Filtered" : "Select Filtered"
                }
              />
            </ListItem>
          );
        }

        return (
          <ListItem {...props} dense>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <Checkbox
                edge="start"
                checked={value.includes(option)}
                size="small"
              />
            </ListItemIcon>
            <ListItemText primary={option} />
          </ListItem>
        );
      }}
      renderTags={(tagValue) => {
        if (!tagValue || tagValue.length === 0) return null;

        return (
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', overflow: 'hidden', height: '100%', pr: '8px' }}>
            <Chip
              label={`+${tagValue.length}`}
              size="small"
              sx={{ flex: '0 0 auto', pl: 1 }}
            />
          </Box>
        );
      }}
      renderInput={(params) => {
        const endAdornment = (
          <>
            {showSelectAllIcon && (
              <Tooltip title={allFilteredSelected ? "Clear filtered" : "Select filtered"} arrow>
                <MuiIconButton
                  size="small"
                  onClick={toggleSelectAll}
                  aria-label={allFilteredSelected ? "Clear filtered" : "Select filtered"}
                  sx={{ mr: 0.75, px: 0.75 }}
                >
                  <DoneAllIcon fontSize="small" color={allFilteredSelected ? 'primary' : 'inherit'} />
                </MuiIconButton>
              </Tooltip>
            )}
            {params.InputProps.endAdornment}
          </>
        );

        return (
          <TextField
            {...params}
            placeholder={value && value.length ? "" : (longestOption || label)}
            size="small"
            required={required}
            aria-label={label}
            InputProps={{
              ...params.InputProps,
              endAdornment,
              sx: { height: 36, '& .MuiInputBase-input': { paddingTop: '6px', paddingBottom: '6px', paddingRight: '56px' } },
            }}
          />
        );
      }}
      ListboxProps={{
        sx: { maxHeight: 320 },
      }}
    />
  );
};

export default MultiSelectField;
export { SELECT_ALL_VALUE };
