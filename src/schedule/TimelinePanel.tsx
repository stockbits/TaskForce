
import React, { useMemo, useState, useEffect, useRef } from "react";
import { Box, Typography, Paper, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Button, IconButton } from "@mui/material";
import { Refresh as RefreshIcon } from "@mui/icons-material";
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
const getDateRange = (mode: '1day' | '3days' | '7days' | '14days') => {
  const today = new Date();
  const startDate = new Date(today);
  const endDate = new Date(today);

  switch (mode) {
    case '1day':
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case '3days':
      startDate.setDate(today.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(today.getDate() + 1);
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
  const [viewMode, setViewMode] = useState<'1day' | '3days' | '7days' | '14days'>('1day');
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

  // Reset zoom when view mode changes
  useEffect(() => {
    if (chartRef.current?.chart) {
      // Small delay to ensure chart has updated with new data
      setTimeout(() => {
        chartRef.current?.chart.zoomOut();
      }, 100);
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
      scrollablePlotArea: {
        minWidth: 1500, // Minimum width for horizontal scrolling
        scrollPositionX: 0,
        minHeight: 600, // Adjusted for increased chart height
        scrollPositionY: 0
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
      scrollbar: {
        enabled: true
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
      type: 'category',
      categories: resources,
      title: {
        text: null // Remove y-axis title
      },
      gridLineWidth: 1,
      gridLineColor: '#e0e0e0',
      min: 0,
      max: resources.length - 1, // Show all resources
      labels: {
        formatter: function(this: any) {
          const resourceName = this.value;
          const resourceId = resourceNameToIdMap[resourceName] || 'UNKNOWN';
          const initials = getInitials(resourceName);

          // Return HTML with ultra-compact design exactly like Bryntum basic-thin example
          return `<div style="display: flex; align-items: center; gap: 2px; padding: 0px 2px; min-width: 100px; border-bottom: 1px solid #e0e0e0; height: 18px; align-items: center;">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; display: flex; align-items: center; justify-content: center; font-size: 5px; font-weight: 700; border: 1px solid rgba(255,255,255,0.8); flex-shrink: 0;">${initials}</div>
            <div style="display: flex; flex-direction: column; flex: 1; min-width: 0; justify-content: center; height: 12px;">
              <div style="font-weight: 600; font-size: 7px; color: #1a1a1a; line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${resourceName}</div>
              <div style="font-size: 5px; color: #666; font-weight: 500; line-height: 1;">${resourceId}</div>
            </div>
          </div>`;
        },
        useHTML: true,
        style: {
          width: '130px',
          padding: '0',
          margin: '0'
        },
        y: 0 // Center the labels vertically
      },
      scrollbar: {
        enabled: true,
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
              Timeline View
            </Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>View Range</InputLabel>
              <Select
                value={viewMode}
                label="View Range"
                onChange={(e: SelectChangeEvent) => setViewMode(e.target.value as '1day' | '3days' | '7days' | '14days')}
              >
                <MenuItem value="1day">1 Day</MenuItem>
                <MenuItem value="3days">3 Days</MenuItem>
                <MenuItem value="7days">7 Days</MenuItem>
                <MenuItem value="14days">14 Days</MenuItem>
              </Select>
            </FormControl>
            <IconButton
              onClick={handleResetView}
              size="small"
              sx={{
                color: '#1976d2',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.04)'
                }
              }}
              title="Reset zoom and position"
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body1" sx={{ color: '#666' }}>
              {(() => {
                const dateRange = getDateRange(viewMode);
                const start = dateRange.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const end = dateRange.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return `${start} - ${end}`;
              })()}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976d2' }}>
              {currentTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              })}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ 
        flex: 1, 
        overflow: 'visible', // Allow chart scrollbars to be visible
        p: 2,
        '& .highcharts-background': {
          fill: 'transparent'
        },
        '& .highcharts-plot-background': {
          fill: 'transparent'
        }
      }}>
        <HighchartsReact
          ref={chartRef}
          highcharts={Highcharts}
          options={options}
          containerProps={{
            style: {
              height: '650px', // Increased height for even more compact resource display
              width: '100%',
              minWidth: '1500px'
            }
          }}
        />
      </Box>
    </Box>
  );
}
