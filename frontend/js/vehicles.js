import { getVehicles, saveVehicle, deleteVehicle } from './services/vehicles.js';
import { element, iconElement, number, money, formatDate, formatMileage, showMessage, focusMessage,
  checkForm, clearFormErrors, showFormErrors, createDeleteDialog } from './ui.js';

function vehicleCard(vehicle) {
  const card = element('article', 'panel vehicle-card');
  const top = element('div', 'vehicle-card-heading');
  const title = element('div');
  title.append(element('h3', '', vehicle.name), element('p', 'metadata', vehicle.type));
  top.append(iconElement(vehicle.type.toLowerCase() === 'moto' ? 'bike' : 'car', 'empty-icon'), title);
  const metrics = element('dl', 'vehicle-metrics');
  for (const [label, value] of [
    ['Mantenimientos', number.format(vehicle.maintenanceCount)], ['Gasto total', money(vehicle.totalCostInCents)],
    ['Último registro', formatDate(vehicle.latestDate)], ['Kilometraje registrado', vehicle.mileage === null ? 'Sin registros' : formatMileage(vehicle.mileage)],
  ]) {
    const item = element('div');
    item.append(element('dt', 'metadata', label), element('dd', '', value));
    metrics.append(item);
  }
  const actions = element('div', 'vehicle-card-actions');
  const add = element('a', 'button button-secondary', 'Añadir mantenimiento');
  add.href = `/anadir-mantenimiento.html?vehicle=${encodeURIComponent(vehicle.id)}`;
  const history = element('a', 'text-link', 'Ver historial');
  history.href = `/historial.html?vehicle=${encodeURIComponent(vehicle.id)}`;
  actions.append(add, history);
  const footer = element('div', 'vehicle-card-footer');
  for (const [action, label, className] of [['edit', 'Editar', 'text-link'], ['delete', 'Eliminar', 'text-link text-danger']]) {
    const button = element('button', className, label);
    button.type = 'button';
    button.dataset[`${action}Vehicle`] = vehicle.id;
    button.setAttribute('aria-label', `${label} ${vehicle.name}, matrícula ${vehicle.plate}`);
    footer.append(button);
  }
  card.append(top, element('span', 'plate-badge', vehicle.plate), metrics, actions, footer);
  return card;
}

export async function initVehicles() {
  const grid = document.querySelector('#vehicle-grid');
  const empty = document.querySelector('#vehicles-empty');
  const message = document.querySelector('#page-message');
  const editor = document.querySelector('#vehicle-editor');
  const form = document.querySelector('#vehicle-form');
  const fields = document.querySelector('#vehicle-fields');
  const formMessage = document.querySelector('#form-message');
  const add = document.querySelector('#add-vehicle');
  const cancel = document.querySelector('#cancel-vehicle');
  const save = document.querySelector('#save-vehicle');
  let vehicles = [];
  let editingId = null;
  let saving = false;

  function openEditor(vehicle = null) {
    if (saving) return;
    editingId = vehicle?.id || null;
    form.reset();
    clearFormErrors(form);
    showMessage(formMessage);
    for (const name of ['name', 'type', 'plate']) form.elements.namedItem(name).value = vehicle?.[name] || '';
    document.querySelector('#editor-title').textContent = vehicle ? 'Editar vehículo' : 'Añadir vehículo';
    save.textContent = vehicle ? 'Guardar cambios' : 'Guardar vehículo';
    editor.hidden = false;
    form.elements.namedItem('name').focus();
    editor.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function closeEditor() {
    editor.hidden = true;
    editingId = null;
    add.focus();
  }

  async function load() {
    showMessage(message, 'Cargando tus vehículos…', 'info');
    grid.setAttribute('aria-busy', 'true');
    try {
      vehicles = await getVehicles();
      grid.replaceChildren(...vehicles.map(vehicleCard));
      empty.hidden = vehicles.length > 0;
      document.querySelector('#vehicles-count').textContent = `${number.format(vehicles.length)} ${vehicles.length === 1 ? 'vehículo' : 'vehículos'}`;
      add.disabled = false;
      showMessage(message);
    } catch (error) {
      grid.replaceChildren();
      empty.hidden = true;
      document.querySelector('#vehicles-count').textContent = 'No se ha podido cargar el garaje';
      showMessage(message, error.message, 'error');
      throw error;
    } finally { grid.removeAttribute('aria-busy'); }
  }

  const dialog = createDeleteDialog({ kind: 'vehículo', message, onConfirm: async (vehicle) => {
    await deleteVehicle(vehicle.id);
    if (editingId === vehicle.id) closeEditor();
    if (await load().then(() => true, () => false)) showMessage(message, 'Vehículo eliminado correctamente.');
  } });

  add.addEventListener('click', () => openEditor());
  document.querySelector('#add-first-vehicle').addEventListener('click', () => openEditor());
  cancel.addEventListener('click', closeEditor);
  grid.addEventListener('click', (event) => {
    if (saving) return;
    const button = event.target.closest('[data-edit-vehicle], [data-delete-vehicle]');
    if (!button) return;
    const vehicle = vehicles.find((item) => item.id === (button.dataset.editVehicle || button.dataset.deleteVehicle));
    if (!vehicle) return;
    if (button.dataset.editVehicle) openEditor(vehicle);
    else dialog.open(vehicle);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (saving) return;
    showMessage(formMessage);
    if (!checkForm(form)) {
      showMessage(formMessage, 'Revisa los campos indicados antes de guardar.', 'error');
      return;
    }
    const data = Object.fromEntries(new FormData(form));
    saving = true;
    fields.disabled = save.disabled = cancel.disabled = add.disabled = true;
    save.textContent = 'Guardando…';
    let saved = false;
    try {
      await saveVehicle(editingId, data);
      saved = true;
    } catch (error) {
      showMessage(formMessage, error.message, 'error');
      // Activar los controles antes de enfocar el primer error.
      fields.disabled = false;
      showFormErrors(form, error.fields);
      if (!Object.keys(error.fields || {}).length) focusMessage(formMessage);
    } finally {
      saving = false;
      fields.disabled = save.disabled = cancel.disabled = add.disabled = false;
      save.textContent = editingId ? 'Guardar cambios' : 'Guardar vehículo';
    }
    if (saved) {
      closeEditor();
      if (await load().then(() => true, () => false)) showMessage(message, 'Vehículo guardado correctamente.');
      focusMessage(message);
    }
  });

  await load();
  if (new URLSearchParams(location.search).get('new') === '1') openEditor();
}
