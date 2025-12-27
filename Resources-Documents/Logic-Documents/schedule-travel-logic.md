# Schedule Travel and Task Rendering Logic

## Overview
This document summarizes the logic for calculating and rendering travel times and task blocks in the timeline view.

## Travel Calculation
- **Home to First Task**: Calculates distance from resource's home lat/lng to first task's lat/lng. Travel time = max(distance / 40 km/h, 10 minutes). Travel starts at shift start time, ends at shift start + travel time. If travel >0, a travel block is rendered.
- **Between Tasks**: For each consecutive task pair, calculates distance between task locations. Travel time = max(distance / 40 km/h, 5 minutes). Travel starts at previous task end, ends at previous end + travel time. Travel block rendered if >0.

## Task Scheduling
- **First Task**: If home travel exists, task start is forced to home travel end time (to start directly after travel). Otherwise, starts at expected time.
- **Subsequent Tasks**: Start at expected time, but if inter-task travel exists, start is forced to travel end time (directly after travel).

## ECBT (Estimated Come Back Time)
- For each resource, ECBT is the latest scheduled task end time on the current date (only for "Assigned (ACT)" tasks).
- If no tasks are scheduled for the current date, ECBT is set to the resource's shift start time.

## Rendering Sequence (per Resource)
1. **Travel from Home** (if applicable): Orange block from shift start to travel end.
2. **First Task**: Blue block starting directly at travel end.
3. **Travel Between**: Orange block from first task end to travel end.
4. **Second Task**: Blue block starting directly at inter-travel end.
5. Repeat for more tasks.

## Visuals
- Travel blocks: Orange, height 12px, min width 10px, sharp corners.
- Task blocks: Blue, height based on row, min width adjusted, sharp corners.
- Gaps: 2px between adjacent blocks.
- ECBT: Diamond marker at the ECBT time.

## Example for FJNEW30 on Dec 25
- Home travel: 08:00–08:10
- Task 1 (RG-AB30019): 08:10–09:10
- Inter travel: 09:10–09:16
- Task 2 (RG-AB30038): 09:16–11:46
- ECBT: 11:46