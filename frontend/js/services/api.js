export async function getServerStatus() {
  const response = await fetch('/api/health');

  if (!response.ok) {
    throw new Error(`Error al consultar el servidor: ${response.status}`);
  }

  return response.json();
}
