import { getServerStatus } from './services/api.js';

const statusElement = document.querySelector('#server-status');

async function showServerStatus() {
  try {
    const data = await getServerStatus();
    statusElement.textContent = data.message;
  } catch (error) {
    statusElement.textContent = 'No se ha podido conectar con el servidor.';
    console.error(error);
  }
}

showServerStatus();
