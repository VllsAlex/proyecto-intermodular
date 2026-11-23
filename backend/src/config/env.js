import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });
//dotenv.config() carga el archivo .env de la direccion que le pasas
//y lo carga en la configuracion de .env para poder usarlo con process.env

//import.meta.url da la direccion del archivo actual, y configura la url de path a
//a la new URL partiendo desde el archivo actual.

export const config = {
  port: process.env.PORT || 3000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27018/autoregistro',
};
