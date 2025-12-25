import React, { useState, useMemo, useRef, useCallback, forwardRef } from 'react';
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
} from '@mui/material';
import type {
  AutocompleteChangeDetails,
  AutocompleteChangeReason,
} from '@mui/material/Autocomplete';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import BaseField from '../base/BaseField';
import { MultiSelectableFieldProps } from '../types';

const SELECT_ALL_VALUE = '__SELECT_ALL__';

interface MultiSelectFieldProps extends MultiSelectableFieldProps {
  /** Selected values */
  value: string[];
  /** Change handler */
  onChange: (value: string[]) => void;
  /** Show select all icon */
  showSelectAll?: boolean;
}

const MultiSelectField = forwardRef<HTMLInputElement, MultiSelectFieldProps>(({
  value,
  onChange,
  options,
  showSelectAll = true,
  maxSelections: _maxSelections,
  size, // Extract size to map it
  renderOption: _renderOption, // Extract renderOption to avoid conflicts
  ...baseProps
}, ref) => {
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

  const handleChange = useCallback((
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
  }, [filteredOptions, allFilteredSelected, value, onChange]);

  const toggleSelectAll = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    if (!filteredOptions.length) return;

    if (allFilteredSelected) {
      const next = value.filter((option) => !filteredOptions.includes(option));
      onChange(next);
    } else {
      const next = Array.from(new Set([...value, ...filteredOptions]));
      onChange(next);
    }
  }, [filteredOptions, allFilteredSelected, value, onChange]);


  // Map field size to autocomplete-compatible size
  const autocompleteSize = size === 'large' ? 'medium' : size;

  const END_ADORNMENT_WIDTH = 80; // px reserved for DoneAll + chevron icons
  const COMPACT_DELTA = 6;
  const COMPACT_CHIP_HEIGHT = Math.max(16, 28 - COMPACT_DELTA); // Use default chip size
  const endAdornmentRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _wrapperRef = useRef<HTMLDivElement | null>(null);
  const [endWidth] = useState<number>(END_ADORNMENT_WIDTH);

  return (
    <BaseField {...baseProps}>
      <Autocomplete
        ref={ref}
        disableClearable
        multiple
        disableCloseOnSelect
        size={autocompleteSize}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      componentsProps={{ popper: { style: { zIndex: 13000 } } }}
      sx={{
          '& .MuiAutocomplete-inputRoot': {
            minHeight: 40,
            maxHeight: 40,
            overflow: 'visible',
            alignItems: 'center',
            transition: 'all 120ms ease',
            position: 'relative',
            // reserve space on the right for the select-all icon + chevron (dynamic)
            '& .MuiInputBase-input': { paddingRight: `${endWidth}px`, fontSize: 13, lineHeight: `28px`, paddingTop: 0, paddingBottom: 0 },
          },
          '& .MuiAutocomplete-tag': {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 28,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          },
          '& .MuiInputBase-root': { minHeight: 40, transition: 'all 120ms ease', overflow: 'visible' },
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
      renderOption={(props, option, _state, _ownerState) => {
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
      {...baseProps}
      renderTags={(tagValue, getTagProps) => {
        if (!tagValue || tagValue.length === 0) return null;
        const total = tagValue.length;
        const visible = Math.min(1, total);
        const overflowCount = total - visible;

        return (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, maxWidth: '100%', overflow: 'visible', whiteSpace: 'nowrap' }}>
            {tagValue.slice(0, visible).map((tag, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              return (
                <Chip
                  key={key}
                  label={tag}
                  size="small"
                  {...tagProps}
                  sx={{
                    height: COMPACT_CHIP_HEIGHT,
                    fontSize: 10,
                    lineHeight: `${COMPACT_CHIP_HEIGHT}px`,
                    flex: '0 0 auto',
                    mr: 0.5,
                    px: 0.5,
                    whiteSpace: 'nowrap',
                  }}
                />
              );
            })}
            {overflowCount > 0 && (
              <Tooltip title={overflowCount > 1 ? `+${overflowCount} more` : 'Show selection'} arrow>
                <Chip
                  label={`+${overflowCount}`}
                  size="small"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => { e.stopPropagation(); setOpen(true); }}
                />
              </Tooltip>
            )}
          </Box>
        );
      }}
      renderInput={(params) => {
        const endAdornment = (
          <Box ref={endAdornmentRef} sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', zIndex: 40, gap: 2, pointerEvents: 'none' }}>
            {showSelectAll && (
              <Tooltip title={allFilteredSelected ? "Clear filtered" : "Select filtered"} arrow>
                <MuiIconButton
                  size="small"
                  onClick={toggleSelectAll}
                  aria-label={allFilteredSelected ? "Clear filtered" : "Select filtered"}
                  sx={{ mr: 1.5, px: 0.75, pointerEvents: 'auto' }}
                >
                  <DoneAllIcon 
                    fontSize="small" 
                    sx={{ 
                      opacity: allFilteredSelected ? 1 : 0.8
                    }}
                  />
                </MuiIconButton>
              </Tooltip>
            )}
            {/* ensure the popup/chevron remains clickable */}
            <Box sx={{ display: 'flex', alignItems: 'center', pointerEvents: 'auto', ml: 1 }}>{params.InputProps.endAdornment}</Box>
          </Box>
        );

        return (
          <TextField
            {...params}
            placeholder=""
            size="small"
            aria-label={baseProps.label}
            InputProps={{
              ...params.InputProps,
              endAdornment,
              sx: { height: 40, '& .MuiInputBase-input': { paddingTop: 0, paddingBottom: 0, paddingRight: `${endWidth}px`, fontSize: 13, lineHeight: `28px` } },
            }}
          />
        );
      }}
      ListboxProps={{
        sx: { maxHeight: 320, zIndex: 2000 },
      }}
      {...baseProps}
    />
    </BaseField>
  );
});

MultiSelectField.displayName = 'MultiSelectField';

export default MultiSelectField;
export { SELECT_ALL_VALUE };
