import mongoose from 'mongoose';
import { Vehicle } from '../models/vehicle.model.js';
import { Maintenance } from '../models/maintenance.model.js';
import { maintenanceJSON } from './serializers.js';

export async function getSummary() {
  const [totalVehicles, maintainedVehicles, totals, recent] = await Promise.all([
    Vehicle.countDocuments(), Maintenance.distinct('vehicle'),
    Maintenance.aggregate([{ $group: { _id: null, count: { $sum: 1 }, cost: { $sum: '$costInCents' } } }]),
    Maintenance.find().sort({ date: -1, _id: -1 }).limit(3).populate('vehicle').lean(),
  ]);
  return {
    totalVehicles, vehicleCount: maintainedVehicles.length, maintenanceCount: totals[0]?.count || 0,
    totalCostInCents: totals[0]?.cost || 0, recent: recent.map(maintenanceJSON),
  };
}

export async function getExpenses({ vehicle, year }) {
  const filter = {};
  if (vehicle) filter.vehicle = new mongoose.Types.ObjectId(vehicle);
  if (year) filter.date = { $gte: new Date(`${year}-01-01T00:00:00Z`), $lt: new Date(`${year + 1}-01-01T00:00:00Z`) };
  const [groups, years] = await Promise.all([
    Maintenance.aggregate([
      { $match: filter },
      { $facet: {
        monthly: [
          { $group: { _id: { $month: '$date' }, costInCents: { $sum: '$costInCents' }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ],
        vehicles: [
          { $group: { _id: '$vehicle', costInCents: { $sum: '$costInCents' }, count: { $sum: 1 } } },
          { $lookup: { from: 'vehicles', localField: '_id', foreignField: '_id', as: 'vehicle' } },
          { $unwind: '$vehicle' }, { $sort: { costInCents: -1, _id: 1 } },
        ],
      } },
    ]),
    Maintenance.aggregate([{ $group: { _id: { $year: '$date' } } }, { $sort: { _id: -1 } }]),
  ]);
  const data = groups[0];
  const monthly = Array.from({ length: 12 }, (_, index) => {
    const item = data.monthly.find((entry) => entry._id === index + 1);
    return { month: index + 1, costInCents: item?.costInCents || 0, count: item?.count || 0 };
  });
  return {
    years: years.map((item) => item._id), monthly,
    totalCostInCents: monthly.reduce((sum, item) => sum + item.costInCents, 0),
    maintenanceCount: monthly.reduce((sum, item) => sum + item.count, 0),
    vehicles: data.vehicles.map((item) => ({
      id: String(item._id), name: item.vehicle.name, plate: item.vehicle.plate,
      costInCents: item.costInCents, count: item.count,
    })),
  };
}
