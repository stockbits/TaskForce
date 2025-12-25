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

// For each resource
resources.forEach(r => {
  const rid = r.resourceId;
  const resTasks = tasks.filter(t => t.employeeId === rid && t.taskStatus === "Assigned (ACT)");
  if (resTasks.length === 0) return;

  // Sort by importance
  resTasks.sort((a, b) => b.importanceScore - a.importanceScore);

  const shiftStartMin = parseTime(r.shiftStart);
  const shiftEndMin = parseTime(r.shiftEnd);

  let currentMin = shiftStartMin; // minutes from midnight

  // Travel from home to first task
  if (r.homeLat && r.homeLng && resTasks[0].lat && resTasks[0].lng) {
    const dist = haversineDistance(r.homeLat, r.homeLng, resTasks[0].lat, resTasks[0].lng);
    const travelMin = (dist / 40) * 60;
    currentMin += travelMin;
  }

  resTasks.forEach((task, i) => {
    // Set expectedStartDate
    const date = new Date();
    date.setHours(Math.floor(currentMin / 60), currentMin % 60, 0, 0);
    task.expectedStartDate = date.toISOString();

    // Add duration
    currentMin += task.estimatedDuration || 60;

    // Travel to next
    if (i < resTasks.length - 1) {
      const next = resTasks[i + 1];
      if (task.lat && task.lng && next.lat && next.lng) {
        const dist = haversineDistance(task.lat, task.lng, next.lat, next.lng);
        const travelMin = Math.min((dist / 40) * 60, 120); // cap at 2 hours
        currentMin += travelMin;
      } else {
        currentMin += 30; // default
      }
    }
  });
});

// Write back
fs.writeFileSync('src/data/mockTasks.json', JSON.stringify(tasks, null, 2));

console.log('Tasks scheduled');