import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import Highcharts from "highcharts";
import "highcharts/modules/gantt";
import HighchartsReact from "highcharts-react-official";
import mockTasks from "../data/mockTasks.json";
import ResourceMock from "../data/ResourceMock.json";

/* ============================================================================
   CONSTANTS / STYLE
============================================================================ */
const LABEL_COL_WIDTH = 220;
const ROW_HEIGHT = 60;
const CHART_HEIGHT_PAD_PX = 14;

// Working hours: subtle band (not a “task”)
const WORKING_HOURS_COLOR = "rgba(65, 105, 225, 0.10)";
const WORKING_HOURS_BORDER = "rgba(65, 105, 225, 0.28)";
const WORKING_HOURS_INSET_PX = 10;
const WORKING_HOURS_RADIUS = 4;

// Tasks + travel sizing
const TASK_HEIGHT_RATIO = 0.5;
const TRAVEL_HEIGHT_RATIO = 0.2;
const TASK_RADIUS = 10;
const TRAVEL_COLOR = "rgba(120,120,120,0.85)";

const DEFAULT_SHIFT_START = "08:00 AM";
const DEFAULT_SHIFT_END = "05:00 PM";

// Tech colors stay consistent
const TECH_COLORS: Record<string, string> = {
  T6344: "#667eea",
  T5678: "#f093fb",
  T9012: "#4facfe",
  T3456: "#43e97b",
  T7890: "#38f9d7",
  T1234: "#ff6b6b",
  T5679: "#ffd93d",
  T0123: "#6bcf7f",
  T4567: "#a8e6cf",
  T8901: "#ffd1dc",
};
const DEFAULT_TECH_COLOR = "#667eea";

/* ============================================================================
   HELPERS
============================================================================ */
type ViewMode = "1day" | "2days" | "5days" | "7days" | "12days" | "14days";

const getDaysCount = (mode: ViewMode) => {
  switch (mode) {
    case "1day":
      return 1;
    case "2days":
      return 2;
    case "5days":
      return 5;
    case "7days":
      return 7;
    case "12days":
      return 12;
    case "14days":
      return 14;
  }
};

const getDateRange = (mode: ViewMode) => {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const days = getDaysCount(mode);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + (days - 1));
  endDate.setHours(23, 59, 59, 999);

  return {
    start: startDate.getTime(),
    end: endDate.getTime(),
    startDate,
    endDate,
    days,
  };
};

// ✅ Dynamic header step based on *visible* zoom range
const chooseStepHoursForRange = (rangeMs: number) => {
  const hours = rangeMs / (60 * 60 * 1000);

  if (hours <= 12) return 1; // very zoomed in
  if (hours <= 24) return 2; // 1 day
  if (hours <= 48) return 4; // 2 days
  if (hours <= 120) return 6; // up to 5 days
  if (hours <= 240) return 12; // up to 10 days
  return 24; // very zoomed out (daily ticks)
};

// Width scaling based on the total bounds span (not the visible extremes)
const pxPerHourForBounds = (boundsSpanDays: number) => {
  // Tune these if you want more/less total scroll width
  if (boundsSpanDays <= 1) return 80;
  if (boundsSpanDays <= 2) return 56;
  if (boundsSpanDays <= 5) return 26;
  if (boundsSpanDays <= 7) return 18;
  if (boundsSpanDays <= 12) return 12;
  return 10;
};

