export function vehicleJSON(vehicle) {
  return { id: String(vehicle._id), name: vehicle.name, type: vehicle.type, plate: vehicle.plate };
}

export function maintenanceJSON(record) {
  return {
    id: String(record._id),
    vehicle: record.vehicle ? vehicleJSON(record.vehicle) : null,
    operation: record.operation,
    date: record.date.toISOString().slice(0, 10),
    mileage: record.mileage,
    costInCents: record.costInCents,
    cost: record.costInCents / 100,
  };
}
