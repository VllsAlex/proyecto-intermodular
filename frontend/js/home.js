import { icon } from './icons.js';
import { STORAGE_KEY, getMaintenances, deleteMaintenance, getMaintenanceSummary } from './services/maintenances.js';

const currency = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const number = new Intl.NumberFormat('es-ES', { useGrouping: 'always', maximumFractionDigits: 2 });
const date = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
const formatDate = (value) => date.format(new Date(`${value}T12:00:00`));
const formatMileage = (value) => `${number.format(value)} km`;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function iconElement(name, className) {
  const node = element('span', className);
  node.innerHTML = icon(name);
  return node;
}

function vehicleDetails(record) {
  return `${record.vehicle.type} · ${record.vehicle.plate}`;
}

function recordActions(record) {
  const actions = element('div', 'record-actions');
  const edit = element('a', 'text-link', 'Editar');
  edit.href = `/anadir-mantenimiento.html?id=${encodeURIComponent(record.id)}`;
  edit.setAttribute('aria-label', `Editar ${record.operation} de ${record.vehicle.name}`);
  const remove = element('button', 'text-link text-danger', 'Eliminar');
  remove.type = 'button';
  remove.dataset.deleteId = String(record.id);
  remove.setAttribute('aria-label', `Eliminar ${record.operation} de ${record.vehicle.name}`);
  actions.append(edit, remove);
  return actions;
}

function recordRow(record) {
  const row = element('tr');
  const vehicle = element('td');
  vehicle.append(element('span', 'vehicle-name', record.vehicle.name), element('span', 'metadata', vehicleDetails(record)));
  const actions = element('td');
  actions.append(recordActions(record));
  row.append(vehicle, element('td', 'operation-cell', record.operation), element('td', 'nowrap', formatDate(record.date)),
    element('td', 'nowrap', formatMileage(record.mileage)), element('td', 'numeric nowrap cost-cell', currency.format(record.cost)), actions);
  return row;
}

function recordCard(record) {
  const card = element('article', 'maintenance-card');
  const heading = element('h3', '', record.operation);
  const details = element('p', 'metadata', `${record.vehicle.name} · ${vehicleDetails(record)}`);
  const dateAndCost = element('div', 'card-date-cost');
  dateAndCost.append(element('span', '', formatDate(record.date)), element('strong', '', currency.format(record.cost)));
  card.append(heading, details, dateAndCost, element('p', 'metadata', formatMileage(record.mileage)), recordActions(record));
  return card;
}

function renderLatest(container, record) {
  const title = element('div', 'latest-details');
  title.append(element('h3', '', record.operation), element('p', 'metadata', `${record.vehicle.name} · ${vehicleDetails(record)}`));
  const details = element('div', 'latest-metrics');
  for (const [label, value] of [['Fecha', formatDate(record.date)], ['Kilometraje', formatMileage(record.mileage)], ['Coste', currency.format(record.cost)]]) {
    const metric = element('div');
    metric.append(element('span', 'metadata', label), element('strong', '', value));
    details.append(metric);
  }
  container.replaceChildren(iconElement('check', 'empty-icon success-icon'), title, details);
}

export function initHome() {
  const latest = document.querySelector('#latest-maintenance');
  const initialLatest = latest.cloneNode(true);
  const recentRecords = document.querySelector('#recent-records');
  const recentEmpty = document.querySelector('#recent-empty');
  const message = document.querySelector('#home-message');
  const dialog = document.querySelector('#delete-dialog');
  let records = [];
  let pendingDelete = null;

  function showMessage(text, isError = false) {
    message.textContent = text;
    message.className = `message ${isError ? 'message-error' : 'message-success'}`;
    message.hidden = !text;
  }

  function render() {
    try {
      records = getMaintenances();
      const summary = getMaintenanceSummary(records);
      document.querySelector('#vehicle-count').textContent = number.format(summary.vehicleCount);
      document.querySelector('#maintenance-count').textContent = number.format(summary.maintenanceCount);
      document.querySelector('#total-cost').textContent = currency.format(summary.totalCost);
      if (summary.latest) {
        renderLatest(latest, summary.latest);
      } else {
        latest.replaceChildren(...Array.from(initialLatest.childNodes, (node) => node.cloneNode(true)));
      }
      recentEmpty.hidden = records.length > 0;
      recentRecords.hidden = records.length === 0;
      document.querySelector('#maintenance-rows').replaceChildren(...summary.recent.map(recordRow));
      document.querySelector('#maintenance-cards').replaceChildren(...summary.recent.map(recordCard));
      document.querySelector('#recent-count').textContent = `${summary.recent.length} de ${summary.maintenanceCount} registros`;
      return true;
    } catch {
      records = [];
      for (const id of ['vehicle-count', 'maintenance-count', 'total-cost']) document.getElementById(id).textContent = '—';
      latest.replaceChildren(element('p', 'metadata', 'No se ha podido consultar el último mantenimiento.'));
      recentRecords.hidden = true;
      recentEmpty.hidden = true;
      showMessage('No se han podido leer los mantenimientos guardados en este navegador. Vuelve a intentarlo recargando la página.', true);
      return false;
    }
  }

  recentRecords.addEventListener('click', (event) => {
    const button = event.target.closest('[data-delete-id]');
    if (!button) return;
    const record = records.find((item) => String(item.id) === button.dataset.deleteId);
    if (!record) return;
    pendingDelete = record.id;
    const summary = document.querySelector('#delete-summary');
    summary.replaceChildren(element('strong', '', record.operation), element('p', '', `${record.vehicle.name} · ${record.vehicle.plate}`),
      element('p', 'metadata', `${formatDate(record.date)} · ${currency.format(record.cost)}`));
    document.querySelector('#delete-error').hidden = true;
    dialog.showModal();
  });

  document.querySelector('#confirm-delete').addEventListener('click', () => {
    if (pendingDelete === null) return;
    try {
      deleteMaintenance(pendingDelete);
      dialog.close();
      if (render()) showMessage('Mantenimiento eliminado. El resumen y el historial se han actualizado.');
      // La fila que abrió el diálogo ya no existe: devolver el foco a un destino estable.
      message.tabIndex = -1;
      message.focus();
    } catch {
      const error = document.querySelector('#delete-error');
      error.textContent = 'No se ha podido eliminar el registro. Comprueba que el navegador permite guardar datos e inténtalo de nuevo.';
      error.hidden = false;
    }
  });
  dialog.addEventListener('close', () => { pendingDelete = null; });
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      if (dialog.open) dialog.close();
      showMessage('');
      render();
    }
  });
  render();
}
