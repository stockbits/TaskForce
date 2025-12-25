const fs = require('fs');

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function parseTime(timeStr) {
  const [time, period] = timeStr.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

const tasks = JSON.parse(fs.readFileSync('src/data/mockTasks.json', 'utf8'));
const resources = JSON.parse(fs.readFileSync('src/data/ResourceMock.json', 'utf8'));

function minsFromDate(d) {
  return d.getHours() * 60 + d.getMinutes();
}

function dateFromMins(mins) {
  const date = new Date();
  date.setHours(Math.floor(mins / 60), Math.round(mins % 60), 0, 0);
  return date;
}

// For each resource: schedule appointments as fixed, then fill gaps with non-appointment tasks sequentially
resources.forEach(r => {
  const rid = r.resourceId;
  let resTasks = tasks.filter(t => t.employeeId === rid && t.taskStatus === "Assigned (ACT)");
  if (resTasks.length === 0) return;

  // Split appointment vs non-appointment
  const appointmentTasks = [];
  const nonAppointmentTasks = [];

  resTasks.forEach(t => {
    const isAppointment = String(t.commitmentType || '').toLowerCase() === 'appointment' || Boolean(t.appointmentStartDate);
    if (isAppointment) appointmentTasks.push(t);
    else nonAppointmentTasks.push(t);
  });

  // Parse appointments and sort by start
  const appointmentEvents = appointmentTasks.map(t => {
    // Prefer explicit appointmentStartDate, fall back to expectedStartDate
    const s = t.appointmentStartDate || t.expectedStartDate || t.startDate;
    const start = new Date(s);
    const startMs = isNaN(start.getTime()) ? null : start.getTime();
    const durationMin = Number(t.estimatedDuration || 60);
    const endMs = startMs ? (startMs + durationMin * 60000) : null;
    return { task: t, startMs, endMs, durationMin };
  }).filter(e => e.startMs != null)
    .sort((a,b) => a.startMs - b.startMs);

  // We'll schedule non-appointments into available windows between shift start and appointment times
  const shiftStartMin = parseTime(r.shiftStart);
  const shiftEndMin = parseTime(r.shiftEnd);

  // Helper to compute travel minutes between two points
  function travelMinutes(lat1, lng1, lat2, lng2) {
    if (!lat1 || !lng1 || !lat2 || !lng2) return 0;
    const dist = haversineDistance(lat1, lng1, lat2, lng2);
    return (dist / 40) * 60;
  }

  // Keep pointer for scheduling in minutes from midnight
  let cursorMin = shiftStartMin;
  let prevLat = r.homeLat;
  let prevLng = r.homeLng;

  // Function to schedule one task at given cursorMin, considering travel from prevLat/prevLng
  function scheduleTaskAtCursor(task) {
    const travelMin = travelMinutes(prevLat, prevLng, task.lat, task.lng);
    let startMin = cursorMin + travelMin;
    const durationMin = Number(task.estimatedDuration || 60);
    // Ensure within shift
    if (startMin < shiftStartMin) startMin = shiftStartMin;
    const startDate = dateFromMins(startMin);
    task.expectedStartDate = startDate.toISOString();
    const finishDate = dateFromMins(startMin + durationMin);
    task.expectedFinishDate = finishDate.toISOString();

    // advance cursor and prev location
    cursorMin = startMin + durationMin;
    prevLat = task.lat || prevLat;
    prevLng = task.lng || prevLng;
  }

  // Iterate through appointment windows and fill gaps
  for (let ai = 0; ai <= appointmentEvents.length; ai++) {
    const nextAppt = appointmentEvents[ai];
    const windowEndMin = nextAppt && nextAppt.startMs ? minsFromDate(new Date(nextAppt.startMs)) : shiftEndMin;

    // Fill non-appointment tasks into [cursorMin, windowEndMin)
    while (nonAppointmentTasks.length > 0) {
      // Estimate if we can fit next task before window end
      const nextTask = nonAppointmentTasks[0];
      const travelMin = travelMinutes(prevLat, prevLng, nextTask.lat, nextTask.lng);
      const estStart = cursorMin + travelMin;
      const estEnd = estStart + Number(nextTask.estimatedDuration || 60);
      if (estEnd <= windowEndMin) {
        scheduleTaskAtCursor(nextTask);
        nonAppointmentTasks.shift();
      } else {
        break; // cannot fit before next appointment
      }
    }

    // If there's an appointment next, schedule it (respect its fixed start)
    if (nextAppt) {
      const t = nextAppt.task;
      if (nextAppt.startMs) {
        // set expectedStart/Finish to appointment times
        const startDate = new Date(nextAppt.startMs);
        const finishDate = new Date(nextAppt.endMs || (nextAppt.startMs + (nextAppt.durationMin || 60) * 60000));
        t.expectedStartDate = startDate.toISOString();
        t.expectedFinishDate = finishDate.toISOString();
        // move cursor to appointment end and set prev location to appointment location
        cursorMin = minsFromDate(finishDate);
        prevLat = t.lat || prevLat;
        prevLng = t.lng || prevLng;
      }
    }
  }

  // After appointments, schedule remaining non-appointment tasks sequentially
  while (nonAppointmentTasks.length > 0) {
    scheduleTaskAtCursor(nonAppointmentTasks.shift());
  }

});

// Write back
fs.writeFileSync('src/data/mockTasks.json', JSON.stringify(tasks, null, 2));

console.log('Tasks scheduled');
