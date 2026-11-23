import { getVehicles } from './services/vehicles.js';
import { getPreferences, savePreferences, defaultPreferences } from './services/preferences.js';
import { fillVehicles, showMessage, focusMessage } from './ui.js';

export async function initSettings() {
  const form = document.querySelector('#preferences-form');
  const message = document.querySelector('#page-message');
  const reset = document.querySelector('#reset-preferences');
  showMessage(message, 'Cargando tus preferencias…', 'info');
  const vehicles = await getVehicles();
  const preferences = getPreferences();
  fillVehicles(form.elements.vehicle, vehicles, { prompt: 'Sin vehículo predeterminado', selected: preferences.vehicle });
  form.elements.sort.value = preferences.sort;
  document.querySelector('#preferences-fields').disabled = reset.disabled = document.querySelector('#save-preferences').disabled = false;
  showMessage(message);

  function persist(data, text) {
    try {
      savePreferences(data);
      form.elements.vehicle.value = data.vehicle;
      form.elements.sort.value = data.sort;
      showMessage(message, text);
    } catch {
      showMessage(message, 'No se han podido guardar las preferencias. Comprueba que el navegador permite el almacenamiento local.', 'error');
    }
    focusMessage(message);
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    persist(Object.fromEntries(new FormData(form)), 'Preferencias guardadas. Se aplicarán al abrir el historial, los gastos y el formulario de mantenimiento.');
  });
  reset.addEventListener('click', () => persist({ ...defaultPreferences }, 'Se han restablecido las preferencias predeterminadas.'));
}
