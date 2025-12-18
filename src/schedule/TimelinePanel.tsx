
import React, { useMemo, useState, useEffect, useRef } from "react";
import { Box, Typography, Paper, IconButton, Menu, MenuItem, Avatar } from "@mui/material";
import { Refresh as RefreshIcon, AccessTime as AccessTimeIcon } from "@mui/icons-material";
import Highcharts from 'highcharts';
import 'highcharts/modules/gantt';
import HighchartsReact from 'highcharts-react-official';
import mockTasks from '../data/mockTasks.json';
import resourceTaskMapping from '../data/resourceTaskMapping.json';

// Helper to parse date strings like "Sat 7 Jan, 8:15 AM"
const parseDate = (dateStr: string) => {
  if (!dateStr) return null;
  // Add year for 2025
  const fullStr = dateStr + ', 2025';
  const date = new Date(fullStr);
  return isNaN(date.getTime()) ? null : date.getTime();
};

// Helper to parse shift time strings like "6:00 AM"
const parseShiftTime = (timeStr: string) => {
  if (!timeStr) return null;
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  let hour24 = hours;
  if (period === 'PM' && hours !== 12) hour24 += 12;
  if (period === 'AM' && hours === 12) hour24 = 0;
  return { hours: hour24, minutes: minutes || 0 };
};

// Helper to calculate distance between two points (simple approximation)
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Helper to estimate travel time in minutes (assuming 30 km/h average speed)
const estimateTravelTime = (distanceKm: number) => {
  const speedKmh = 30; // 30 km/h average speed
  const timeHours = distanceKm / speedKmh;
  return Math.max(15, Math.ceil(timeHours * 60)); // Minimum 15 minutes travel time
};

// Helper to get initials from name
const getInitials = (name: string) => {
  if (!name || typeof name !== 'string') return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

// Helper to get priority color for tooltips
const getPriorityColor = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case 'critical': return '#d32f2f';
    case 'high': return '#f57c00';
    case 'medium': return '#fbc02d';
    case 'low': return '#388e3c';
    default: return '#666';
  }
};

