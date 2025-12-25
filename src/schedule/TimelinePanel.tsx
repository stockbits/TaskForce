import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Stack,
  Tooltip,
  useTheme,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

import TimelineZoomControl from "./TimelineZoomControl";

type ResourceRow = {
  resourceId?: string;
  id?: string;
  shiftStart?: string; // e.g. "6:00 AM"
  shiftEnd?: string; // e.g. "2:00 PM"
  lunchStart?: string; // e.g. "12:00 PM"
  lunchEnd?: string; // e.g. "12:30 PM"
};

const MS_HOUR = 60 * 60 * 1000;
const MS_DAY = 24 * MS_HOUR;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getDateRange(start: Date, end: Date) {
  return {
    start: start.getTime(),
    end: end.getTime(),
    startDate: start,
    endDate: end,
  };
}

function parseShiftTime(timeStr: unknown): { h: number; m: number } | null {
  if (!timeStr) return null;
  const m = String(timeStr).match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return null;

  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = String(m[3]).toUpperCase();

  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;

  return { h, m: min };
}

function formatHourLabel(d: Date, step: number, totalHours: number) {
  const totalDays = Math.ceil(totalHours / 24);

  // For many days (>7), show just dates - keep as single day labels
  if (totalDays > 7) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  // For multiple days (3-7), show just the date (full day columns)
  if (totalDays > 2) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  // For 1-2 days, show detailed time intervals
  if (step >= 24) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  // For single day or short ranges, show hour intervals with "till" format
  const hour = d.getHours();

  // For step intervals > 1, show ranges like "12:00 till 13:00"
  if (step > 1) {
    const endHour = hour + step;
    return `${hour.toString().padStart(2, '0')}:00 till ${(endHour % 24).toString().padStart(2, '0')}:00`;
  }

  // For single hour intervals, just show the hour in 24-hour format
  return `${hour.toString().padStart(2, '0')}:00`;
}

function formatLunchTooltip(lunchStart?: string, lunchEnd?: string): string {
  if (!lunchStart || !lunchEnd) return "Lunch Break";
  return `Expected Lunch Time: ${lunchStart} - ${lunchEnd}`;
}

