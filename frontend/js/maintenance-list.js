import { element, formatDate, formatMileage, money } from './ui.js';

function recordActions(record) {
  const actions = element('div', 'record-actions');
  const name = record.vehicle?.name || 'vehículo no disponible';
  const edit = element('a', 'text-link', 'Editar');
  edit.href = `/anadir-mantenimiento.html?id=${encodeURIComponent(record.id)}`;
  edit.setAttribute('aria-label', `Editar ${record.operation} de ${name}`);
  const remove = element('button', 'text-link text-danger', 'Eliminar');
  remove.type = 'button';
  remove.dataset.deleteId = record.id;
  remove.setAttribute('aria-label', `Eliminar ${record.operation} de ${name}`);
  actions.append(edit, remove);
  return actions;
}

function vehicleDetails(record) {
  return record.vehicle ? `${record.vehicle.type} · ${record.vehicle.plate}` : 'Vehículo no disponible';
}

export function recordRow(record) {
  const row = element('tr');
  const vehicle = element('td');
  vehicle.append(element('span', 'vehicle-name', record.vehicle?.name || '—'), element('span', 'metadata', vehicleDetails(record)));
  const actions = element('td');
  actions.append(recordActions(record));
  row.append(vehicle, element('td', 'operation-cell', record.operation), element('td', 'nowrap', formatDate(record.date)),
    element('td', 'nowrap', formatMileage(record.mileage)), element('td', 'numeric nowrap cost-cell', money(record.costInCents)), actions);
  return row;
}

export function recordCard(record) {
  const card = element('article', 'maintenance-card');
  const dateAndCost = element('div', 'card-date-cost');
  dateAndCost.append(element('span', '', formatDate(record.date)), element('strong', '', money(record.costInCents)));
  card.append(element('h3', '', record.operation), element('p', 'metadata', `${record.vehicle?.name || '—'} · ${vehicleDetails(record)}`),
    dateAndCost, element('p', 'metadata', formatMileage(record.mileage)), recordActions(record));
  return card;
}

export function renderRecords(rows, cards, records) {
  rows.replaceChildren(...records.map(recordRow));
  cards.replaceChildren(...records.map(recordCard));
}

export const tableMarkup = `
  <div class="table-wrapper"><table><caption class="visually-hidden">Historial de mantenimientos</caption>
    <thead><tr><th scope="col">Vehículo</th><th scope="col">Operación</th><th scope="col">Fecha</th><th scope="col">Kilometraje</th><th scope="col" class="numeric">Coste</th><th scope="col">Acciones</th></tr></thead>
    <tbody id="maintenance-rows"></tbody></table></div><div id="maintenance-cards" class="maintenance-cards"></div>`;
