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
│   │   ├── ui.js                  # Formatos, formularios, mensajes y diálogos
│   │   ├── maintenance-list.js    # Tabla y tarjetas compartidas
│   │   ├── home.js                # Resumen del Home
│   │   ├── vehicles.js            # Garaje y formulario de vehículos
│   │   ├── history.js             # Historial, filtros y paginación
│   │   ├── expenses.js            # Resumen y distribución de gastos
│   │   ├── maintenance-form.js    # Creación y edición de mantenimientos
│   │   ├── settings.js            # Preferencias del navegador
│   │   └── services/
│   │       ├── api.js             # Cliente HTTP y consultas de resumen
│   │       ├── vehicles.js        # API de vehículos
│   │       ├── maintenances.js    # API de mantenimientos
│   │       └── preferences.js     # Preferencias locales
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
│       │   ├── health.controller.js
│       │   ├── vehicles.controller.js
│       │   ├── maintenances.controller.js
│       │   └── reports.controller.js
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

La referencia permite usar `populate('vehicle')`. La API comprueba que el vehículo exista antes de registrar un mantenimiento y devuelve un conflicto al eliminar un vehículo con registros asociados. Primero deben eliminarse sus mantenimientos desde el historial. Las ediciones utilizan `save`, que ejecuta las validaciones de Mongoose.

### Pruebas

```bash
npm --prefix backend test
npm --prefix backend run test:integration
```

Las pruebas de modelos funcionan sin MongoDB. Las de integración necesitan MongoDB en `127.0.0.1:27018`; puedes indicar otra instancia con `TEST_MONGODB_URI`. Crean bases temporales `autoregistro_test_<identificador>` y las eliminan al terminar. Comprueban persistencia, relación entre modelos, matrícula única, índices y la API HTTP: validaciones, filtros, paginación, informes, actualización y eliminación.

## API

Todas las rutas utilizan el prefijo `/api` y responden con JSON, salvo las eliminaciones correctas, que devuelven `204` sin cuerpo.

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/health` | Estado del servidor |
| GET | `/vehicles` | Vehículos con número de mantenimientos, gasto total, última fecha y kilometraje máximo registrado |
| POST | `/vehicles` | Crear vehículo |
| PUT | `/vehicles/:id` | Editar vehículo |
| DELETE | `/vehicles/:id` | Eliminar un vehículo sin mantenimientos asociados |
| GET | `/maintenances` | Historial filtrado y paginado |
| GET | `/maintenances/:id` | Consultar un mantenimiento para editarlo |
| POST | `/maintenances` | Crear mantenimiento |
| PUT | `/maintenances/:id` | Editar mantenimiento |
| DELETE | `/maintenances/:id` | Eliminar mantenimiento |
| GET | `/summary` | Totales globales y tres mantenimientos recientes |
| GET | `/expenses` | Gastos mensuales y por vehículo de un año |

### Crear y editar datos

`POST` y `PUT /vehicles` reciben `name`, `type` y `plate`. En `PUT`, incluye el identificador en la ruta y envía todos los campos.

`POST` y `PUT /maintenances` reciben:

```json
{
  "vehicle": "507f1f77bcf86cd799439011",
  "operation": "Cambio de aceite",
  "date": "2026-11-15",
  "mileage": 84500,
  "costInCents": 12050
}
```

El identificador debe corresponder a un vehículo existente. El coste y el kilometraje deben ser números enteros no negativos; las fechas se validan como días reales de calendario.

### Consultas del historial y gastos

`GET /maintenances` admite:

- `vehicle`: identificador de vehículo.
- `search`: búsqueda literal por operación, sin distinguir mayúsculas.
- `from`, `to`: fechas inclusivas en formato `YYYY-MM-DD`.
- `sort`: `recent` (predeterminado), `oldest`, `cost-desc` o `cost-asc`.
- `page`: página, comenzando en 1.
- `pageSize`: registros por página; 10 por defecto y 100 como máximo.

Devuelve `{ items, pagination: { page, pageSize, total, pages }, totalCostInCents }`. El total de coste incluye todos los registros filtrados, no solo los de la página visible. Cada mantenimiento contiene su vehículo relacionado. Editar un vehículo actualiza su identificación en todo el historial.

`GET /expenses?year=2026&vehicle=…` admite un año y un vehículo opcional. Por defecto utiliza el año actual y todos los vehículos. Devuelve los doce meses, gastos por vehículo, totales y los años que tienen registros.

### Errores

Los errores tienen la forma `{ message, fields }`; `fields` identifica los campos que deben corregirse cuando procede. Los códigos principales son `400` para datos inválidos, `404` para recursos inexistentes y `409` para matrículas duplicadas o vehículos con mantenimientos asociados.

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

- **Home:** `/`. Totales, último mantenimiento y los tres registros más recientes, con edición y eliminación.
- **Vehículos:** `/vehiculos.html`. Alta, edición, eliminación y resumen de cada vehículo. El enlace `?new=1` abre el formulario de alta.
- **Historial:** `/historial.html`. Búsqueda, filtros por vehículo y fechas, cuatro órdenes y paginación de diez registros. `?vehicle=…` abre el historial de un vehículo. Los filtros y la página quedan reflejados en la URL.
- **Gastos:** `/gastos.html`. Filtros por año y vehículo, gasto total, número de mantenimientos, coste medio, barras mensuales y distribución por vehículo.
- **Formulario:** `/anadir-mantenimiento.html`. Alta de mantenimiento; `?id=…` permite editar y `?vehicle=…` preselecciona un vehículo. Los importes admiten coma o punto decimal y un máximo de dos decimales.
- **Ajustes:** `/ajustes.html`. Vehículo predeterminado, orden del historial y restablecimiento de preferencias.
- La guía visual está en `frontend/GUIA_ESTILOS.md`; Inter se sirve localmente desde `frontend/assets/fonts/`, con su licencia incluida.
- La navegación y el footer se generan en `frontend/js/layout.js`. El Home se gestiona en `frontend/js/home.js`.

Todas las páginas consultan la misma API y los vehículos y mantenimientos se guardan en MongoDB. La aplicación comienza con estados vacíos cuando no hay datos. Se muestran mensajes de carga, errores y confirmaciones; los formularios validan los campos y los diálogos permiten cancelar con Escape.

El formato de un mantenimiento devuelto por la API es:

```json
{
  "id": "507f191e810c19729de860ea",
  "vehicle": { "id": "507f1f77bcf86cd799439011", "name": "SEAT León", "type": "Coche", "plate": "1234KLM" },
  "operation": "Cambio de aceite",
  "date": "2026-11-15",
  "mileage": 84500,
  "costInCents": 12050,
  "cost": 120.5
}
```

Las fechas de la API utilizan `YYYY-MM-DD` y se muestran en español. Los cálculos utilizan `costInCents`; `cost` es su equivalente en euros. Los resúmenes del Home y Gastos se calculan en el backend sobre el historial completo.

Las preferencias utilizan la clave `autoregistro.preferences` de `localStorage`. El vehículo predeterminado se aplica al formulario, al historial y a los gastos, y el orden preferido se aplica al historial. Los enlaces a un vehículo concreto tienen prioridad sobre las preferencias; si el vehículo predeterminado ya no existe, la selección queda vacía. `Restablecer` guarda los valores iniciales: sin vehículo y orden de más recientes primero.

El historial utiliza tabla en escritorio y tarjetas por debajo de 768 px. Los formularios y filtros pasan a una columna en móvil; la navegación se recoge en un menú accesible. Se reutilizan las mismas tarjetas, acciones, formatos y diálogos en el Home y el Historial.