// Helper to get date range based on view mode
const getDateRange = (mode: '1day' | '2days' | '5days' | '7days' | '14days') => {
  const today = new Date();
  const startDate = new Date(today);
  const endDate = new Date(today);

  switch (mode) {
    case '1day':
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case '2days':
      // today + tomorrow
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(today.getDate() + 1);
      endDate.setHours(23, 59, 59, 999);
      break;
    case '5days':
      // 2 days before through 2 days after
      startDate.setDate(today.getDate() - 2);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(today.getDate() + 2);
      endDate.setHours(23, 59, 59, 999);
      break;
    case '7days':
      startDate.setDate(today.getDate() - 3);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(today.getDate() + 3);
      endDate.setHours(23, 59, 59, 999);
      break;
    case '14days':
      startDate.setDate(today.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(today.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
  }

  return {
    start: startDate.getTime(),
    end: endDate.getTime(),
    startDate,
    endDate
  };
};

export default function TimelinePanel({ selectedResource }: { selectedResource?: any }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewMode, setViewMode] = useState<'1day' | '2days' | '5days' | '7days' | '14days'>('1day');
  const [anchorElRange, setAnchorElRange] = useState<null | HTMLElement>(null);
  const chartRef = useRef<HighchartsReact.RefObject>(null);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Function to reset chart zoom and position
  const handleResetView = () => {
    if (chartRef.current?.chart) {
      chartRef.current.chart.zoomOut();
    }
  };

  // When viewMode changes, update the chart window to the date range
  useEffect(() => {
    try {
      const chart = chartRef.current && (chartRef.current as any).chart;
      if (chart && chart.xAxis && chart.xAxis[0] && typeof chart.xAxis[0].setExtremes === 'function') {
        const dr = getDateRange(viewMode);
        chart.xAxis[0].setExtremes(dr.start, dr.end, true, false);
      }
    } catch (err) {
      // ignore
    }
  }, [viewMode]);

  // Create a mapping of resource names to IDs
  const resourceNameToIdMap = useMemo(() => {
    const map: {[key: string]: string} = {};
    resourceTaskMapping.forEach((resource: any) => {
      map[resource.resourceName] = resource.resourceId;
    });
    return map;
  }, []);

  // Create a mapping of resource names to shift info
  const resourceShiftMap = useMemo(() => {
    const map: {[key: string]: { shiftStart: string, shiftEnd: string }} = {};
    resourceTaskMapping.forEach((resource: any) => {
      map[resource.resourceName] = {
        shiftStart: resource.shiftStart,
        shiftEnd: resource.shiftEnd
      };
    });
    return map;
  }, []);

  // Process tasks data with proper scheduling based on estimated duration and travel times
  const { resources, series } = useMemo(() => {
    // Get date range based on view mode
    const dateRange = getDateRange(viewMode);
    const startDate = dateRange.startDate;
    const endDate = dateRange.endDate;

    // Filter resources based on selection
    let filteredResources = selectedResource && selectedResource.resourceId
      ? resourceTaskMapping.filter(r => r.resourceId === selectedResource.resourceId)
      : resourceTaskMapping;

    const series = filteredResources.map((resource, resourceIndex) => {
      const shiftStart = parseShiftTime(resource.shiftStart);
      const shiftEnd = parseShiftTime(resource.shiftEnd);
      
      if (!shiftStart || !shiftEnd) return { name: resource.resourceName, type: 'gantt' as const, data: [] };

      // Sort tasks by priority and expected start date
      const sortedTasks = [...resource.assignedTasks].sort((a, b) => {
        // Priority order: Critical > High > Medium > Low
        const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
        if (aPriority !== bPriority) return bPriority - aPriority;
        
        // Then by expected start date
        const aDate = parseDate(a.expectedStartDate) || 0;
        const bDate = parseDate(b.expectedStartDate) || 0;
        return aDate - bDate;
      });

      // Schedule tasks across the date range
      const scheduledTasks: any[] = [];
      let currentDate = new Date(startDate);
      let previousLocation = { lat: resource.homeLat, lng: resource.homeLng };

      // Loop through each day in the range
      while (currentDate <= endDate) {
        const dayStart = new Date(currentDate);
        dayStart.setHours(shiftStart.hours, shiftStart.minutes, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(shiftEnd.hours, shiftEnd.minutes, 0, 0);
        
        let currentTime = new Date(dayStart);

        // Schedule tasks for this day
        for (let i = 0; i < sortedTasks.length; i++) {
          const task = sortedTasks[i];
          
          // Calculate travel time from previous location
          const taskLocation = { lat: task.lat, lng: task.lng };
          const distance = calculateDistance(previousLocation.lat, previousLocation.lng, taskLocation.lat, taskLocation.lng);
          const travelTime = estimateTravelTime(distance);
          
          // Add travel time if not the first task of the day
          if (scheduledTasks.length > 0 && scheduledTasks[scheduledTasks.length - 1].employeeId === resource.resourceId) {
            currentTime = new Date(currentTime.getTime() + travelTime * 60 * 1000);
          }

          // Ensure we don't start before shift start
          if (currentTime < dayStart) {
            currentTime = new Date(dayStart);
          }

          // Check if we can fit this task within the shift
          const taskDurationMs = task.estimatedDuration * 60 * 1000; // Convert minutes to milliseconds
          const taskEndTime = new Date(currentTime.getTime() + taskDurationMs);
          
          // If task would end after shift end, skip it
          if (taskEndTime > dayEnd) {
            continue;
          }

          // Create the task bar
          const taskStart = currentTime.getTime();
          const taskEnd = taskStart + taskDurationMs;

          scheduledTasks.push({
            name: `${task.taskType} - ${task.taskId}`,
            start: taskStart,
            end: taskEnd,
            y: resourceIndex,
            taskId: task.taskId,
            taskType: task.taskType,
            priority: task.priority,
            estimatedDuration: task.estimatedDuration,
            travelTime: travelTime,
            employeeId: resource.resourceId,
            color: (() => {
              // Color coding based on employee/commit user (similar to map panel commit icons)
              const employeeColors: {[key: string]: string} = {
                'T6344': '#667eea', // Blue
                'T5678': '#f093fb', // Pink  
                'T9012': '#4facfe', // Light blue
                'T3456': '#43e97b', // Green
                'T7890': '#38f9d7', // Teal
                'T1234': '#ff6b6b', // Red
                'T5679': '#ffd93d', // Yellow
                'T0123': '#6bcf7f', // Light green
                'T4567': '#a8e6cf', // Mint
                'T8901': '#ffd1dc', // Light pink
              };
              return employeeColors[resource.resourceId] || '#667eea'; // Default blue
            })()
          });

          // Update current time and previous location
          currentTime = new Date(taskEnd);
          previousLocation = taskLocation;
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // If no tasks, add a dummy point to ensure the row shows
      if (scheduledTasks.length === 0) {
        const dummyStart = new Date(startDate);
        dummyStart.setHours(shiftStart.hours, shiftStart.minutes, 0, 0);
        scheduledTasks.push({
          name: 'No tasks scheduled',
          start: dummyStart.getTime(),
          end: dummyStart.getTime(), // 0 duration
          y: resourceIndex,
          taskId: '',
          taskType: '',
          priority: '',
          estimatedDuration: 0,
          travelTime: 0,
          employeeId: '',
          color: '#f0f0f0' // Light gray for dummy tasks
        });
      }

      return {
        name: resource.resourceName,
        type: 'gantt' as const,
        data: scheduledTasks
      };
    });

    return { 
      resources: filteredResources.map(r => r.resourceName), 
      series: series
    };
  }, [selectedResource, viewMode]);

  // Calculate date range for current view mode
  const dateRange = getDateRange(viewMode);

  const options = {
    accessibility: {
      enabled: false // Disable accessibility warnings
    },
    title: {
      text: null // Remove the main title
    },
    chart: {
      height: null, // Let it fill container height
      width: null, // Let it fill container width
      zoomType: 'x', // Enable horizontal zoom
      panning: {
        enabled: true,
        type: 'x' // Only allow horizontal panning
      },
      // Remove panKey to allow direct click and drag panning
      panKey: null, // Allow panning without modifier key
      resetZoomButton: {
        theme: {
          fill: '#1976d2',
          stroke: '#fff',
          r: 4,
          states: {
            hover: {
              fill: '#1565c0'
            }
          }
        },
        position: {
          align: 'right',
          verticalAlign: 'top',
          x: -10,
          y: 10
        }
      },
      events: {
        load: function(this: Highcharts.Chart) {
          // Add mouse wheel zoom with CTRL modifier - more responsive/snappy
          const chart = this;
          const container = chart.container;

          container.addEventListener('wheel', function(e: WheelEvent) {
            // Only zoom with CTRL + wheel, otherwise let normal scrolling happen
            if (e.ctrlKey) {
              e.preventDefault();
              
              const delta = e.deltaY > 0 ? 1.4 : 0.7; // More aggressive zoom for snappier feel
              const xAxis = chart.xAxis[0];
              
              // Get current extremes
              const currentMin = xAxis.min;
              const currentMax = xAxis.max;
              
              if (currentMin !== undefined && currentMax !== undefined) {
                const center = (currentMin + currentMax) / 2;
                const range = currentMax - currentMin;
                
                // Calculate new range with snapping to nice time intervals
                const newRange = range * delta;
                const newMin = center - newRange / 2;
                const newMax = center + newRange / 2;
                
                // Snap to nearest 15-minute intervals for cleaner movement
                const snapInterval = 15 * 60 * 1000; // 15 minutes in milliseconds
                const snappedMin = Math.round(newMin / snapInterval) * snapInterval;
                const snappedMax = Math.round(newMax / snapInterval) * snapInterval;
                
                // Apply zoom with snapping
                xAxis.setExtremes(snappedMin, snappedMax);
              }
            }
            // If not CTRL, allow normal scrolling behavior
          });

          // Set cursor style for better UX - Highcharts handles panning
          container.style.cursor = 'grab';
          
          container.addEventListener('mousedown', function(e: MouseEvent) {
            if (e.button === 0) { // Left click
              container.style.cursor = 'grabbing';
            }
          });
          
          container.addEventListener('mouseup', function(e: MouseEvent) {
            container.style.cursor = 'grab';
          });
        }
      },
      backgroundColor: 'transparent',
      style: {
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }
    },
    xAxis: {
      type: 'datetime',
      dateTimeLabelFormats: {
        hour: '%H:%M',
        day: '%a %e %b'
      },
      title: {
        text: null // Remove x-axis title
      },
      // Let the outer panel handle scrolling; disable Highcharts x-axis scrollbar
      scrollbar: {
        enabled: false
      },
      // Use date range based on view mode
      min: dateRange.start,
      max: dateRange.end,
      minRange: dateRange.end - dateRange.start, // Prevent zooming out beyond current view
      gridLineWidth: 1,
      gridLineColor: '#e0e0e0',
      opposite: true, // Move x-axis to the top
      labels: {
        align: 'left',
        x: 0,
        y: -5
      }
    },
    yAxis: {
        pointWidth: 10, // thinner task bar for compact rows
      categories: resources,
      title: {
        text: null // Remove y-axis title
      },
      gridLineWidth: 0, // we'll draw custom grid lines that match left labels
      gridLineColor: '#e0e0e0',
      min: 0,
      max: resources.length - 1, // Show all resources
      // Disable Highcharts-rendered labels; we'll render a MUI left column for consistent styling
      labels: {
        enabled: false
      },
      scrollbar: {
        enabled: false,
        showFull: false
      }
    },
    series: series,
    plotOptions: {
      gantt: {
        dataLabels: {
          enabled: false // Disable data labels for cleaner look
        },
        borderWidth: 0,
        borderRadius: 1,
        pointPadding: 0.02, // Very thin padding like Bryntum example
        groupPadding: 0.02, // Very thin group padding
        pointWidth: 12, // Ultra-thin task bars matching Bryntum basic-thin example
      },
      series: {
        states: {
          hover: {
            brightness: 0.1
          }
        }
      }
    },
    tooltip: {
      useHTML: true,
      formatter: function(this: any) {
        const point = this.point;
        const task = point.taskData;
        
        if (!task) return false;
        
        const startDate = new Date(point.start);
        const endDate = new Date(point.end);
        const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60)); // Duration in minutes
        
        return `<div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 300px;">
          <div style="font-weight: 600; font-size: 14px; color: #1a1a1a; margin-bottom: 8px;">${task.taskName}</div>
          <div style="display: flex; flex-direction: column; gap: 4px; font-size: 12px;">
            <div><strong>Priority:</strong> <span style="color: ${getPriorityColor(task.priority)};">${task.priority}</span></div>
            <div><strong>Status:</strong> ${task.status}</div>
            <div><strong>Duration:</strong> ${duration} minutes</div>
            <div><strong>Start:</strong> ${startDate.toLocaleString()}</div>
            <div><strong>End:</strong> ${endDate.toLocaleString()}</div>
            ${task.description ? `<div><strong>Description:</strong> ${task.description}</div>` : ''}
          </div>
        </div>`;
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e0e0e0',
      borderRadius: 8,
      shadow: true,
      style: {
        fontSize: '12px'
      }
    },
    legend: {
      enabled: false // Remove legend since we're showing resource IDs on y-axis
    },
    credits: {
      enabled: false // Remove Highcharts credits
    }
  };

  const LABEL_COL_WIDTH = 220;
  const ROW_HEIGHT = 36;
  const [chartPlotOffset, setChartPlotOffset] = useState<number>(0);
  const [computedRowHeight, setComputedRowHeight] = useState<number>(ROW_HEIGHT);
  const leftColRef = useRef<HTMLDivElement | null>(null);
  const rightColRef = useRef<HTMLDivElement | null>(null);
  const [rowTops, setRowTops] = useState<number[]>([]);
  const gridLinesRef = useRef<any[]>([]);

  useEffect(() => {
    const updateOffset = () => {
      try {
        const chart = (chartRef.current as any)?.chart;
        if (chart && typeof chart.plotTop === 'number') {
          const plotTop = chart.plotTop || 0;
          setChartPlotOffset(plotTop);

          // derive row height from plotHeight / rows and compute per-row top positions
          const plotH = chart.plotHeight || 0;
          const count = (resources && resources.length) || 1;

          // Inspect point.shapeArgs (when available) for exact SVG box positions/heights.
          const tops: number[] = [];
          let maxBarHeight = 0;

          for (let i = 0; i < count; i++) {
            let found = false;
            for (let si = 0; si < (chart.series || []).length && !found; si++) {
              const s = chart.series[si];
              const pts = s.points || [];
              for (let pi = 0; pi < pts.length; pi++) {
                const p = pts[pi];
                if (p && typeof p.y !== 'undefined' && +p.y === i) {
                  // Prefer actual rendered bbox from the point's graphic for absolute precision
                  let bbox: any | undefined;
                  try {
                    if (p.graphic && typeof p.graphic.getBBox === 'function') {
                      bbox = p.graphic.getBBox();
                    }
                  } catch (e) {
                    bbox = undefined;
                  }

                  if (bbox && typeof bbox.y === 'number') {
                    // bbox.y is relative to the plot area; add plotTop to get container-relative top
                    tops[i] = plotTop + bbox.y;
                    maxBarHeight = Math.max(maxBarHeight, Math.round(bbox.height || 0));
                  } else {
                    // Prefer shapeArgs when bbox isn't available
                    const shapeY = p.shapeArgs && typeof p.shapeArgs.y === 'number' ? p.shapeArgs.y : undefined;
                    const shapeH = p.shapeArgs && typeof p.shapeArgs.height === 'number' ? p.shapeArgs.height : undefined;

                    if (typeof shapeY !== 'undefined') {
                      tops[i] = plotTop + shapeY;
                    } else if (typeof p.plotY === 'number') {
                      tops[i] = plotTop + p.plotY - Math.round(plotH / Math.max(1, count) / 2);
                    } else {
                      tops[i] = plotTop + i * Math.max(ROW_HEIGHT, Math.round(plotH / count));
                    }

                    if (typeof shapeH === 'number') {
                      maxBarHeight = Math.max(maxBarHeight, shapeH);
                    } else if (typeof p.plotY === 'number') {
                      maxBarHeight = Math.max(maxBarHeight, Math.round(plotH / Math.max(1, count) * 0.7));
                    }
                  }

                  found = true;
                  break;
                }
              }
            }
            if (!found) {
              tops[i] = plotTop + i * Math.max(ROW_HEIGHT, Math.round(plotH / count));
            }
          }

          // Derive a row height that at minimum respects the original ROW_HEIGHT but also
          // is large enough to contain the tallest rendered bar plus a small padding.
          const avgDerived = Math.max(ROW_HEIGHT, Math.round(plotH / Math.max(1, count)));
          const paddedBar = maxBarHeight ? Math.round(maxBarHeight + 8) : avgDerived;
          const finalDerived = Math.max(ROW_HEIGHT, Math.round(Math.max(avgDerived, paddedBar)));

          setComputedRowHeight(finalDerived);
          setRowTops(tops);

          // draw custom horizontal grid lines that align to either the bottom of the bar
          // (when available via shapeArgs) or to the computed row bottoms
          try {
            // clear previous
            if (gridLinesRef.current && gridLinesRef.current.length && chart && chart.renderer) {
              gridLinesRef.current.forEach((el: any) => { try { el.destroy(); } catch (e) {} });
              gridLinesRef.current = [];
            }

            if (chart && chart.renderer) {
              const left = chart.plotLeft || 0;
              const right = (chart.plotLeft || 0) + (chart.plotWidth || 0);
              for (let i = 0; i <= count; i++) {
                const baseTop = (tops[i] != null ? tops[i] : (plotTop + i * finalDerived));
                // if we have a maxBarHeight use that to draw the baseline, otherwise use finalDerived
                const lineY = Math.round(baseTop + (maxBarHeight ? Math.max(maxBarHeight, finalDerived) : finalDerived));
                const line = chart.renderer.path(["M", left, lineY, "L", right, lineY])
                  .attr({ 'stroke-width': 1, stroke: '#f0f0f0' })
                  .add();
                gridLinesRef.current.push(line);
              }
            }
          } catch (e) {
            // ignore renderer errors
          }
        }
      } catch (e) {
        // ignore
      }
    };

    // Initial measurement and on resize only (no polling fallback)
    updateOffset();
    window.addEventListener('resize', updateOffset);

    // Also resync after chart redraws (zoom/pan) for immediate alignment
    const chart = (chartRef.current as any)?.chart;
    if (chart && (Highcharts as any).addEvent) {
      (Highcharts as any).addEvent(chart, 'redraw', updateOffset);
    }

    return () => {
      window.removeEventListener('resize', updateOffset);
      if (chart && (Highcharts as any).removeEvent) {
        try { (Highcharts as any).removeEvent(chart, 'redraw', updateOffset); } catch (e) {}
      }
    };
  }, [resources, viewMode]);

  // cleanup grid lines on unmount
  useEffect(() => {
    return () => {
      try {
        if (gridLinesRef.current && gridLinesRef.current.length) {
          gridLinesRef.current.forEach((el: any) => { try { el.destroy(); } catch (e) {} });
          gridLinesRef.current = [];
        }
      } catch (e) {}
    };
  }, []);

  // Update chart pointWidth to visually match computed row height
  useEffect(() => {
    try {
      const chart = (chartRef.current as any)?.chart;
      if (chart) {
        const pw = Math.max(8, Math.round(computedRowHeight * 0.6));
        chart.update({ plotOptions: { gantt: { pointWidth: pw } } }, true, false);
      }
    } catch (e) {
      // ignore
    }
  }, [computedRowHeight]);

  // Sync vertical scrolling between left labels column and right chart area
  const onLeftScroll = () => {
    try {
      if (leftColRef.current && rightColRef.current) {
        rightColRef.current.scrollTop = leftColRef.current.scrollTop;
      }
    } catch (e) {}
  };

  const onRightScroll = () => {
    try {
      if (leftColRef.current && rightColRef.current) {
        leftColRef.current.scrollTop = rightColRef.current.scrollTop;
      }
    } catch (e) {}
  };

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#fafafa',
        borderRadius: 1
      }}
    >
      {/* Time Header with View Mode Controls */}
      <Paper
        elevation={1}
        sx={{
          p: 1.5,
              mb: 1,
          backgroundColor: 'white',
          borderRadius: 1,
          border: '1px solid #e0e0e0'
        }}
      >
            {/* removed top accent as requested */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Timeline View
            </Typography>
            {/* Removed inline select - day range is chosen via time icon menu */}
            <IconButton onClick={handleResetView} size="small" sx={{ color: 'primary.main' }} title="Reset zoom and position">
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {(() => {
                const dateRange = getDateRange(viewMode);
                const start = dateRange.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const end = dateRange.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return `${start} - ${end}`;
              })()}
            </Typography>
            <IconButton size="small" onClick={(e) => setAnchorElRange(e.currentTarget)} title="Select day range">
              <AccessTimeIcon sx={{ color: 'primary.main' }} />
            </IconButton>
            <Menu anchorEl={anchorElRange} open={Boolean(anchorElRange)} onClose={() => setAnchorElRange(null)}>
              <MenuItem onClick={() => { setViewMode('1day'); setAnchorElRange(null); }}>1 Day</MenuItem>
              <MenuItem onClick={() => { setViewMode('2days'); setAnchorElRange(null); }}>2 Days</MenuItem>
              <MenuItem onClick={() => { setViewMode('5days'); setAnchorElRange(null); }}>5 Days</MenuItem>
              <MenuItem onClick={() => { setViewMode('7days'); setAnchorElRange(null); }}>7 Days</MenuItem>
            </Menu>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left column: MUI-rendered resource labels (keeps consistent styling with app) */}
        <Box ref={leftColRef} onScroll={onLeftScroll} sx={{ width: LABEL_COL_WIDTH, p: 2, overflow: 'auto' }}>
          <Paper elevation={0} sx={{ borderRight: '1px solid #e0e0e0', bgcolor: 'transparent', overflow: 'hidden', position: 'relative', zIndex: 3 }}>
            {/* Resource header spacer to align with chart plot area */}
            <Box sx={{ height: `${chartPlotOffset}px`, display: 'flex', alignItems: 'center', px: 0, borderBottom: '1px solid transparent' }}>
              <Typography sx={{ fontWeight: 700, color: 'text.secondary' }}>Resource</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {resources && resources.map((r: string, idx: number) => {
                const resourceId = resourceNameToIdMap[r] || '';
                return (
                  <Box key={r} sx={{ height: `${computedRowHeight}px`, display: 'flex', alignItems: 'center', gap: 1, px: 1, borderBottom: '1px solid #f0f0f0' }}>
                    <Avatar sx={{ width: Math.max(24, computedRowHeight - 12), height: Math.max(24, computedRowHeight - 12), bgcolor: 'primary.main', fontSize: 12, fontWeight: 700 }}>{getInitials(r)}</Avatar>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', minWidth: 0 }}>
                      <Typography noWrap sx={{ fontWeight: 700, fontSize: 13, color: 'text.primary' }}>{r}</Typography>
                      <Box sx={{ ml: 1, flexShrink: 0 }}>
                        <Typography noWrap variant="caption" sx={{ color: 'primary.main', fontWeight: 700, bgcolor: 'rgba(25,118,210,0.08)', px: 1, py: '2px', borderRadius: 1 }}>{resourceId}</Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Box>

        {/* Right: chart */}
        <Box ref={rightColRef} onScroll={onRightScroll} sx={{ flex: 1, overflow: 'auto', p: 2,
          '& .highcharts-background': { fill: 'transparent' },
          '& .highcharts-plot-background': { fill: 'transparent' },
          '& .highcharts-scrollbar': { display: 'none !important' },
          '& .highcharts-scrollbar-thumb': { display: 'none !important' }
        }}>
          <HighchartsReact
            ref={chartRef}
            highcharts={Highcharts}
            options={options}
            containerProps={{
              style: {
                // set chart pixel height so Highcharts does not add its own scrollbars
                height: `${(resources?.length || 1) * computedRowHeight + 40}px`,
                width: '100%',
                minWidth: '1200px'
              }
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
