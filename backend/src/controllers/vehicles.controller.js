import { objectId, vehicleInput } from '../services/validation.js';
import * as vehicles from '../services/vehicles.service.js';

export async function listVehicles(_req, res) {
  res.json({ items: await vehicles.listVehicles() });
}

export async function createVehicle(req, res) {
  res.status(201).json(await vehicles.saveVehicle(null, vehicleInput(req.body)));
}

export async function updateVehicle(req, res) {
  res.json(await vehicles.saveVehicle(objectId(req.params.id), vehicleInput(req.body)));
}

export async function deleteVehicle(req, res) {
  await vehicles.removeVehicle(objectId(req.params.id));
  res.status(204).end();
}
