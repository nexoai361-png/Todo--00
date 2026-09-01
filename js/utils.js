export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

export function today() {
  return new Date().toISOString().split('T')[0];
}

export function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export function ago(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

export function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  const n = new Date(today() + 'T00:00:00');
  const diff = Math.floor((dt - n) / 864e5);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff < -1) return Math.abs(diff) + 'd overdue';
  if (diff <= 7) return diff + 'd left';
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function dateCls(d) {
  if (!d) return '';
  const t = today();
  if (d < t) return 'overdue';
  if (d === t) return 'today';
  return '';
}

export function hl(text, q) {
  if (!q) return esc(text);
  const l = text.toLowerCase();
  const i = l.indexOf(q.toLowerCase());
  if (i === -1) return esc(text);
  return (
    esc(text.slice(0, i)) +
    '<span class="todo-item__text-highlight">' +
    esc(text.slice(i, i + q.length)) +
    '</span>' +
    esc(text.slice(i + q.length))
  );
}

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
