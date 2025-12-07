#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', 'src', 'data', 'mockTasks.json');
const PORT = process.env.NOTES_PORT ? Number(process.env.NOTES_PORT) : 5179;

function readJson() {
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeJson(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function send(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    });
    return res.end();
  }

  if (req.url === '/health') {
    return send(res, 200, { ok: true });
  }

  if (req.url === '/progress-notes' && req.method === 'POST') {
    let buf = '';
    req.on('data', (chunk) => (buf += chunk));
    req.on('end', () => {
      try {
        const payload = JSON.parse(buf || '{}');
        const { taskId, text, taskStatus } = payload;
        if (!taskId || !text) {
          return send(res, 400, { error: 'taskId and text required' });
        }
        const data = readJson();
        const idx = data.findIndex((t) => t.taskId === taskId);
        if (idx === -1) {
          return send(res, 404, { error: 'Task not found' });
        }
        const ts = new Date().toISOString();
        const entry = { ts, status: taskStatus || data[idx].taskStatus || '', text };
        // Ensure progressNotes is an array for history
        const prev = data[idx].progressNotes;
        let arr;
        if (Array.isArray(prev)) arr = prev;
        else if (typeof prev === 'string' && prev.length) arr = [{ ts, status: data[idx].taskStatus || '', text: prev }];
        else arr = [];
        arr.push(entry);
        data[idx].progressNotes = arr;
        writeJson(data);
        return send(res, 200, { ok: true, entry });
      } catch (e) {
        return send(res, 500, { error: e.message });
      }
    });
    return;
  }

  send(res, 404, { error: 'not found' });
});

server.listen(PORT, () => {
  console.log(`Dev Notes server listening on http://localhost:${PORT}`);
});