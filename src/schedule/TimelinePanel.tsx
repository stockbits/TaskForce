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

function formatHourLabel(d: Date, step: number) {
  if (step >= 24) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return `${String(d.getHours()).padStart(2, "0")}:00`;
}

export default function TimelinePanel({
  isMaximized = false,
}: {
  isMaximized?: boolean;
}) {
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(5, 0, 0, 0); // start at 5:00 AM
    return d;
  });
  const [endDate, setEndDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999); // end at end of current day
    return d;
  });
  const [dateModalOpen, setDateModalOpen] = useState(false);

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
  const PX_PER_HOUR =
    isMaximized && containerWidth > 0
      ? Math.max(10, containerWidth / totalHours)
      : totalHours <= 24
      ? 50
      : Math.max(10, 50 * (24 / totalHours));
  let step = 1;
  if (totalHours > 24) step = 24;

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
      out.push({ time: d.getTime(), label: formatHourLabel(d, step) });
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
            overflow: isMaximized ? "hidden" : "auto",
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
                      top: 14,
                      left: b.leftPx,
                      width: b.widthPx,
                      height: 28,
                      borderRadius: 1,
                      bgcolor: "rgba(220, 0, 0, 0.18)",
                      border: "1px solid rgba(220, 0, 0, 0.45)",
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
