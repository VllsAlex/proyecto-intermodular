import app from './app.js';
import { config } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

try {
  await connectDatabase();

  const server = app.listen(config.port);
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });

  console.log(`Servidor disponible en http://localhost:${server.address().port}`);

  let closing = false;
  function shutdown() {
    if (closing) return;
    closing = true;

    server.close(async (error) => {
      try {
        await disconnectDatabase();
        if (error) throw error;
      } catch (shutdownError) {
        console.error('No se ha podido cerrar el servidor correctamente:', shutdownError.message);
        process.exitCode = 1;
      }
    });
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} catch (error) {
  console.error('No se ha podido iniciar el servidor:', error.message);
  await disconnectDatabase();
  process.exitCode = 1;
}
