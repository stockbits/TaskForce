# Schedule Travel and Task Rendering Logic

## Overview
This document describes the simplified logic for positioning tasks and calculating travel times in the timeline view.

## Task Positioning Logic

### Appointment Tasks
- **Position**: Use `task.startDate` (scheduled appointment time)
- **Example**: Customer appointments render at their booked time slots

### Non-Appointment Tasks (Start By, Complete By, Future, Tail)
- **Position**: Use tech's `shiftStart` time
- **Example**: Work tasks render at the start of the tech's working day

## Travel Calculation & Rendering

### Home to First Task Travel
- **Distance**: Haversine formula between resource home lat/lng and first task lat/lng
- **Speed**: 40 km/h average
- **Minimum**: 10 minutes travel time
- **Formula**: `travelMinutes = max(distanceKm / 40 * 60, 10)`
- **Timing**: Starts at shift start, ends at shift start + travel time
- **Visual**: Orange travel block rendered if travel time > 0

### Inter-Task Travel
- **Distance**: Haversine formula between consecutive task locations
- **Speed**: 40 km/h average
- **Minimum**: 5 minutes travel time
- **Formula**: `travelMinutes = max(distanceKm / 40 * 60, 5)`
- **Timing**: Starts at previous task end, ends at previous task end + travel time
- **Visual**: Orange travel block rendered if travel time > 0

## Task Scheduling with Travel

### Task Start Times
- **Base Position**: Tasks positioned at their calculated time (appointment time or shift start)
- **Travel Adjustment**: If travel precedes a task, task start is forced to travel end time
- **Working Hours**: All tasks clamped to tech's shift start/end times

### Rendering Sequence (per Resource)
1. **Home Travel Block** (orange): From shift start to travel end
2. **First Task** (blue): Starts directly after home travel (or at base position)
3. **Inter-Task Travel** (orange): From task end to travel end
4. **Next Task** (blue): Starts directly after inter-travel
5. **Repeat** for additional tasks

## Performance Optimizations

### Fast Calculations
- **Distance**: Haversine formula (trigonometric operations only)
- **Travel Time**: Simple division/multiplication
- **No API Calls**: All calculations done client-side
- **Minimal Data**: Only lat/lng coordinates required

### Efficient Rendering
- **Per Resource**: Calculations done once per resource per render
- **Conditional**: Travel blocks only rendered when travel time > 0
- **Clamped**: Tasks constrained to working hours automatically

## Visual Elements

### Travel Blocks
- **Color**: Orange
- **Height**: 12px
- **Style**: Sharp corners, minimum width
- **Labels**: "Travel from Home" or "Travel"

### Task Blocks
- **Color**: Blue
- **Height**: Row-based
- **Gaps**: 2px between adjacent blocks
- **Positioning**: After travel, within working hours

## Example
**Tech: PLMKC14 (8:00 AM shift start)**
- Home travel: 8:00–8:10 (10 min minimum)
- Task 1: 8:10–9:40 (starts after travel)
- Inter travel: 9:40–9:45 (5 min minimum)
## ECBT (Estimated Come Back Time) Calculation

### Active Task Statuses
- **Included Statuses**: Dispatched(AWI), Accepted(ISS), In Progress(EXC)
- **Filtering**: Only tasks with these active statuses contribute to ECBT calculation

### ECBT Logic
- **Base Time**: Starts from resource's `shiftStart` time
- **Sequential Calculation**: Travel time + task duration for each task position
- **Travel Between Tasks**: Calculated using Haversine distance and 40 km/h speed
- **Minimum Travel**: 5 minutes between tasks, 10 minutes from home
- **Task Duration**: Uses `estimatedDuration` field (default 60 minutes)

### Lunch Time Handling
- **Lunch Period**: Defined by resource's `lunchStart` and `lunchEnd` times
- **Overlap Detection**: If any task overlaps with lunch period
- **Addition**: Full lunch duration added to ECBT when overlap occurs
- **Single Addition**: Lunch time added only once per overlapping task sequence

### Calculation Sequence
1. **Start**: Set current time to shift start
2. **Home Travel**: Add travel from home to first task location
3. **Task Processing**: For each task in chronological order:
   - Add travel time from previous location
   - Add task duration
   - Check for lunch overlap and add lunch time if needed
4. **Final ECBT**: Time when resource becomes available after last task

### Example Calculation
**Tech: SWBXA12 (6:00 AM shift, lunch 12:00-12:30 PM)**
- Shift start: 6:00 AM
- Travel home to task 1: +15 min → 6:15 AM
- Task 1 duration: +90 min → 7:45 AM
- Travel to task 2: +8 min → 7:53 AM
- Task 2 duration: +60 min → 8:53 AM
- **Task 2 overlaps lunch** → +30 min → 9:23 AM
- **ECBT**: 9:23 AM