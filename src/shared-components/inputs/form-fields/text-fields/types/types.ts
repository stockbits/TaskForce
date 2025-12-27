import React from 'react';
import { SxProps, Theme } from '@mui/material/styles';

// ============================================================================
// SHARED TYPES FOR INPUT FIELD SYSTEM
// ============================================================================

export type FieldSize = 'small' | 'medium' | 'large';
export type FieldVariant = 'outlined' | 'filled' | 'standard';
export type FieldState = 'default' | 'error' | 'success' | 'warning' | 'disabled';

// ============================================================================
// COMMON PROP INTERFACES
// ============================================================================

export interface BaseFieldProps {
  /** Field identifier for form handling */
  id?: string;
  /** Field name for form submission */
  name?: string;
  /** Human-readable label */
  label?: string;
  /** Helper text displayed below the field */
  helperText?: string;
  /** Error message (when error state) */
  error?: boolean;
  /** Required field indicator */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Read-only state */
  readOnly?: boolean;
  /** Field size variant */
  size?: FieldSize;
  /** Visual style variant */
  variant?: FieldVariant;
  /** Custom styling */
  sx?: SxProps<Theme>;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

export interface SelectableFieldProps extends BaseFieldProps {
  /** Available options */
  options: (string | { label: string; value: string })[];
  /** Placeholder text */
  placeholder?: string;
  /** Allow clearing selection */
  clearable?: boolean;
  /** Custom option rendering */
  renderOption?: (option: string) => React.ReactNode;
  /** Custom value display */
  renderValue?: (value: any) => React.ReactNode;
}

export interface MultiSelectableFieldProps extends SelectableFieldProps {
  /** Maximum number of selections */
  maxSelections?: number;
  /** Show select all option */
  showSelectAll?: boolean;
  /** Custom chip rendering */
  renderChip?: (option: string, onRemove: () => void) => React.ReactNode;
}

export interface TextFieldProps extends BaseFieldProps {
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  /** Placeholder text */
  placeholder?: string;
  /** Maximum character count */
  maxLength?: number;
  /** Minimum character count */
  minLength?: number;
  /** Input pattern for validation */
  pattern?: string;
  /** Autocomplete attribute */
  autoComplete?: string;
  /** Input mode for mobile keyboards */
  inputMode?: 'text' | 'numeric' | 'email' | 'tel' | 'url' | 'search';
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

export type FieldChangeHandler<T = any> = (value: T, event?: React.ChangeEvent) => void;
export type FieldFocusHandler = (event: React.FocusEvent) => void;
export type FieldBlurHandler = (event: React.FocusEvent) => void;
export type FieldKeyHandler = (event: React.KeyboardEvent) => void;

// ============================================================================
// VALIDATION
// ============================================================================

export interface ValidationRule {
  /** Validation function */
  validate: (value: any) => boolean;
  /** Error message when validation fails */
  message: string;
  /** When to trigger validation */
  trigger?: 'blur' | 'change' | 'submit';
}

export interface FieldValidation {
  /** Field value to validate */
  value: any;
  /** Validation rules */
  rules?: ValidationRule[];
  /** Custom validation function */
  customValidator?: (value: any) => string | null;
}

// ============================================================================
// THEMING & STYLING
// ============================================================================

export interface FieldTheme {
  /** Border radius */
  borderRadius: number;
  /** Border width */
  borderWidth: number;
  /** Focus ring width */
  focusRingWidth: number;
  /** Transition duration */
  transitionDuration: string;
  /** Shadow definitions */
  shadows: {
    default: string;
    hover: string;
    focus: string;
    error: string;
  };
  /** Color palette */
  colors: {
    background: {
      default: string;
      hover: string;
      focus: string;
      disabled: string;
      error: string;
    };
    border: {
      default: string;
      hover: string;
      focus: string;
      disabled: string;
      error: string;
    };
    text: {
      primary: string;
      secondary: string;
      disabled: string;
      error: string;
    };
  };
}

// ============================================================================
// COMPONENT REFS
// ============================================================================

export interface FieldRef {
  /** Focus the field */
  focus(): void;
  /** Blur the field */
  blur(): void;
  /** Get current value */
  getValue(): any;
  /** Set field value */
  setValue(value: any): void;
  /** Check if field is valid */
  isValid(): boolean;
  /** Get validation errors */
  getErrors(): string[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/** Extract props from a component, excluding children */
export type ComponentProps<T extends React.ElementType> = Omit<React.ComponentProps<T>, 'children'>;

/** Make specific props optional */
export type OptionalProps<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Merge two interfaces */
export type MergeProps<T, U> = Omit<T, keyof U> & U;

/** Extract event handlers from props */
export type EventHandlers<T> = {
  [K in keyof T as K extends `on${string}` ? K : never]: T[K];
};