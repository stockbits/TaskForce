import React, { useState } from "react";
import { Box, IconButton, Paper, Stack, Typography, Tabs, Tab, Popper, Fade } from "@mui/material";
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
  anchorEl: HTMLElement | null;
}

export default function ScheduleLegend({ visible, onClose, anchorEl }: ScheduleLegendProps) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Popper
      open={visible}
      anchorEl={anchorEl}
      placement="bottom-start"
      transition
      sx={{ zIndex: 9999 }}
    >
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={200}>
          <Box
            sx={{
              position: "relative",
              mt: 1, // Small gap from the button
            }}
          >
            <Paper
        elevation={14}
        sx={{
          minWidth: theme.spacing(32),
          maxWidth: theme.spacing(45),
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
              minHeight: 48,
              '& .MuiTab-root': {
                minHeight: 48,
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                px: 2,
                py: 1.5,
              },
            }}
          >
            <Tab
              icon={<GroupsIcon />}
              label="Resources"
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
            <Tab
              icon={<AssignmentIcon />}
              label="Tasks"
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
            <Tab
              icon={<TimelineIcon />}
              label="Timeline"
              iconPosition="start"
              sx={{ minHeight: 48 }}
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
                      bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.3) : "primary.main",
                      opacity: theme.palette.mode === 'dark' ? 1 : 0.15,
                      borderLeft: `3px solid ${theme.palette.mode === 'dark' ? theme.palette.common.white : "#000000"}`,
                      borderRight: `3px solid ${theme.palette.mode === 'dark' ? theme.palette.common.white : "#000000"}`,
                      borderRadius: 0,
                      boxSizing: "border-box",
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Working Hours
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      bgcolor: theme.palette.mode === 'dark' ? "#ff8c00" : "#ff9800",
                      opacity: 0.25,
                      borderRadius: 0,
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Lunch Break
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          )}
        </Box>
      </Paper>
          </Box>
        </Fade>
      )}
    </Popper>
  );
}
