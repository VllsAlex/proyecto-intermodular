import { getExpenses } from './services/api.js';
import { getVehicles } from './services/vehicles.js';
import { getPreferences } from './services/preferences.js';
import { element, money, number, fillVehicles, showMessage } from './ui.js';

const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function renderMonthly(data) {
  const max = Math.max(...data.map((month) => month.costInCents), 1);
  return data.map((month) => {
    const row = element('div', 'month-row');
    const label = element('span', 'month-label', months[month.month - 1]);
    const track = element('div', 'bar-track');
    track.setAttribute('aria-hidden', 'true');
    const bar = element('div', 'bar-fill');
    bar.style.width = `${month.costInCents / max * 100}%`;
    track.append(bar);
    row.append(label, track, element('strong', 'month-amount', money(month.costInCents)));
    return row;
  });
}

export async function initExpenses() {
  const form = document.querySelector('#expense-filters');
  const message = document.querySelector('#page-message');
  const chart = document.querySelector('#monthly-chart');
  const distribution = document.querySelector('#expense-distribution');
  const panel = document.querySelector('#monthly-panel');
  const params = new URLSearchParams(location.search);
  const currentYear = new Date().getFullYear();
  const requestedYear = Number(params.get('year'));
  const initialYear = Number.isInteger(requestedYear) && requestedYear >= 1000 && requestedYear <= 9998 ? requestedYear : currentYear;
  form.elements.year.replaceChildren(new Option(String(initialYear), String(initialYear)));
  let version = 0;
  showMessage(message, 'Cargando el resumen de gastos…', 'info');
  const vehicles = await getVehicles();
  fillVehicles(form.elements.vehicle, vehicles, { selected: params.has('vehicle') ? params.get('vehicle') : getPreferences().vehicle });

  async function load() {
    const requestVersion = ++version;
    const year = form.elements.year.value;
    showMessage(message, 'Calculando los gastos del periodo…', 'info');
    panel.setAttribute('aria-busy', 'true');
    document.querySelector('#expenses-empty').hidden = true;
    try {
      const data = await getExpenses({ vehicle: form.elements.vehicle.value, year });
      if (version !== requestVersion) return;
      const years = [...new Set([currentYear, Number(year), ...data.years])].sort((a, b) => b - a);
      form.elements.year.replaceChildren(...years.map((value) => new Option(String(value), String(value))));
      form.elements.year.value = year;
      document.querySelector('#expense-total').textContent = money(data.totalCostInCents);
      document.querySelector('#expense-count').textContent = number.format(data.maintenanceCount);
      document.querySelector('#expense-average').textContent = money(data.maintenanceCount ? Math.round(data.totalCostInCents / data.maintenanceCount) : 0);
      document.querySelector('#chart-year').textContent = year;
      chart.replaceChildren(...renderMonthly(data.monthly));
      document.querySelector('#expenses-empty').hidden = data.maintenanceCount > 0;
      document.querySelector('#distribution-count').textContent = `${data.vehicles.length} ${data.vehicles.length === 1 ? 'vehículo' : 'vehículos'}`;
      distribution.replaceChildren(...data.vehicles.map((vehicle) => {
        const row = element('div', 'distribution-row');
        const label = element('div');
        label.append(element('h3', '', vehicle.name), element('p', 'metadata', `${vehicle.plate} · ${vehicle.count} ${vehicle.count === 1 ? 'mantenimiento' : 'mantenimientos'}`));
        const amount = element('div', 'distribution-amount');
        const percentage = data.totalCostInCents ? Math.round(vehicle.costInCents / data.totalCostInCents * 100) : 0;
        amount.append(element('strong', '', money(vehicle.costInCents)), element('span', 'metadata', `${percentage} % del gasto`));
        row.append(label, amount);
        return row;
      }));
      if (!data.vehicles.length) distribution.append(element('p', 'muted-block', 'No hay gastos de vehículos para este periodo.'));
      showMessage(message);
    } catch (error) {
      if (version !== requestVersion) return;
      for (const id of ['expense-total', 'expense-count', 'expense-average']) document.getElementById(id).textContent = '—';
      chart.replaceChildren(element('p', 'metadata', 'No se ha podido cargar el desglose mensual.'));
      distribution.replaceChildren(element('p', 'muted-block', 'No se ha podido consultar la distribución.'));
      showMessage(message, error.message, 'error');
    } finally { if (version === requestVersion) panel.removeAttribute('aria-busy'); }
  }
  form.addEventListener('submit', (event) => { event.preventDefault(); load(); });
  form.addEventListener('change', () => load());
  await load();
}
