import {
  getTodos,
  getFilteredTodos,
  getStats,
  getEditingId,
  setEditingId,
  isExpandedExpanded,
  getCurrentFilter,
  getSearchQuery,
  persist,
} from './store.js';
import { fmtDate, dateCls, ago, hl, esc } from './utils.js';

export function showToast(msg, undo) {
  const t = document.getElementById('toast');
  t.innerHTML = '';
  t.appendChild(document.createTextNode(msg));
  t.className = 'toast active';
  if (undo) {
    const b = document.createElement('button');
    b.className = 'toast__action';
    b.textContent = 'Undo';
    b.onclick = () => {
      undo();
      t.classList.remove('active');
    };
    t.appendChild(b);
  }
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('active'), 3500);
}

export function showContextMenu(x, y) {
  const m = document.getElementById('contextMenu');
  m.style.left = Math.min(x, window.innerWidth - 200) + 'px';
  m.style.top = Math.min(y, window.innerHeight - 220) + 'px';
  m.classList.add('active');
}

export function hideContextMenu() {
  document.getElementById('contextMenu').classList.remove('active');
}

export function showCelebration() {
  const c = document.getElementById('celebration');
  c.classList.add('active');
  setTimeout(() => c.classList.remove('active'), 1200);
}

function createTodoItem(t) {
  const d = document.createElement('div');
  d.className = 'todo-item' + (t.completed ? ' completed' : '');
  d.dataset.id = t.id;

  const searchQuery = getSearchQuery();
  const pb =
    t.priority !== 'low'
      ? '<div class="todo-item__priority todo-item__priority--' + t.priority + '"></div>'
      : '';
  const ds = fmtDate(t.date);
  const dc = dateCls(t.date);
  const sd = t.subtasks.filter((s) => s.completed).length;
  const st = t.subtasks.length;
  const hn = t.notes && t.notes.trim();

  d.innerHTML =
    pb +
    '<button class="todo-item__check" data-action="toggle" aria-label="' +
    (t.completed ? 'Mark incomplete' : 'Mark complete') +
    '"></button>' +
    '<div class="todo-item__content">' +
    '<div class="todo-item__text">' +
    hl(t.text, searchQuery) +
    '</div>' +
    '<div class="todo-item__meta">' +
    '<span class="todo-item__tag todo-item__tag--' +
    t.category +
    '">' +
    t.category +
    '</span>' +
    (ds
      ? '<span class="todo-item__date' +
        (dc ? ' ' + dc : '') +
        '">' +
        ds +
        '</span>'
      : '') +
    (st ? '<span class="todo-item__date">' + sd + '/' + st + '</span>' : '') +
    (t.completedAt
      ? '<span class="todo-item__timestamp">Done ' + ago(t.completedAt) + '</span>'
      : '<span class="todo-item__timestamp">' + ago(t.createdAt) + '</span>') +
    '</div>' +
    '<div class="todo-item__notes" data-field="notes">' +
    (hn ? esc(t.notes) : '') +
    '</div>' +
    '<div class="todo-item__subtasks">' +
    t.subtasks
      .map(
        (s) =>
          '<div class="subtask' +
          (s.completed ? ' completed' : '') +
          '" data-sid="' +
          s.id +
          '">' +
          '<button class="subtask__check" data-action="toggle-sub"></button>' +
          '<div class="subtask__text" data-action="edit-sub">' +
          esc(s.text) +
          '</div>' +
          '<button class="subtask__delete" data-action="del-sub" aria-label="Delete subtask"><i data-lucide="x"></i></button>' +
          '</div>'
      )
      .join('') +
    (t.completed
      ? ''
      : '<div class="subtask__add"><input type="text" class="subtask__add-input" placeholder="Add subtask..."><button class="subtask__add-btn" data-action="add-sub">+ Add</button></div>') +
    '</div></div>' +
    '<div class="todo-item__actions">' +
    '<button class="todo-item__action todo-item__action--expand" data-action="expand" aria-label="Expand"><i data-lucide="move-left"></i></button>' +
    '<button class="todo-item__action todo-item__action--edit" data-action="edit" aria-label="Edit"><i data-lucide="pencil"></i></button>' +
    '<button class="todo-item__action todo-item__action--duplicate" data-action="dup" aria-label="Duplicate"><i data-lucide="copy"></i></button>' +
    '<button class="todo-item__action todo-item__action--delete" data-action="del" aria-label="Delete"><i data-lucide="trash-2"></i></button>' +
    '</div>';
  return d;
}

