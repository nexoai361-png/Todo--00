import { uid, deepClone } from './utils.js';
import { loadTodos, saveTodos } from './storage.js';

let todos = loadTodos();
let editingId = null;
let currentFilter = 'all';
let searchQuery = '';
let lastDeleted = null;
let contextTargetId = null;
let expandedExpanded = false;
let selectedId = null;

export function getTodos() {
  return todos;
}

export function getEditingId() {
  return editingId;
}

export function setEditingId(id) {
  editingId = id;
}

export function getCurrentFilter() {
  return currentFilter;
}

export function setCurrentFilter(f) {
  currentFilter = f;
}

export function getSearchQuery() {
  return searchQuery;
}

export function setSearchQuery(q) {
  searchQuery = q;
}

export function getContextTargetId() {
  return contextTargetId;
}

export function setContextTargetId(id) {
  contextTargetId = id;
}

export function isExpandedExpanded() {
  return expandedExpanded;
}

export function setExpandedExpanded(v) {
  expandedExpanded = v;
}

export function getSelectedId() {
  return selectedId;
}

export function setSelectedId(id) {
  selectedId = id;
}

export function persist() {
  saveTodos(todos);
}

export function addTodo(text, category, priority, date) {
  if (!text.trim()) return;
  todos.unshift({
    id: uid(),
    text: text.trim(),
    completed: false,
    category: category || document.getElementById('categorySelect')?.value || 'work',
    priority: priority || document.getElementById('prioritySelect')?.value || 'low',
    date: date || window._selDate || '',
    notes: '',
    subtasks: [],
    createdAt: Date.now(),
    completedAt: null,
  });
  window._selDate = '';
  document.querySelectorAll('.input-area__date-btn').forEach((b) => b.classList.remove('active'));
  persist();
}

export function toggleTodo(id) {
  const t = todos.find((x) => x.id === id);
  if (!t) return;
  t.completed = !t.completed;
  t.completedAt = t.completed ? Date.now() : null;
  persist();
}

export function deleteTodo(id) {
  const t = todos.find((x) => x.id === id);
  if (!t) return null;
  const idx = todos.findIndex((x) => x.id === id);
  lastDeleted = { todo: deepClone(t), idx };
  persist();
  todos = todos.filter((x) => x.id !== id);
  return lastDeleted;
}

export function undoDelete() {
  if (!lastDeleted) return;
  todos.splice(lastDeleted.idx, 0, lastDeleted.todo);
  lastDeleted = null;
  persist();
}

export function duplicateTodo(id) {
  const t = todos.find((x) => x.id === id);
  if (!t) return;
  todos.unshift({
    id: uid(),
    text: t.text + ' (copy)',
    completed: false,
    category: t.category,
    priority: t.priority,
    date: t.date,
    notes: t.notes || '',
    subtasks: t.subtasks.map((s) => ({ id: uid(), text: s.text, completed: false })),
    createdAt: Date.now(),
    completedAt: null,
  });
  persist();
}

export function addSubtask(id, text) {
  if (!text.trim()) return;
  const t = todos.find((x) => x.id === id);
  if (!t) return;
  t.subtasks.push({ id: uid(), text: text.trim(), completed: false });
  persist();
}

export function toggleSubtask(id, sid) {
  const t = todos.find((x) => x.id === id);
  if (!t) return;
  const s = t.subtasks.find((x) => x.id === sid);
  if (!s) return;
  s.completed = !s.completed;
  persist();
}

export function deleteSubtask(id, sid) {
  const t = todos.find((x) => x.id === id);
  if (!t) return;
  t.subtasks = t.subtasks.filter((x) => x.id !== sid);
  persist();
}

export function editSubtask(id, sid, txt) {
  const t = todos.find((x) => x.id === id);
  if (!t) return;
  const s = t.subtasks.find((x) => x.id === sid);
  if (!s) return;
  if (txt.trim()) s.text = txt.trim();
  else t.subtasks = t.subtasks.filter((x) => x.id !== sid);
  persist();
}

export function saveNotes(id, txt) {
  const t = todos.find((x) => x.id === id);
  if (!t) return;
  t.notes = txt;
  persist();
}

export function clearCompleted() {
  const done = todos.filter((t) => t.completed);
  if (!done.length) return null;
  const snap = [...todos];
  todos = todos.filter((t) => !t.completed);
  persist();
  return snap;
}

export function restoreTodos(snapshot) {
  todos = snapshot;
  persist();
}

export function importTodos(data) {
  if (!Array.isArray(data)) return false;
  todos = data;
  persist();
  return true;
}

export function getAllTodos() {
  return todos;
}

export function getFilteredTodos() {
  let list = [...todos];
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(
      (t) =>
        t.text.toLowerCase().includes(q) ||
        (t.notes || '').toLowerCase().includes(q) ||
        t.subtasks.some((s) => s.text.toLowerCase().includes(q))
    );
  }
  if (currentFilter === 'active') list = list.filter((t) => !t.completed);
  else if (currentFilter === 'completed') list = list.filter((t) => t.completed);
  return list.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const p = { high: 0, medium: 1, low: 2 };
    if (a.priority !== b.priority) return p[a.priority] - p[b.priority];
    return b.createdAt - a.createdAt;
  });
}

export function getStats() {
  const active = todos.filter((t) => !t.completed).length;
  const done = todos.filter((t) => t.completed).length;
  return { total: todos.length, active, done };
}

export function allCompleted() {
  return todos.length > 0 && todos.every((x) => x.completed);
}
