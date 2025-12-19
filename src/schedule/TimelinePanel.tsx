import React, { useMemo, useState, useRef } from "react";
import { Box, Typography, Paper, Avatar, IconButton, Menu, MenuItem } from "@mui/material";
import { Refresh as RefreshIcon, AccessTime as AccessTimeIcon, Person as PersonIcon } from "@mui/icons-material";
import Highcharts from 'highcharts';
import 'highcharts/modules/gantt';
import HighchartsReact from 'highcharts-react-official';
import mockTasks from '../data/mockTasks.json';
import ResourceMock from '../data/ResourceMock.json';

// Helper to parse date strings like "Sat 7 Jan, 8:15 AM"
const parseDate = (dateStr: string) => {
  if (!dateStr) return null;
  const fullStr = dateStr + ', 2025';
  const date = new Date(fullStr);
  return isNaN(date.getTime()) ? null : date.getTime();
};

// Helper to get initials from name
const getInitials = (name: string) => {
  if (!name || typeof name !== 'string') return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

// Helper to calculate distance between two lat/lng points in km
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

// Helper to calculate travel time in minutes (assuming 30 km/h average speed)
const calculateTravelTime = (distanceKm: number) => {
  const speedKmh = 30; // 30 km/h
  const timeHours = distanceKm / speedKmh;
  return Math.max(15, Math.round(timeHours * 60)); // minimum 15 minutes travel time
};

// Helper to get date range based on view mode
const getDateRange = (mode: '1day' | '2days' | '5days' | '7days' | '12days') => {
  const today = new Date();
  const startDate = new Date(today);
  const endDate = new Date(today);

  switch (mode) {
    case '1day':
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case '2days':
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(today.getDate() + 1);
      endDate.setHours(23, 59, 59, 999);
      break;
    case '5days':
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
    case '12days':
      startDate.setDate(today.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(today.getDate() + 5);
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

export default function TimelinePanel() {
  const [viewMode, setViewMode] = useState<'1day' | '2days' | '5days' | '7days' | '12days'>('5days');
  const [displayMode, setDisplayMode] = useState<'name' | 'id' | 'both'>(() => {
    const saved = localStorage.getItem('timelineDisplayMode');
    return (saved as 'name' | 'id' | 'both') || 'both';
  });
  const chartRef = useRef<HighchartsReact.RefObject>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  // Menu state
  const [dayMenuAnchor, setDayMenuAnchor] = useState<null | HTMLElement>(null);
  const [displayMenuAnchor, setDisplayMenuAnchor] = useState<null | HTMLElement>(null);

  // Reset zoom when view mode changes
  React.useEffect(() => {
    if (chartRef.current?.chart) {
      chartRef.current.chart.zoomOut();
    }
  }, [viewMode]);

  // Function to reset chart zoom and position
  const handleResetView = () => {
    if (chartRef.current?.chart) {
      chartRef.current.chart.zoomOut();
    }
  };

  // Menu handlers
  const handleDayMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setDayMenuAnchor(event.currentTarget);
  };

  const handleDayMenuClose = () => {
    setDayMenuAnchor(null);
  };

  const handleDisplayMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setDisplayMenuAnchor(event.currentTarget);
  };

  const handleDisplayMenuClose = () => {
    setDisplayMenuAnchor(null);
  };

  const handleViewModeChange = (mode: '1day' | '2days' | '5days' | '7days' | '12days') => {
    setViewMode(mode);
    handleDayMenuClose();
  };

  const handleDisplayModeChange = (mode: 'name' | 'id' | 'both') => {
    setDisplayMode(mode);
    localStorage.setItem('timelineDisplayMode', mode);
    handleDisplayMenuClose();
  };

  // Scroll synchronization handler
  const handleTimelineScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (timelineScrollRef.current) {
      timelineScrollRef.current.scrollLeft = event.currentTarget.scrollLeft;
    }
  };

  // Always show all resources from ResourceMock
  const allResources = useMemo(() => {
    return ResourceMock;
  }, []);

  // Create task assignments - distribute all tasks among resources in tours
  const taskAssignments = useMemo(() => {
    const assignments: {[key: string]: any[]} = {};
    
    // Initialize empty arrays for each resource
    allResources.forEach((resource: any) => {
      assignments[resource.resourceId] = [];
    });
    
    // Distribute tasks in round-robin fashion to create tours of work
    mockTasks.forEach((task: any, index: number) => {
      const resourceIndex = index % allResources.length;
      const resourceId = allResources[resourceIndex].resourceId;
      assignments[resourceId].push({
        taskId: task.taskId,
        taskType: task.taskType,
        taskStatus: 'Assigned (ACT)',
        expectedStartDate: task.expectedStartDate,
        expectedFinishDate: task.expectedFinishDate,
        lat: task.lat,
        lng: task.lng,
        postCode: task.postCode,
        estimatedDuration: task.estimatedDuration,
        priority: task.importanceScore >= 90 ? 'Critical' : 
                 task.importanceScore >= 70 ? 'High' :
                 task.importanceScore >= 50 ? 'Medium' : 'Low'
      });
    });
    
    return assignments;
  }, [allResources]);

  // Create resource name to ID mapping
  const resourceNameToIdMap = useMemo(() => {
    const map: {[key: string]: string} = {};
    allResources.forEach((resource: any) => {
      map[resource.name] = resource.resourceId;
    });
    return map;
  }, [allResources]);

  // Process tasks data - simplified version without complex scheduling
  const { resources, series } = useMemo(() => {
    const dateRange = getDateRange(viewMode);

    const series = allResources.map((resource, resourceIndex) => {
      // Get assigned tasks for this resource from our new assignment system
      const resourceTasks = taskAssignments[resource.resourceId] || [];

      // Create task bars from expected start times and estimated duration
      const taskBars = resourceTasks.map((task: any) => {
        const startTime = parseDate(task.expectedStartDate);

        if (!startTime) return null;

        // Calculate end time using estimated duration (in minutes)
        const endTime = startTime + (task.estimatedDuration * 60 * 1000);

        // Only show tasks within the current date range
        if (startTime < dateRange.start || startTime > dateRange.end) return null;

        return {
          name: `${task.taskType} - ${task.taskId}`,
          start: startTime,
          end: endTime,
          y: resourceIndex,
          taskId: task.taskId,
          taskType: task.taskType,
          priority: task.importanceScore >= 90 ? 'Critical' :
                   task.importanceScore >= 70 ? 'High' :
                   task.importanceScore >= 50 ? 'Medium' : 'Low',
          estimatedDuration: task.estimatedDuration,
          employeeId: resource.resourceId,
          color: (() => {
            const employeeColors: {[key: string]: string} = {
              'T6344': '#667eea', 'T5678': '#f093fb', 'T9012': '#4facfe',
              'T3456': '#43e97b', 'T7890': '#38f9d7', 'T1234': '#ff6b6b',
              'T5679': '#ffd93d', 'T0123': '#6bcf7f', 'T4567': '#a8e6cf',
              'T8901': '#ffd1dc'
            };
            return employeeColors[resource.resourceId] || '#667eea';
          })(),
          pointPadding: 0.2,
          pointWidth: 25
        };
      }).filter(Boolean);

      // Sort tasks by start time for travel calculation
      const sortedTasks = resourceTasks.sort((a, b) => {
        const aTime = parseDate(a.expectedStartDate) || 0;
        const bTime = parseDate(b.expectedStartDate) || 0;
        return aTime - bTime;
      });

      // Create travel bars
      const travelBars = [];
      const homeLat = resource.homeLat;
      const homeLng = resource.homeLng;

      if (homeLat && homeLng) {
        // Travel from home to first task
        const firstTask = sortedTasks[0];
        if (firstTask && firstTask.lat && firstTask.lng) {
          const firstStart = parseDate(firstTask.expectedStartDate);
          if (firstStart) {
            const distance = calculateDistance(homeLat, homeLng, firstTask.lat, firstTask.lng);
            const travelTime = calculateTravelTime(distance);
            const travelStart = firstStart - (travelTime * 60 * 1000);
            if (travelStart >= dateRange.start) {
              travelBars.push({
                name: 'Travel from Home',
                start: travelStart,
                end: firstStart,
                y: resourceIndex,
                taskId: 'travel-home',
                taskType: 'Travel',
                priority: 'Travel',
                estimatedDuration: travelTime,
                employeeId: resource.resourceId,
                color: '#9e9e9e',
                pointWidth: 6
              });
            }
          }
        }

        // Travel between tasks
        for (let i = 0; i < sortedTasks.length - 1; i++) {
          const currentTask = sortedTasks[i];
          const nextTask = sortedTasks[i + 1];
          const currentStart = parseDate(currentTask.expectedStartDate);
          const nextStart = parseDate(nextTask.expectedStartDate);
          if (currentStart && nextStart && currentTask.lat && currentTask.lng && nextTask.lat && nextTask.lng) {
            // Calculate current task end using estimated duration
            const currentEnd = currentStart + (currentTask.estimatedDuration * 60 * 1000);
            const gap = nextStart - currentEnd;
            if (gap > 0) {
              const distance = calculateDistance(currentTask.lat, currentTask.lng, nextTask.lat, nextTask.lng);
              const travelTime = Math.min(calculateTravelTime(distance), gap / (60 * 1000));
              const travelStart = currentEnd;
              const travelEnd = Math.min(nextStart, currentEnd + (travelTime * 60 * 1000));
              travelBars.push({
                name: 'Travel',
                start: travelStart,
                end: travelEnd,
                y: resourceIndex,
                taskId: `travel-${i}`,
                taskType: 'Travel',
                priority: 'Travel',
                estimatedDuration: travelTime,
                employeeId: resource.resourceId,
                color: '#9e9e9e',
                pointWidth: 6
              });
            }
          }
        }

        // Travel from last task to home
        const lastTask = sortedTasks[sortedTasks.length - 1];
        if (lastTask && lastTask.lat && lastTask.lng) {
          const lastStart = parseDate(lastTask.expectedStartDate);
          if (lastStart) {
            // Calculate last task end using estimated duration
            const lastEnd = lastStart + (lastTask.estimatedDuration * 60 * 1000);
            const distance = calculateDistance(lastTask.lat, lastTask.lng, homeLat, homeLng);
            const travelTime = calculateTravelTime(distance);
            const travelEnd = lastEnd + (travelTime * 60 * 1000);
            if (travelEnd <= dateRange.end) {
              travelBars.push({
                name: 'Travel to Home',
                start: lastEnd,
                end: travelEnd,
                y: resourceIndex,
                taskId: 'travel-home-end',
                taskType: 'Travel',
                priority: 'Travel',
                estimatedDuration: travelTime,
                employeeId: resource.resourceId,
                color: '#9e9e9e',
                pointWidth: 6
              });
            }
          }
        }
      }

      // Add shift time visualization
      const shiftBars = [];
      if (resource.shiftStart && resource.shiftEnd) {
        // Create shift bars for each day in the date range
        const currentDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        
        while (currentDate <= endDate) {
          const shiftStartTime = new Date(currentDate);
          const shiftEndTime = new Date(currentDate);
          
          // Parse shift times (e.g., "6:00 AM" -> hours and minutes)
          const startMatch = resource.shiftStart.match(/(\d+):(\d+)\s*(AM|PM)/i);
          const endMatch = resource.shiftEnd.match(/(\d+):(\d+)\s*(AM|PM)/i);
          
          if (startMatch && endMatch) {
            let startHour = parseInt(startMatch[1]);
            const startMinute = parseInt(startMatch[2]);
            const startPeriod = startMatch[3].toUpperCase();
            
            let endHour = parseInt(endMatch[1]);
            const endMinute = parseInt(endMatch[2]);
            const endPeriod = endMatch[3].toUpperCase();
            
            // Convert to 24-hour format
            if (startPeriod === 'PM' && startHour !== 12) startHour += 12;
            if (startPeriod === 'AM' && startHour === 12) startHour = 0;
            if (endPeriod === 'PM' && endHour !== 12) endHour += 12;
            if (endPeriod === 'AM' && endHour === 12) endHour = 0;
            
            shiftStartTime.setHours(startHour, startMinute, 0, 0);
            shiftEndTime.setHours(endHour, endMinute, 0, 0);
            
            // Only add shift bar if it's within the current date range
            if (shiftStartTime.getTime() >= dateRange.start && shiftStartTime.getTime() <= dateRange.end) {
              shiftBars.push({
                name: 'Working Hours',
                start: shiftStartTime.getTime(),
                end: shiftEndTime.getTime(),
                y: resourceIndex,
                taskId: 'shift',
                taskType: 'Shift',
                priority: 'Shift',
                estimatedDuration: 0,
                employeeId: resource.resourceId,
                color: 'rgba(76, 175, 80, 0.4)', // Light green background for shifts
                borderColor: 'rgba(76, 175, 80, 0.7)',
                borderWidth: 2,
                pointPadding: 0.15
              });
            }
          }
          
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      // Combine shift bars, task bars, and travel bars
      const allBars = [...shiftBars, ...taskBars, ...travelBars];

      // If no tasks or shifts, add a placeholder
      if (allBars.length === 0) {
        allBars.push({
          name: 'No tasks scheduled',
          start: dateRange.start,
          end: dateRange.start,
          y: resourceIndex,
          taskId: '',
          taskType: '',
          priority: '',
          estimatedDuration: 0,
          employeeId: '',
          color: '#f0f0f0',
          pointWidth: 50
        });
      }

      return {
        name: resource.name,
        type: 'gantt' as const,
        data: allBars
      };
    });

    return {
      resources: allResources.map(r => r.name),
      series: series
    };
  }, [allResources, viewMode]);

  // Calculate date range for current view mode
  const dateRange = getDateRange(viewMode);

  // Handle Ctrl+wheel zoom for the chart
  React.useEffect(() => {
    if (chartRef.current?.chart?.container) {
      const container = chartRef.current.chart.container;
      const handleWheel = (e: WheelEvent) => {
        if (e.ctrlKey && chartRef.current?.chart) {
          e.preventDefault();
          const chart = chartRef.current.chart;
          const delta = e.deltaY > 0 ? 1.2 : 0.8; // zoom out or in
          const xAxis = chart.xAxis[0];
          const currentMin = xAxis.min || dateRange.start;
          const currentMax = xAxis.max || dateRange.end;
          const currentRange = currentMax - currentMin;
          const newRange = currentRange * delta;
          // Limit max zoom to 30 minutes
          if (newRange < 30 * 60 * 1000) return;
          const center = (currentMin + currentMax) / 2;
          const newMin = Math.max(dateRange.start, center - newRange / 2);
          const newMax = Math.min(dateRange.end, center + newRange / 2);
          xAxis.setExtremes(newMin, newMax);
        }
      };
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [dateRange]);

  const options = {
    accessibility: { enabled: false },
    title: { text: null },
    chart: {
      height: null,
      width: null,
      zoomType: 'x',
      panning: { enabled: true, type: 'x' },
      panKey: null,
      mouseWheel: { enabled: false },
      resetZoomButton: {
        theme: { fill: '#1976d2', stroke: '#fff', r: 4 },
        position: { align: 'right', verticalAlign: 'top', x: -10, y: 10 }
      },
      backgroundColor: 'transparent',
      style: { fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
    },
    xAxis: {
      type: 'datetime',
      dateTimeLabelFormats: { hour: '%H:%M', day: '%a %e %b' },
      title: { text: null },
      scrollbar: { enabled: false },
      min: dateRange.start + (5 * 60 * 60 * 1000), // Start at 5 AM
      max: dateRange.end,
      minRange: dateRange.end - dateRange.start,
      gridLineWidth: 0, // Removed grid lines
      gridLineColor: '#e0e0e0',
      opposite: true,
      labels: { enabled: false },
      visible: false // Hide the entire x-axis to align Y positions
    },
    yAxis: {
      categories: resources,
      title: { text: null },
      gridLineWidth: 0, // Removed grid lines
      gridLineColor: '#d0d0d0',
      min: 0,
      max: resources.length - 1,
      labels: { enabled: false },
      scrollbar: { enabled: false, showFull: false },
      staticScale: 60
    },
    series: series,
    plotOptions: {
      gantt: {
        dataLabels: { enabled: false },
        borderWidth: 0,
        borderRadius: 1,
        pointPadding: 0.02,
        groupPadding: 0.02,
        pointWidth: 50
      },
      series: {
        states: { hover: { enabled: false }, inactive: { enabled: false } }
      }
    },
    tooltip: {
      useHTML: true,
      delay: 0,
      hideDelay: 0,
      formatter: function(this: any) {
        const point = this.point;
        if (!point || point.name === 'No tasks scheduled') return false;

        // Disable tooltips for shift bars
        if (point.taskId === 'shift') {
          return false;
        }

        // Handle travel bars
        if (point.taskType === 'Travel') {
          const startDate = new Date(point.start);
          const endDate = new Date(point.end);
          return `<div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 300px;">
            <div style="font-weight: 600; font-size: 14px; color: #616161; margin-bottom: 8px;">${point.name}</div>
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 12px;">
              <div><strong>Duration:</strong> ${point.estimatedDuration} minutes</div>
              <div><strong>Start:</strong> ${startDate.toLocaleString()}</div>
              <div><strong>End:</strong> ${endDate.toLocaleString()}</div>
            </div>
          </div>`;
        }

        // Handle task bars
        const startDate = new Date(point.start);
        const endDate = new Date(point.end);
        const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));

        return `<div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 300px;">
          <div style="font-weight: 600; font-size: 14px; color: #1a1a1a; margin-bottom: 8px;">${point.name}</div>
          <div style="display: flex; flex-direction: column; gap: 4px; font-size: 12px;">
            <div><strong>Priority:</strong> ${point.priority}</div>
            <div><strong>Duration:</strong> ${duration} minutes</div>
            <div><strong>Start:</strong> ${startDate.toLocaleString()}</div>
            <div><strong>End:</strong> ${endDate.toLocaleString()}</div>
          </div>
        </div>`;
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e0e0e0',
      borderRadius: 8,
      shadow: true,
      style: { fontSize: '12px' }
    },
    legend: { enabled: false },
    credits: { enabled: false }
  };

  const LABEL_COL_WIDTH = 220;
  const ROW_HEIGHT = 60;

  return (
    <Box sx={{
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#fafafa',
      borderRadius: 1
    }}>
      {/* Fixed Header Row */}
      <Box sx={{
        display: 'flex',
        backgroundColor: 'white',
        borderBottom: '1px solid #e0e0e0'
      }}>
        {/* Left: Controls */}
        <Box sx={{
          width: LABEL_COL_WIDTH,
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          px: 1,
          gap: 1,
          borderRight: '1px solid #e0e0e0'
        }}>
          <IconButton
            size="small"
            onClick={handleResetView}
            title="Reset View"
            sx={{ color: '#666' }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            onClick={handleDayMenuOpen}
            title="Select Day Range"
            sx={{ color: '#666' }}
          >
            <AccessTimeIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            onClick={handleDisplayMenuOpen}
            title="Display Mode"
            sx={{ color: '#666' }}
          >
            <PersonIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Right: Timeline Intervals (Scrollable) */}
        <Box sx={{
          flex: 1,
          height: '40px',
          overflow: 'auto',
          overflowY: 'hidden',
          '&::-webkit-scrollbar': { display: 'none' }
        }}>
          <Box
            ref={timelineScrollRef}
            sx={{
              display: 'flex',
              width: '1200px', // Match Gantt chart width
              height: '100%',
              '&::-webkit-scrollbar': { display: 'none' }
            }}
          >
            {Array.from({ length: 24 }, (_, i) => (
              <Box
                key={i}
                sx={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  color: '#666',
                  borderRight: i < 23 ? '1px solid #e0e0e0' : 'none',
                  py: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {i.toString().padStart(2, '0')}:00
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'auto', pb: 2 }}>
        {/* Left column: Resource labels (Sticky) */}
        <Box sx={{ width: LABEL_COL_WIDTH, flexShrink: 0 }}>
          <Paper elevation={0} sx={{ borderRight: '1px solid #e0e0e0', bgcolor: 'transparent' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {resources.map((resourceName: string, _idx: number) => {
                const resourceId = resourceNameToIdMap[resourceName] || '';
                return (
                  <Box key={resourceName} sx={{
                    height: `${ROW_HEIGHT}px`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1,
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <Avatar sx={{
                      width: 24,
                      height: 24,
                      bgcolor: 'primary.main',
                      fontSize: 12,
                      fontWeight: 700
                    }}>
                      {getInitials(resourceName)}
                    </Avatar>
                    <Box sx={{
                      display: 'flex',
                      flexDirection: displayMode === 'both' ? 'column' : 'row',
                      alignItems: displayMode === 'both' ? 'flex-start' : 'center',
                      width: '100%',
                      minWidth: 0,
                      gap: displayMode === 'both' ? 0.5 : 0
                    }}>
                      {displayMode === 'name' || displayMode === 'both' ? (
                        <Typography noWrap sx={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: 'text.primary'
                        }}>
                          {resourceName}
                        </Typography>
                      ) : null}
                      {displayMode === 'id' || displayMode === 'both' ? (
                        <Typography noWrap variant="caption" sx={{
                          color: 'primary.main',
                          fontWeight: 700,
                          bgcolor: 'rgba(25,118,210,0.08)',
                          px: 1,
                          py: '2px',
                          borderRadius: 1
                        }}>
                          {resourceId}
                        </Typography>
                      ) : null}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Box>

        {/* Right: Gantt chart (Horizontally Scrollable) */}
        <Box
          sx={{
            flex: 1,
            overflowX: 'auto',
            overflowY: 'hidden',
            '& .highcharts-background': { fill: 'transparent' },
            '& .highcharts-plot-background': { fill: 'transparent' },
            '& .highcharts-scrollbar': { display: 'none !important' },
            '& .highcharts-scrollbar-thumb': { display: 'none !important' },
            '&::-webkit-scrollbar': { display: 'none' }
          }}
          onScroll={handleTimelineScroll}
        >
          <Box sx={{ width: '1200px', minWidth: '1200px' }}> {/* Fixed width container */}
            <HighchartsReact
              ref={chartRef}
              highcharts={Highcharts}
              options={options}
              containerProps={{
                style: {
                  height: `${(resources?.length || 1) * ROW_HEIGHT}px`,
                  width: '100%'
                }
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Day Range Menu */}
      <Menu
        anchorEl={dayMenuAnchor}
        open={Boolean(dayMenuAnchor)}
        onClose={handleDayMenuClose}
      >
        <MenuItem onClick={() => handleViewModeChange('1day')}>1 Day</MenuItem>
        <MenuItem onClick={() => handleViewModeChange('2days')}>2 Days</MenuItem>
        <MenuItem onClick={() => handleViewModeChange('5days')}>5 Days</MenuItem>
        <MenuItem onClick={() => handleViewModeChange('7days')}>7 Days</MenuItem>
        <MenuItem onClick={() => handleViewModeChange('12days')}>12 Days</MenuItem>
      </Menu>

      {/* Display Mode Menu */}
      <Menu
        anchorEl={displayMenuAnchor}
        open={Boolean(displayMenuAnchor)}
        onClose={handleDisplayMenuClose}
      >
        <MenuItem onClick={() => handleDisplayModeChange('name')}>Name Only</MenuItem>
        <MenuItem onClick={() => handleDisplayModeChange('id')}>ID Only</MenuItem>
        <MenuItem onClick={() => handleDisplayModeChange('both')}>Name & ID</MenuItem>
      </Menu>
    </Box>
  );
}
