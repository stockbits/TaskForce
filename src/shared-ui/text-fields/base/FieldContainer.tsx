import React from 'react';
import { Box } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';
import useFieldSizes from '../utils/useFieldSizes';

interface FieldContainerProps {
  children: React.ReactNode;
  /** Container size variant */
  size?: 'small' | 'medium' | 'large';
  /** Custom styling */
  sx?: SxProps<Theme>;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * Consistent container wrapper for all input field components.
 * Provides standardized spacing, sizing, and layout.
 */
const FieldContainer: React.FC<FieldContainerProps> = ({
  children,
  size = 'medium',
  sx,
  className,
  'data-testid': testId,
  ...rest
}) => {
  const { INPUT_HEIGHT, MAX_WIDTH, MIN_WIDTH, FIELD_GAP } = useFieldSizes();

  // Size-specific adjustments
  const sizeMultipliers = {
    small: 0.875,
    medium: 1,
    large: 1.125,
  };

  const multiplier = sizeMultipliers[size];

  const containerStyles: SxProps<Theme> = {
    display: 'flex',
    flexDirection: 'column',
    gap: FIELD_GAP,
    width: '100%',
    maxWidth: MAX_WIDTH,
    minWidth: MIN_WIDTH,
    position: 'relative',

    // Size adjustments
    '& .MuiInputBase-root': {
      minHeight: INPUT_HEIGHT * multiplier,
    },
    '& .MuiFormLabel-root': {
      fontSize: `${0.875 * multiplier}rem`,
    },
    '& .MuiFormHelperText-root': {
      fontSize: `${0.75 * multiplier}rem`,
    },

    ...sx,
  };

  return (
    <Box
      className={className}
      data-testid={testId}
      sx={containerStyles}
      {...rest}
    >
      {children}
    </Box>
  );
};

export default FieldContainer;