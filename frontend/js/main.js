import { renderLayout } from './layout.js';
import { showMessage } from './ui.js';

renderLayout();
// Una página restaurada desde la caché del navegador debe consultar los datos actuales.
window.addEventListener('pageshow', (event) => { if (event.persisted) location.reload(); });

const pages = {
  home: ['./home.js', 'initHome'],
  vehiculos: ['./vehicles.js', 'initVehicles'],
  historial: ['./history.js', 'initHistory'],
  gastos: ['./expenses.js', 'initExpenses'],
  'anadir-mantenimiento': ['./maintenance-form.js', 'initMaintenanceForm'],
  ajustes: ['./settings.js', 'initSettings'],
};

try {
  const page = pages[document.body.dataset.page];
  if (page) {
    const module = await import(page[0]);
    await module[page[1]]();
  }
} catch (error) {
  const message = document.querySelector('#page-message, #home-message');
  if (message) showMessage(message, error.message || 'No se ha podido cargar la página. Vuelve a intentarlo.', 'error');
  document.querySelectorAll('[aria-busy]').forEach((node) => node.removeAttribute('aria-busy'));
}
