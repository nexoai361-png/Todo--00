import {
  addTodo,
  toggleTodo,
  deleteTodo,
  undoDelete,
  duplicateTodo,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  editSubtask,
  saveNotes,
  clearCompleted,
  restoreTodos,
  setSearchQuery,
  setCurrentFilter,
  setContextTargetId,
  setExpandedExpanded,
  getContextTargetId,
  isExpandedExpanded,
  allCompleted,
  getTodos,
} from './store.js';
import { addDays } from './utils.js';
import {
  render,
  showToast,
  showContextMenu,
  hideContextMenu,
  showCelebration,
  startEdit,
  expandTodo,
} from './ui.js';
import {
  openCommandPalette,
  closeCommandPalette,
  updateCommandList,
  navigateCommand,
  executeSelectedCommand,
  executeCommand,
  getCmdItems,
} from './commands.js';

export function initEvents() {
  document.getElementById('addBtn').addEventListener('click', handleAdd);
  document.getElementById('todoInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAdd();
  });

  document.getElementById('todoList').addEventListener('click', handleTodoListClick);
  document.getElementById('todoList').addEventListener('keydown', handleTodoListKeydown);
  document.getElementById('todoList').addEventListener('dblclick', handleTodoListDblClick);

  initTouchHandlers();
  initContextMenu();
  initSearch();
  initFilters();
  initClearCompleted();
  initDateButtons();
  initCompletedSection();
  initCommandPalette();
  initKeyboardShortcuts();
  initSwipeToDelete();
}

function handleAdd() {
  const el = document.getElementById('todoInput');
  const text = el.value;
  if (!text.trim()) return;
  addTodo(text);
  render();
  el.value = '';
  el.focus();
}

function handleTodoListClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const item = btn.closest('.todo-item');
  if (!item) return;
  const id = item.dataset.id;
  const a = btn.dataset.action;

  if (a === 'toggle') {
    toggleTodo(id);
    render();
    if (allCompleted()) {
      setTimeout(() => showCelebration(), 300);
    }
  } else if (a === 'edit') {
    startEdit(id);
  } else if (a === 'del') {
    const el = document.querySelector('[data-id="' + id + '"]');
    if (el) el.classList.add('deleting');
    deleteTodo(id);
    showToast('Task deleted', () => {
      undoDelete();
      render();
    });
    setTimeout(() => render(), 250);
  } else if (a === 'dup') {
    duplicateTodo(id);
    render();
    showToast('Task duplicated');
  } else if (a === 'expand') {
    expandTodo(id);
  } else if (a === 'add-sub') {
    const inp = btn.parentElement.querySelector('.subtask__add-input');
    if (inp && inp.value.trim()) {
      addSubtask(id, inp.value);
      inp.value = '';
      render();
      setTimeout(() => {
        const i = document.querySelector('[data-id="' + id + '"] .subtask__add-input');
        if (i) i.focus();
      }, 50);
    }
  } else if (a === 'toggle-sub') {
    const s = e.target.closest('.subtask');
    if (s) {
      toggleSubtask(id, s.dataset.sid);
      render();
    }
  } else if (a === 'del-sub') {
    const s = e.target.closest('.subtask');
    if (s) {
      deleteSubtask(id, s.dataset.sid);
      render();
    }
  } else if (a === 'edit-sub') {
    const s = e.target.closest('.subtask');
    if (s && !s.querySelector('.subtask__text').isContentEditable) {
      const el = s.querySelector('.subtask__text');
      el.contentEditable = 'true';
      el.focus();
      el.classList.add('editing');
      const orig = el.textContent;

      const kh = (e2) => {
        if (e2.key === 'Enter') {
          e2.preventDefault();
          el.blur();
        }
        if (e2.key === 'Escape') {
          e2.preventDefault();
          el.textContent = orig;
          el.contentEditable = 'false';
          el.classList.remove('editing');
          el.removeEventListener('keydown', kh);
          el.removeEventListener('blur', bh);
        }
      };

      const bh = () => {
        el.contentEditable = 'false';
        el.classList.remove('editing');
        editSubtask(id, s.dataset.sid, el.textContent);
        el.removeEventListener('keydown', kh);
        el.removeEventListener('blur', bh);
        render();
      };

      el.addEventListener('keydown', kh);
      el.addEventListener('blur', bh);
    }
  }
}

function handleTodoListKeydown(e) {
  if (e.key === 'Enter' && e.target.classList.contains('subtask__add-input')) {
    const item = e.target.closest('.todo-item');
    if (item) {
      e.preventDefault();
      addSubtask(item.dataset.id, e.target.value);
      e.target.value = '';
      render();
    }
  }
}

function handleTodoListDblClick(e) {
  const t = e.target.closest('.todo-item__text');
  if (t) {
    const i = t.closest('.todo-item');
    if (i) startEdit(i.dataset.id);
    return;
  }

  const n = e.target.closest('.todo-item__notes');
  if (n && !n.isContentEditable) {
    const i = n.closest('.todo-item');
    if (!i) return;
    n.contentEditable = 'true';
    n.focus();
    n.classList.add('editing');
    const orig = n.textContent;

    const bh = () => {
      n.contentEditable = 'false';
      n.classList.remove('editing');
      saveNotes(i.dataset.id, n.textContent.trim());
      n.removeEventListener('blur', bh);
      n.removeEventListener('keydown', kh);
    };

    const kh = (e2) => {
      if (e2.key === 'Enter' && !e2.shiftKey) {
        e2.preventDefault();
        n.blur();
      }
      if (e2.key === 'Escape') {
        e2.preventDefault();
        n.textContent = orig;
        n.contentEditable = 'false';
        n.classList.remove('editing');
        n.removeEventListener('blur', bh);
        n.removeEventListener('keydown', kh);
      }
    };

    n.addEventListener('blur', bh);
    n.addEventListener('keydown', kh);
  }
}

