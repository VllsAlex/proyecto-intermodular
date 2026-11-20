import app from './app.js';
import { config } from './config/env.js';

app.listen(config.port, () => {
  console.log(`Servidor disponible en http://localhost:${config.port}`);
});
