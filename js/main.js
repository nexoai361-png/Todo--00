import { render } from './ui.js';
import { initEvents } from './events.js';

function bootstrap() {
  render();
  initEvents();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
