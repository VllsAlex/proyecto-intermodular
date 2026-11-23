# Proyecto intermodular

Aplicación web con frontend en **HTML, CSS y JavaScript**, backend en **Node.js y Express** y base de datos **MongoDB** mediante **Mongoose**.

## Requisitos

- Node.js 22 o superior.
- npm, incluido con Node.js.
- MongoDB 8.0, o Docker con Docker Compose para levantar el servicio incluido.

## Estructura del proyecto

```text
.
├── frontend/
│   ├── index.html                 # Página principal
│   ├── css/
│   │   └── styles.css             # Estilos de la aplicación
│   ├── js/
│   │   ├── main.js                # Punto de entrada del JavaScript del navegador
│   │   └── services/
│   │       └── api.js             # Peticiones al backend
│   └── assets/
│       ├── images/                # Imágenes e iconos
│       └── fonts/                 # Fuentes locales
├── backend/
│   ├── .env.example               # Ejemplo de variables de entorno
│   ├── package.json               # Dependencias y comandos del backend
│   └── src/
│       ├── app.js                 # Configuración de Express y archivos estáticos
│       ├── server.js              # Arranque del servidor
│       ├── config/                # Configuración de la aplicación
│       │   ├── env.js             # Lectura de variables de entorno
│       │   └── database.js        # Conexión a MongoDB e inicialización de índices
│       ├── routes/                # Definición de rutas de la API
│       │   └── index.js
│       ├── controllers/           # Gestión de las peticiones y respuestas
│       │   └── health.controller.js
│       ├── services/              # Lógica de negocio
│       ├── models/                # Modelos y acceso a datos
│       │   ├── vehicle.model.js   # Vehículos
│       │   └── maintenance.model.js # Mantenimientos
│       └── middlewares/           # Validación, autenticación y otros intermediarios
├── compose.yaml                   # MongoDB local con volumen persistente
├── .gitignore
└── README.md
```

Los archivos `.gitkeep` permiten guardar en Git las carpetas que todavía están vacías. Puedes eliminarlos cuando añadas contenido a esas carpetas.

## Instalación y ejecución

Para entender por qué se sirve mediante HTTP y comparar Express, Live Server, Python y Node.js, consulta [Cómo servir el frontend en local](frontend/SERVIR_FRONTEND.md).

Ejecuta estos comandos desde la raíz del proyecto:

```bash
npm --prefix backend install
cp backend/.env.example backend/.env
docker compose up -d mongo
npm --prefix backend run dev
```

Abre **http://localhost:3001** en el navegador (el puerto del archivo `.env.example`). Express sirve tanto los archivos del frontend como la API. La página inicial muestra el resumen de mantenimiento de AutoRegistro.

Docker publica MongoDB en `127.0.0.1:27018` y conserva los datos en el volumen `mongo_data`. Si ya tienes MongoDB disponible, configura su URI en `.env` y utiliza esa instancia. El backend espera a conectar y crear las colecciones e índices antes de escuchar peticiones. Si la conexión falla, termina con un código de error. Al recibir `SIGINT` o `SIGTERM`, cierra el servidor HTTP y la conexión a MongoDB.

El comando `dev` reinicia el servidor al modificar los archivos del backend. Para ver cambios en HTML, CSS o JavaScript del frontend, recarga el navegador.

Para arrancar el servidor sin reinicio automático:

```bash
npm --prefix backend start
```

## Variables de entorno

Configura las variables en `backend/.env`:

| Variable | Descripción | Valor predeterminado |
| --- | --- | --- |
| `PORT` | Puerto en el que escucha el servidor | `3000` |
| `MONGODB_URI` | URI de conexión a MongoDB | `mongodb://127.0.0.1:27018/autoregistro` |

El archivo `.env` está excluido de Git. Usa `.env.example` para documentar nuevas variables sin incluir credenciales reales.

## Esquema de MongoDB

La base de datos `autoregistro` está pensada para uso personal. La relación es **un vehículo → muchos mantenimientos**. Los gastos se obtienen sumando el coste de los mantenimientos.

### `Vehicle` — colección `vehicles`

| Campo | Tipo | Reglas |
| --- | --- | --- |
| `_id` | ObjectId | Generado automáticamente |
| `name` | String | Obligatorio, sin espacios en los extremos; máximo 120 caracteres |
| `type` | String | Obligatorio, sin espacios en los extremos; máximo 40 caracteres; por ejemplo, `Coche` o `Moto` |
| `plate` | String | Obligatoria y única; máximo 20 caracteres; se guarda en mayúsculas y sin espacios |
| `createdAt`, `updatedAt` | Date | Gestionados automáticamente por Mongoose |

El índice único de `plate` impide registrar dos veces la misma matrícula normalizada. MongoDB devuelve el error `11000` al duplicarla.

### `Maintenance` — colección `maintenances`

