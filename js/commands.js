import { getTodos, setCurrentFilter, importTodos } from './store.js';
import { render, showToast } from './ui.js';

let cmdIdx = 0;
let cmdItems = [];

export function openCommandPalette() {
  document.getElementById('commandOverlay').classList.add('active');
  document.getElementById('commandInput').value = '';
  document.getElementById('commandInput').focus();
  updateCommandList('');
  cmdIdx = 0;
}

export function closeCommandPalette() {
  document.getElementById('commandOverlay').classList.remove('active');
}

function getCommandItems() {
  return [
    { icon: '<i data-lucide="plus"></i>', label: 'New Task', a: 'new', s: 'Ctrl+N' },
    { icon: '<i data-lucide="search"></i>', label: 'Search', a: 'search', s: 'Ctrl+F' },
    { icon: '<i data-lucide="square-check"></i>', label: 'Clear Done', a: 'clear', s: '' },
    { icon: '<i data-lucide="layout-grid"></i>', label: 'Show All', a: 'f:all', s: '' },
    { icon: '<i data-lucide="circle-check"></i>', label: 'Show Active', a: 'f:active', s: '' },
    { icon: '<i data-lucide="circle-check"></i>', label: 'Show Done', a: 'f:completed', s: '' },
    { icon: '<i data-lucide="file-text"></i>', label: 'Export JSON', a: 'export', s: '' },
    { icon: '<i data-lucide="file-up"></i>', label: 'Import JSON', a: 'import', s: '' },
  ];
}

export function updateCommandList(q) {
  const list = document.getElementById('commandList');
  const l = q.toLowerCase();
  cmdItems = getCommandItems().filter((i) => !l || i.label.toLowerCase().includes(l));
  list.innerHTML = cmdItems
    .map(
      (i, idx) =>
        '<div class="command-palette__item' +
        (idx === cmdIdx ? ' selected' : '') +
        '" data-i="' +
        idx +
        '">' +
        i.icon +
        '<span>' +
        i.label +
        '</span>' +
        (i.s ? '<span class="command-palette__shortcut">' + i.s + '</span>' : '') +
        '</div>'
    )
    .join('');
  if (window.lucide) lucide.createIcons();
}

export function navigateCommand(direction) {
  const items = document.querySelectorAll('#commandList .command-palette__item');
  if (!items.length) return;
  cmdIdx = direction === 'down' ? Math.min(cmdIdx + 1, items.length - 1) : Math.max(cmdIdx - 1, 0);
  items.forEach((it, i) => it.classList.toggle('selected', i === cmdIdx));
}

export function executeSelectedCommand() {
  if (cmdItems[cmdIdx]) executeCommand(cmdItems[cmdIdx].a);
}

export function getCmdItems() {
  return cmdItems;
}

export function executeCommand(a) {
  closeCommandPalette();

  if (a === 'new') {
    document.getElementById('todoInput').focus();
  } else if (a === 'search') {
    document.getElementById('searchBtn').click();
  } else if (a === 'clear') {
    document.getElementById('clearCompletedBtn').click();
  } else if (a.startsWith('f:')) {
    const filter = a.split(':')[1];
    setCurrentFilter(filter);
    document.querySelectorAll('.filter-tab').forEach((t) => {
      t.classList.toggle('active', t.dataset.filter === filter);
    });
    render();
  } else if (a === 'export') {
    const d = JSON.stringify(getTodos(), null, 2);
    const b = new Blob([d], { type: 'application/json' });
    const u = URL.createObjectURL(b);
    const x = document.createElement('a');
    x.href = u;
    x.download = 'todos.json';
    x.click();
    URL.revokeObjectURL(u);
    showToast('Exported ' + getTodos().length + ' tasks');
  } else if (a === 'import') {
    const i = document.createElement('input');
    i.type = 'file';
    i.accept = '.json';
    i.onchange = (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = (ev) => {
        try {
          const d = JSON.parse(ev.target.result);
          if (importTodos(d)) {
            render();
            showToast('Imported ' + d.length + ' tasks');
          } else {
            showToast('Invalid format');
          }
        } catch {
          showToast('Import failed');
        }
      };
      r.readAsText(f);
    };
    i.click();
  }
}
