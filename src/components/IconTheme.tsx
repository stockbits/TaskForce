import React from "react";
import { LucideIcon } from "lucide-react";

interface IconThemeProps {
  icon: LucideIcon;
  size?: number;
  className?: string;
}

/**
 * IconTheme - Unified black icon style across the entire app.
 * Clean, simple, high-contrast design for light backgrounds.
 */
const IconTheme: React.FC<IconThemeProps> = ({
  icon: Icon,
  size = 22,
  className = "",
}) => {
  return (
    <Icon
      size={size}
      strokeWidth={2.25}
      className={`text-black ${className}`}
    />
  );
};

export default IconTheme;
