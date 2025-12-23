// src/SCH_Live/panels/MapLegend.tsx
import React from "react";
import { Box, IconButton, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import Close from '@mui/icons-material/Close';
import {
  COMMIT_COLORS,
  STATUS_COLORS,
  createTaskSVG,
  createResourceSVG,
} from "@/shared-config/pins";

interface ScheduleLegendProps {
  visible: boolean;
  onClose: () => void;
}

export default function ScheduleLegend({ visible, onClose }: ScheduleLegendProps) {
  const theme = useTheme();
  if (!visible) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        top: theme.spacing(7),
        right: theme.spacing(4),
        zIndex: 9999,
      }}
    >
      <Paper
        elevation={14}
        sx={{
          width: theme.spacing(36), // 288px
          borderRadius: 3,
          px: 3,
          py: 2.5,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
          boxShadow: "0 18px 46px rgba(8,58,97,0.22)",
          backgroundImage: "none",
          maxHeight: theme.spacing(50), // 400px max height
          overflowY: "auto", // Make it scrollable
        }}
      >
        <Stack spacing={3}>
          {/* HEADER */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle2" fontWeight={600} color="text.primary">
              Schedule Legend
            </Typography>
            <IconButton
              size="small"
              onClick={onClose}
              sx={{
                color: alpha(theme.palette.text.primary, 0.6),
                '&:hover': {
                  color: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
              aria-label="Close legend"
            >
              <Close style={{ fontSize: 16 }} />
            </IconButton>
          </Stack>

          {/* RESOURCES */}
          <Stack spacing={1.5}>
            <Typography
              variant="overline"
              sx={{
                fontWeight: 700,
                letterSpacing: 1.1,
                color: alpha(theme.palette.text.secondary, 0.85),
              }}
            >
              Resources
            </Typography>

            <Stack spacing={1.5}>
              {Object.keys(STATUS_COLORS).map((status) => (
                <Stack direction="row" spacing={2} alignItems="center" key={status}>
                  <Box
                    sx={{ transform: "scale(0.75)", transformOrigin: "left center" }}
                    dangerouslySetInnerHTML={{
                      __html: createResourceSVG(status, false),
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {status}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>

          {/* TASKS */}
          <Stack spacing={1.5}>
            <Typography
              variant="overline"
              sx={{
                fontWeight: 700,
                letterSpacing: 1.1,
                color: alpha(theme.palette.text.secondary, 0.85),
              }}
            >
              Tasks
            </Typography>

            <Stack spacing={1.5}>
              {Object.entries(COMMIT_COLORS).map(([type, color]) => (
                <Stack direction="row" spacing={2} alignItems="center" key={type}>
                  <Box
                    sx={{ transform: "scale(0.75)", transformOrigin: "left center" }}
                    dangerouslySetInnerHTML={{
                      __html: createTaskSVG(color, false),
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {type}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>

          {/* TIMELINE */}
          <Stack spacing={1.5}>
            <Typography
              variant="overline"
              sx={{
                fontWeight: 700,
                letterSpacing: 1.1,
                color: alpha(theme.palette.text.secondary, 0.85),
              }}
            >
              Timeline
            </Typography>

            <Stack spacing={1.5}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    bgcolor: "primary.main",
                    opacity: 0.15,
                    borderLeft: "3px solid #000000",
                    borderRight: "3px solid #000000",
                    borderRadius: 0,
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  Working Hours
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
