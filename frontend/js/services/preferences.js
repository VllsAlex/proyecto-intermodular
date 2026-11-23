const KEY = 'autoregistro.preferences';
export const historyOrders = ['recent', 'oldest', 'cost-desc', 'cost-asc'];
export const defaultPreferences = { vehicle: '', sort: 'recent' };

export function getPreferences() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY));
    return {
      vehicle: typeof stored?.vehicle === 'string' ? stored.vehicle : '',
      sort: historyOrders.includes(stored?.sort) ? stored.sort : 'recent',
    };
  } catch {
    return { ...defaultPreferences };
  }
}

export function savePreferences(preferences) {
  localStorage.setItem(KEY, JSON.stringify(preferences));
}
