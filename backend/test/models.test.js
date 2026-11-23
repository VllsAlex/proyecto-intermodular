import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';
import { Vehicle } from '../src/models/vehicle.model.js';
import { Maintenance } from '../src/models/maintenance.model.js';

function maintenanceData(overrides = {}) {
  return {
    vehicle: new mongoose.Types.ObjectId(),
    operation: 'Cambio de aceite',
    date: '2026-11-15',
    mileage: 84500,
    costInCents: 12050,
    ...overrides,
  };
}

test('normaliza los textos y la matrícula del vehículo', async () => {
  const vehicle = new Vehicle({ name: ' SEAT León ', type: ' Coche ', plate: ' 1234 klm ' });
  await vehicle.validate();
  assert.equal(vehicle.name, 'SEAT León');
  assert.equal(vehicle.type, 'Coche');
  assert.equal(vehicle.plate, '1234KLM');
});

test('rechaza los campos obligatorios vacíos de un vehículo', async () => {
  await assert.rejects(new Vehicle({ name: ' ', type: '', plate: '  ' }).validate(), (error) => {
    assert.deepEqual(Object.keys(error.errors).sort(), ['name', 'plate', 'type']);
    return true;
  });
});

test('acepta un mantenimiento gratuito con kilometraje cero', async () => {
  const maintenance = new Maintenance(maintenanceData({ mileage: 0, costInCents: 0 }));
  await maintenance.validate();
  assert.equal(maintenance.date.toISOString(), '2026-11-15T00:00:00.000Z');
});

test('exige todos los campos del mantenimiento', async () => {
  await assert.rejects(new Maintenance().validate(), (error) => {
    assert.deepEqual(Object.keys(error.errors).sort(), [
      'costInCents', 'date', 'mileage', 'operation', 'vehicle',
    ]);
    return true;
  });
});

test('rechaza un vehículo, una fecha o una operación inválidos', async () => {
  for (const [field, value] of [
    ['vehicle', 'no-es-un-objectid'], ['date', 'fecha inválida'], ['operation', ' '],
  ]) {
    await assert.rejects(new Maintenance(maintenanceData({ [field]: value })).validate(), (error) => {
      assert.ok(error.errors[field], `Debe rechazar ${field}`);
      return true;
    });
  }
});

test('rechaza kilometrajes y costes negativos, fraccionarios o fuera del rango seguro', async () => {
  for (const field of ['mileage', 'costInCents']) {
    for (const value of [-1, 1.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) {
      await assert.rejects(new Maintenance(maintenanceData({ [field]: value })).validate(), (error) => {
        assert.ok(error.errors[field], `Debe rechazar ${field} = ${value}`);
        return true;
      });
    }
  }
});
