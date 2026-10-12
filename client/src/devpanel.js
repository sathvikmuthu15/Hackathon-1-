// Developer panel for the demo: task completion times and misread counts.
// Off by default. Stored only in this browser's localStorage. Never records content.

import { loadDev, saveDev } from './store.js';

const TASKS = [
  { id: 'home', label: 'Home flow (eyes closed)' },
  { id: 'bill', label: 'Read sample bill' },
  { id: 'label', label: 'Read sample medicine label' },
  { id: 'form', label: 'Complete sample form' },
];

let running = null; // { task, start }

export function renderDevPanel(root) {
  const data = loadDev();
  root.innerHTML = '';

  const h = document.createElement('h2');
  h.textContent = 'Developer panel';
  const note = document.createElement('p');
  note.textContent = 'Stored only on this device. Records times and counts, never content.';
  root.append(h, note);

  const sel = document.createElement('select');
  sel.id = 'dev-task';
  const lbl = document.createElement('label');
  lbl.htmlFor = 'dev-task';
  lbl.textContent = 'Task';
  for (const t of TASKS) {
    const o = document.createElement('option');
    o.value = t.id;
    o.textContent = t.label;
    sel.append(o);
  }
  const mode = document.createElement('select');
  mode.id = 'dev-mode';
  const mlbl = document.createElement('label');
  mlbl.htmlFor = 'dev-mode';
  mlbl.textContent = 'Method';
  for (const [v, l] of [['voice', 'Voice only (this app)'], ['baseline', 'Baseline (other method)']]) {
    const o = document.createElement('option');
    o.value = v;
    o.textContent = l;
    mode.append(o);
  }

  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  status.textContent = running ? `Timing: ${running.task}` : 'Not timing.';

  const start = button(running ? 'Stop timer' : 'Start timer', () => {
    if (running) {
      const ms = Date.now() - running.start;
      data.tasks.push({ task: running.task, mode: running.mode, ms, at: new Date().toISOString() });
      saveDev(data);
      running = null;
    } else {
      running = { task: sel.value, mode: mode.value, start: Date.now() };
    }
    renderDevPanel(root);
  });

  const misread = button('Add one misread for this task', () => {
    data.misreads[sel.value] = (data.misreads[sel.value] || 0) + 1;
    saveDev(data);
    renderDevPanel(root);
  });

  const exp = button('Download results (JSON)', () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'cantina-cuhh-timings.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  const clr = button('Clear dev data', () => {
    saveDev({ tasks: [], misreads: {} });
    renderDevPanel(root);
  });

  const table = document.createElement('table');
  table.innerHTML = '<caption>Results</caption><thead><tr><th scope="col">Task</th><th scope="col">Method</th><th scope="col">Runs</th><th scope="col">Average seconds</th><th scope="col">Misreads</th></tr></thead>';
  const tb = document.createElement('tbody');
  for (const t of TASKS) {
    for (const m of ['voice', 'baseline']) {
      const runs = data.tasks.filter((x) => x.task === t.id && (x.mode || 'voice') === m);
      if (!runs.length && m === 'baseline') continue;
      const avg = runs.length ? (runs.reduce((s, r) => s + r.ms, 0) / runs.length / 1000).toFixed(1) : '–';
      const tr = document.createElement('tr');
      tr.innerHTML = `<th scope="row">${t.label}</th><td>${m}</td><td>${runs.length}</td><td>${avg}</td><td>${m === 'voice' ? data.misreads[t.id] || 0 : '–'}</td>`;
      tb.append(tr);
    }
  }
  table.append(tb);

  root.append(lbl, sel, mlbl, mode, status, start, misread, exp, clr, table);
}

function button(text, onClick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = text;
  b.addEventListener('click', onClick);
  return b;
}
