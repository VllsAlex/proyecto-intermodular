import { getSummary } from './services/api.js';
import { deleteMaintenance } from './services/maintenances.js';
import { renderRecords } from './maintenance-list.js';
import { element, iconElement, formatDate, formatMileage, money, number, showMessage, createDeleteDialog } from './ui.js';

function renderLatest(container, record) {
  const title = element('div', 'latest-details');
  title.append(element('h3', '', record.operation), element('p', 'metadata', record.vehicle
    ? `${record.vehicle.name} · ${record.vehicle.type} · ${record.vehicle.plate}` : 'Vehículo no disponible'));
  const details = element('div', 'latest-metrics');
  for (const [label, value] of [['Fecha', formatDate(record.date)], ['Kilometraje', formatMileage(record.mileage)], ['Coste', money(record.costInCents)]]) {
    const metric = element('div');
    metric.append(element('span', 'metadata', label), element('strong', '', value));
    details.append(metric);
  }
  container.replaceChildren(iconElement('check', 'empty-icon success-icon'), title, details);
}

export async function initHome() {
  const latest = document.querySelector('#latest-maintenance');
  const initialLatest = latest.cloneNode(true);
  const recentRecords = document.querySelector('#recent-records');
  const recentEmpty = document.querySelector('#recent-empty');
  const message = document.querySelector('#home-message');
  let records = [];
  let version = 0;
  const dialog = createDeleteDialog({ message, onConfirm: async (record) => {
    await deleteMaintenance(record.id);
    if (await render().then(() => true, () => false)) {
      showMessage(message, 'Mantenimiento eliminado. El resumen se ha actualizado.');
    }
  } });

  async function render() {
    const requestVersion = ++version;
    recentRecords.hidden = recentEmpty.hidden = true;
    showMessage(message, 'Cargando el resumen de tus vehículos…', 'info');
    latest.setAttribute('aria-busy', 'true');
    try {
      const summary = await getSummary();
      if (requestVersion !== version) return;
      records = summary.recent;
      document.querySelector('#vehicle-count').textContent = number.format(summary.vehicleCount);
      document.querySelector('#maintenance-count').textContent = number.format(summary.maintenanceCount);
      document.querySelector('#total-cost').textContent = money(summary.totalCostInCents);
      if (records[0]) renderLatest(latest, records[0]);
      else latest.replaceChildren(...Array.from(initialLatest.childNodes, (node) => node.cloneNode(true)));
      recentEmpty.hidden = records.length > 0;
      recentRecords.hidden = records.length === 0;
      renderRecords(document.querySelector('#maintenance-rows'), document.querySelector('#maintenance-cards'), records);
      document.querySelector('#recent-count').textContent = `${records.length} de ${summary.maintenanceCount} registros`;
      showMessage(message);
    } catch (error) {
      if (requestVersion !== version) return;
      for (const id of ['vehicle-count', 'maintenance-count', 'total-cost']) document.getElementById(id).textContent = '—';
      latest.replaceChildren(element('p', 'metadata', 'No se ha podido consultar el último mantenimiento.'));
      showMessage(message, error.message, 'error');
      throw error;
    } finally {
      if (requestVersion === version) latest.removeAttribute('aria-busy');
    }
  }
  recentRecords.addEventListener('click', (event) => {
    const button = event.target.closest('[data-delete-id]');
    const record = records.find((item) => item.id === button?.dataset.deleteId);
    if (record) dialog.open(record);
  });
  await render();
}
