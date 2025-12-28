import React, { useState, useMemo, forwardRef } from 'react';
import { Autocomplete, ListItem, ListItemText, TextField } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTheme as useAppTheme } from '@/System Settings/Dark Mode Handler - Component';
import { alpha } from '@mui/material';
import BaseField from '../base/BaseField';
import { SelectableFieldProps } from '../types';

interface FreeTypeSelectFieldProps extends Omit<SelectableFieldProps, 'options'> {
  /** Selected value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Available options */
  options: (string | { label: string; value: string })[];
  /** Placeholder text */
  placeholder?: string;
}

const FreeTypeSelectField = forwardRef<HTMLInputElement, FreeTypeSelectFieldProps>(({
  value,
  onChange,
  options,
  placeholder = '',
  ...baseProps
}, ref) => {
  const theme = useTheme();
  const { mode } = useAppTheme();
  const [inputValue, setInputValue] = useState<string>(value ?? '');

  // Find the current option object based on the value
  const currentOption = useMemo(() => {
    return options.find((opt) => 
      typeof opt === 'string' ? opt === value : opt.value === value
    ) || null;
  }, [options, value]);

  const normalizedQuery = inputValue.trim().toLowerCase();

  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) return options;
    return options.filter((opt) => {
      const label = typeof opt === 'string' ? opt : opt.label;
      return label.toLowerCase().includes(normalizedQuery);
    });
  }, [normalizedQuery, options]);

  return (
    <BaseField {...baseProps}>
      <Autocomplete
        ref={ref}
        freeSolo
        disableClearable
        componentsProps={{ popper: { style: { zIndex: 13000 } } }}
        options={filteredOptions}
        value={currentOption || undefined}
        inputValue={inputValue}
        onInputChange={(_e, newInput) => setInputValue(newInput)}
        onChange={(_e, newValue) => {
          const selectedValue = typeof newValue === 'string' 
            ? newValue 
            : (newValue as any)?.value ?? '';
          onChange(selectedValue);
        }}
        getOptionLabel={(option) => {
          if (typeof option === 'string') return option;
          return option?.label || '';
        }}
        renderOption={(props, option) => (
          <ListItem {...props} dense>
            <ListItemText primary={typeof option === 'string' ? option : option.label} />
          </ListItem>
        )}
        renderInput={(params) => {
          const endAdornment = <>{params.InputProps.endAdornment}</>;

          return (
            <TextField
              {...params}
              placeholder={placeholder}
              size="small"
              variant="outlined"
              InputProps={{
                ...params.InputProps,
                endAdornment,
                sx: { height: 40, '& .MuiInputBase-input': { paddingTop: 0, paddingBottom: 0, paddingRight: '56px', fontSize: 13, lineHeight: '28px' } },
              }}
              sx={{
                // Ensure dark-mode friendly focus + text colors and remove browser default focus ring
                '& .MuiOutlinedInput-root': {
                  backgroundColor: mode === 'dark' ? alpha(theme.palette.background.paper, 0.8) : theme.palette.background.paper,
                  '& fieldset': {
                    borderColor: mode === 'dark' ? alpha(theme.palette.common.white, 0.23) : alpha(theme.palette.common.black, 0.23),
                  },
                  '&:hover fieldset': {
                    borderColor: mode === 'dark' ? alpha(theme.palette.common.white, 0.4) : alpha(theme.palette.common.black, 0.4),
                  },
                  '&.Mui-focused': {
                    boxShadow: mode === 'dark'
                      ? `0 0 0 2px ${alpha('#3BE089', 0.2)}`
                      : `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                    backgroundColor: mode === 'dark' ? alpha(theme.palette.background.paper, 0.9) : theme.palette.background.paper,
                  },
                  // Remove any native browser focus outline that can render a strong blue ring
                  '& input:focus': {
                    outline: 'none',
                  },
                },
                '& .MuiInputBase-input': {
                  color: mode === 'dark' ? theme.palette.common.white : theme.palette.text.primary,
                },
                '& .MuiInputBase-input::placeholder': {
                  color: mode === 'dark' ? alpha(theme.palette.common.white, 0.5) : alpha(theme.palette.text.primary, 0.5),
                  opacity: 1,
                },
              }}
            />
          );
        }}
        ListboxProps={{ sx: { zIndex: 13000, maxHeight: 320 } }}
        sx={{ '& .MuiAutocomplete-inputRoot': { minHeight: 40, maxHeight: 40, alignItems: 'center', '& .MuiInputBase-input': { paddingTop: 0, paddingBottom: 0, paddingRight: '56px', fontSize: 13, lineHeight: '28px', color: mode === 'dark' ? theme.palette.common.white : theme.palette.text.primary } } }}
      />
    </BaseField>
  );
});

FreeTypeSelectField.displayName = 'FreeTypeSelectField';

export default FreeTypeSelectField;

