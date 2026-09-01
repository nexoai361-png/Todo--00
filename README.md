# Todo App

A single-page Todo app built with vanilla JS and ES modules, featuring a VS Code Dark+ aesthetic, Lucide icons, subtasks, notes, swipe gestures, and a command palette.

## Features

- Add, edit, delete, duplicate, and complete tasks
- Subtasks with inline editing
- Notes per task
- Categories: Work, Personal, Urgent, Shopping
- Priorities: Low, Medium, High
- Due dates with quick-select (Today, Tomorrow, +7d)
- Search with highlighting
- Filters: All, Active, Done
- Swipe-to-delete on mobile
- Context menu (long-press or right-click)
- Command palette (`Ctrl+K` / `Cmd+K`)
- Keyboard shortcuts (`Ctrl+N`, `Ctrl+F`, `Escape`)
- Undo delete via toast
- Progress bar
- Celebration animation when all tasks are done
- Export/Import JSON
- Android-first: safe-area insets, `100dvh`, touch targets ≥48px
- localStorage persistence

## Quick Start

Because the app uses ES modules, you must serve it over HTTP (not `file://`).

### Python (recommended)

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

### Node.js

```bash
npx serve . -p 8080
```

## Project Structure

```
index.html          HTML + CSS
js/
  main.js           Entry point
  store.js          State management + todo CRUD
  storage.js        localStorage read/write
  utils.js          Helpers: uid, esc, fmtDate, ago, hl, deepClone
  ui.js             Rendering: render, toast, context menu, celebration, edit
  events.js         Event listeners: click, touch, swipe, keyboard, search, filters
  commands.js       Command palette logic
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` / `Cmd+K` | Open command palette |
| `Ctrl+N` / `Cmd+N` | Focus new task input |
| `Ctrl+F` / `Cmd+F` | Toggle search |
| `Enter` | Add task / Save subtask |
| `Escape` | Close overlays / Cancel edit |

## Tech Stack

- HTML5 + CSS3
- Vanilla JavaScript (ES modules)
- Lucide icons
- localStorage

## Run in Termux (proot-ubuntu)

```bash
git clone https://github.com/nexoai361-png/Todo--00.git
cd Todo--00
python3 -m http.server 8080
# Open http://localhost:8080 in your Android browser
```

## License

MIT
