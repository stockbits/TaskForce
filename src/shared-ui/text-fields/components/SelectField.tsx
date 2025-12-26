import React, { forwardRef } from 'react';
import { TextField, MenuItem } from '@mui/material';
import BaseField from '../base/BaseField';
import { SelectableFieldProps } from '../types';

type OptionItem = string | { label: string; value: string };

interface SelectFieldProps extends Omit<SelectableFieldProps, 'options'> {
  /** Selected value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Available options */
  options: OptionItem[];
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
          renderValue: renderValue || ((selected) => {
            if (!selected) return placeholder;
            const option = options.find(opt => (typeof opt === 'string' ? opt === selected : opt.value === selected));
            return option ? (typeof option === 'string' ? option : option.label) : String(selected);
          })
        }}
      >
        {displayEmpty && <MenuItem value=""><em>All</em></MenuItem>}
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          return (
            <MenuItem key={optionValue} value={optionValue}>
              {optionLabel}
            </MenuItem>
          );
        })}
      </TextField>
    </BaseField>
  );
});

SelectField.displayName = 'SelectField';

export default SelectField;