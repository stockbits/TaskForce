import React from 'react';
import { Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useFieldSizes from '../utils/useFieldSizes';

interface FieldLabelProps {
  /** Label text */
  children: React.ReactNode;
  /** Associated field ID */
  htmlFor?: string;
  /** Required field indicator */
  required?: boolean;
  /** Error state */
  error?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Label size variant */
  size?: 'small' | 'medium' | 'large';
  /** Custom styling */
  sx?: any;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * Standardized label component for all input fields.
 * Provides consistent typography, spacing, and accessibility.
 */
const FieldLabel: React.FC<FieldLabelProps> = ({
  children,
  htmlFor,
  required = false,
  error = false,
  disabled = false,
  size = 'medium',
  sx,
  'data-testid': testId,
  ...rest
}) => {
  const theme = useTheme();
  const { FIELD_GAP } = useFieldSizes();

  // Size-specific font sizes
  const sizeStyles = {
    small: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
    },
    medium: {
      fontSize: '0.875rem',
      lineHeight: 1.4,
    },
    large: {
      fontSize: '1rem',
      lineHeight: 1.3,
    },
  };

  const labelStyles = {
    ...sizeStyles[size],
    fontWeight: 500,
    marginBottom: theme.spacing(FIELD_GAP),
    color: error ? theme.palette.error.main :
           disabled ? theme.palette.text.disabled :
           theme.palette.text.primary,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),

    // Ensure proper contrast and readability
    userSelect: 'none',
    cursor: disabled ? 'default' : 'pointer',

    ...sx,
  };

  return (
    <Typography
      component="label"
      htmlFor={htmlFor}
      data-testid={testId}
      sx={labelStyles}
      {...rest}
    >
      {children}
      {required && (
        <Typography
          component="span"
          sx={{
            color: theme.palette.error.main,
            fontSize: 'inherit',
            fontWeight: 'bold',
          }}
          aria-label="required"
        >
          **
        </Typography>
      )}
    </Typography>
  );
};

export default FieldLabel;