import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';

test('API HTTP de AutoRegistro', async (t) => {
  const dbName = `autoregistro_test_${randomUUID().replaceAll('-', '')}`;
  let server;
  t.after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    try {
      if (mongoose.connection.readyState === 1 && mongoose.connection.name === dbName) await mongoose.connection.dropDatabase();
    } finally { await disconnectDatabase(); }
  });
  await connectDatabase(process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27018', { dbName });
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api`;
  async function api(path, { method = 'GET', body, status = 200 } = {}) {
    const response = await fetch(`${base}${path}`, {
      method, headers: { 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const data = response.status === 204 ? null : await response.json();
    assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(data)}`);
    return data;
  }
  let car;
  let bike;
  let first;
  let second;
  let old;
  const maintenance = (vehicle, overrides = {}) => ({
    vehicle, operation: 'Cambio de aceite', date: '2026-11-15', mileage: 84500, costInCents: 12050, ...overrides,
  });

  await t.test('devuelve estados vacíos y errores JSON', async () => {
    assert.equal((await api('/summary')).maintenanceCount, 0);
    assert.deepEqual((await api('/vehicles')).items, []);
    assert.deepEqual((await api('/maintenances')).items, []);
    assert.equal((await api('/expenses?year=2026')).monthly.length, 12);
    await api('/missing', { status: 404 });
    const response = await fetch(`${base}/vehicles`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{invalid' });
    assert.equal(response.status, 400);
    assert.match((await response.json()).message, /JSON/);
  });

  await t.test('crea vehículos, normaliza matrículas y comunica conflictos por campo', async () => {
    car = await api('/vehicles', { method: 'POST', status: 201, body: { name: ' SEAT León ', type: 'Coche', plate: '1234 klm' } });
    bike = await api('/vehicles', { method: 'POST', status: 201, body: { name: 'Yamaha MT-07', type: 'Moto', plate: '5678 MNP' } });
    assert.equal(car.plate, '1234KLM');
    const duplicate = await api('/vehicles', { method: 'POST', status: 409, body: { name: 'Duplicado', type: 'Coche', plate: ' 1234 KLM ' } });
    assert.ok(duplicate.fields.plate);
    await api('/vehicles', { method: 'POST', status: 400, body: { name: ' ', type: 'Moto', plate: '0000AAA' } });
  });

  await t.test('valida referencias, fechas reales e importes enteros', async () => {
    for (const overrides of [
      { vehicle: 'invalid' }, { date: '2026-02-30' }, { date: '2026-13-01' },
      { mileage: -1 }, { mileage: 1.5 }, { costInCents: 12.5 }, { costInCents: '120' }, { costInCents: true },
    ]) await api('/maintenances', { method: 'POST', status: 400, body: maintenance(car.id, overrides) });
    await api('/maintenances', { method: 'POST', status: 404, body: maintenance(new mongoose.Types.ObjectId().toString()) });
    first = await api('/maintenances', { method: 'POST', status: 201, body: maintenance(car.id) });
    second = await api('/maintenances', { method: 'POST', status: 201, body: maintenance(bike.id, { operation: 'Frenos [delanteros]', date: '2026-08-10', mileage: 18300, costInCents: 8500 }) });
    old = await api('/maintenances', { method: 'POST', status: 201, body: maintenance(car.id, { operation: 'Revisión gratuita', date: '2025-12-31', mileage: 80000, costInCents: 0 }) });
    assert.equal(first.date, '2026-11-15');
    assert.equal(first.cost, 120.5);
    assert.equal(first.vehicle.name, 'SEAT León');
  });

  await t.test('filtra, ordena y pagina con totales del conjunto filtrado', async () => {
    const page = await api('/maintenances?pageSize=1&page=2');
    assert.equal(page.items[0].id, second.id);
    assert.equal(page.pagination.total, 3);
    assert.equal(page.pagination.pages, 3);
    assert.equal(page.totalCostInCents, 20550);
    const filtered = await api(`/maintenances?vehicle=${car.id}&from=2026-01-01&to=2026-12-31`);
    assert.deepEqual(filtered.items.map((item) => item.id), [first.id]);
    const search = await api('/maintenances?search=%5Bdelanteros%5D');
    assert.deepEqual(search.items.map((item) => item.id), [second.id]);
    assert.equal((await api('/maintenances?sort=cost-asc')).items[0].id, old.id);
    assert.equal((await api('/maintenances?sort=oldest')).items[0].id, old.id);
    assert.equal((await api('/maintenances?page=99')).pagination.page, 1);
    await api('/maintenances?sort=unknown', { status: 400 });
    await api('/maintenances?from=2026-11-01&to=2026-01-01', { status: 400 });
    await api('/maintenances?pageSize=101', { status: 400 });
    await api('/maintenances?vehicle[$ne]=x', { status: 200 });
  });

  await t.test('los informes y las estadísticas de vehículos coinciden', async () => {
    const summary = await api('/summary');
    assert.equal(summary.totalVehicles, 2);
    assert.equal(summary.vehicleCount, 2);
    assert.equal(summary.maintenanceCount, 3);
    assert.equal(summary.totalCostInCents, 20550);
    assert.equal(summary.recent[0].id, first.id);
    const expenses = await api('/expenses?year=2026');
    assert.equal(expenses.maintenanceCount, 2);
    assert.equal(expenses.totalCostInCents, 20550);
    assert.equal(expenses.monthly[10].costInCents, 12050);
    assert.equal(expenses.monthly[7].costInCents, 8500);
    assert.deepEqual(expenses.years, [2026, 2025]);
    const carExpenses = await api(`/expenses?year=2026&vehicle=${car.id}`);
    assert.equal(carExpenses.totalCostInCents, 12050);
    assert.equal(carExpenses.vehicles.length, 1);
    const vehicles = (await api('/vehicles')).items;
    assert.equal(vehicles.find((item) => item.id === car.id).maintenanceCount, 2);
    assert.equal(vehicles.find((item) => item.id === car.id).mileage, 84500);
    await api('/expenses?year=abcd', { status: 400 });
  });

  await t.test('actualizar un vehículo se refleja en todo su historial', async () => {
    await api(`/vehicles/${car.id}`, { method: 'PUT', body: { name: 'León actualizado', type: 'Coche', plate: car.plate } });
    assert.equal((await api(`/maintenances/${first.id}`)).vehicle.name, 'León actualizado');
    await api(`/maintenances/${first.id}`, { method: 'PUT', body: maintenance(car.id, { operation: 'Aceite y filtro', costInCents: 15000 }) });
    assert.equal((await api('/summary')).totalCostInCents, 23500);
  });

  await t.test('protege vehículos con historial y elimina los registros solicitados', async () => {
    await api(`/vehicles/${car.id}`, { method: 'DELETE', status: 409 });
    for (const record of [first, old]) await api(`/maintenances/${record.id}`, { method: 'DELETE', status: 204 });
    await api(`/vehicles/${car.id}`, { method: 'DELETE', status: 204 });
    await api(`/maintenances/${first.id}`, { status: 404 });
    await api(`/vehicles/${car.id}`, { method: 'DELETE', status: 404 });
    await api('/maintenances/invalid', { status: 400 });
    assert.equal((await api('/summary')).totalCostInCents, 8500);
  });
});
