import React, { useState, useMemo, forwardRef } from 'react';
import { Autocomplete, ListItem, ListItemText, TextField } from '@mui/material';
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
  const [inputValue, setInputValue] = useState<string>(value ?? '');

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
        value={value || ''}
        inputValue={inputValue}
        onInputChange={(_e, newInput) => setInputValue(newInput)}
        onChange={(_e, newValue) => onChange(String(newValue ?? ''))}
        getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
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
              InputProps={{
                ...params.InputProps,
                endAdornment,
                sx: { height: 40, '& .MuiInputBase-input': { paddingTop: 0, paddingBottom: 0, paddingRight: '56px', fontSize: 13, lineHeight: '28px' } },
              }}
            />
          );
        }}
        ListboxProps={{ sx: { zIndex: 13000, maxHeight: 320 } }}
        sx={{ '& .MuiAutocomplete-inputRoot': { minHeight: 40, maxHeight: 40, alignItems: 'center', '& .MuiInputBase-input': { paddingTop: 0, paddingBottom: 0, paddingRight: '56px', fontSize: 13, lineHeight: '28px' } } }}
      />
    </BaseField>
  );
});

FreeTypeSelectField.displayName = 'FreeTypeSelectField';

export default FreeTypeSelectField;

