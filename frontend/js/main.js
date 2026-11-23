import { renderLayout } from './layout.js';

renderLayout();

if (document.body.dataset.page === 'home') {
  const { initHome } = await import('./home.js');
  initHome();
}
