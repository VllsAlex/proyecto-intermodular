// Almacenamiento provisional hasta conectar la API. No se crean datos de ejemplo.
// Registro: { id, vehicle: { id, name, type, plate }, operation,
//             date: 'YYYY-MM-DD', mileage: number, cost: number (euros) }.
export const STORAGE_KEY = 'autoregistro.maintenances';

function validId(value) {
  return (typeof value === 'string' && value.trim() !== '') ||
    (typeof value === 'number' && Number.isFinite(value));
}

function validRecord(record) {
  if (!record || !validId(record.id) || !record.vehicle) return false;
  const { vehicle, operation, date, mileage, cost } = record;
  const validText = (value) => typeof value === 'string' && value.trim() !== '';
  return validId(vehicle.id) && [vehicle.name, vehicle.type, vehicle.plate, operation].every(validText) &&
    typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(Date.parse(`${date}T12:00:00Z`)) &&
    new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) === date &&
    Number.isFinite(mileage) && mileage >= 0 && Number.isFinite(cost) && cost >= 0;
}

export function getMaintenances() {
  const stored = localStorage.getItem(STORAGE_KEY);
  const records = stored === null ? [] : JSON.parse(stored);
  if (!Array.isArray(records) || !records.every(validRecord) ||
      new Set(records.map((record) => String(record.id))).size !== records.length) {
    throw new Error('El formato de los mantenimientos guardados no es válido.');
  }
  return records;
}

export function deleteMaintenance(id) {
  const records = getMaintenances();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records.filter((record) => String(record.id) !== String(id))));
}

export function getMaintenanceSummary(records) {
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
  return {
    vehicleCount: new Set(records.map((record) => String(record.vehicle.id))).size,
    maintenanceCount: records.length,
    totalCost: records.reduce((total, record) => total + Math.round(record.cost * 100), 0) / 100,
    latest: sorted[0] || null,
    recent: sorted.slice(0, 3),
  };
}
