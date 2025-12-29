import React, { useState, memo, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Collapse,
  IconButton,
  Box,
  Typography,
  Chip,
} from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { useTheme, alpha } from "@mui/material/styles";

interface ExpandableSectionCardProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  actions?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerProps?: any;
  contentProps?: any;
  contentSx?: any;
  paperProps?: any;
  variant?: 'default' | 'compact' | 'spacious';
}

const ExpandableSectionCard: React.FC<ExpandableSectionCardProps> = memo(({
  title,
  children,
  defaultExpanded = false,
  expanded,
  onToggle,
  actions,
  subtitle,
  headerProps,
  contentProps,
  contentSx,
  paperProps,
  variant = 'default',
}) => {
  const theme = useTheme();
  // If expanded prop is provided, use controlled mode; else use internal state
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isControlled = typeof expanded === "boolean";
  const isExpanded = isControlled ? expanded : internalExpanded;
  const handleToggle = useCallback(() => {
    if (isControlled && onToggle) {
      onToggle();
    } else {
      setInternalExpanded((prev) => !prev);
    }
  }, [isControlled, onToggle]);

  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return {
          header: { py: 1.5, px: 2 },
          content: { py: 1, px: 2 },
          titleVariant: 'subtitle2' as const,
        };
      case 'spacious':
        return {
          header: { py: 3, px: 3 },
          content: { py: 3, px: 3 },
          titleVariant: 'h6' as const,
        };
      default:
        return {
          header: { py: 2, px: 2.5 },
          content: { py: 2, px: 2.5 },
          titleVariant: 'subtitle1' as const,
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Card
      elevation={2}
      sx={{
        mb: 1.5,
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
        '&:hover': {
          elevation: 4,
          borderColor: alpha(theme.palette.primary.main, 0.16),
        },
        ...paperProps?.sx,
      }}
      {...paperProps}
    >
      <CardHeader
        onClick={handleToggle}
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant={styles.titleVariant} sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            <Chip
              label={isExpanded ? 'Expanded' : 'Collapsed'}
              size="small"
              variant="outlined"
              sx={{
                height: 18,
                fontSize: '0.7rem',
                fontWeight: 500,
                color: isExpanded ? theme.palette.primary.main : theme.palette.text.secondary,
                borderColor: isExpanded ? theme.palette.primary.main : alpha(theme.palette.text.secondary, 0.3),
                bgcolor: isExpanded ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
              }}
            />
          </Box>
        }
        subheader={subtitle}
        action={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {actions}
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleToggle();
              }}
              aria-label={isExpanded ? "Collapse section" : "Expand section"}
              size="small"
              sx={{
                bgcolor: isExpanded ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                color: isExpanded ? theme.palette.primary.main : theme.palette.text.secondary,
                '&:hover': {
                  bgcolor: isExpanded ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.action.hover, 0.8),
                },
                transition: 'all 0.15s ease',
              }}
            >
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        }
        {...headerProps}
        sx={{
          ...styles.header,
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.04),
          },
          ...headerProps?.sx,
        }}
      />
      <Collapse in={isExpanded} timeout={200} unmountOnExit>
        <CardContent {...contentProps} sx={{ ...styles.content, ...contentSx }}>
          {children}
        </CardContent>
      </Collapse>
    </Card>
  );
});

ExpandableSectionCard.displayName = "ExpandableSectionCard";

export default ExpandableSectionCard;
