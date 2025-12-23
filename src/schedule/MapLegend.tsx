// src/SCH_Live/panels/MapLegend.tsx
import React, { useRef, useState } from "react";
import { Box, IconButton, Paper, Stack, Typography, Tabs, Tab } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import Close from '@mui/icons-material/Close';
import GroupsIcon from '@mui/icons-material/Groups';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TimelineIcon from '@mui/icons-material/Timeline';
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
  const legendRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState(0);

  if (!visible) return null;

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (legendRef.current && !legendRef.current.contains(event.target as Node)) {
      onClose();
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9998,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
      }}
      onClick={handleBackdropClick}
    >
      <Box
        ref={legendRef}
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
          width: theme.spacing(40),
          borderRadius: 3,
          px: 3,
          py: 2.5,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
          boxShadow: "0 18px 46px rgba(8,58,97,0.22)",
          backgroundImage: "none",
          maxHeight: '80vh',
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* HEADER */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
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

        {/* TABS */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="legend sections"
            variant="fullWidth"
            sx={{
              minHeight: 40,
              '& .MuiTab-root': {
                minHeight: 40,
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
              },
            }}
          >
            <Tab
              icon={<GroupsIcon />}
              label="Resources"
              iconPosition="start"
              sx={{ minHeight: 40 }}
            />
            <Tab
              icon={<AssignmentIcon />}
              label="Tasks"
              iconPosition="start"
              sx={{ minHeight: 40 }}
            />
            <Tab
              icon={<TimelineIcon />}
              label="Timeline"
              iconPosition="start"
              sx={{ minHeight: 40 }}
            />
          </Tabs>
        </Box>

        {/* TAB CONTENT */}
        <Box sx={{ flex: 1, overflowY: "auto", pr: 1 }}>
          {/* RESOURCES TAB */}
          {activeTab === 0 && (
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
          )}

          {/* TASKS TAB */}
          {activeTab === 1 && (
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
          )}

          {/* TIMELINE TAB */}
          {activeTab === 2 && (
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
          )}
        </Box>
      </Paper>
    </Box>
    </Box>
  );
}
