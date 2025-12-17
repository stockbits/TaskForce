import React from "react";

interface IconThemeProps {
  icon: React.ElementType;
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
  return <Icon style={{ fontSize: size, color: '#000' }} className={className} />;
};

export default IconTheme;
