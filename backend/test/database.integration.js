import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { Vehicle } from '../src/models/vehicle.model.js';
import { Maintenance } from '../src/models/maintenance.model.js';

test('persistencia de AutoRegistro en MongoDB', async (t) => {
  const dbName = `autoregistro_test_${randomUUID().replaceAll('-', '')}`;
  const uri = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27018';

  t.after(async () => {
    try {
      if (mongoose.connection.readyState === 1 && mongoose.connection.name === dbName) {
        await mongoose.connection.dropDatabase();
      }
    } finally {
      await disconnectDatabase();
    }
  });

  await connectDatabase(uri, { dbName });
  let vehicle;
  let maintenance;

  await t.test('guarda vehículos y mantenimientos y permite consultar su relación', async () => {
    vehicle = await Vehicle.create({ name: 'SEAT León', type: 'Coche', plate: '1234 klm' });
    maintenance = await Maintenance.create({
      vehicle: vehicle._id,
      operation: 'Cambio de aceite',
      date: '2026-11-15',
      mileage: 84500,
      costInCents: 12050,
    });

    const saved = await Maintenance.findById(maintenance._id).populate('vehicle');
    assert.equal(saved.vehicle.name, 'SEAT León');
    assert.equal(saved.vehicle.plate, '1234KLM');
    assert.equal(saved.costInCents, 12050);
    assert.equal(saved.date.toISOString(), '2026-11-15T00:00:00.000Z');
    assert.ok(saved.createdAt instanceof Date);
    assert.ok(saved.updatedAt instanceof Date);
    assert.ok(saved.vehicle.createdAt instanceof Date);
  });

  await t.test('el índice único impide duplicar una matrícula normalizada', async () => {
    await assert.rejects(
      Vehicle.create({ name: 'Duplicado', type: 'Coche', plate: ' 1234 KLM ' }),
      (error) => error.code === 11000,
    );
  });

  await t.test('crea los índices del historial global y por vehículo', async () => {
    const indexes = await Maintenance.collection.indexes();
    assert.ok(indexes.some(({ key }) => JSON.stringify(key) === '{"date":-1}'));
    assert.ok(indexes.some(({ key }) => JSON.stringify(key) === '{"vehicle":1,"date":-1}'));
  });

  await t.test('valida las actualizaciones y persiste las modificaciones', async () => {
    await assert.rejects(
      Maintenance.findByIdAndUpdate(maintenance._id, { costInCents: -1 }, { runValidators: true }),
      { name: 'ValidationError' },
    );
    maintenance.operation = 'Cambio de aceite y filtro';
    await maintenance.save();
    const saved = await Maintenance.findById(maintenance._id);
    assert.equal(saved.operation, 'Cambio de aceite y filtro');
    assert.ok(saved.updatedAt >= saved.createdAt);
  });

  await t.test('elimina un mantenimiento y conserva su vehículo', async () => {
    await Maintenance.deleteOne({ _id: maintenance._id });
    assert.equal(await Maintenance.countDocuments({ vehicle: vehicle._id }), 0);
    assert.ok(await Vehicle.exists({ _id: vehicle._id }));
  });
});
