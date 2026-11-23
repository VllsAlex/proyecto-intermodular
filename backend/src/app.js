import express from 'express';
import { fileURLToPath } from 'node:url';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middlewares/error-handler.js';

const app = express();
const frontendPath = fileURLToPath(new URL('../../frontend/', import.meta.url));

app.use(express.json());
app.use('/api', apiRoutes);
app.use(express.static(frontendPath));
app.use(errorHandler);

export default app;
