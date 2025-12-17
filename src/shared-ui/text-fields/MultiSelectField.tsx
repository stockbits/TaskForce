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
import { useTheme } from '@mui/material/styles';
import useFieldSizes from './useFieldSizes';

const SELECT_ALL_VALUE = "__SELECT_ALL__";

interface MultiSelectFieldProps {
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  required?: boolean;
  showSelectAllIcon?: boolean;
  wrapperSx?: any;
}

const MultiSelectField: React.FC<MultiSelectFieldProps> = ({
  label,
  options,
  value,
  onChange,
  required = false,
  showSelectAllIcon = true,
  wrapperSx,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const normalizedQuery = inputValue.trim().toLowerCase();

  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) return options;
    return options.filter((option) =>
      option.toLowerCase().includes(normalizedQuery)
    );
  }, [normalizedQuery, options]);

  // Use only the provided label as the placeholder header.

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


  const FIELD_WIDTH = { xs: '100%', sm: '22ch', md: '28ch' };

  const theme = useTheme();
  const { INPUT_HEIGHT, CHIP_SIZE } = useFieldSizes();

  const DEFAULT_WRAPPER_SX = {
    width: "100%",
    maxWidth: FIELD_WIDTH,
    px: 1,
    display: "flex",
    alignItems: "center",
    minHeight: INPUT_HEIGHT,
    flex: "0 0 auto",
    '& .MuiInputBase-root': { minHeight: INPUT_HEIGHT, transition: 'all 120ms ease' },
    '& .MuiSelect-select': { display: 'flex', alignItems: 'center', minHeight: INPUT_HEIGHT, transition: 'all 120ms ease' },
    '& .MuiAutocomplete-inputRoot': { paddingTop: 0, paddingBottom: 0, transition: 'all 120ms ease' },
  } as const;

  return (
    <Box sx={wrapperSx ?? DEFAULT_WRAPPER_SX}>
      <Autocomplete
      disableClearable
      multiple
      disableCloseOnSelect
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      componentsProps={{ popper: { style: { minWidth: '32ch', zIndex: 13000 } } }}
      sx={{
        width: FIELD_WIDTH,
          '& .MuiAutocomplete-inputRoot': {
          minHeight: INPUT_HEIGHT,
          maxHeight: INPUT_HEIGHT,
          overflow: 'hidden',
          alignItems: 'center',
          transition: 'all 120ms ease',
          // reserve space on the right for the select-all icon
          '& .MuiInputBase-input': { paddingRight: '40px', fontSize: 13, lineHeight: `${CHIP_SIZE}px`, paddingTop: 0, paddingBottom: 0 },
        },
        '& .MuiAutocomplete-tag': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: CHIP_SIZE,
          maxWidth: '100%',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
        '& .MuiInputBase-root': { minHeight: INPUT_HEIGHT, transition: 'all 120ms ease' },
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
        // props may include a `key` which must not be spread into the JSX element
        // (React warns when `key` is passed via spread). Remove it before spreading.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { key: _k, ...safeProps } = props as any;

        if (option === SELECT_ALL_VALUE) {
          return (
            <ListItem {...safeProps} dense>
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
          <ListItem {...safeProps} dense>
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
        const count = tagValue.length;
        return (
          <Tooltip title="Show selections" arrow>
            <span>
              <Chip
                label={`+${count} `}
                size="small"
                variant="outlined"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => { e.stopPropagation(); setOpen(true); }}
                sx={{
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: (theme) => theme.palette.action.hover },
                  flex: '0 0 auto',
                  height: CHIP_SIZE,
                  minWidth: 44,
                  maxWidth: 240,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: 1,
                  boxSizing: 'border-box',
                  fontWeight: 600,
                  fontSize: count >= 100 ? 10 : count >= 10 ? 11 : 12,
                  lineHeight: `${CHIP_SIZE}px`,
                  borderRadius: '999px',
                  color: 'primary.main',
                  borderColor: 'primary.main',
                  ml: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  zIndex: 30,
                }}
              />
            </span>
          </Tooltip>
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
            placeholder={value && value.length ? "" : label}
            size="small"
            required={required}
            aria-label={label}
            InputProps={{
              ...params.InputProps,
              endAdornment,
              sx: { height: INPUT_HEIGHT, transition: 'all 120ms ease', '& .MuiInputBase-input': { paddingTop: 0, paddingBottom: 0, paddingRight: '40px', fontSize: 13, lineHeight: `${CHIP_SIZE}px` } },
            }}
          />
        );
      }}
      ListboxProps={{
        sx: { maxHeight: 320, zIndex: 2000 },
      }}
    />
    </Box>
  );
};

export default MultiSelectField;
export { SELECT_ALL_VALUE };
