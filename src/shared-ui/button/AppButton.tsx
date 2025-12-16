import React from 'react';
import MuiButton, { ButtonProps as MuiButtonProps } from '@mui/material/Button';

export interface AppButtonProps extends MuiButtonProps {}

export default function AppButton(props: AppButtonProps) {
  const { variant = 'contained', color = 'primary', size = 'medium', sx, ...rest } = props;

  return <MuiButton variant={variant} color={color} size={size} sx={{ ...sx }} {...rest} />;
}
