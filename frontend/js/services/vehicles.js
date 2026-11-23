import { request } from './api.js';

export const getVehicles = async () => (await request('/vehicles')).items;
export const saveVehicle = (id, data) => request(id ? `/vehicles/${encodeURIComponent(id)}` : '/vehicles', {
  method: id ? 'PUT' : 'POST', body: data,
});
export const deleteVehicle = (id) => request(`/vehicles/${encodeURIComponent(id)}`, { method: 'DELETE' });
