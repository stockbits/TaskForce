import React, { forwardRef } from 'react';
import { TextField } from '@mui/material';
import BaseField from '../base/BaseField';
import { BaseFieldProps } from '../types';

interface TextInputFieldProps extends BaseFieldProps {
  /** Input value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  /** Placeholder text */
  placeholder?: string;
  /** Allow multiline input */
  multiline?: boolean;
  /** Minimum rows for multiline */
  minRows?: number;
  /** Maximum rows for multiline */
  maxRows?: number;
  /** Input pattern for validation */
  pattern?: string;
  /** Autocomplete attribute */
  autoComplete?: string;
  /** Input mode for mobile keyboards */
  inputMode?: 'text' | 'numeric' | 'email' | 'tel' | 'url' | 'search';
}

const TextInputField = forwardRef<HTMLInputElement, TextInputFieldProps>(({
  value,
  onChange,
  type = 'text',
  placeholder,
  multiline = false,
  minRows,
  maxRows,
  pattern,
  autoComplete,
  inputMode,
  ...baseProps
}, ref) => {
  return (
    <BaseField {...baseProps}>
      <TextField
        ref={ref}
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        multiline={multiline}
        minRows={minRows}
        maxRows={maxRows}
        inputProps={{
          pattern,
          autoComplete,
          inputMode,
        }}
        size="small"
        variant="outlined"
      />
    </BaseField>
  );
});

TextInputField.displayName = 'TextInputField';

export default TextInputField;