import React from 'react';
import MuiButton, { ButtonProps as MuiButtonProps } from '@mui/material/Button';
import { useTheme, alpha } from '@mui/material/styles';

export interface AppButtonProps extends MuiButtonProps {}

export default function AppButton(props: AppButtonProps) {
  const theme = useTheme();
  const { variant = 'contained', color = 'primary', size = 'medium', sx, ...rest } = props;

  // If button is outlined, apply subtle dark-mode friendly defaults so Cancel/outlined
  // buttons remain readable in dark theme. These can be overridden by passing sx.
  const outlinedDefaults = variant === 'outlined' ? {
    color: theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.text.primary,
    borderColor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.12) : alpha(theme.palette.primary.main, 0.12),
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.04) : alpha(theme.palette.primary.main, 0.04),
    },
  } : {};

  return <MuiButton variant={variant} color={color} size={size} sx={{ ...outlinedDefaults, ...sx }} {...rest} />;
}
