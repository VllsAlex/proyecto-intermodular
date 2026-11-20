import express from 'express';
import { fileURLToPath } from 'node:url';
import apiRoutes from './routes/index.js';

const app = express();
const frontendPath = fileURLToPath(new URL('../../frontend/', import.meta.url));

app.use(express.json());
app.use('/api', apiRoutes);
app.use(express.static(frontendPath));

export default app;
