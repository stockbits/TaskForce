#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const file = path.join(__dirname, '..', 'src', 'data', 'mockTasks.json');

const raw = fs.readFileSync(file, 'utf-8');
let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  console.error('Failed to parse mockTasks.json:', e.message);
  process.exit(1);
}

if (!Array.isArray(data)) {
  console.error('mockTasks.json is not an array');
  process.exit(1);
}

const sampleField = (t) => {
  const pc = t.postCode ? `Postcode ${t.postCode}` : "Unknown postcode";
  const type = t.taskType ? `Type ${t.taskType}` : "Unknown type";
  const skill = t.primarySkill ? `Skill ${t.primarySkill}` : "Unknown skill";
  return `On-site observation:\n- ${pc}\n- ${type}\n- ${skill}\nActions:\n- Verified equipment and recorded measurements\n- Spoke with resident; confirmed access\nNotes:\n- Minor obstruction near DP; requires follow-up.`;
};

const buildProgressNotes = (t) => {
  if (Array.isArray(t.progressNotes) && t.progressNotes.length) {
    return t.progressNotes;
  }
  if (typeof t.progressNotes === 'string' && t.progressNotes.trim()) {
    const ts = new Date().toISOString();
    return [
      {
        ts,
        status: t.taskStatus || '',
        text: t.progressNotes.trim(),
        source: 'Imported',
      },
    ];
  }

  const baseTs = new Date().toISOString();
  return [
    {
      ts: baseTs,
      status: t.taskStatus || 'Logged',
      text: 'Initial site review captured from legacy system.',
      source: 'System',
    },
    {
      ts: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      status: t.taskStatus || 'Follow-up',
      text: 'Awaiting confirmation from field engineer regarding access.',
      source: 'Dispatcher',
    },
  ];
};

const updated = data.map((t) => ({
  ...t,
  fieldNotes: t.fieldNotes && t.fieldNotes.length ? t.fieldNotes : sampleField(t),
  progressNotes: buildProgressNotes(t),
}));

fs.writeFileSync(file, JSON.stringify(updated, null, 2) + '\n', 'utf-8');
console.log('Updated mockTasks.json with fieldNotes and progressNotes');