export function render() {
  const list = document.getElementById('todoList');
  const empty = document.getElementById('emptyState');
  const compSec = document.getElementById('completedSection');
  const compItems = document.getElementById('completedItems');
  const counter = document.getElementById('counter');
  const prog = document.getElementById('progressBar');

  const f = getFilteredTodos();
  const stats = getStats();
  const searchQuery = getSearchQuery();
  const filter = getCurrentFilter();

  counter.textContent = stats.active + ' active';
  document.getElementById('countAll').textContent = stats.total;
  document.getElementById('countActive').textContent = stats.active;
  document.getElementById('countDone').textContent = stats.done;
  document.getElementById('completedCount').textContent = stats.done;
  prog.style.width = (stats.total ? Math.round((stats.done / stats.total) * 100) : 0) + '%';

  document.querySelectorAll('.filter-tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.filter === filter);
  });

  const activeF = f.filter((t) => !t.completed);
  const doneF = f.filter((t) => t.completed);

  if (!getTodos().length) {
    list.innerHTML = '';
    compSec.style.display = 'none';
    empty.classList.add('visible');
    empty.querySelector('.empty-state__text').textContent = 'No tasks yet';
    empty.querySelector('.empty-state__hint').textContent = 'Type above and press Enter to add';
    return;
  }

  if (!f.length) {
    list.innerHTML = '';
    compSec.style.display = 'none';
    empty.classList.add('visible');
    empty.querySelector('.empty-state__text').textContent = searchQuery
      ? 'No matching tasks'
      : 'No ' + filter + ' tasks';
    empty.querySelector('.empty-state__hint').textContent = '';
    return;
  }

  empty.classList.remove('visible');
  list.innerHTML = '';

  if (filter === 'all') {
    activeF.forEach((t) => list.appendChild(createTodoItem(t)));
    if (doneF.length) {
      compSec.style.display = 'block';
      compItems.innerHTML = '';
      if (isExpandedExpanded()) {
        doneF.forEach((t) => compItems.appendChild(createTodoItem(t)));
      }
      document.getElementById('completedSection').classList.toggle('expanded', isExpandedExpanded());
    } else {
      compSec.style.display = 'none';
    }
  } else {
    compSec.style.display = 'none';
    f.forEach((t) => list.appendChild(createTodoItem(t)));
  }

  if (getEditingId()) {
    const el = document.querySelector('[data-id="' + getEditingId() + '"] .todo-item__text');
    if (el && el.getAttribute('contenteditable') !== 'true') {
      startEdit(getEditingId());
    }
  }

  if (window.lucide) lucide.createIcons();
}

export function startEdit(id) {
  const t = getTodos().find((x) => x.id === id);
  if (!t) return;
  setEditingId(id);
  render();
  setTimeout(() => {
    const el = document.querySelector('[data-id="' + id + '"] .todo-item__text');
    if (!el) return;
    el.contentEditable = 'true';
    el.focus();
    const r = document.createRange();
    r.selectNodeContents(el);
    const s = window.getSelection();
    s.removeAllRanges();
    s.addRange(r);

    const saveFn = () => finishEdit(id);
    const keyFn = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        el.removeEventListener('keydown', keyFn);
        el.blur();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        el.removeEventListener('blur', saveFn);
        el.removeEventListener('keydown', keyFn);
        setEditingId(null);
        render();
      }
    };
    el.addEventListener('blur', saveFn, { once: true });
    el.addEventListener('keydown', keyFn);
  }, 50);
}

export function finishEdit(id) {
  setEditingId(null);
  const el = document.querySelector('[data-id="' + id + '"] .todo-item__text');
  if (el) el.contentEditable = 'false';
  const t = getTodos().find((x) => x.id === id);
  if (t) {
    const txt = el ? el.textContent.trim() : '';
    if (txt) {
      t.text = txt;
      persist();
    }
  }
  render();
}

export function expandTodo(id) {
  const el = document.querySelector('[data-id="' + id + '"]');
  if (el) el.classList.toggle('expanded');
}
