import React from "react";
import { useTheme } from "@mui/material/styles";

interface IconThemeProps {
  icon: React.ElementType;
  size?: number;
  className?: string;
}
/**
 * IconTheme - Unified icon style across the entire app.
 * Uses theme-aware colors for proper light/dark mode support.
 */
const IconTheme: React.FC<IconThemeProps> = ({
  icon: Icon,
  size = 22,
  className = "",
}) => {
  const theme = useTheme();
  return <Icon style={{ fontSize: size, color: theme.palette.text.primary }} className={className} />;
};

export default IconTheme;
