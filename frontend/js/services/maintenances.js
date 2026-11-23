import { request, queryString } from './api.js';

export const getMaintenances = (params) => request(`/maintenances?${queryString(params)}`);
export const getMaintenance = (id) => request(`/maintenances/${encodeURIComponent(id)}`);
export const saveMaintenance = (id, data) => request(id ? `/maintenances/${encodeURIComponent(id)}` : '/maintenances', {
  method: id ? 'PUT' : 'POST', body: data,
});
export const deleteMaintenance = (id) => request(`/maintenances/${encodeURIComponent(id)}`, { method: 'DELETE' });
