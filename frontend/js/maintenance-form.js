import { getVehicles } from './services/vehicles.js';
import { getMaintenance, saveMaintenance } from './services/maintenances.js';
import { getPreferences } from './services/preferences.js';
import { fillVehicles, showMessage, focusMessage, checkForm, showFormErrors, parseCost, today, setFlash } from './ui.js';

export async function initMaintenanceForm() {
  const form = document.querySelector('#maintenance-form');
  const fields = document.querySelector('#maintenance-fields');
  const save = document.querySelector('#save-maintenance');
  const cancel = document.querySelector('#cancel-maintenance');
  const message = document.querySelector('#page-message');
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  let saving = false;
  if (id) {
    document.title = 'Editar mantenimiento · AutoRegistro';
    document.querySelector('#maintenance-title').textContent = 'Editar mantenimiento';
    document.querySelector('#maintenance-description').textContent = 'Actualiza los detalles de este registro de tu historial.';
    save.lastChild.textContent = 'Guardar cambios';
  }
  showMessage(message, 'Cargando los datos del formulario…', 'info');
  const [vehicles, record] = await Promise.all([getVehicles(), id ? getMaintenance(id) : null]);
  const selected = record?.vehicle?.id || params.get('vehicle') || getPreferences().vehicle;
  fillVehicles(form.elements.vehicle, vehicles, { prompt: 'Selecciona un vehículo', selected });
  if (!vehicles.length) {
    showMessage(message, 'Añade primero un vehículo desde la página Vehículos para poder registrar un mantenimiento.', 'info');
    return;
  }
  form.elements.date.value = record?.date || today();
  if (record) {
    form.elements.operation.value = record.operation;
    form.elements.mileage.value = record.mileage;
    form.elements.costInCents.value = `${Math.floor(record.costInCents / 100)},${String(record.costInCents % 100).padStart(2, '0')}`;
  }
  fields.disabled = save.disabled = false;
  showMessage(message);

  cancel.addEventListener('click', (event) => { if (saving) event.preventDefault(); });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (saving) return;
    showMessage(message);
    const valid = checkForm(form);
    const cost = parseCost(form.elements.costInCents.value);
    const mileage = Number(form.elements.mileage.value);
    const errors = {};
    if (cost === null) errors.costInCents = 'Introduce un importe no negativo con un máximo de dos decimales.';
    if (!Number.isSafeInteger(mileage) || mileage < 0) errors.mileage = 'Introduce un kilometraje entero igual o mayor que 0.';
    if (!valid || Object.keys(errors).length) {
      showFormErrors(form, errors);
      showMessage(message, 'Hay campos con errores. Corrígelos para continuar.', 'error');
      return;
    }
    const payload = {
      vehicle: form.elements.vehicle.value, operation: form.elements.operation.value.trim(),
      date: form.elements.date.value, mileage, costInCents: cost,
    };
    saving = true;
    fields.disabled = save.disabled = true;
    cancel.setAttribute('aria-disabled', 'true');
    save.textContent = 'Guardando…';
    try {
      await saveMaintenance(id, payload);
      setFlash(id ? 'Los cambios del mantenimiento se han guardado correctamente.' : 'Mantenimiento guardado correctamente.');
      location.assign(`/historial.html?vehicle=${encodeURIComponent(payload.vehicle)}`);
    } catch (error) {
      showMessage(message, error.message, 'error');
      fields.disabled = false;
      showFormErrors(form, error.fields);
      if (!Object.keys(error.fields || {}).length) focusMessage(message);
      saving = false;
      fields.disabled = save.disabled = false;
      cancel.removeAttribute('aria-disabled');
      save.textContent = id ? 'Guardar cambios' : 'Guardar mantenimiento';
    }
  });
}
