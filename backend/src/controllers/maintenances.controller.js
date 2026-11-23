import { objectId, maintenanceInput, maintenanceFilter, positiveInteger } from '../services/validation.js';
import * as maintenances from '../services/maintenances.service.js';

export async function listMaintenances(req, res) {
  res.json(await maintenances.listMaintenances(maintenanceFilter(req.query), {
    page: positiveInteger(req.query.page, 1),
    pageSize: positiveInteger(req.query.pageSize, 10, 100),
    sort: req.query.sort || 'recent',
  }));
}

export async function getMaintenance(req, res) {
  res.json(await maintenances.getMaintenance(objectId(req.params.id)));
}

export async function createMaintenance(req, res) {
  res.status(201).json(await maintenances.saveMaintenance(null, maintenanceInput(req.body)));
}

export async function updateMaintenance(req, res) {
  res.json(await maintenances.saveMaintenance(objectId(req.params.id), maintenanceInput(req.body)));
}

export async function deleteMaintenance(req, res) {
  await maintenances.removeMaintenance(objectId(req.params.id));
  res.status(204).end();
}
