import React, { forwardRef, useState, useCallback, useMemo } from 'react';
import { Box, FormHelperText, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  BaseFieldProps,
  FieldRef,
  FieldChangeHandler,
  FieldFocusHandler,
  FieldBlurHandler,
  FieldState,
  ValidationRule
} from '../types';
import useFieldSizes from '../utils/useFieldSizes';

// ============================================================================
// BASE FIELD COMPONENT
// ============================================================================

/**
 * Abstract base component providing common functionality for all input fields.
 * Handles state management, validation, theming, and accessibility.
 */
const BaseField = forwardRef<FieldRef, BaseFieldProps & {
  children: React.ReactNode;
  value?: any;
  onChange?: FieldChangeHandler;
  onFocus?: FieldFocusHandler;
  onBlur?: FieldBlurHandler;
  validationRules?: ValidationRule[];
  customValidator?: (value: any) => string | null;
}>(({
  id,
  name: _name,
  label,
  helperText,
  error: externalError = false,
  required = false,
  disabled = false,
  readOnly = false,
  size: _size = 'medium',
  variant: _variant = 'outlined',
  sx,
  className,
  'data-testid': testId,
  children,
  value,
  onChange,
  onFocus,
  onBlur,
  validationRules = [],
  customValidator,
  ...rest
}, ref) => {
  const theme = useTheme();
  const { MAX_WIDTH, MIN_WIDTH, FIELD_GAP } = useFieldSizes();

  // Internal state
  const [internalValue, setInternalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [touched, setTouched] = useState(false);

  // Use external value if provided, otherwise use internal state
  const currentValue = value !== undefined ? value : internalValue;

  // ============================================================================
  // VALIDATION LOGIC
  // ============================================================================

  const validationErrors = useMemo(() => {
    if (!touched && !externalError) return [];

    const errors: string[] = [];

    // Run validation rules
    for (const rule of validationRules) {
      if (!rule.validate(currentValue)) {
        errors.push(rule.message);
      }
    }

    // Run custom validator
    if (customValidator) {
      const customError = customValidator(currentValue);
      if (customError) {
        errors.push(customError);
      }
    }

    return errors;
  }, [currentValue, validationRules, customValidator, touched, externalError]);

  const hasError = externalError || validationErrors.length > 0;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _fieldState: FieldState = disabled ? 'disabled' :
                                hasError ? 'error' :
                                isFocused ? 'default' : 'default';

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleChange = useCallback((newValue: any, event?: React.ChangeEvent) => {
    if (disabled || readOnly) return;

    // Update internal state if not controlled
    if (value === undefined) {
      setInternalValue(newValue);
    }

    // Call external handler
    onChange?.(newValue, event);
  }, [value, onChange, disabled, readOnly]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleFocus = useCallback((event: React.FocusEvent) => {
    setIsFocused(true);
    onFocus?.(event);
  }, [onFocus]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleBlur = useCallback((event: React.FocusEvent) => {
    setIsFocused(false);
    setTouched(true);
    onBlur?.(event);
  }, [onBlur]);

  // ============================================================================
  // FIELD REF METHODS
  // ============================================================================

  React.useImperativeHandle(ref, () => ({
    focus: () => {
      // Implementation will be provided by child components
    },
    blur: () => {
      // Implementation will be provided by child components
    },
    getValue: () => currentValue,
    setValue: (newValue: any) => handleChange(newValue),
    isValid: () => validationErrors.length === 0,
    getErrors: () => validationErrors,
  }), [currentValue, validationErrors, handleChange]);

  // ============================================================================
  // STYLING
  // ============================================================================

  const fieldStyles = useMemo(() => ({
    width: '100%',
    // Ensure field always fills the grid cell and can shrink as needed.
    // Using fixed ch-based max widths caused leftover gaps on some breakpoints
    // (rendering would sometimes leave empty space until a forced reflow).
    maxWidth: '100%',
    minWidth: 0,
    opacity: disabled ? 0.6 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
  }), [disabled]);

  const labelStyles = useMemo(() => ({
    mb: FIELD_GAP,
    fontSize: '0.875rem',
    fontWeight: 500,
    color: hasError ? theme.palette.error.main :
           disabled ? theme.palette.text.disabled :
           theme.palette.text.primary,
  }), [FIELD_GAP, hasError, disabled, theme]);

  const helperTextStyles = useMemo(() => ({
    mt: FIELD_GAP / 2,
    fontSize: '0.75rem',
    color: hasError ? theme.palette.error.main :
           disabled ? theme.palette.text.disabled :
           theme.palette.text.secondary,
  }), [FIELD_GAP, hasError, disabled, theme]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Box
      className={className}
      data-testid={testId}
      sx={{ ...fieldStyles, ...(sx as any) } as any}
      {...rest}
    >
      {/* Label */}
      {label && (
        <Typography
          component="label"
          htmlFor={id}
          sx={labelStyles}
        >
          {label}
          {required && (
            <Typography
              component="span"
              sx={{
                color: theme.palette.error.main,
                ml: 0.5,
              }}
            >
              **
            </Typography>
          )}
        </Typography>
      )}

      {/* Field Content (provided by child components) */}
      <Box sx={{ position: 'relative' }}>
        {children}
      </Box>

      {/* Helper/Error Text */}
      {(helperText || hasError) && (
        <FormHelperText
          error={hasError}
          sx={helperTextStyles}
        >
          {hasError ? validationErrors[0] : helperText}
        </FormHelperText>
      )}
    </Box>
  );
});

BaseField.displayName = 'BaseField';

export default BaseField;