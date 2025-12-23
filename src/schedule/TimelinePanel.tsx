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
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

import ResourceMock from "../data/ResourceMock.json";

type ResourceRow = {
  resourceId?: string;
  id?: string;
  shiftStart?: string; // e.g. "6:00 AM"
  shiftEnd?: string; // e.g. "2:00 PM"
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

  // For many days (>7), show just dates
  if (totalDays > 7) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  // For multiple days (3-7), show date + AM/PM
  if (totalDays > 2) {
    const hour = d.getHours();
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${ampm}`;
  }

  // For 1-2 days, show detailed time intervals
  if (step >= 24) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  // For single day or short ranges, show hour intervals
  const hour = d.getHours();
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour} ${ampm}`;
}

export default function TimelinePanel({
  isMaximized = false,
  startDate: propStartDate,
  endDate: propEndDate,
  onStartDateChange,
  onEndDateChange,
}: {
  isMaximized?: boolean;
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
}) {
  // Use props for date state instead of internal state
  const startDate = propStartDate;
  const endDate = propEndDate;
  const setStartDate = onStartDateChange;
  const setEndDate = onEndDateChange;

  const [dateModalOpen, setDateModalOpen] = useState(false);

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

  // Layout constants (keep simple + predictable)
  const LABEL_COL_WIDTH = 160;
  const ROW_HEIGHT = 40;

  const resources: ResourceRow[] = useMemo(() => {
    return Array.isArray(ResourceMock) ? (ResourceMock as ResourceRow[]) : [];
  }, []);

  const dateRange = useMemo(
    () => getDateRange(startDate, endDate),
    [startDate, endDate]
  );

  const totalHours = Math.ceil((dateRange.end - dateRange.start) / MS_HOUR);
  const totalDays = Math.ceil(totalHours / 24);

  const PX_PER_HOUR =
    isMaximized && containerWidth > 0
      ? Math.max(10, containerWidth / totalHours)
      : totalHours <= 24
      ? 50
      : Math.max(10, 50 * (24 / totalHours));

  // Dynamic step calculation based on total days
  let step = 1;
  if (totalDays > 7) {
    step = 24; // Show daily intervals for long ranges
  } else if (totalDays > 2) {
    step = 12; // Show 12-hour intervals (AM/PM) for medium ranges
  } else if (totalHours > 24) {
    step = 6; // Show 6-hour intervals for multi-day but short ranges
  } else {
    step = 1; // Show hourly intervals for single day
  }

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.clientWidth);
    }
  }, [isMaximized, totalHours]); // update when maximized or hours change

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

  const contentWidth = totalHours * PX_PER_HOUR;

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

  const syncFromBody = () => {
    if (!headerScrollRef.current || !bodyScrollRef.current) return;
    headerScrollRef.current.scrollLeft = bodyScrollRef.current.scrollLeft;
    if (leftScrollRef.current) {
      leftScrollRef.current.scrollTop = bodyScrollRef.current.scrollTop;
    }
  };

  const syncBodyFromHeader = () => {
    if (!headerScrollRef.current || !bodyScrollRef.current) return;
    bodyScrollRef.current.scrollLeft = headerScrollRef.current.scrollLeft;
  };

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#fafafa",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          height: 40,
          bgcolor: "white",
          borderBottom: "1px solid #e0e0e0",
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
          <IconButton onClick={() => setDateModalOpen(true)} size="small">
            <CalendarTodayIcon />
          </IconButton>
        </Box>

        {/* Timeline labels */}
        <Box
          ref={headerScrollRef}
          onScroll={syncBodyFromHeader}
          sx={{
            flex: 1,
            overflowX: isMaximized ? "hidden" : "auto",
            overflowY: "auto",
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
            {timelineIntervals.map((it, i) => (
              <Box
                key={it.time}
                sx={{
                  width: step * PX_PER_HOUR,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  color: "#666",
                  borderRight:
                    i < timelineIntervals.length - 1
                      ? "1px solid #eee"
                      : "none",
                }}
              >
                {it.label}
              </Box>
            ))}
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
            borderRight: "1px solid #e0e0e0",
            bgcolor: "transparent",
            overflow: "auto",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {categories.map((rid) => (
            <Box
              key={rid}
              sx={{
                height: ROW_HEIGHT,
                display: "flex",
                alignItems: "center",
                px: 1,
                borderBottom: "1px solid #f0f0f0",
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
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                {/* optional vertical hour dividers */}
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    pointerEvents: "none",
                  }}
                >
                  {timelineIntervals.map((it, i) => (
                    <Box
                      key={it.time}
                      sx={{
                        width: PX_PER_HOUR,
                        borderRight:
                          i < timelineIntervals.length - 1
                            ? "1px solid #f5f5f5"
                            : "none",
                      }}
                    />
                  ))}
                </Box>

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
                      bgcolor: "primary.main",
                      opacity: 0.15,
                      borderLeft: "2px solid",
                      borderLeftColor: "text.primary",
                      borderRight: "2px solid",
                      borderRightColor: "text.primary",
                      boxSizing: "border-box",
                    }}
                  />
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
                slotProps={{ textField: { fullWidth: true } }}
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
                slotProps={{ textField: { fullWidth: true } }}
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
          <Button onClick={() => setDateModalOpen(false)}>Cancel</Button>
          <Button onClick={() => setDateModalOpen(false)} variant="contained">
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
