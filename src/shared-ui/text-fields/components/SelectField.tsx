import React, { forwardRef } from 'react';
import { TextField, MenuItem } from '@mui/material';
import BaseField from '../base/BaseField';
import { SelectableFieldProps } from '../types';

interface SelectFieldProps extends SelectableFieldProps {
  /** Selected value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Display empty option */
  displayEmpty?: boolean;
}

const SelectField = forwardRef<HTMLInputElement, SelectFieldProps>(({
  value,
  onChange,
  options,
  placeholder = "Select...",
  displayEmpty = true,
  renderValue,
  clearable: _clearable = false,
  ...baseProps
}, ref) => {
  return (
    <BaseField {...baseProps}>
      <TextField
        ref={ref}
        select
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        size="small"
        variant="outlined"
        SelectProps={{
          displayEmpty,
          renderValue: renderValue || ((selected) => (selected as string) || placeholder)
        }}
      >
        {displayEmpty && <MenuItem value=""><em>All</em></MenuItem>}
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </TextField>
    </BaseField>
  );
});

SelectField.displayName = 'SelectField';

export default SelectField;