const getInitials = (name: string) => {
  if (!name || typeof name !== "string") return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

// Parse "Sat 7 Jan, 8:15 AM" -> timestamp (dynamic year)
const parseDate = (dateStr: string, year?: number) => {
  if (!dateStr) return null;
  const y = year ?? new Date().getFullYear();
  const fullStr = `${dateStr}, ${y}`;
  const d = new Date(fullStr);
  return isNaN(d.getTime()) ? null : d.getTime();
};

// Parse "6:00 AM" -> {h,min} 24-hour
const parseShiftTime = (timeStr: string) => {
  const m = String(timeStr).match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return null;

  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const period = m[3].toUpperCase();

  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;

  return { h, min };
};

const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateTravelTime = (distanceKm: number) => {
  const speedKmh = 30;
  const timeHours = distanceKm / speedKmh;
  return Math.max(15, Math.round(timeHours * 60));
};

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

/* ============================================================================
   COMPONENT
============================================================================ */
export default function TimelinePanel() {
  // Persist view mode across maximize/remount
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("timelineViewMode") as ViewMode | null;
    return saved || "7days";
  });

  const [displayMode, setDisplayMode] = useState<"name" | "id" | "both">(() => {
    const saved = localStorage.getItem("timelineDisplayMode");
    return (saved as "name" | "id" | "both") || "both";
  });

  useEffect(() => {
    localStorage.setItem("timelineViewMode", viewMode);
  }, [viewMode]);

  const chartRef = useRef<HighchartsReact.RefObject>(null);

  // X scroll sync
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const chartScrollRef = useRef<HTMLDivElement>(null);
  const syncingScroll = useRef(false);

  const syncScroll =
    (source: "header" | "chart") => (e: React.UIEvent<HTMLDivElement>) => {
      if (syncingScroll.current) return;
      syncingScroll.current = true;

      const left = e.currentTarget.scrollLeft;
      if (source === "header" && chartScrollRef.current)
        chartScrollRef.current.scrollLeft = left;
      if (source === "chart" && headerScrollRef.current)
        headerScrollRef.current.scrollLeft = left;

      requestAnimationFrame(() => {
        syncingScroll.current = false;
      });
    };

  // Menus
  const [dayMenuAnchor, setDayMenuAnchor] = useState<null | HTMLElement>(null);
  const [displayMenuAnchor, setDisplayMenuAnchor] =
    useState<null | HTMLElement>(null);

  const handleDayMenuOpen = (event: React.MouseEvent<HTMLElement>) =>
    setDayMenuAnchor(event.currentTarget);
  const handleDayMenuClose = () => setDayMenuAnchor(null);

  const handleDisplayMenuOpen = (event: React.MouseEvent<HTMLElement>) =>
    setDisplayMenuAnchor(event.currentTarget);
  const handleDisplayMenuClose = () => setDisplayMenuAnchor(null);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    handleDayMenuClose();
  };

  const handleDisplayModeChange = (mode: "name" | "id" | "both") => {
    setDisplayMode(mode);
    localStorage.setItem("timelineDisplayMode", mode);
    handleDisplayMenuClose();
  };

  // Data / ranges
  const allResources = useMemo(() => (ResourceMock as any[]) ?? [], []);
  const dateRange = useMemo(() => getDateRange(viewMode), [viewMode]);
  const viewYear = useMemo(
    () => dateRange.startDate.getFullYear(),
    [dateRange.startDate]
  );

  // ✅ Bounds: selected window is exactly the chosen view range.
  // ✅ BUT for 1day, allow zoom-out to show neighboring days (so you *can* zoom out further).
  const boundsMin = useMemo(() => {
    if (viewMode === "1day") {
      const d = new Date(dateRange.startDate);
      d.setDate(d.getDate() - 1);
      d.setHours(0, 0, 0, 0);
      return d.getTime(); // previous day 00:00
    }
    return dateRange.start; // selected start 00:00
  }, [viewMode, dateRange.start, dateRange.startDate]);

  const boundsMax = useMemo(() => {
    if (viewMode === "1day") {
      const d = new Date(dateRange.startDate);
      d.setDate(d.getDate() + 1);
      d.setHours(23, 59, 59, 999);
      return d.getTime(); // next day 23:59
    }
    return dateRange.end; // selected end 23:59
  }, [viewMode, dateRange.end, dateRange.startDate]);

  const boundsSpanDays = useMemo(() => {
    const spanMs = boundsMax - boundsMin;
    return Math.max(1, Math.round(spanMs / (24 * 60 * 60 * 1000)));
  }, [boundsMin, boundsMax]);

  const PX_PER_HOUR = useMemo(
    () => pxPerHourForBounds(boundsSpanDays),
    [boundsSpanDays]
  );

  const TASK_POINT_WIDTH = useMemo(
    () => Math.max(8, Math.round(ROW_HEIGHT * TASK_HEIGHT_RATIO)),
    []
  );
  const TRAVEL_POINT_WIDTH = useMemo(
    () => Math.max(4, Math.round(ROW_HEIGHT * TRAVEL_HEIGHT_RATIO)),
    []
  );
  const WORKING_POINT_WIDTH = useMemo(
    () => Math.max(10, ROW_HEIGHT - WORKING_HOURS_INSET_PX * 2),
    []
  );

  // Normalize shift times so every row has a band
  const normalizedResources = useMemo(() => {
    return allResources.map((r: any) => ({
      ...r,
      shiftStart: r.shiftStart || DEFAULT_SHIFT_START,
      shiftEnd: r.shiftEnd || DEFAULT_SHIFT_END,
    }));
  }, [allResources]);

  // Name -> ID mapping
  const resourceNameToIdMap = useMemo(() => {
    const map: Record<string, string> = {};
    normalizedResources.forEach((r: any) => (map[r.name] = r.resourceId));
    return map;
  }, [normalizedResources]);

  // Extremes memory (for resize/reflow)
  const extremesRef = useRef<{ min: number; max: number } | null>(null);

  // ✅ Dynamic header tick step based on CURRENT visible range
  const [headerStepHours, setHeaderStepHours] = useState<number>(() => {
    // initial default (use a “working window” feel on 1day)
    if (viewMode === "1day") return 2;
    return 6;
  });

  const setExtremesSafe = (min: number, max: number) => {
    const chart = chartRef.current?.chart;
    if (!chart) return;
    chart.xAxis[0].setExtremes(min, max, true, false);
    extremesRef.current = { min, max };
    setHeaderStepHours(chooseStepHoursForRange(max - min));
  };

  // ✅ Default starting window:
  // - 1day starts "work window" but can zoom out to bounds (prev day .. next day)
  // - others start full selected window
  const defaultMin = useMemo(() => {
    if (viewMode === "1day") return dateRange.start + 6 * 60 * 60 * 1000; // 06:00 today
    return dateRange.start;
  }, [viewMode, dateRange.start]);

  const defaultMax = useMemo(() => {
    if (viewMode === "1day") return dateRange.start + 20 * 60 * 60 * 1000; // 20:00 today
    return dateRange.end;
  }, [viewMode, dateRange.start, dateRange.end]);

  // On view mode change reset extremes + scroll
  useEffect(() => {
    setExtremesSafe(defaultMin, defaultMax);
    if (headerScrollRef.current) headerScrollRef.current.scrollLeft = 0;
    if (chartScrollRef.current) chartScrollRef.current.scrollLeft = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, defaultMin, defaultMax]);

  // Resize/maximize: keep extremes stable (prevents showing “extra days”)
  useEffect(() => {
    const chart = chartRef.current?.chart;
    const el = chartScrollRef.current;
    if (!chart || !el) return;

    const ro = new ResizeObserver(() => {
      chart.reflow();
      const ex = extremesRef.current;
      if (ex) {
        const min = clamp(ex.min, boundsMin, boundsMax);
        const max = clamp(ex.max, boundsMin, boundsMax);
        chart.xAxis[0].setExtremes(min, max, false, false);
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [boundsMin, boundsMax]);

  // Ctrl+wheel zoom with clamped bounds
  useEffect(() => {
    const chart = chartRef.current?.chart;
    if (!chart) return;

    const container = chart.container;

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();

      const xAxis = chart.xAxis[0];
      const curMin = xAxis.min ?? defaultMin;
      const curMax = xAxis.max ?? defaultMax;

      const range = curMax - curMin;
      const factor = e.deltaY > 0 ? 1.45 : 0.82; // stronger zoom-out
      let newRange = range * factor;

      const maxRange = boundsMax - boundsMin; // ✅ allow zoom-out to bounds
      newRange = Math.min(newRange, maxRange);

      // allow deeper zoom-in
      if (newRange < 10 * 60 * 1000) return;

      const center = (curMin + curMax) / 2;
      const newMin = clamp(
        center - newRange / 2,
        boundsMin,
        boundsMax - newRange
      );
      const newMax = newMin + newRange;

      xAxis.setExtremes(newMin, newMax, true, false);
      extremesRef.current = { min: newMin, max: newMax };
      setHeaderStepHours(chooseStepHoursForRange(newRange));
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [boundsMin, boundsMax, defaultMin, defaultMax]);

  // Header intervals built across FULL bounds, but tick step changes with zoom
  const timelineIntervals = useMemo(() => {
    const intervals: { time: number; label: string; isDayStart: boolean }[] =
      [];
    const stepMs = headerStepHours * 60 * 60 * 1000;
    const first = Math.floor(boundsMin / stepMs) * stepMs;

    for (let t = first; t <= boundsMax; t += stepMs) {
      if (t < boundsMin) continue;

      const d = new Date(t);
      const isDayStart = d.getHours() === 0 && d.getMinutes() === 0;

      const label = isDayStart
        ? d.toLocaleDateString(undefined, {
            weekday: "short",
            day: "2-digit",
            month: "short",
          })
        : d.getHours().toString().padStart(2, "0") + ":00";

      intervals.push({ time: t, label, isDayStart });
    }

    return intervals;
  }, [boundsMin, boundsMax, headerStepHours]);

  // Inner width based on bounds span and PX_PER_HOUR
  const innerWidthPx = useMemo(() => {
    const spanHours = (boundsMax - boundsMin) / (60 * 60 * 1000);
    return `${Math.max(1, Math.round(spanHours * PX_PER_HOUR))}px`;
  }, [boundsMin, boundsMax, PX_PER_HOUR]);

  // Assign tasks (mock distribution)
  const taskAssignments = useMemo(() => {
    const assignments: Record<string, any[]> = {};
    normalizedResources.forEach((r: any) => (assignments[r.resourceId] = []));

    (mockTasks as any[]).forEach((task: any, index: number) => {
      const resourceIndex = index % normalizedResources.length;
      const resourceId = normalizedResources[resourceIndex].resourceId;

      assignments[resourceId].push({
        taskId: task.taskId,
        taskType: task.taskType,
        expectedStartDate: task.expectedStartDate,
        expectedFinishDate: task.expectedFinishDate,
        lat: task.lat,
        lng: task.lng,
        estimatedDuration: task.estimatedDuration,
        importanceScore: task.importanceScore,
      });
    });

    return assignments;
  }, [normalizedResources]);

  // Build series: working hours background + tasks/travel
  const { resources, series } = useMemo(() => {
    const categories = normalizedResources.map((r: any) => r.name);

    // Working hours points ONLY for the SELECTED view window (not the expanded bounds)
    const workingHourPoints: any[] = [];

    normalizedResources.forEach((resource: any, resourceIndex: number) => {
      const startT =
        parseShiftTime(resource.shiftStart) ||
        parseShiftTime(DEFAULT_SHIFT_START);
      const endT =
        parseShiftTime(resource.shiftEnd) || parseShiftTime(DEFAULT_SHIFT_END);
      if (!startT || !endT) return;

      const dayCursor = new Date(dateRange.startDate);
      const endDay = new Date(dateRange.endDate);

      while (dayCursor <= endDay) {
        const s = new Date(dayCursor);
        const e = new Date(dayCursor);

        s.setHours(startT.h, startT.min, 0, 0);
        e.setHours(endT.h, endT.min, 0, 0);
        if (e.getTime() <= s.getTime()) e.setDate(e.getDate() + 1);

        const start = Math.max(s.getTime(), boundsMin);
        const end = Math.min(e.getTime(), boundsMax);

        if (end > start) {
          workingHourPoints.push({
            name: "Working Hours",
            start,
            end,
            y: resourceIndex,
            taskId: "shift",
            taskType: "Shift",
            color: WORKING_HOURS_COLOR,
            borderColor: WORKING_HOURS_BORDER,
            borderWidth: 1,
            pointWidth: Math.min(WORKING_POINT_WIDTH, ROW_HEIGHT - 2),
            pointPadding: 0,
            borderRadius: WORKING_HOURS_RADIUS,
            zIndex: 0,
          });
        }

        dayCursor.setDate(dayCursor.getDate() + 1);
      }
    });

    const workingHoursSeries: any = {
      name: "Working Hours",
      type: "gantt",
      data: workingHourPoints,
      colorByPoint: false,
      color: WORKING_HOURS_COLOR,
      enableMouseTracking: false,
      animation: false,
      zIndex: 0,
    };

    // Tasks (also only in selected view window)
    const taskSeries = normalizedResources.map(
      (resource: any, resourceIndex: number) => {
        const resourceTasks = taskAssignments[resource.resourceId] || [];
        const techColor =
          TECH_COLORS[resource.resourceId] || DEFAULT_TECH_COLOR;

        const taskBars: any[] = resourceTasks
          .map((task: any) => {
            const startTime = parseDate(task.expectedStartDate, viewYear);
            if (!startTime) return null;

            const endTime =
              startTime + (task.estimatedDuration || 0) * 60 * 1000;

            // only show tasks in selected window
            if (startTime < dateRange.start || startTime > dateRange.end)
              return null;

            return {
              name: `${task.taskType} - ${task.taskId}`,
              start: startTime,
              end: endTime,
              y: resourceIndex,
              taskId: task.taskId,
              taskType: task.taskType,
              color: techColor,
              borderRadius: TASK_RADIUS,
              pointWidth: TASK_POINT_WIDTH,
              pointPadding: 0.12,
              zIndex: 6,
            };
          })
          .filter(Boolean) as any[];

        // Travel (optional: home -> first)
        const travelBars: any[] = [];
        const sortedTasks = [...resourceTasks].sort((a, b) => {
          const aTime = parseDate(a.expectedStartDate, viewYear) || 0;
          const bTime = parseDate(b.expectedStartDate, viewYear) || 0;
          return aTime - bTime;
        });

        const homeLat = resource.homeLat;
        const homeLng = resource.homeLng;

        if (homeLat && homeLng && sortedTasks.length > 0) {
          const firstTask = sortedTasks[0];
          if (firstTask?.lat && firstTask?.lng) {
            const firstStart = parseDate(firstTask.expectedStartDate, viewYear);
            if (firstStart) {
              const distance = calculateDistance(
                homeLat,
                homeLng,
                firstTask.lat,
                firstTask.lng
              );
              const travelTime = calculateTravelTime(distance);
              const travelStart = firstStart - travelTime * 60 * 1000;

              if (travelStart >= dateRange.start) {
                travelBars.push({
                  name: "Travel from Home",
                  start: travelStart,
                  end: firstStart,
                  y: resourceIndex,
                  taskId: "travel-home",
                  taskType: "Travel",
                  color: TRAVEL_COLOR,
                  pointWidth: TRAVEL_POINT_WIDTH,
                  borderRadius: 999,
                  pointPadding: 0.08,
                  zIndex: 7,
                });
              }
            }
          }
        }

        return {
          name: resource.name,
          type: "gantt" as const,
          data: [...taskBars, ...travelBars],
          zIndex: 6,
        };
      }
    );

    return {
      resources: categories,
      series: [workingHoursSeries, ...taskSeries],
    };
  }, [
    normalizedResources,
    taskAssignments,
    dateRange,
    boundsMin,
    boundsMax,
    viewYear,
    TASK_POINT_WIDTH,
    TRAVEL_POINT_WIDTH,
    WORKING_POINT_WIDTH,
  ]);

  // Highcharts options
  const options: Highcharts.Options = {
    accessibility: { enabled: false },
    title: { text: "" },

    chart: {
      backgroundColor: "transparent",
      zoomType: "x",
      panning: { enabled: true, type: "x" },

      height: resources.length * ROW_HEIGHT + CHART_HEIGHT_PAD_PX,
      spacing: [0, 0, 0, 0],
      margin: [0, 0, 0, 0],

      style: {
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
    } as any,

    xAxis: {
      type: "datetime",
      min: boundsMin, // ✅ bounds can include extra days for 1day view zoom-out
      max: boundsMax,
      gridLineWidth: 0,
      labels: { enabled: false },
      visible: false,
      events: {
        afterSetExtremes: function (this: any, e: any) {
          if (typeof e.min === "number" && typeof e.max === "number") {
            extremesRef.current = { min: e.min, max: e.max };
            setHeaderStepHours(chooseStepHoursForRange(e.max - e.min));
          }
        },
      } as any,
    },

    yAxis: {
      categories: resources,
      title: { text: "" },
      staticScale: ROW_HEIGHT,
      min: 0,
      max: resources.length - 1,
      tickInterval: 1,
      labels: { enabled: false },

      gridLineWidth: 1,
      gridLineColor: "rgba(0,0,0,0.06)",

      minPadding: 0.02,
      maxPadding: 0.08,

      startOnTick: true,
      endOnTick: true,
    },

    series: series as any,

    plotOptions: {
      gantt: {
        borderWidth: 0,
        dataLabels: { enabled: false },
        pointPadding: 0,
        groupPadding: 0,
      },
      series: {
        states: { hover: { enabled: false }, inactive: { enabled: false } },
      },
    },

    tooltip: {
      useHTML: true,
      formatter: function (this: any) {
        const p = this.point;
        if (!p) return false;
        if (p.taskId === "shift") return false;

        const startDate = new Date(p.start);
        const endDate = new Date(p.end);
        const duration = Math.round(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60)
        );

        return `<div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 320px;">
          <div style="font-weight: 700; font-size: 13px; margin-bottom: 6px; color:#1a1a1a;">${
            p.name
          }</div>
          <div style="font-size: 12px; display: flex; flex-direction: column; gap: 4px;">
            <div><strong>Duration:</strong> ${duration} minutes</div>
            <div><strong>Start:</strong> ${startDate.toLocaleString()}</div>
            <div><strong>End:</strong> ${endDate.toLocaleString()}</div>
          </div>
        </div>`;
      },
      backgroundColor: "rgba(255,255,255,0.96)",
      borderColor: "rgba(0,0,0,0.10)",
      borderRadius: 10,
      shadow: true,
    },

    legend: { enabled: false },
    credits: { enabled: false },
  };

  // Reset button: go to full *selected* window for that view
  const handleResetView = () => {
    if (viewMode === "1day") {
      // show full current day (not the extra bounds)
      setExtremesSafe(dateRange.start, dateRange.end);
    } else {
      setExtremesSafe(dateRange.start, dateRange.end);
    }
  };

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#fafafa",
        borderRadius: 1,
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          display: "flex",
          backgroundColor: "white",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        {/* Controls */}
        <Box
          sx={{
            width: LABEL_COL_WIDTH,
            height: "40px",
            display: "flex",
            alignItems: "center",
            px: 1,
            gap: 1,
            borderRight: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          <IconButton
            size="small"
            onClick={handleResetView}
            title="Reset View"
            sx={{ color: "#666" }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            onClick={handleDayMenuOpen}
            title="Select Day Range"
            sx={{ color: "#666" }}
          >
            <AccessTimeIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            onClick={handleDisplayMenuOpen}
            title="Display Mode"
            sx={{ color: "#666" }}
          >
            <PersonIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Dynamic time header (scroll X) */}
        <Box
          ref={headerScrollRef}
          onScroll={syncScroll("header")}
          sx={{
            flex: 1,
            height: "40px",
            overflow: "auto",
            overflowY: "hidden",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          <Box sx={{ display: "flex", width: innerWidthPx, height: "100%" }}>
            {timelineIntervals.map((interval, i) => (
              <Box
                key={i}
                sx={{
                  // spacing based on hour step and px-per-hour for the bounds
                  width: `${PX_PER_HOUR * headerStepHours}px`,
                  textAlign: "center",
                  fontSize: interval.isDayStart ? "0.78rem" : "0.72rem",
                  fontWeight: interval.isDayStart ? 700 : 500,
                  color: interval.isDayStart ? "#111" : "#666",
                  borderRight: "1px solid rgba(0,0,0,0.06)",
                  background: interval.isDayStart
                    ? "rgba(65,105,225,0.06)"
                    : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  userSelect: "none",
                }}
              >
                {interval.label}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* BODY (shared Y scroll) */}
      <Box
        sx={{
          display: "flex",
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {/* Left labels */}
        <Box sx={{ width: LABEL_COL_WIDTH, flexShrink: 0 }}>
          <Paper
            elevation={0}
            sx={{
              borderRight: "1px solid rgba(0,0,0,0.08)",
              bgcolor: "transparent",
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              {resources.map((resourceName: string) => {
                const resourceId = resourceNameToIdMap[resourceName] || "";
                return (
                  <Box
                    key={resourceName}
                    sx={{
                      height: `${ROW_HEIGHT}px`,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      px: 1,
                      borderBottom: "1px solid rgba(0,0,0,0.04)",
                      boxSizing: "border-box",
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 26,
                        height: 26,
                        bgcolor: "primary.main",
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {getInitials(resourceName)}
                    </Avatar>

                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        width: "100%",
                        minWidth: 0,
                        gap: 1,
                      }}
                    >
                      {(displayMode === "name" || displayMode === "both") && (
                        <Typography
                          noWrap
                          sx={{ fontWeight: 700, fontSize: 13 }}
                        >
                          {resourceName}
                        </Typography>
                      )}

                      {(displayMode === "id" || displayMode === "both") && (
                        <Typography
                          noWrap
                          variant="caption"
                          sx={{
                            color: "primary.main",
                            fontWeight: 800,
                            bgcolor: "rgba(25,118,210,0.08)",
                            px: 1,
                            py: "2px",
                            borderRadius: 1,
                          }}
                        >
                          {resourceId}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Box>

        {/* Right chart */}
        <Box
          ref={chartScrollRef}
          onScroll={syncScroll("chart")}
          sx={{
            flex: 1,
            overflowX: "auto",
            overflowY: "hidden",
            "& .highcharts-background": { fill: "transparent" },
            "& .highcharts-plot-background": { fill: "transparent" },

            // shadow tasks, NOT shift band (series 0)
            "& .highcharts-point": {
              filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.10))",
            },
            "& .highcharts-series-0 .highcharts-point": { filter: "none" },

            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          <Box sx={{ width: innerWidthPx, minWidth: innerWidthPx }}>
            <HighchartsReact
              ref={chartRef}
              highcharts={Highcharts}
              options={options}
              containerProps={{
                style: {
                  height: `${
                    resources.length * ROW_HEIGHT + CHART_HEIGHT_PAD_PX
                  }px`,
                  width: "100%",
                },
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* MENUS */}
      <Menu
        anchorEl={dayMenuAnchor}
        open={Boolean(dayMenuAnchor)}
        onClose={handleDayMenuClose}
      >
        <MenuItem onClick={() => handleViewModeChange("1day")}>1 Day</MenuItem>
        <MenuItem onClick={() => handleViewModeChange("2days")}>
          2 Days
        </MenuItem>
        <MenuItem onClick={() => handleViewModeChange("5days")}>
          5 Days
        </MenuItem>
        <MenuItem onClick={() => handleViewModeChange("7days")}>
          7 Days
        </MenuItem>
        <MenuItem onClick={() => handleViewModeChange("12days")}>
          12 Days
        </MenuItem>
        <MenuItem onClick={() => handleViewModeChange("14days")}>
          14 Days
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={displayMenuAnchor}
        open={Boolean(displayMenuAnchor)}
        onClose={handleDisplayMenuClose}
      >
        <MenuItem onClick={() => handleDisplayModeChange("name")}>
          Name Only
        </MenuItem>
        <MenuItem onClick={() => handleDisplayModeChange("id")}>
          ID Only
        </MenuItem>
        <MenuItem onClick={() => handleDisplayModeChange("both")}>
          Name & ID
        </MenuItem>
      </Menu>
    </Box>
  );
}
