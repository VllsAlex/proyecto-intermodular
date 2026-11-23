export class ApiError extends Error {
  constructor(message, status = 0, fields = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

export async function request(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method, signal,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('No se ha podido conectar con el servidor. Comprueba la conexión e inténtalo de nuevo.');
  }
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) throw new ApiError(data.message || 'No se ha podido completar la operación.', response.status, data.fields);
  return data;
}

export function queryString(params = {}) {
  return new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)).toString();
}

export const getServerStatus = () => request('/health');
export const getSummary = () => request('/summary');
export const getExpenses = (params) => request(`/expenses?${queryString(params)}`);