function initTouchHandlers() {
  let lpTimer = null;

  document.getElementById('todoList').addEventListener(
    'touchstart',
    (e) => {
      const i = e.target.closest('.todo-item');
      if (!i) return;
      lpTimer = setTimeout(() => {
        setContextTargetId(i.dataset.id);
        showContextMenu(e.touches[0].clientX, e.touches[0].clientY);
      }, 500);
    },
    { passive: true }
  );

  document.getElementById('todoList').addEventListener('touchend', () => clearTimeout(lpTimer));
  document.getElementById('todoList').addEventListener('touchmove', () => clearTimeout(lpTimer));

  document.getElementById('todoList').addEventListener('contextmenu', (e) => {
    const i = e.target.closest('.todo-item');
    if (!i) return;
    e.preventDefault();
    setContextTargetId(i.dataset.id);
    showContextMenu(e.clientX, e.clientY);
  });
}

function initContextMenu() {
  document.querySelectorAll('.context-menu__item').forEach((el) => {
    el.addEventListener('click', () => {
      const id = getContextTargetId();
      if (!id) return;
      const a = el.dataset.action;
      if (a === 'toggle') {
        toggleTodo(id);
        render();
      } else if (a === 'edit') {
        startEdit(id);
      } else if (a === 'duplicate') {
        duplicateTodo(id);
        render();
        showToast('Task duplicated');
      } else if (a === 'delete') {
        deleteTodo(id);
        showToast('Task deleted', () => {
          undoDelete();
          render();
        });
        setTimeout(() => render(), 250);
      }
      hideContextMenu();
      setContextTargetId(null);
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.context-menu')) hideContextMenu();
  });
}

function initSearch() {
  document.getElementById('searchBtn').addEventListener('click', () => {
    const bar = document.getElementById('searchBar');
    bar.classList.toggle('active');
    if (bar.classList.contains('active')) {
      document.getElementById('searchInput').focus();
    } else {
      setSearchQuery('');
      document.getElementById('searchInput').value = '';
      render();
    }
  });

  document.getElementById('searchInput').addEventListener('input', (e) => {
    setSearchQuery(e.target.value);
    render();
  });
}

function initFilters() {
  document.querySelectorAll('.filter-tab').forEach((t) => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach((x) => x.classList.remove('active'));
      t.classList.add('active');
      setCurrentFilter(t.dataset.filter);
      render();
    });
  });
}

function initClearCompleted() {
  document.getElementById('clearCompletedBtn').addEventListener('click', () => {
    const snap = clearCompleted();
    if (!snap) return;
    render();
    showToast(getTodos().length + ' cleared', () => {
      restoreTodos(snap);
      render();
    });
  });
}

function initDateButtons() {
  document.querySelectorAll('.input-area__date-btn').forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.input-area__date-btn').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      window._selDate = addDays(parseInt(b.dataset.days));
    });
  });
}

function initCompletedSection() {
  document.getElementById('completedHeader').addEventListener('click', () => {
    setExpandedExpanded(!isExpandedExpanded());
    render();
  });
}

function initCommandPalette() {
  document.getElementById('moreBtn').addEventListener('click', openCommandPalette);

  document.getElementById('commandOverlay').addEventListener('click', function (e) {
    if (e.target === this) closeCommandPalette();
  });

  document.getElementById('commandInput').addEventListener('input', (e) => {
    updateCommandList(e.target.value);
  });

  document.getElementById('commandList').addEventListener('click', (e) => {
    const i = e.target.closest('.command-palette__item');
    if (!i) return;
    const idx = parseInt(i.dataset.i);
    const items = getCmdItems();
    if (items[idx]) executeCommand(items[idx].a);
  });
}

function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.isContentEditable) return;

    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openCommandPalette();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      document.getElementById('todoInput').focus();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      document.getElementById('searchBtn').click();
    }
    if (e.key === 'Escape') {
      if (document.getElementById('commandOverlay').classList.contains('active')) {
        closeCommandPalette();
      } else {
        document.getElementById('searchBar').classList.remove('active');
        setSearchQuery('');
        document.getElementById('searchInput').value = '';
        render();
        hideContextMenu();
      }
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      navigateCommand(e.key === 'ArrowDown' ? 'down' : 'up');
      e.preventDefault();
    }
    if (e.key === 'Enter' && document.getElementById('commandOverlay').classList.contains('active')) {
      executeSelectedCommand();
    }
  });
}

function initSwipeToDelete() {
  let tx = 0;

  document.getElementById('todoList').addEventListener(
    'touchstart',
    (e) => {
      const i = e.target.closest('.todo-item');
      if (i) {
        tx = e.touches[0].clientX;
        i.dataset.sx = tx;
      }
    },
    { passive: true }
  );

  document.getElementById('todoList').addEventListener(
    'touchmove',
    (e) => {
      const i = e.target.closest('.todo-item');
      if (!i) return;
      const d = e.touches[0].clientX - parseInt(i.dataset.sx || 0);
      if (d < 0) i.style.transform = 'translateX(' + Math.max(d, -100) + 'px)';
    },
    { passive: true }
  );

  document.getElementById('todoList').addEventListener('touchend', (e) => {
    const i = e.target.closest('.todo-item');
    if (!i) return;
    const d = e.changedTouches[0].clientX - parseInt(i.dataset.sx || 0);
    i.style.transform = '';
    if (d < -60) {
      const id = i.dataset.id;
      deleteTodo(id);
      showToast('Task deleted', () => {
        undoDelete();
        render();
      });
      setTimeout(() => render(), 250);
    }
  });
}