| Campo | Tipo | Reglas |
| --- | --- | --- |
| `_id` | ObjectId | Generado automáticamente |
| `vehicle` | ObjectId | Obligatorio; referencia al modelo `Vehicle` |
| `operation` | String | Obligatoria, sin espacios en los extremos; máximo 200 caracteres |
| `date` | Date | Fecha obligatoria del mantenimiento |
| `mileage` | Number | Obligatorio; entero no negativo dentro del rango seguro de JavaScript |
| `costInCents` | Number | Obligatorio; entero no negativo dentro del rango seguro de JavaScript |
| `createdAt`, `updatedAt` | Date | Gestionados automáticamente por Mongoose |

Índices: `{ date: -1 }` para el historial global y `{ vehicle: 1, date: -1 }` para el historial de un vehículo.

Los importes se almacenan en céntimos: `12050` representa **120,50 €**. Para una fecha de calendario se utiliza medianoche UTC: `2026-11-15T00:00:00.000Z`.

Ejemplo de uso desde el backend, después de conectar a MongoDB:

```js
import { Vehicle } from './models/vehicle.model.js';
import { Maintenance } from './models/maintenance.model.js';

const vehicle = await Vehicle.create({
  name: 'SEAT León', type: 'Coche', plate: '1234 KLM',
});

await Maintenance.create({
  vehicle: vehicle._id,
  operation: 'Cambio de aceite',
  date: '2026-11-15',
  mileage: 84500,
  costInCents: 12050,
});

const history = await Maintenance.find({ vehicle: vehicle._id })
  .sort({ date: -1 })
  .populate('vehicle');
```

La referencia permite usar `populate('vehicle')`. La lógica de negocio debe comprobar que el vehículo exista antes de registrar un mantenimiento y resolver sus mantenimientos al eliminarlo: MongoDB no aplica claves foráneas ni borrado en cascada. Al actualizar mediante `updateOne` o `findOneAndUpdate`, utiliza `{ runValidators: true }`; `create` y `save` validan automáticamente.

### Pruebas

```bash
npm --prefix backend test
npm --prefix backend run test:integration
```

Las pruebas de modelos funcionan sin MongoDB. Las de integración necesitan MongoDB en `127.0.0.1:27018`; puedes indicar otra instancia con `TEST_MONGODB_URI`. Crean una base temporal `autoregistro_test_<identificador>` y la eliminan al terminar. Comprueban persistencia, relación entre modelos, matrícula única, índices, actualización y eliminación.

## API inicial

### `GET /api/health`

Comprueba que el servidor responde. Devuelve una respuesta JSON:

```json
{
  "status": "ok",
  "message": "El servidor está funcionando correctamente."
}
```

## Cómo ampliar el proyecto

- **Frontend:** añade las páginas HTML en `frontend/`, sus estilos en `frontend/css/` y su JavaScript en `frontend/js/`. Centraliza las peticiones HTTP en `frontend/js/services/`.
- **Rutas:** define los endpoints en `backend/src/routes/` y conéctalos al router de `index.js`. Todas las rutas de este router utilizan el prefijo `/api`.
- **Controladores:** gestiona los datos de entrada y las respuestas HTTP en `backend/src/controllers/`.
- **Servicios:** coloca la lógica de negocio en `backend/src/services/`.
- **Modelos:** utiliza y amplía los modelos de `backend/src/models/` para acceder a MongoDB.
- **Middlewares:** añade funciones compartidas de validación, autenticación o tratamiento de errores en `backend/src/middlewares/`.

El frontend utiliza módulos nativos de JavaScript y no requiere un proceso de compilación.

## Frontend de AutoRegistro

- Home: `/`. Incluye los totales, el último mantenimiento y los tres registros más recientes.
- Páginas con navegación y footer compartidos: `/vehiculos.html`, `/historial.html`, `/gastos.html`, `/ajustes.html` y `/anadir-mantenimiento.html`.
- La guía visual está en `frontend/GUIA_ESTILOS.md`; Inter se sirve localmente desde `frontend/assets/fonts/`, con su licencia incluida.
- La navegación y el footer se generan en `frontend/js/layout.js`. El Home se gestiona en `frontend/js/home.js`.

El Home comienza sin registros. Mientras se desarrolla la API de mantenimiento, `frontend/js/services/maintenances.js` lee los registros de `localStorage` usando la clave `autoregistro.maintenances`. Los datos solo pertenecen a ese navegador y origen. El módulo centraliza la lectura, la eliminación y los cálculos para facilitar su posterior conexión al backend.

El formato de cada registro es:

```json
{
  "id": "mantenimiento-1",
  "vehicle": { "id": "vehiculo-1", "name": "SEAT León", "type": "Coche", "plate": "1234 KLM" },
  "operation": "Cambio de aceite",
  "date": "2026-11-15",
  "mileage": 84500,
  "cost": 120
}
```

Los mantenimientos de un mismo vehículo deben compartir `vehicle.id`. Las fechas usan `YYYY-MM-DD`, el kilometraje es un número no negativo y el coste se expresa en euros. El enlace Editar apunta a `/anadir-mantenimiento.html?id=…`; el formulario está pendiente de desarrollar. Eliminar pide confirmación, persiste el cambio y recalcula el Home.

Al conectar la API con el frontend, habrá que convertir los ObjectId a `id`, cargar el vehículo relacionado, convertir `date` a `YYYY-MM-DD` y transformar `costInCents` a `cost` dividiendo entre 100.
