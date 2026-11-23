import { getVehicles } from './services/vehicles.js';
import { getMaintenances, deleteMaintenance } from './services/maintenances.js';
import { getPreferences } from './services/preferences.js';
import { queryString } from './services/api.js';
import { renderRecords, tableMarkup } from './maintenance-list.js';
import { fillVehicles, number, money, showMessage, clearFormErrors, showFormErrors, createDeleteDialog, takeFlash } from './ui.js';

export async function initHistory() {
  const form = document.querySelector('#history-filters');
  const message = document.querySelector('#page-message');
  const list = document.querySelector('#history-list');
  const empty = document.querySelector('#history-empty');
  const panel = document.querySelector('#history-panel');
  const pagination = document.querySelector('#pagination');
  const previous = document.querySelector('#previous-page');
  const next = document.querySelector('#next-page');
  const summary = document.querySelector('#history-summary');
  list.innerHTML = tableMarkup;
  const preferences = getPreferences();
  const params = new URLSearchParams(location.search);
  let page = /^\d+$/.test(params.get('page') || '') ? Math.max(1, Number(params.get('page'))) : 1;
  let records = [];
  let version = 0;
  let flash = takeFlash();

  showMessage(message, 'Cargando vehículos e historial…', 'info');
  const vehicles = await getVehicles();
  fillVehicles(form.elements.vehicle, vehicles, { selected: params.has('vehicle') ? params.get('vehicle') : preferences.vehicle });
  form.elements.sort.value = params.get('sort') || preferences.sort;
  if (!form.elements.sort.value) form.elements.sort.value = 'recent';
  for (const name of ['search', 'from', 'to']) form.elements.namedItem(name).value = params.get(name) || '';

  async function load() {
    const requestVersion = ++version;
    const filters = Object.fromEntries(new FormData(form));
    clearFormErrors(form);
    showMessage(message, 'Cargando mantenimientos…', 'info');
    panel.setAttribute('aria-busy', 'true');
    list.hidden = empty.hidden = summary.hidden = true;
    previous.disabled = next.disabled = true;
    try {
      const data = await getMaintenances({ ...filters, page });
      if (version !== requestVersion) return false;
      records = data.items;
      const info = data.pagination;
      page = info.page;
      renderRecords(list.querySelector('#maintenance-rows'), list.querySelector('#maintenance-cards'), records);
      document.querySelector('#result-count').textContent = `${number.format(info.total)} ${info.total === 1 ? 'registro' : 'registros'}`;
      empty.hidden = records.length > 0;
      list.hidden = summary.hidden = records.length === 0;
      const filtered = filters.vehicle || filters.search || filters.from || filters.to;
      empty.querySelector('h3').textContent = filtered ? 'No hay resultados para estos filtros' : 'Tu historial empieza aquí';
      document.querySelector('#history-empty-text').textContent = filtered
        ? 'Prueba con otras fechas, otro vehículo o limpia los filtros para ver todos los registros.'
        : 'Añade tu primer mantenimiento para llevar el control de operaciones, kilómetros y gastos.';
      document.querySelector('#results-range').textContent = `Mostrando ${(page - 1) * info.pageSize + 1}–${Math.min(page * info.pageSize, info.total)} de ${number.format(info.total)} registros`;
      document.querySelector('#results-cost').textContent = money(data.totalCostInCents);
      pagination.hidden = info.pages <= 1;
      document.querySelector('#page-number').textContent = `Página ${page} de ${info.pages}`;
      previous.disabled = page <= 1;
      next.disabled = page >= info.pages;
      history.replaceState(null, '', `/historial.html?${queryString({ ...filters, page })}`);
      showMessage(message, flash);
      flash = '';
      return true;
    } catch (error) {
      if (version !== requestVersion) return false;
      pagination.hidden = true;
      document.querySelector('#result-count').textContent = 'No se ha podido cargar el historial';
      showMessage(message, error.message, 'error');
      showFormErrors(form, error.fields);
      return false;
    } finally { if (version === requestVersion) panel.removeAttribute('aria-busy'); }
  }

  const dialog = createDeleteDialog({ message, onConfirm: async (record) => {
    await deleteMaintenance(record.id);
    if (await load()) showMessage(message, 'Mantenimiento eliminado. Los gastos se han actualizado.');
  } });
  list.addEventListener('click', (event) => {
    const button = event.target.closest('[data-delete-id]');
    const record = records.find((item) => item.id === button?.dataset.deleteId);
    if (record) dialog.open(record);
  });
  form.addEventListener('submit', (event) => { event.preventDefault(); page = 1; load(); });
  form.addEventListener('change', (event) => {
    if (event.target.type !== 'search') { page = 1; load(); }
  });
  document.querySelector('#clear-filters').addEventListener('click', () => {
    form.reset();
    form.elements.vehicle.value = '';
    form.elements.sort.value = preferences.sort;
    page = 1;
    load();
  });
  previous.addEventListener('click', async () => { page--; await load(); panel.scrollIntoView({ block: 'start' }); });
  next.addEventListener('click', async () => { page++; await load(); panel.scrollIntoView({ block: 'start' }); });
  await load();
}
