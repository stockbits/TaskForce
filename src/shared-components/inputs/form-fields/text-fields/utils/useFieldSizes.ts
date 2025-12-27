import { useTheme } from '@mui/material/styles';
import { useMemo } from 'react';

// ============================================================================
// COMPREHENSIVE FIELD SIZING HOOK
// ============================================================================

/**
 * Centralized hook for all input field sizing, spacing, and responsive behavior.
 * Provides theme-aware dimensions and consistent spacing across all field components.
 */
export default function useFieldSizes() {
  const theme: any = useTheme();

  return useMemo(() => {
    // ============================================================================
    // BASE DIMENSIONS
    // ============================================================================

    const baseInputHeight = theme?.custom?.inputHeight ?? 40;
    const baseChipSize = theme?.custom?.chipSize ?? 28;

    // ============================================================================
    // RESPONSIVE SIZING
    // ============================================================================

    const maxWidth = {
      xs: '100%',      // Mobile: full width
      sm: '60ch',      // Small screens: constrained width
      md: '50ch',      // Medium screens: more constrained
      lg: '45ch',      // Large screens: even more constrained
      xl: '40ch',      // Extra large: most constrained
    };

    const minWidth = {
      xs: '100%',      // Mobile: full width
      sm: '20ch',      // Small screens: minimum readable width
      md: '18ch',      // Medium screens: slightly smaller
      lg: '16ch',      // Large screens: compact
      xl: '16ch',      // Extra large: same as large
    };

    // ============================================================================
    // SPACING SYSTEM
    // ============================================================================

    const fieldGap = 0.5;        // Gap between label and field
    const elementGap = 0.75;     // Gap between field elements
    const containerGap = 1;      // Gap between field containers
    const contentGap = 0.25;     // Gap within field content

    // ============================================================================
    // SIZE VARIANTS
    // ============================================================================

    const sizeMultipliers = {
      small: 0.875,
      medium: 1,
      large: 1.125,
    };

    // ============================================================================
    // THEME-AWARE DIMENSIONS
    // ============================================================================

    const getInputHeight = (size: keyof typeof sizeMultipliers = 'medium') =>
      Math.round(baseInputHeight * sizeMultipliers[size]);

    const getChipSize = (size: keyof typeof sizeMultipliers = 'medium') =>
      Math.round(baseChipSize * sizeMultipliers[size]);

    // ============================================================================
    // BORDER RADIUS SYSTEM
    // ============================================================================

    const borderRadius = {
      small: theme?.shape?.borderRadius ?? 4,
      medium: (theme?.shape?.borderRadius ?? 4) * 1.5,
      large: (theme?.shape?.borderRadius ?? 4) * 2,
    };

    // ============================================================================
    // SHADOW SYSTEM
    // ============================================================================

    const shadows = {
      none: 'none',
      subtle: theme?.shadows?.[1] ?? '0 1px 3px rgba(0,0,0,0.12)',
      medium: theme?.shadows?.[2] ?? '0 2px 8px rgba(0,0,0,0.15)',
      strong: theme?.shadows?.[4] ?? '0 4px 16px rgba(0,0,0,0.2)',
    };

    // ============================================================================
    // TYPOGRAPHY SCALE
    // ============================================================================

    const fontSizes = {
      label: {
        small: '0.75rem',
        medium: '0.875rem',
        large: '1rem',
      },
      helper: {
        small: '0.688rem',
        medium: '0.75rem',
        large: '0.875rem',
      },
      input: {
        small: '0.875rem',
        medium: '1rem',
        large: '1.125rem',
      },
    };

    // ============================================================================
    // RETURN COMPREHENSIVE CONFIG
    // ============================================================================

    return {
      // Base dimensions
      INPUT_HEIGHT: baseInputHeight,
      CHIP_SIZE: baseChipSize,

      // Responsive sizing
      MAX_WIDTH: maxWidth,
      MIN_WIDTH: minWidth,

      // Spacing system
      FIELD_GAP: fieldGap,
      ELEMENT_GAP: elementGap,
      CONTAINER_GAP: containerGap,
      CONTENT_GAP: contentGap,

      // Size variants
      SIZE_MULTIPLIERS: sizeMultipliers,

      // Theme-aware helpers
      getInputHeight,
      getChipSize,

      // Design tokens
      BORDER_RADIUS: borderRadius,
      SHADOWS: shadows,
      FONT_SIZES: fontSizes,

      // Legacy support (for backward compatibility)
      inputHeight: baseInputHeight,
      chipSize: baseChipSize,
      maxWidth,
      minWidth,
      fieldGap,
    };
  }, [theme]);
}
