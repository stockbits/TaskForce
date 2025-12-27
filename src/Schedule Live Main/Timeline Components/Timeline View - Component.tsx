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
  useTheme,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import TimelineZoomControl from "./Timeline Zoom Controls - Component";
import TaskBlock from "../../A - Schedule Live Main/UI Components/Task Block - Component";
import { TimeTooltip, SimpleTooltip } from "@/shared-components";

type ResourceRow = {
  resourceId?: string;
  id?: string;
  shiftStart?: string; // e.g. "6:00 AM"
  shiftEnd?: string; // e.g. "2:00 PM"
  lunchStart?: string; // e.g. "12:00 PM"
  lunchEnd?: string; // e.g. "12:30 PM"
  homeLat?: number;
  homeLng?: number;
  ecbt?: number; // Estimated Come Back Time in milliseconds
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

function parseTaskDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // Format: "Fri 28 Nov, 12:10 PM"
  const m = dateStr.match(/(\w+)\s+(\d+)\s+(\w+),\s*(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return null;

  const day = parseInt(m[2], 10);
  const monthName = m[3];
  const hour = parseInt(m[4], 10);
  const minute = parseInt(m[5], 10);
  const ap = m[6].toUpperCase();

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames.indexOf(monthName);
  if (month === -1) return null;

  let h = hour;
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;

  const now = new Date();
  const year = now.getFullYear(); // Assume current year

  return new Date(year, month, day, h, minute);
}

// Calculate distance between two lat/lng points using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

// Calculate travel time based on distance (40 km/h average speed)
function calculateTravelTime(distanceKm: number, minTravelMinutes: number = 5): number {
  const speedKmh = 40; // 40 km/h average speed
  const travelHours = distanceKm / speedKmh;
  const travelMinutes = travelHours * 60;
  return Math.max(travelMinutes, minTravelMinutes); // Minimum travel time
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
  tasks: taskData = [],
  onTaskClick,
  onTaskDoubleClick,
  onResourceClick,
}: {
  isMaximized?: boolean;
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  resources?: ResourceRow[];
  tasks?: any[];
  onTaskClick?: (task: any) => void;
  onTaskDoubleClick?: (task: any) => void;
  onResourceClick?: (resource: ResourceRow) => void;
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
    const cats = resources.map((r) => String(r.resourceId ?? r.id ?? "UNKNOWN"));
    return cats;
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

  // Build task bars
  const taskBarsByRow = useMemo(() => {
    const rows: Array<Array<{ leftPx: number; widthPx: number; task: any; type: 'task' | 'travel' }>> = [];

    // Group assigned tasks by employeeId
    const tasksByResource: Record<string, any[]> = {};
    taskData.filter(task => task.taskStatus === "Assigned (ACT)").forEach(task => {
      const rid = task.employeeId;
      if (rid) {
        if (!tasksByResource[rid]) tasksByResource[rid] = [];
        tasksByResource[rid].push(task);
      }
    });

    // Use the same resources order as the UI (categories) so rows align
    for (let y = 0; y < resources.length; y++) {
      const r = resources[y];
      const rid = String(r.resourceId ?? r.id ?? "UNKNOWN");
      const resourceTasks = tasksByResource[rid] || [];

      // Sort tasks by expected start date
      resourceTasks.sort((a, b) => {
        const aStart = new Date(a.expectedStartDate || a.startDate).getTime();
        const bStart = new Date(b.expectedStartDate || b.startDate).getTime();
        return aStart - bStart;
      });

      const bars: Array<{ leftPx: number; widthPx: number; task: any; type: 'task' | 'travel' }> = [];

      // Get shift times for today
      const today = new Date();
      const shiftStart = parseShiftTime(r.shiftStart);
      const shiftEnd = parseShiftTime(r.shiftEnd);
      if (!shiftStart || !shiftEnd) {
        rows.push(bars);
        continue;
      }
      const shiftStartMs = new Date(today).setHours(shiftStart.h, shiftStart.m, 0, 0);
      const shiftEndMs = new Date(today).setHours(shiftEnd.h, shiftEnd.m, 0, 0);

      // Calculate travel segments using distance-based logic
      const travelSegments: Record<number, { travelStartMs: number; travelEndMs: number; type?: string }> = {};

      // Calculate travel from home to first task
      if (resourceTasks.length > 0 && r.homeLat != null && r.homeLng != null) {
        const firstTask = resourceTasks[0];
        if (firstTask.lat != null && firstTask.lng != null) {
          const distance = calculateDistance(r.homeLat, r.homeLng, firstTask.lat, firstTask.lng);
          const travelMinutes = calculateTravelTime(distance, 10); // Minimum 10 minutes for home travel
          const travelDurationMs = travelMinutes * 60 * 1000;

          const travelStartMs = shiftStartMs;
          const travelEndMs = shiftStartMs + travelDurationMs;

          if (travelEndMs > travelStartMs) {
            travelSegments[0] = { travelStartMs, travelEndMs, type: 'home' };
          }
        }
      }

      // Calculate travel between consecutive tasks
      for (let j = 1; j < resourceTasks.length; j++) {
        const prev = resourceTasks[j - 1];
        const next = resourceTasks[j];

        // Only calculate travel if both tasks are on the same day
        const prevDate = new Date(prev.expectedStartDate || prev.startDate);
        const nextDate = new Date(next.expectedStartDate || next.startDate);

        if (prevDate.toDateString() !== nextDate.toDateString()) continue;

        // Check if both tasks have coordinates
        if (prev.lat != null && prev.lng != null && next.lat != null && next.lng != null) {
          const distance = calculateDistance(prev.lat, prev.lng, next.lat, next.lng);
          const travelMinutes = calculateTravelTime(distance, 5); // Minimum 5 minutes between tasks
          const travelDurationMs = travelMinutes * 60 * 1000;

          const prevEndStr = prev.expectedFinishDate || prev.endDate || prev.expectedStartDate || prev.startDate;
          if (prevEndStr) {
            const prevEndMs = new Date(prevEndStr).getTime();
            const travelStartMs = prevEndMs;
            const travelEndMs = prevEndMs + travelDurationMs;

            if (travelEndMs > travelStartMs) {
              travelSegments[j] = { travelStartMs, travelEndMs, type: 'inter-task' };
            }
          }
        }
      }

      // Position tasks with proper travel scheduling

      for (let i = 0; i < resourceTasks.length; i++) {
        const task = resourceTasks[i];
        const startStr = task.expectedStartDate || task.startDate;
        if (!startStr) continue;

        const expectedDate = parseTaskDate(startStr) || new Date();

        // Position tasks at their expected times, but force start after travel if applicable
        let startMs = expectedDate.getTime();

        // Check if there's travel before this task that should force the start time
        const travelBefore = travelSegments[i];
        if (travelBefore) {
          // Force task to start directly after travel ends
          const forcedStartMs = travelBefore.travelEndMs;
          const originalExpectedMs = startMs;

          // Only force if travel end is later than expected start (to avoid moving tasks backwards)
          if (forcedStartMs > startMs) {
            startMs = forcedStartMs;
            task.debug = { ...(task.debug || {}), forcedStartMs, originalExpectedMs };
          }
        }

        // Render any precomputed travel segment for this task (from previous)
        // Note: Travel calculations are kept for task scheduling logic but not rendered visually
        const seg = travelSegments[i];
        if (seg) {
          const clippedStart = clamp(seg.travelStartMs, shiftStartMs, shiftEndMs);
          const clippedEnd = clamp(seg.travelEndMs, shiftStartMs, shiftEndMs);

          if (clippedEnd > clippedStart) {
            // Travel blocks are rendered visually to show travel time
            const leftPx = ((clippedStart - dateRange.start) / MS_HOUR) * PX_PER_HOUR;
            const widthPx = ((clippedEnd - clippedStart) / MS_HOUR) * PX_PER_HOUR;
            const travelTaskId = seg.type === 'home' ? 'Travel from Home' : 'Travel';
            bars.push({ leftPx, widthPx, task: { taskId: travelTaskId, debug: { travelStartMs: seg.travelStartMs, travelEndMs: seg.travelEndMs } }, type: 'travel' });
          }
        }

        task.expectedDate = expectedDate; // store for line drawing

        const durationMs = (task.estimatedDuration || 60) * 60 * 1000; // minutes to ms
        const endMs = startMs + durationMs;

        // Clip to shift
        const clippedStart = clamp(startMs, shiftStartMs, shiftEndMs);
        const clippedEnd = clamp(endMs, shiftStartMs, shiftEndMs);

        if (clippedEnd > clippedStart) {
          const leftPx = ((clippedStart - dateRange.start) / MS_HOUR) * PX_PER_HOUR;
          const widthPx = ((clippedEnd - clippedStart) / MS_HOUR) * PX_PER_HOUR;
          // Small visual gap between adjacent task bars to avoid touching/overlap
          const GAP_PX = 2; // total gap in pixels between bars
          const adjLeftPx = leftPx + GAP_PX / 2;
          const adjWidthPx = Math.max(1, widthPx - GAP_PX);
          bars.push({ leftPx: adjLeftPx, widthPx: adjWidthPx, task, type: 'task' });
          // update prevRendered end marker for the next iteration
          // prevRenderedEndMs = clippedEnd;
        }
      }

      rows.push(bars);
    }

    return rows;
  }, [resources, taskData, dateRange, PX_PER_HOUR]);

  // Compute ECBT (Estimated Comeback Time) for each resource.
  // ECBT = latest scheduled end time for that resource (exclude travel-home).
  const { ecbtByRow } = useMemo(() => {
    const today = new Date();
    const ecbts: number[] = [];
    const enhancedResources = resources.map(r => ({ ...r })); // Clone resources

    // Group tasks by resourceId
    const tasksByResource: Record<string, any[]> = {};
    taskData.forEach(task => {
      const rid = task.employeeId || task.resourceId;
      if (rid) {
        if (!tasksByResource[rid]) tasksByResource[rid] = [];
        tasksByResource[rid].push(task);
      }
    });

    for (let y = 0; y < resources.length; y++) {
      const r = resources[y];
      const rid = String(r.resourceId ?? r.id ?? "UNKNOWN");
      const resourceTasks = tasksByResource[rid] || [];

      // Filter to current date and assigned
      const relevantTasks = resourceTasks.filter(task => {
        if (task.taskStatus !== "Assigned (ACT)") return false;
        const start = new Date(task.expectedStartDate || task.startDate);
        return start.toDateString() === today.toDateString();
      });

      let ecbtMs = 0;
      if (relevantTasks.length === 0) {
        // No work scheduled, set ECBT to shift start
        const shiftStart = parseShiftTime(r.shiftStart);
        if (shiftStart) {
          ecbtMs = new Date(today).setHours(shiftStart.h, shiftStart.m, 0, 0);
        }
      } else {
        // Find the latest end time
        relevantTasks.forEach(task => {
          const endStr = task.expectedFinishDate || task.startDate;
          if (endStr) {
            const endMs = new Date(endStr).getTime();
            if (endMs > ecbtMs) {
              ecbtMs = endMs;
            }
          }
        });
      }

      ecbts.push(ecbtMs);
      // Add ECBT to the enhanced resource
      enhancedResources[y].ecbt = ecbtMs;
    }

    return { ecbtByRow: ecbts };
  }, [resources, taskData]);

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
          onWheel={(e: React.WheelEvent<HTMLDivElement>) => {
            // Prevent the left column from scrolling independently.
            // Instead, forward vertical wheel delta to the main timeline body so
            // vertical scrolling is always controlled by the right Gantt.
            const body = bodyScrollRef.current;
            if (!body) return;
            e.preventDefault();
            e.stopPropagation();
            // Use scrollBy for smooth native-like behavior
            body.scrollBy({ top: e.deltaY, left: 0, behavior: 'auto' });
          }}
          sx={{
            width: LABEL_COL_WIDTH,
            flexShrink: 0,
            borderRight: `1px solid ${theme.palette.divider}`,
            bgcolor: "transparent",
            overflow: "auto",
            overscrollBehavior: 'contain',
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {resources.map((r, rowIndex) => {
            const rid = String(r.resourceId ?? r.id ?? "UNKNOWN");
            return (
              <Box
                key={`${rid}-${rowIndex}`}
                onClick={() => onResourceClick?.(r)}
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
                  cursor: 'pointer',
                }}
              >
                <PersonIcon
                  sx={{ fontSize: 16, mr: 0.5, color: "action.active" }}
                />
                <Typography noWrap sx={{ fontWeight: 700, fontSize: 13 }}>
                  {rid}
                </Typography>
              </Box>
            );
          })}
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
                key={`${rid}-${rowIndex}`}
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
                  <SimpleTooltip
                    key={`${rid}-lunch-${i}`}
                    title={formatLunchTooltip(resources[rowIndex]?.lunchStart, resources[rowIndex]?.lunchEnd)}
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
                  </SimpleTooltip>
                ))}

                {/* task bars */}
                {taskBarsByRow[rowIndex]?.map((b, i) => (
                  <TaskBlock
                    key={`${rid}-task-${i}`}
                    leftPx={b.leftPx}
                    widthPx={b.widthPx}
                    task={b.task}
                    type={b.type}
                    rowHeight={ROW_HEIGHT}
                    onClick={onTaskClick}
                    onDoubleClick={onTaskDoubleClick}
                  />
                ))}

                {/* connecting lines between consecutive tasks */}
                {(() => {
                  const taskBars = taskBarsByRow[rowIndex]?.filter(b => b.type === 'task') || [];
                  return taskBars.slice(1).map((currentBar, i) => {
                    const prevBar = taskBars[i];
                    const prevEndPx = prevBar.leftPx + prevBar.widthPx;
                    const currentStartPx = currentBar.leftPx;
                    const lineStartPx = prevEndPx;
                    const lineEndPx = currentStartPx;
                    const lineLengthPx = lineEndPx - lineStartPx;

                    if (lineLengthPx > 0) {
                      return (
                        <Box
                          key={`${rid}-line-${i}`}
                          sx={{
                            position: 'absolute',
                            left: lineStartPx,
                            top: ROW_HEIGHT / 2 - 1, // center vertically in the row
                            width: lineLengthPx,
                            height: 2,
                            bgcolor: theme.palette.primary.main,
                            opacity: 0.6,
                          }}
                        />
                      );
                    }
                    return null;
                  });
                })()}

                {/* connecting lines for travel segments */}
                {(() => {
                  const travelBars = taskBarsByRow[rowIndex]?.filter(b => b.type === 'travel' && b.widthPx > 0) || [];
                  return travelBars.map((travelBar, i) => {
                    // For home travel: connect from shift start to travel start (only if within timeline bounds)
                    if (travelBar.task?.taskId === 'Travel from Home') {
                      const shiftStartPx = Math.max(0, ((new Date(resources[rowIndex]?.shiftStart || '08:00').getTime() - dateRange.start) / MS_HOUR) * PX_PER_HOUR);
                      const travelStartPx = travelBar.leftPx;
                      const lineLengthPx = travelStartPx - shiftStartPx;

                      // Only draw if the line is within timeline bounds and has positive length
                      if (lineLengthPx > 0 && travelStartPx >= 0 && travelStartPx <= contentWidth) {
                        return (
                          <Box
                            key={`${rid}-travel-line-home-${i}`}
                            sx={{
                              position: 'absolute',
                              left: Math.max(0, shiftStartPx), // Don't go before timeline start
                              top: ROW_HEIGHT / 2 - 1, // center vertically in the row
                              width: Math.min(lineLengthPx, contentWidth - Math.max(0, shiftStartPx)), // Don't extend past timeline end
                              height: 2,
                              bgcolor: '#3BE089', // Travel color
                              opacity: 0.6,
                            }}
                          />
                        );
                      }
                    }
                    // For inter-task travel: connect from previous task end to travel start
                    else {
                      const allBars = taskBarsByRow[rowIndex] || [];
                      const travelIndex = allBars.findIndex(b => b === travelBar);
                      if (travelIndex > 0) {
                        const prevBar = allBars[travelIndex - 1];
                        if (prevBar && prevBar.type === 'task') {
                          const prevEndPx = prevBar.leftPx + prevBar.widthPx;
                          const travelStartPx = travelBar.leftPx;
                          const lineLengthPx = travelStartPx - prevEndPx;

                          // Only draw if within timeline bounds and has positive length
                          if (lineLengthPx > 0 && travelStartPx >= 0 && travelStartPx <= contentWidth) {
                            return (
                              <Box
                                key={`${rid}-travel-line-${i}`}
                                sx={{
                                  position: 'absolute',
                                  left: prevEndPx,
                                  top: ROW_HEIGHT / 2 - 1, // center vertically in the row
                                  width: Math.min(lineLengthPx, contentWidth - prevEndPx), // Don't extend past timeline end
                                  height: 2,
                                  bgcolor: '#3BE089', // Travel color
                                  opacity: 0.6,
                                }}
                              />
                            );
                          }
                        }
                      }
                    }
                    return null;
                  });
                })()}

                {/* debug: show travel/first-task timestamps if available */}
                {(() => {
                  // Debug information hidden - uncomment for debugging travel calculations
                  /*
                  const travelBar = taskBarsByRow[rowIndex]?.find(x => x.type === 'travel' && x.task?.taskId === 'Travel from Home');
                  const firstTaskBar = taskBarsByRow[rowIndex]?.find(x => x.type === 'task');
                    if (travelBar && travelBar.task?.debug) {
                      const tStart = travelBar.task.debug.travelStartMs;
                      const tEnd = travelBar.task.debug.travelEndMs;
                      const travelMinutes = Math.round((tEnd - tStart) / 60000);
                      const fStart = firstTaskBar ? ((firstTaskBar.leftPx / PX_PER_HOUR) * MS_HOUR + dateRange.start) : null;
                      return (
                        <Box sx={{ position: 'absolute', left: travelBar.leftPx, top: 2, zIndex: 40 }}>
                          <Typography variant="caption" sx={{ color: 'error.main', fontSize: 10 }}>
                            {`T: ${travelMinutes}m (${new Date(tStart).toLocaleTimeString()}→${new Date(tEnd).toLocaleTimeString()})`}
                          </Typography>
                          {fStart && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 10 }}>
                              {`F:${new Date(fStart).toLocaleTimeString()}`}
                            </Typography>
                          )}
                        </Box>
                      );
                    }
                  */
                  return null;
                })()}

                {/* ECBT line */}
                {ecbtByRow[rowIndex] > 0 && (() => {
                  const ecbtMs = ecbtByRow[rowIndex];
                  if (ecbtMs >= dateRange.start && ecbtMs <= dateRange.end) {
                    const leftPx = ((ecbtMs - dateRange.start) / MS_HOUR) * PX_PER_HOUR;
                    const size = 12; // diamond size
                    const diamondTop = (ROW_HEIGHT - size) / 2;
                    const diamondLeft = leftPx - size / 2;

                    return (
                      <TimeTooltip key={`${rid}-ecbt`} title={`ECBT ${new Date(ecbtMs).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}>
                        <Box
                          sx={{
                            position: "absolute",
                            top: diamondTop,
                            left: diamondLeft,
                            width: size,
                            height: size,
                            bgcolor: theme.palette.error.main,
                            transform: 'rotate(45deg)',
                            border: `2px solid ${theme.palette.background.paper}`,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                            boxSizing: 'border-box',
                            zIndex: 30,
                          }}
                        />
                      </TimeTooltip>
                    );
                  }
                  return null;
                })()}
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
