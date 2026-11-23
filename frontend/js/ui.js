import { icon } from './icons.js';

export const currency = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
export const number = new Intl.NumberFormat('es-ES', { useGrouping: 'always', maximumFractionDigits: 0 });
const dateFormat = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
export const formatDate = (value) => value ? dateFormat.format(new Date(`${value}T00:00:00Z`)) : 'Sin registros';
export const formatMileage = (value) => `${number.format(value)} km`;
export const money = (cents) => currency.format(cents / 100);

export function element(tag, className = '', text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function iconElement(name, className = '') {
  const node = element('span', className);
  node.innerHTML = icon(name);
  return node;
}

export function showMessage(node, text = '', type = 'success') {
  node.textContent = text;
  node.className = `message message-${type}`;
  node.hidden = !text;
  node.setAttribute('role', type === 'error' ? 'alert' : 'status');
}

export function focusMessage(node) {
  node.tabIndex = -1;
  node.focus();
}

export function fillVehicles(select, vehicles, { prompt = 'Todos los vehículos', selected = '' } = {}) {
  const options = [new Option(prompt, ''), ...vehicles.map((vehicle) => new Option(`${vehicle.name} · ${vehicle.plate}`, vehicle.id))];
  select.replaceChildren(...options);
  select.value = vehicles.some((vehicle) => vehicle.id === selected) ? selected : '';
}

export function clearFormErrors(form) {
  form.querySelectorAll('[aria-invalid]').forEach((input) => input.removeAttribute('aria-invalid'));
  form.querySelectorAll('[data-error-for]').forEach((node) => { node.textContent = ''; node.hidden = true; });
}

export function showFormErrors(form, fields = {}) {
  for (const [name, text] of Object.entries(fields)) {
    const input = form.elements.namedItem(name);
    const error = form.querySelector(`[data-error-for="${name}"]`);
    if (input) input.setAttribute('aria-invalid', 'true');
    if (error) { error.textContent = text; error.hidden = false; }
  }
  const first = form.querySelector('[aria-invalid="true"]');
  if (first) first.focus();
}

export function checkForm(form) {
  clearFormErrors(form);
  const errors = {};
  for (const input of form.querySelectorAll('input, select, textarea')) {
    if (!input.checkValidity()) errors[input.name] = input.validationMessage;
    else if (input.required && !input.value.trim()) errors[input.name] = 'Completa este campo.';
  }
  showFormErrors(form, errors);
  return Object.keys(errors).length === 0;
}

export function setFlash(text) {
  try { sessionStorage.setItem('autoregistro.flash', text); } catch { /* La navegación sigue funcionando sin almacenamiento. */ }
}

export function takeFlash() {
  try {
    const text = sessionStorage.getItem('autoregistro.flash') || '';
    sessionStorage.removeItem('autoregistro.flash');
    return text;
  } catch { return ''; }
}

export function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function parseCost(value) {
  const text = value.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const [euros, decimals = ''] = text.split('.');
  const cents = Number(euros) * 100 + Number(decimals.padEnd(2, '0'));
  return Number.isSafeInteger(cents) ? cents : null;
}

export function createDeleteDialog({ kind = 'mantenimiento', onConfirm, message }) {
  const dialog = document.createElement('dialog');
  dialog.setAttribute('aria-labelledby', 'delete-title');
  dialog.setAttribute('aria-describedby', 'delete-description');
  dialog.innerHTML = `
    <form method="dialog">
      <span class="empty-icon danger-icon">${icon('trash')}</span>
      <h2 id="delete-title">¿Eliminar ${kind}?</h2>
      <p id="delete-description">${kind === 'vehículo' ? 'Se eliminará este vehículo de tu listado.' : 'Se eliminará este registro del historial.'} Esta acción no se puede deshacer.</p>
      <div class="delete-summary"></div>
      <p class="message message-error" role="alert" hidden></p>
      <div class="dialog-actions"><button class="button button-secondary" value="cancel" autofocus>Cancelar</button><button class="button button-danger" type="button" data-confirm>Eliminar</button></div>
    </form>`;
  document.body.append(dialog);
  let pending = null;
  let busy = false;
  const confirm = dialog.querySelector('[data-confirm]');
  const cancel = dialog.querySelector('[value="cancel"]');
  const error = dialog.querySelector('.message');
  dialog.addEventListener('cancel', (event) => { if (busy) event.preventDefault(); });
  dialog.addEventListener('close', () => { pending = null; });
  confirm.addEventListener('click', async () => {
    if (!pending || busy) return;
    busy = true;
    confirm.disabled = cancel.disabled = true;
    confirm.textContent = 'Eliminando…';
    try {
      await onConfirm(pending);
      dialog.close();
      if (message && !message.hidden) focusMessage(message);
    } catch (failure) {
      showMessage(error, failure.message, 'error');
    } finally {
      busy = false;
      confirm.disabled = cancel.disabled = false;
      confirm.textContent = 'Eliminar';
    }
  });
  return {
    open(item) {
      pending = item;
      const summary = dialog.querySelector('.delete-summary');
      summary.replaceChildren(element('strong', '', item.operation || item.name));
      if (item.operation) {
        summary.append(element('p', '', `${item.vehicle?.name || 'Vehículo no disponible'} · ${item.vehicle?.plate || '—'}`),
          element('p', 'metadata', `${formatDate(item.date)} · ${money(item.costInCents)}`));
      } else summary.append(element('p', 'metadata', `${item.type} · ${item.plate}`));
      showMessage(error);
      dialog.showModal();
    },
  };
}
