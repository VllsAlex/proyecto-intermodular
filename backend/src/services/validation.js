import mongoose from 'mongoose';
import { HttpError } from './errors.js';

export function objectId(value, field = 'id') {
  if (typeof value !== 'string' || !mongoose.isObjectIdOrHexString(value)) {
    throw new HttpError(400, 'El identificador no es válido.', { [field]: 'Selecciona un vehículo válido.' });
  }
  return value;
}

export function calendarDate(value, field = 'date') {
  const parsed = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00.000Z`) : new Date(NaN);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new HttpError(400, 'Revisa la fecha indicada.', { [field]: 'Introduce una fecha válida.' });
  }
  return parsed;
}

function text(value, field, max) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new HttpError(400, 'Revisa los datos del formulario.', {
      [field]: `Introduce un texto de entre 1 y ${max} caracteres.`,
    });
  }
  return value.trim();
}

function integer(value, field) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new HttpError(400, 'Revisa los datos del formulario.', {
      [field]: 'Introduce un número entero igual o mayor que 0.',
    });
  }
  return value;
}

export function vehicleInput(body = {}) {
  return {
    name: text(body.name, 'name', 120),
    type: text(body.type, 'type', 40),
    plate: text(body.plate, 'plate', 40).replace(/\s+/g, '').toUpperCase(),
  };
}

export function maintenanceInput(body = {}) {
  return {
    vehicle: objectId(body.vehicle, 'vehicle'),
    operation: text(body.operation, 'operation', 200),
    date: calendarDate(body.date),
    mileage: integer(body.mileage, 'mileage'),
    costInCents: integer(body.costInCents, 'costInCents'),
  };
}

export function maintenanceFilter(query) {
  const filter = {};
  if (query.vehicle) filter.vehicle = objectId(query.vehicle, 'vehicle');
  if (query.from) filter.date = { $gte: calendarDate(query.from, 'from') };
  if (query.to) filter.date = { ...filter.date, $lte: calendarDate(query.to, 'to') };
  if (filter.date?.$gte && filter.date?.$lte && filter.date.$gte > filter.date.$lte) {
    throw new HttpError(400, 'La fecha inicial debe ser anterior o igual a la final.', {
      to: 'La fecha final debe ser igual o posterior a la inicial.',
    });
  }
  if (query.search) {
    const search = text(query.search, 'search', 200);
    filter.operation = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  }
  return filter;
}

export function positiveInteger(value, fallback, maximum = Number.MAX_SAFE_INTEGER) {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^\d+$/.test(value) || Number(value) < 1 || Number(value) > maximum) {
    throw new HttpError(400, 'El parámetro numérico de la consulta no es válido.');
  }
  return Number(value);
}
