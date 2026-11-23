import mongoose from 'mongoose';
import { config } from './env.js';
import { Vehicle } from '../models/vehicle.model.js';
import { Maintenance } from '../models/maintenance.model.js';

export async function connectDatabase(uri = config.mongodbUri, options = {}) {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, ...options });
    // Crea las colecciones y sus índices antes de aceptar peticiones.
    await Promise.all([Vehicle.init(), Maintenance.init()]);
  } catch (error) {
    await mongoose.disconnect();
    throw error;
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
