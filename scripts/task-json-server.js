/* Simple dev server to persist task edits to data/tasks.json

Run with:
  node scripts/task-json-server.js

It listens on port 4000 and accepts POST /save-task with body { taskId, updates }
*/

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'tasks.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({}, null, 2));

app.post('/save-task', (req, res) => {
  const { taskId, updates } = req.body || {};
  if (!taskId || !updates) return res.status(400).json({ error: 'taskId and updates required' });

  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const store = raw ? JSON.parse(raw) : {};
    const existing = store[taskId] || {};
    store[taskId] = { ...existing, ...updates, _updatedAt: new Date().toISOString() };
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
    return res.json({ ok: true, task: store[taskId] });
  } catch (err) {
    console.error('Error saving task', err);
    return res.status(500).json({ error: String(err) });
  }
});

app.get('/tasks/:id', (req, res) => {
  const id = req.params.id;
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const store = raw ? JSON.parse(raw) : {};
    return res.json({ task: store[id] || null });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`task-json-server listening on http://localhost:${port}`));