export default function TimelinePanel({
  isMaximized = false,
  startDate: propStartDate,
  endDate: propEndDate,
  onStartDateChange,
  onEndDateChange,
  resources: resourceData = [],
}: {
  isMaximized?: boolean;
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  resources?: ResourceRow[];
}) {
  // Use props for date state instead of internal state
  const startDate = propStartDate;
  const endDate = propEndDate;
  const setStartDate = onStartDateChange;
  const setEndDate = onEndDateChange;

  const theme = useTheme();

  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1); // Default zoom level (1x)

  // Quick date range selection
  const handleQuickSelect = (days: number) => {
    const today = new Date();
    const start = new Date(today);
    start.setHours(5, 0, 0, 0); // start at 5:00 AM

    const end = new Date(today);
    end.setDate(end.getDate() + (days - 1)); // Add days - 1 to get the correct end date
    end.setHours(23, 59, 59, 999); // end at 11:59:59 PM

    onStartDateChange(start);
    onEndDateChange(end);
  };

  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [containerWidth, setContainerWidth] = useState(0);

  // ResizeObserver to track container size changes
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  // Layout constants (keep simple + predictable)
  const LABEL_COL_WIDTH = 160;
  const ROW_HEIGHT = 40;

  const resources: ResourceRow[] = useMemo(() => {
    return Array.isArray(resourceData) ? resourceData : [];
  }, [resourceData]);

  const dateRange = useMemo(
    () => getDateRange(startDate, endDate),
    [startDate, endDate]
  );

  const totalHours = Math.ceil((dateRange.end - dateRange.start) / MS_HOUR);
  const totalDays = Math.ceil(totalHours / 24);

  const PX_PER_HOUR = totalHours <= 24
    ? 50 * zoomLevel
    : Math.max(10, 50 * (24 / totalHours) * zoomLevel);

  // Dynamic step calculation based on total days
  let step = 1;
  if (totalDays > 7) {
    step = 24; // Show daily intervals for long ranges
  } else if (totalDays > 2) {
    step = 24; // Show full day intervals for medium ranges (3-7 days)
  } else if (totalHours > 24) {
    step = 6; // Show 6-hour intervals for multi-day but short ranges
  } else {
    step = 1; // Show hourly intervals for single day
  }

  // Mouse and wheel event handling for cursor-based zoom
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      // Only handle zoom if Ctrl is pressed
      if (!event.ctrlKey) return;

      event.preventDefault();

      const rect = bodyScrollRef.current?.getBoundingClientRect();
      if (!rect || !bodyScrollRef.current) return;

      // Calculate cursor position relative to timeline content
      const cursorX = event.clientX - rect.left + bodyScrollRef.current.scrollLeft;
      
      // Calculate the time point under cursor before zoom
      const timeUnderCursor = dateRange.start + (cursorX / PX_PER_HOUR) * MS_HOUR;
      
      // Determine zoom direction and calculate new zoom level
      let newZoomLevel = zoomLevel;
      if (event.deltaY < 0) {
        // Zoom in
        newZoomLevel = Math.min(4, zoomLevel * 1.2);
      } else {
        // Zoom out (but not below 1x to prevent wasted space)
        newZoomLevel = Math.max(1, zoomLevel / 1.2);
      }

      // Only update if zoom actually changed
      if (newZoomLevel !== zoomLevel) {
        setZoomLevel(newZoomLevel);
        
        // After zoom change, adjust scroll to keep cursor point centered
        // Use setTimeout to ensure DOM updates after zoom level change
        setTimeout(() => {
          if (!bodyScrollRef.current) return;
          
          const newPxPerHour = totalHours <= 24
            ? 50 * newZoomLevel
            : Math.max(10, 50 * (24 / totalHours) * newZoomLevel);
            
          // Calculate new scroll position to keep timeUnderCursor at cursorX
          const newScrollLeft = ((timeUnderCursor - dateRange.start) / MS_HOUR) * newPxPerHour - cursorX;
          bodyScrollRef.current.scrollTo({ left: Math.max(0, newScrollLeft), behavior: 'auto' });
        }, 0);
      }
    };

    // Add event listeners
    const timelineElement = bodyScrollRef.current;
    if (timelineElement) {
      timelineElement.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (timelineElement) {
        timelineElement.removeEventListener('wheel', handleWheel);
      }
    };
  }, [zoomLevel, dateRange, PX_PER_HOUR, totalHours, containerWidth]);

  const categories = useMemo(() => {
    return resources.map((r) => String(r.resourceId ?? r.id ?? "UNKNOWN"));
  }, [resources]);

  const timelineIntervals = useMemo(() => {
    const out: { time: number; label: string }[] = [];
    for (let i = 0; i <= totalHours; i += step) {
      const d = new Date(dateRange.start + i * MS_HOUR);
      out.push({ time: d.getTime(), label: formatHourLabel(d, step, totalHours) });
    }
    return out;
  }, [dateRange, totalHours, step]);

  const contentWidth = Math.max(containerWidth || 0, totalHours * PX_PER_HOUR);

  // Build shift bars only
  const shiftBarsByRow = useMemo(() => {
    const rows: Array<Array<{ leftPx: number; widthPx: number }>> = [];

    for (let y = 0; y < resources.length; y++) {
      const r = resources[y];
      const startT = parseShiftTime(r.shiftStart);
      const endT = parseShiftTime(r.shiftEnd);

      const bars: Array<{ leftPx: number; widthPx: number }> = [];
      if (!startT || !endT) {
        rows.push(bars);
        continue;
      }

      const cursor = new Date(dateRange.startDate);
      const last = new Date(dateRange.endDate);

      while (cursor <= last) {
        const start = new Date(cursor);
        const end = new Date(cursor);

        start.setHours(startT.h, startT.m, 0, 0);
        end.setHours(endT.h, endT.m, 0, 0);

        let startMs = start.getTime();
        let endMs = end.getTime();

        // Overnight shift support (e.g. 10PM -> 6AM)
        if (endMs <= startMs) endMs += MS_DAY;

        // Clip to visible range
        const clippedStart = clamp(startMs, dateRange.start, dateRange.end);
        const clippedEnd = clamp(endMs, dateRange.start, dateRange.end);

        if (clippedEnd > clippedStart) {
          const leftPx =
            ((clippedStart - dateRange.start) / MS_HOUR) * PX_PER_HOUR;
          const widthPx = ((clippedEnd - clippedStart) / MS_HOUR) * PX_PER_HOUR;
          bars.push({ leftPx, widthPx });
        }

        cursor.setDate(cursor.getDate() + 1);
      }

      rows.push(bars);
    }

    return rows;
  }, [resources, dateRange, PX_PER_HOUR]);

  // Build lunch break bars
  const lunchBarsByRow = useMemo(() => {
    const rows: Array<Array<{ leftPx: number; widthPx: number }>> = [];

    for (let y = 0; y < resources.length; y++) {
      const r = resources[y];
      const lunchStartT = parseShiftTime(r.lunchStart);
      const lunchEndT = parseShiftTime(r.lunchEnd);

      const bars: Array<{ leftPx: number; widthPx: number }> = [];
      if (!lunchStartT || !lunchEndT) {
        rows.push(bars);
        continue;
      }

      const cursor = new Date(dateRange.startDate);
      const last = new Date(dateRange.endDate);

      while (cursor <= last) {
        const start = new Date(cursor);
        const end = new Date(cursor);

        start.setHours(lunchStartT.h, lunchStartT.m, 0, 0);
        end.setHours(lunchEndT.h, lunchEndT.m, 0, 0);

        let startMs = start.getTime();
        let endMs = end.getTime();

        // Overnight lunch support (unlikely but possible)
        if (endMs <= startMs) endMs += MS_DAY;

        // Clip to visible range
        const clippedStart = clamp(startMs, dateRange.start, dateRange.end);
        const clippedEnd = clamp(endMs, dateRange.start, dateRange.end);

        if (clippedEnd > clippedStart) {
          const leftPx =
            ((clippedStart - dateRange.start) / MS_HOUR) * PX_PER_HOUR;
          const widthPx = ((clippedEnd - clippedStart) / MS_HOUR) * PX_PER_HOUR;
          bars.push({ leftPx, widthPx });
        }

        cursor.setDate(cursor.getDate() + 1);
      }

      rows.push(bars);
    }

    return rows;
  }, [resources, dateRange, PX_PER_HOUR]);

  const syncFromBody = () => {
    if (!headerScrollRef.current || !bodyScrollRef.current) return;
    const header = headerScrollRef.current;
    const body = bodyScrollRef.current;
    const headerScrollMax = header.scrollWidth - header.clientWidth;
    const bodyScrollMax = body.scrollWidth - body.clientWidth;
    if (headerScrollMax > 0 && bodyScrollMax > 0) {
      const fraction = body.scrollLeft / bodyScrollMax;
      header.scrollLeft = fraction * headerScrollMax;
    }
    if (leftScrollRef.current) {
      // Use requestAnimationFrame to ensure synchronization happens after scroll event
      requestAnimationFrame(() => {
        if (leftScrollRef.current) {
          leftScrollRef.current.scrollTop = body.scrollTop;
        }
      });
    }
  };

  const syncBodyFromHeader = () => {
    if (!headerScrollRef.current || !bodyScrollRef.current) return;
    const header = headerScrollRef.current;
    const body = bodyScrollRef.current;
    const headerScrollMax = header.scrollWidth - header.clientWidth;
    const bodyScrollMax = body.scrollWidth - body.clientWidth;
    if (headerScrollMax > 0 && bodyScrollMax > 0) {
      const fraction = header.scrollLeft / headerScrollMax;
      body.scrollLeft = fraction * bodyScrollMax;
    }
  };

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: theme.palette.background.default,
        overflow: isMaximized ? "hidden" : "visible",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          height: 40,
          bgcolor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <Box
          sx={{
            width: LABEL_COL_WIDTH,
            px: 1,
            display: "flex",
            alignItems: "center",
            gap: 1,
            borderRight: "1px solid #e0e0e0",
          }}
        >
          <IconButton onClick={() => setDateModalOpen(true)} size="small" sx={{ p: 0.5 }}>
            <CalendarMonthIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <TimelineZoomControl
            onZoomChange={setZoomLevel}
            currentZoom={zoomLevel}
          />
        </Box>

        {/* Timeline labels */}
        <Box
          ref={headerScrollRef}
          onScroll={syncBodyFromHeader}
          sx={{
            flex: 1,
            overflowX: isMaximized ? "hidden" : "auto",
            overflowY: "hidden",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          <Box
            sx={{
              width: isMaximized ? "100%" : contentWidth,
              height: "100%",
              display: "flex",
            }}
          >
            {timelineIntervals.map((it, i) => {
              const intervalWidth = step * PX_PER_HOUR;
              const minLabelWidth = 60; // Minimum width to prevent text wrapping
              const actualWidth = Math.max(intervalWidth, minLabelWidth);

              return (
                <Box
                  key={it.time}
                  sx={{
                    width: actualWidth,
                    minWidth: minLabelWidth,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    color: "#666",
                    borderRight:
                      i < timelineIntervals.length - 1
                        ? "1px solid #eee"
                        : "none",
                    px: 0.5, // Add padding to prevent text cutoff
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={it.label} // Show full label on hover if truncated
                >
                  {it.label}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Body */}
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left: Resource IDs */}
        <Paper
          ref={leftScrollRef}
          elevation={0}
          sx={{
            width: LABEL_COL_WIDTH,
            flexShrink: 0,
            borderRight: `1px solid ${theme.palette.divider}`,
            bgcolor: "transparent",
            overflow: "auto",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {categories.map((rid, rowIndex) => (
            <Box
              key={rid}
              sx={{
                height: ROW_HEIGHT,
                display: "flex",
                alignItems: "center",
                px: 1,
                borderBottom: "1px solid #cccccc",
                backgroundColor: rowIndex % 2 === 0 ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
                '&:hover': {
                  backgroundColor: rowIndex % 2 === 0 ? 'rgba(0, 0, 0, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                },
              }}
            >
              <PersonIcon
                sx={{ fontSize: 16, mr: 0.5, color: "action.active" }}
              />
              <Typography noWrap sx={{ fontWeight: 700, fontSize: 13 }}>
                {rid}
              </Typography>
            </Box>
          ))}
        </Paper>

        {/* Right: Timeline rows */}
        <Box
          ref={(el: HTMLDivElement | null) => {
            bodyScrollRef.current = el;
            containerRef.current = el;
          }}
          onScroll={syncFromBody}
          sx={{
            flex: 1,
            overflow: "auto",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          <Box
            sx={{
              width: isMaximized ? "100%" : contentWidth,
              minWidth: contentWidth,
            }}
          >
            {categories.map((rid, rowIndex) => (
              <Box
                key={rid}
                sx={{
                  position: "relative",
                  height: ROW_HEIGHT,
                  borderBottom: "1px solid #cccccc",
                  backgroundColor: rowIndex % 2 === 0 ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
                  '&:hover': {
                    backgroundColor: rowIndex % 2 === 0 ? 'rgba(0, 0, 0, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                  },
                }}
              >
                {/* shift bars */}
                {shiftBarsByRow[rowIndex]?.map((b, i) => (
                  <Box
                    key={`${rid}-shift-${i}`}
                    title="Working Time"
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: b.leftPx,
                      width: b.widthPx,
                      height: ROW_HEIGHT,
                      borderRadius: 0,
                      bgcolor: theme.palette.mode === 'dark' ? "rgba(59, 224, 137, 0.3)" : "primary.main",
                      opacity: theme.palette.mode === 'dark' ? 1 : 0.15,
                      borderLeft: `3px solid ${theme.palette.mode === 'dark' ? "#3BE089" : "#000000"}`,
                      borderRight: `3px solid ${theme.palette.mode === 'dark' ? "#3BE089" : "#000000"}`,
                      boxSizing: "border-box",
                    }}
                  />
                ))}

                {/* lunch break bars */}
                {lunchBarsByRow[rowIndex]?.map((b, i) => (
                  <Tooltip
                    key={`${rid}-lunch-${i}`}
                    title={formatLunchTooltip(resources[rowIndex]?.lunchStart, resources[rowIndex]?.lunchEnd)}
                    placement="top"
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: b.leftPx,
                        width: b.widthPx,
                        height: ROW_HEIGHT,
                        borderRadius: 0,
                        bgcolor: theme.palette.mode === 'dark' ? "#ff8c00" : "#ff9800", // Orange color for lunch breaks
                        opacity: 0.25,
                        boxSizing: "border-box",
                        cursor: "pointer",
                      }}
                    />
                  </Tooltip>
                ))}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Date Range Modal */}
      <Dialog
        open={dateModalOpen}
        onClose={() => setDateModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Select Date Range</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
              <DatePicker
                label="Start Date"
                value={startDate}
                defaultValue={new Date()}
                minDate={new Date()}
                onChange={(newValue) => {
                  if (newValue) {
                    const d = new Date(newValue);
                    d.setHours(5, 0, 0, 0); // start at 5:00 AM
                    setStartDate(d);
                  }
                }}
                slotProps={{
                  textField: { fullWidth: true, size: "small" },
                  openPickerButton: { size: "small" }
                }}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                defaultValue={new Date()}
                minDate={new Date()}
                onChange={(newValue) => {
                  if (newValue) {
                    const d = new Date(newValue);
                    d.setHours(23, 59, 59, 999);
                    setEndDate(d);
                  }
                }}
                slotProps={{
                  textField: { fullWidth: true, size: "small" },
                  openPickerButton: { size: "small" }
                }}
              />
            </Box>

            {/* Quick Selection Chips */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                Quick Select:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {[1, 2, 4, 6, 8, 10, 12].map((days) => (
                  <Chip
                    key={days}
                    label={days === 1 ? 'Today' : `${days} days`}
                    size="small"
                    variant="outlined"
                    onClick={() => handleQuickSelect(days)}
                    sx={{ minWidth: 70 }}
                  />
                ))}
              </Stack>
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDateModalOpen(false)} variant="contained">Cancel</Button>
          <Button onClick={() => setDateModalOpen(false)} variant="contained">
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
