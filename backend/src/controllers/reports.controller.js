import { objectId, positiveInteger } from '../services/validation.js';
import * as reports from '../services/reports.service.js';
import { HttpError } from '../services/errors.js';

export async function getSummary(_req, res) {
  res.json(await reports.getSummary());
}

export async function getExpenses(req, res) {
  const vehicle = req.query.vehicle ? objectId(req.query.vehicle, 'vehicle') : undefined;
  const year = positiveInteger(req.query.year, new Date().getFullYear(), 9998);
  if (year < 1000) throw new HttpError(400, 'Introduce un año de cuatro cifras.');
  res.json(await reports.getExpenses({ vehicle, year }));
}
