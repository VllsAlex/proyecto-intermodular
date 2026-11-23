import { Router } from 'express';
import { getHealth } from '../controllers/health.controller.js';
import * as vehicles from '../controllers/vehicles.controller.js';
import * as maintenances from '../controllers/maintenances.controller.js';
import { getSummary, getExpenses } from '../controllers/reports.controller.js';

const router = Router();

router.get('/health', getHealth);
router.get('/vehicles', vehicles.listVehicles);
router.post('/vehicles', vehicles.createVehicle);
router.put('/vehicles/:id', vehicles.updateVehicle);
router.delete('/vehicles/:id', vehicles.deleteVehicle);
router.get('/maintenances', maintenances.listMaintenances);
router.get('/maintenances/:id', maintenances.getMaintenance);
router.post('/maintenances', maintenances.createMaintenance);
router.put('/maintenances/:id', maintenances.updateMaintenance);
router.delete('/maintenances/:id', maintenances.deleteMaintenance);
router.get('/summary', getSummary);
router.get('/expenses', getExpenses);

router.use((_req, res) => res.status(404).json({ message: 'La ruta de la API no existe.' }));

export default router;
