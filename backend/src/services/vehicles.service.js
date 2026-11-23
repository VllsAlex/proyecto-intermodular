import { Vehicle } from '../models/vehicle.model.js';
import { Maintenance } from '../models/maintenance.model.js';
import { HttpError } from './errors.js';
import { vehicleJSON } from './serializers.js';

export async function requireVehicle(id) {
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) throw new HttpError(404, 'El vehículo ya no existe.');
  return vehicle;
}

export async function listVehicles() {
  const [vehicles, stats] = await Promise.all([
    Vehicle.find().sort({ name: 1, _id: 1 }).lean(),
    Maintenance.aggregate([{ $group: {
      _id: '$vehicle', maintenanceCount: { $sum: 1 }, totalCostInCents: { $sum: '$costInCents' },
      latestDate: { $max: '$date' }, mileage: { $max: '$mileage' },
    } }]),
  ]);
  const byVehicle = new Map(stats.map((item) => [String(item._id), item]));
  return vehicles.map((vehicle) => {
    const stat = byVehicle.get(String(vehicle._id));
    return {
      ...vehicleJSON(vehicle),
      maintenanceCount: stat?.maintenanceCount || 0,
      totalCostInCents: stat?.totalCostInCents || 0,
      latestDate: stat?.latestDate.toISOString().slice(0, 10) || null,
      mileage: stat?.mileage ?? null,
    };
  });
}

export async function saveVehicle(id, data) {
  const vehicle = id ? await requireVehicle(id) : new Vehicle();
  vehicle.set(data);
  await vehicle.save();
  return vehicleJSON(vehicle);
}

export async function removeVehicle(id) {
  await requireVehicle(id);
  if (await Maintenance.exists({ vehicle: id })) {
    throw new HttpError(409, 'Este vehículo tiene mantenimientos asociados. Elimina primero sus registros desde el historial.');
  }
  await Vehicle.deleteOne({ _id: id });
}
