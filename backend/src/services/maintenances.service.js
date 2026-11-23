import mongoose from 'mongoose';
import { Maintenance } from '../models/maintenance.model.js';
import { HttpError } from './errors.js';
import { requireVehicle } from './vehicles.service.js';
import { maintenanceJSON } from './serializers.js';

export const maintenanceSorts = {
  recent: { date: -1, _id: -1 },
  oldest: { date: 1, _id: 1 },
  'cost-desc': { costInCents: -1, date: -1, _id: -1 },
  'cost-asc': { costInCents: 1, date: -1, _id: -1 },
};

export function aggregateFilter(filter) {
  return { ...filter, ...(filter.vehicle ? { vehicle: new mongoose.Types.ObjectId(filter.vehicle) } : {}) };
}

export async function listMaintenances(filter, { page = 1, pageSize = 10, sort = 'recent' } = {}) {
  if (!Object.hasOwn(maintenanceSorts, sort)) throw new HttpError(400, 'El orden solicitado no es válido.');
  const [total, sums] = await Promise.all([
    Maintenance.countDocuments(filter),
    Maintenance.aggregate([
      { $match: aggregateFilter(filter) }, { $group: { _id: null, cost: { $sum: '$costInCents' } } },
    ]),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  page = Math.min(page, pages);
  const items = await Maintenance.find(filter).sort(maintenanceSorts[sort])
    .skip((page - 1) * pageSize).limit(pageSize).populate('vehicle').lean();
  return {
    items: items.map(maintenanceJSON),
    pagination: { page, pageSize, total, pages },
    totalCostInCents: sums[0]?.cost || 0,
  };
}

export async function getMaintenance(id) {
  const record = await Maintenance.findById(id).populate('vehicle').lean();
  if (!record) throw new HttpError(404, 'El mantenimiento ya no existe.');
  return maintenanceJSON(record);
}

export async function saveMaintenance(id, data) {
  const record = id ? await Maintenance.findById(id) : new Maintenance();
  if (!record) throw new HttpError(404, 'El mantenimiento ya no existe.');
  await requireVehicle(data.vehicle);
  record.set(data);
  await record.save();
  await record.populate('vehicle');
  return maintenanceJSON(record);
}

export async function removeMaintenance(id) {
  const result = await Maintenance.deleteOne({ _id: id });
  if (!result.deletedCount) throw new HttpError(404, 'El mantenimiento ya no existe.');
}
