import React from "react";
import {
  Box,
  Button,
  Collapse,
  Paper,
  Stack,
  Typography,
  type PaperProps,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface ExpandableSectionCardProps {
  title: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  description?: React.ReactNode;
  startAdornment?: React.ReactNode;
  headerAction?: React.ReactNode;
  disablePadding?: boolean;
  contentSx?: SxProps<Theme>;
  paperProps?: PaperProps;
  expandIcon?: React.ReactNode;
  collapseIcon?: React.ReactNode;
}

const ExpandableSectionCard: React.FC<ExpandableSectionCardProps> = ({
  title,
  expanded,
  onToggle,
  children,
  description,
  startAdornment,
  headerAction,
  disablePadding = false,
  contentSx,
  paperProps,
  expandIcon,
  collapseIcon,
}) => {
  const theme = useTheme();
  const { sx: paperSx, ...restPaperProps } = paperProps ?? {};
  const paperSxArray = React.useMemo(() => {
    if (!paperSx) return [] as SxProps<Theme>[];
    return Array.isArray(paperSx) ? paperSx : [paperSx];
  }, [paperSx]);

  return (
    <Paper
      variant="outlined"
      sx={[
        {
          borderRadius: 2,
          overflow: "hidden",
          borderColor: alpha(theme.palette.primary.main, 0.12),
          backgroundImage: "none",
        },
        ...paperSxArray,
      ]}
      {...restPaperProps}
    >
      <Button
        onClick={onToggle}
        fullWidth
        disableRipple
        sx={{
          justifyContent: "flex-start",
          px: 3,
          py: 2.5,
          textTransform: "none",
          fontWeight: 600,
          color: theme.palette.text.primary,
          bgcolor: alpha(theme.palette.primary.main, expanded ? 0.08 : 0.04),
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.12),
          },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ width: "100%", gap: 2 }}
        >
          <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
            {startAdornment}
            <Stack spacing={description ? 0.5 : 0} sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                fontWeight={600}
                color="text.primary"
                sx={{ whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}
              >
                {title}
              </Typography>
              {description && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", whiteSpace: "normal" }}
                >
                  {description}
                </Typography>
              )}
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
            {headerAction}
            {expanded ? collapseIcon ?? <ChevronUp size={18} /> : expandIcon ?? <ChevronDown size={18} />}
          </Stack>
        </Stack>
      </Button>

      <Collapse in={expanded} unmountOnExit>
        <Box
          sx={{
            px: disablePadding ? 0 : 3,
            py: disablePadding ? 0 : 3,
            ...contentSx,
          }}
        >
          {children}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default ExpandableSectionCard;
