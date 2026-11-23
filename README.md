# AutoRegistro — documentación técnica

AutoRegistro es una aplicación web de uso personal para gestionar vehículos, registrar sus mantenimientos y consultar sus gastos. Este documento explica cómo instalarla, configurarla, ejecutarla y comprobar su funcionamiento.

La presentación del proyecto y los espacios para sus enlaces de GitHub y Figma están en [EXPLICACION.md](EXPLICACION.md).

## Índice

- [Tecnologías y arquitectura](#tecnologías-y-arquitectura)
- [Requisitos](#requisitos)
- [Instalación y primera ejecución](#instalación-y-primera-ejecución)
- [Configuración del entorno](#configuración-del-entorno)
- [Comandos y ejecución diaria](#comandos-y-ejecución-diaria)
- [Base de datos y persistencia](#base-de-datos-y-persistencia)
- [Páginas y almacenamiento del navegador](#páginas-y-almacenamiento-del-navegador)
- [API HTTP](#api-http)
- [Pruebas automatizadas](#pruebas-automatizadas)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Resolución de problemas](#resolución-de-problemas)

## Tecnologías y arquitectura

| Componente | Tecnología | Función |
| --- | --- | --- |
| Frontend | HTML5, CSS3 y JavaScript con módulos nativos | Páginas, formularios, navegación y presentación de datos |
| Servidor | Node.js 22 o superior | Ejecución del backend y de las pruebas |
| API y archivos estáticos | Express 5 | Rutas `/api` y entrega del directorio `frontend/` |
| Modelado de datos | Mongoose 9 | Esquemas, validaciones, referencias y consultas a MongoDB |
| Configuración | dotenv 16 | Lectura de `backend/.env` |
| Base de datos | MongoDB 8.0 | Persistencia de vehículos y mantenimientos |
| Entorno de base de datos | Docker Compose | Servicio MongoDB con volumen persistente |
| Pruebas | `node:test` y `node:assert/strict` | Validación de modelos, persistencia y API HTTP |

Las dependencias se declaran en `backend/package.json` y sus versiones resueltas están en `backend/package-lock.json`.

```text
Navegador
   │ HTTP: páginas, CSS, JavaScript y peticiones /api
   ▼
Node.js + Express · puerto 3001 con el .env de ejemplo
   │ Mongoose
   ▼
MongoDB · 127.0.0.1:27018 en el equipo anfitrión
   │ Docker redirige al puerto 27017 del contenedor
   ▼
Volumen mongo_data · /data/db
```

Express sirve el frontend y la API desde el mismo origen. Las peticiones del navegador utilizan rutas relativas `/api/...`. El frontend funciona directamente con módulos JavaScript y no necesita compilación.

La configuración incluida ejecuta **Node.js en el equipo anfitrión y MongoDB en Docker**. El archivo `compose.yaml` define únicamente el servicio de base de datos.

## Requisitos

- **Git**, para clonar el repositorio.
- **Node.js 22 o superior** y **npm**.
- **Docker Engine o Docker Desktop**, con **Docker Compose v2**, para utilizar la base de datos incluida. El motor de Docker debe estar arrancado.
- Un navegador actualizado con JavaScript habilitado.

También se puede utilizar una instancia de MongoDB 8.0 instalada por separado, configurando su URI en `backend/.env`.

Comprueba las herramientas que vayas a utilizar:

```bash
git --version
node --version
npm --version
docker --version
docker compose version
```

Los comandos siguientes se ejecutan desde la **raíz del proyecto**, la carpeta que contiene `backend/`, `frontend/` y `compose.yaml`.

## Instalación y primera ejecución

### 1. Obtener el proyecto

Sustituye `URL_DEL_REPOSITORIO_GITHUB` por el enlace del repositorio:

```bash
git clone "URL_DEL_REPOSITORIO_GITHUB" autoregistro
cd autoregistro
```

Si ya tienes el proyecto descargado, abre una terminal en su carpeta raíz.

### 2. Instalar las dependencias

```bash
npm --prefix backend ci
```

`npm ci` instala las versiones del archivo de bloqueo. Las dependencias se instalan en `backend/node_modules/`; el frontend se sirve directamente desde sus archivos.

### 3. Crear el archivo de configuración

En Linux o macOS:

```bash
cp backend/.env.example backend/.env
```

En Windows PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
```

Este paso se realiza en la primera instalación. Si ya existe `backend/.env`, revisa su contenido para conservar tu configuración.

El archivo de ejemplo contiene:

```dotenv
PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27018/autoregistro
```

### 4. Arrancar MongoDB

```bash
docker compose up -d mongo
docker compose ps
```

La primera ejecución descarga la imagen `mongodb/mongodb-community-server:8.0-ubi8` y crea el volumen de datos. Espera a que MongoDB esté preparado para aceptar conexiones. Puedes consultar su arranque con:

```bash
docker compose logs --tail=50 mongo
```

El servicio publica el puerto `27018` del equipo anfitrión hacia el `27017` del contenedor, limitado a `127.0.0.1`.

Si utilizas una instancia de MongoDB ya disponible, configura `MONGODB_URI` con su dirección y continúa con el arranque del backend.

### 5. Arrancar el backend

```bash
npm --prefix backend run dev
```

El servidor conecta a MongoDB e inicializa las colecciones y sus índices antes de aceptar peticiones. Cuando termine, mostrará:

```text
Servidor disponible en http://localhost:3001
```

Mantén esta terminal abierta mientras utilizas la aplicación.

### 6. Comprobar el acceso

Abre **http://localhost:3001**. También puedes comprobar la API desde el navegador en **http://localhost:3001/api/health**, o con:

```bash
curl http://localhost:3001/api/health
```

En Windows PowerShell puedes utilizar:

```powershell
Invoke-RestMethod http://localhost:3001/api/health
```

La respuesta esperada es:

```json
{
  "status": "ok",
  "message": "El servidor está funcionando correctamente."
}
```

Esta ruta comprueba que el servidor HTTP responde. La conexión inicial con MongoDB se realiza durante el arranque del backend.

### 7. Crear los primeros datos

1. Entra en **Vehículos** y añade un coche, una moto u otro vehículo con nombre, tipo y matrícula.
2. Abre **Añadir mantenimiento** y selecciona ese vehículo.
3. Completa operación, fecha, kilometraje y coste, y guarda el registro.
4. Comprueba el resultado en **Historial**, **Home** y **Gastos**. En Gastos, selecciona el año del mantenimiento.
5. En **Ajustes**, puedes elegir el vehículo predeterminado y el orden preferido del historial.

La aplicación comienza con estados vacíos cuando la base de datos no contiene registros. Las colecciones y los índices se crean automáticamente al arrancar; los vehículos y mantenimientos se introducen desde la aplicación.

## Configuración del entorno

| Variable | Función | Valor en `.env.example` | Valor de respaldo del código |
| --- | --- | --- | --- |
| `PORT` | Puerto HTTP de Express | `3001` | `3000` |
| `MONGODB_URI` | URI y nombre de la base de datos | `mongodb://127.0.0.1:27018/autoregistro` | El mismo valor |

Por tanto, al copiar `.env.example` la aplicación utiliza **3001**. El puerto **3000** se usa si `PORT` no está definido o está vacío.

`backend/src/config/env.js` carga `backend/.env` mediante una ruta relativa al propio módulo. Las variables ya definidas en el entorno del proceso tienen prioridad sobre las del archivo. Reinicia el backend después de modificar la configuración.

`backend/.env` está excluido de Git; `.env.example` documenta la configuración que necesita el proyecto.

### Utilizar otro MongoDB

Para una instalación local que escuche en el puerto habitual `27017`, configura:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/autoregistro
```

Para otra instancia, utiliza su URI de conexión, incluyendo las credenciales si esa instancia las requiere. El último segmento de la URI determina la base de datos de la aplicación.

### Cambiar los puertos

- **HTTP:** cambia `PORT` en `backend/.env`, reinicia el servidor y abre el nuevo puerto en el navegador.
- **MongoDB de Docker:** cambia el puerto del anfitrión en `compose.yaml` y actualiza `MONGODB_URI`. Por ejemplo, con `"127.0.0.1:27019:27017"`, la URI será `mongodb://127.0.0.1:27019/autoregistro`. Aplica el cambio con `docker compose up -d mongo`.

El puerto `27017` dentro del contenedor y el puerto publicado en el anfitrión tienen funciones distintas: Node.js utiliza el puerto publicado porque se ejecuta en el anfitrión.

## Comandos y ejecución diaria

| Comando desde la raíz | Uso |
| --- | --- |
| `npm --prefix backend ci` | Instalar las dependencias desde el archivo de bloqueo |
| `docker compose up -d mongo` | Crear o arrancar el servicio MongoDB |
| `npm --prefix backend run dev` | Arrancar el backend con reinicio automático al cambiar su código |
| `npm --prefix backend start` | Arrancar el backend sin modo de vigilancia |
| `docker compose ps` | Consultar el estado del servicio de base de datos |
| `docker compose logs -f mongo` | Seguir los registros de MongoDB |
| `npm --prefix backend test` | Ejecutar las pruebas de modelos |
| `npm --prefix backend run test:integration` | Ejecutar las pruebas de persistencia y API |

Para volver a utilizar una instalación ya configurada:

```bash
docker compose up -d mongo
npm --prefix backend run dev
```

El modo `dev` reinicia Node.js al modificar los archivos del backend. Para ver cambios del frontend, recarga el navegador. `start` mantiene el servidor en primer plano y utiliza la misma configuración de entorno.

### Detener los servicios

1. Pulsa **Ctrl+C** en la terminal del backend. El servidor cierra HTTP y desconecta Mongoose; también gestiona la señal `SIGTERM`.
2. Detén MongoDB con:

```bash
docker compose stop mongo
```

También puedes utilizar `docker compose down` para retirar los contenedores y la red de Compose. Los datos permanecen en el volumen nombrado y estarán disponibles al volver a arrancar el mismo proyecto.

## Base de datos y persistencia

La base predeterminada es `autoregistro`. La relación entre sus colecciones es **un vehículo → muchos mantenimientos**.

### Colección `vehicles` — modelo `Vehicle`

| Campo | Tipo | Reglas |
| --- | --- | --- |
| `_id` | ObjectId | Generado automáticamente |
| `name` | String | Obligatorio; se recortan espacios en los extremos; máximo 120 caracteres |
| `type` | String | Obligatorio; se recortan espacios en los extremos; máximo 40 caracteres |
| `plate` | String | Obligatoria y única; mayúsculas, sin espacios; máximo 20 caracteres |
| `createdAt`, `updatedAt` | Date | Gestionados automáticamente por Mongoose |

Tiene un índice único `{ plate: 1 }`. Una matrícula como `1234 klm` se guarda como `1234KLM`.

### Colección `maintenances` — modelo `Maintenance`

| Campo | Tipo | Reglas |
| --- | --- | --- |
| `_id` | ObjectId | Generado automáticamente |
| `vehicle` | ObjectId | Obligatorio; referencia a `Vehicle` |
| `operation` | String | Obligatoria; se recortan espacios en los extremos; máximo 200 caracteres |
| `date` | Date | Obligatoria; la API recibe una fecha real en formato `YYYY-MM-DD` |
| `mileage` | Number | Entero obligatorio entre 0 y `Number.MAX_SAFE_INTEGER` |
| `costInCents` | Number | Entero obligatorio entre 0 y `Number.MAX_SAFE_INTEGER` |
| `createdAt`, `updatedAt` | Date | Gestionados automáticamente por Mongoose |

Índices: `{ date: -1 }` para consultas globales y `{ vehicle: 1, date: -1 }` para el historial de un vehículo.

Los importes se almacenan en **céntimos**: `12050` representa **120,50 €**. Las fechas de calendario se almacenan a medianoche UTC, por ejemplo `2026-11-15T00:00:00.000Z`.

La API verifica la existencia del vehículo al guardar un mantenimiento. Para eliminar un vehículo con historial, primero deben eliminarse sus mantenimientos. Las ediciones utilizan `save`, con validación de Mongoose. Los resúmenes se calculan sobre los registros guardados en MongoDB.

### Volumen y acceso directo

Compose monta el volumen `mongo_data` en `/data/db`; su nombre efectivo puede incorporar el prefijo del proyecto de Compose. Los datos persisten entre paradas y recreaciones del contenedor mientras se conserve ese volumen.

Desde MongoDB Compass, o desde un cliente instalado en el anfitrión, utiliza:

```text
mongodb://127.0.0.1:27018/autoregistro
```

Si tienes `mongosh` instalado, puedes acceder con:

```bash
mongosh "mongodb://127.0.0.1:27018/autoregistro"
```

## Páginas y almacenamiento del navegador

| Página | Ruta | Funciones |
| --- | --- | --- |
| Home | `/` | Totales, último mantenimiento y los tres registros más recientes |
| Vehículos | `/vehiculos.html` | Alta, edición, eliminación y resumen por vehículo |
| Historial | `/historial.html` | Búsqueda, filtros, ordenación, paginación, edición y eliminación |
| Gastos | `/gastos.html` | Filtros por año y vehículo, totales, coste medio y distribución mensual y por vehículo |
| Formulario | `/anadir-mantenimiento.html` | Crear un mantenimiento o editarlo mediante `?id=…` |
| Ajustes | `/ajustes.html` | Vehículo predeterminado, orden del historial y restablecimiento de preferencias |

Parámetros de navegación:

- `/vehiculos.html?new=1` abre el formulario de alta.
- `/historial.html?vehicle=…` filtra el historial de un vehículo; los filtros y la página quedan reflejados en la URL.
- `/anadir-mantenimiento.html?vehicle=…` preselecciona un vehículo.
- `/anadir-mantenimiento.html?id=…` carga el mantenimiento que se va a editar.

Los vehículos y mantenimientos se guardan en MongoDB. Las preferencias se almacenan en `localStorage` con la clave `autoregistro.preferences`, y los mensajes de confirmación entre páginas utilizan `sessionStorage` con la clave `autoregistro.flash`.

Las preferencias pertenecen al navegador y al origen: cambiar entre `localhost` y `127.0.0.1`, o cambiar el puerto HTTP, crea un contexto de almacenamiento distinto. El vehículo indicado en un enlace tiene prioridad sobre el predeterminado. Si este último ya no existe, la selección queda vacía. Restablecer preferencias guarda los valores iniciales: sin vehículo y orden de más recientes primero.

La interfaz utiliza formatos españoles para fechas, euros y kilómetros. Los formularios aceptan coma o punto decimal en el coste y hasta dos decimales. El historial muestra tabla en escritorio y tarjetas por debajo de 768 px.

## API HTTP

La URL base con la configuración de ejemplo es `http://localhost:3001/api`. Las peticiones con cuerpo utilizan `Content-Type: application/json`. Las respuestas son JSON, salvo las eliminaciones correctas, que devuelven `204` sin cuerpo.

| Método | Ruta relativa a `/api` | Descripción |
| --- | --- | --- |
| GET | `/health` | Estado del servidor HTTP |
| GET | `/vehicles` | Vehículos y sus estadísticas, dentro de `{ items }` |
| POST | `/vehicles` | Crear vehículo; devuelve `201` |
| PUT | `/vehicles/:id` | Editar vehículo |
| DELETE | `/vehicles/:id` | Eliminar vehículo sin mantenimientos asociados |
| GET | `/maintenances` | Historial filtrado y paginado |
| GET | `/maintenances/:id` | Obtener un mantenimiento |
| POST | `/maintenances` | Crear mantenimiento; devuelve `201` |
| PUT | `/maintenances/:id` | Editar mantenimiento |
| DELETE | `/maintenances/:id` | Eliminar mantenimiento |
| GET | `/summary` | Totales globales y tres mantenimientos recientes |
| GET | `/expenses` | Gastos mensuales y por vehículo de un año |

### Crear y editar vehículos

`POST /api/vehicles` y `PUT /api/vehicles/:id` reciben todos estos campos:

```json
{
  "name": "SEAT León",
  "type": "Coche",
  "plate": "1234 KLM"
}
```

La respuesta contiene `id`, `name`, `type` y `plate`. La consulta del listado añade `maintenanceCount`, `totalCostInCents`, `latestDate` y `mileage`; este último es el kilometraje máximo registrado.

### Crear y editar mantenimientos

`POST /api/maintenances` y `PUT /api/maintenances/:id` reciben:

```json
{
  "vehicle": "507f1f77bcf86cd799439011",
  "operation": "Cambio de aceite",
  "date": "2026-11-15",
  "mileage": 84500,
  "costInCents": 12050
}
```

Sustituye el identificador del ejemplo por el `id` de un vehículo real. Las actualizaciones `PUT` reciben el conjunto completo de campos.

El mantenimiento devuelto por la API tiene esta forma:

```json
{
  "id": "507f191e810c19729de860ea",
  "vehicle": {
    "id": "507f1f77bcf86cd799439011",
    "name": "SEAT León",
    "type": "Coche",
    "plate": "1234KLM"
  },
  "operation": "Cambio de aceite",
  "date": "2026-11-15",
  "mileage": 84500,
  "costInCents": 12050,
  "cost": 120.5
}
```

`cost` es el equivalente en euros de `costInCents`. El vehículo relacionado se carga mediante `populate`; al editar su nombre o matrícula se refleja el cambio en su historial.

### Consultas del historial

`GET /api/maintenances` admite:

| Parámetro | Uso |
| --- | --- |
| `vehicle` | Identificador del vehículo |
| `search` | Búsqueda literal por operación, sin distinguir mayúsculas |
| `from`, `to` | Fechas inclusivas en formato `YYYY-MM-DD` |
| `sort` | `recent` por defecto, `oldest`, `cost-desc` o `cost-asc` |
| `page` | Página a partir de 1; por defecto, 1 |
| `pageSize` | Registros por página; por defecto, 10; máximo, 100 |

Ejemplo:

```text
http://localhost:3001/api/maintenances?search=aceite&from=2026-01-01&to=2026-12-31&sort=recent&page=1&pageSize=10
```

Devuelve `{ items, pagination: { page, pageSize, total, pages }, totalCostInCents }`. El coste total incluye todos los resultados filtrados, no solo los de la página visible.

### Resumen y gastos

- `GET /api/summary` devuelve `totalVehicles`, `vehicleCount` —vehículos con mantenimientos—, `maintenanceCount`, `totalCostInCents` y `recent`.
- `GET /api/expenses?year=2026&vehicle=…` acepta un año entre 1000 y 9998 y un vehículo opcional. Por defecto utiliza el año actual y todos los vehículos. Devuelve `years`, `monthly`, `vehicles`, `totalCostInCents` y `maintenanceCount`. El desglose mensual contiene los doce meses, incluidos los que tienen gasto cero.

### Errores

Los errores incluyen `message` y, cuando corresponde, `fields` con los campos que necesitan corrección.

| Código | Significado |
| --- | --- |
| `400` | Datos, fechas, identificadores o parámetros inválidos |
| `404` | Recurso o ruta de API inexistente |
| `409` | Matrícula duplicada o eliminación de un vehículo con mantenimientos |
| `500` | Error interno al completar la operación |

## Pruebas automatizadas

### Modelos

```bash
npm --prefix backend test
```

Comprueban campos obligatorios, normalización de matrículas y validación de kilometraje y costes. Se ejecutan sin conexión a MongoDB.

### Persistencia y API

Con MongoDB arrancado:

```bash
npm --prefix backend run test:integration
```

Las pruebas usan por defecto `mongodb://127.0.0.1:27018`. Comprueban persistencia, referencias, índices, conflictos, validaciones HTTP, filtros, paginación, informes, actualizaciones y eliminaciones. Levantan su propio servidor HTTP en un puerto libre.

Para utilizar otra instancia desde Linux o macOS:

```bash
TEST_MONGODB_URI="mongodb://127.0.0.1:27017" npm --prefix backend run test:integration
```

En Windows PowerShell:

```powershell
$env:TEST_MONGODB_URI = "mongodb://127.0.0.1:27017"
npm --prefix backend run test:integration
Remove-Item Env:TEST_MONGODB_URI
```

`TEST_MONGODB_URI` es una variable específica de las pruebas y su valor predeterminado es independiente de `MONGODB_URI`. Cada prueba de integración crea una base `autoregistro_test_<identificador>` y la elimina al terminar; la conexión de pruebas debe permitir crear y eliminar esas bases.

## Estructura del proyecto

```text
.
├── frontend/
│   ├── index.html                  # Home
│   ├── vehiculos.html              # Gestión de vehículos
│   ├── historial.html              # Historial y filtros
│   ├── gastos.html                 # Resumen de gastos
│   ├── anadir-mantenimiento.html   # Alta y edición de mantenimientos
│   ├── ajustes.html                # Preferencias
│   ├── css/styles.css              # Estilos compartidos y adaptación móvil
│   ├── js/
│   │   ├── main.js                 # Inicialización según la página
│   │   ├── layout.js               # Navegación y pie compartidos
│   │   ├── icons.js                # Iconos SVG
│   │   ├── ui.js                   # Formatos, validación, mensajes y diálogos
│   │   ├── maintenance-list.js     # Tabla y tarjetas reutilizables
│   │   ├── home.js                 # Lógica del Home
│   │   ├── vehicles.js             # Lógica de Vehículos
│   │   ├── history.js              # Lógica del Historial
│   │   ├── expenses.js             # Lógica de Gastos
│   │   ├── maintenance-form.js     # Formulario de mantenimiento
│   │   ├── settings.js             # Lógica de Ajustes
│   │   └── services/               # Cliente HTTP, API y preferencias
│   └── assets/                     # Recursos y fuente Inter local
├── backend/
│   ├── .env.example                # Plantilla de configuración
│   ├── package.json                # Dependencias y scripts
│   ├── package-lock.json           # Versiones resueltas
│   ├── src/
│   │   ├── app.js                  # Express, JSON, API y archivos estáticos
│   │   ├── server.js               # Arranque y cierre del servidor
│   │   ├── config/                 # Variables y conexión a MongoDB
│   │   ├── routes/                 # Rutas de la API
│   │   ├── controllers/            # Peticiones y respuestas HTTP
│   │   ├── services/               # Validación, lógica, consultas e informes
│   │   ├── models/                 # Vehicle y Maintenance
│   │   └── middlewares/            # Tratamiento de errores
│   └── test/                       # Modelos, persistencia y API
├── compose.yaml                    # Servicio MongoDB y volumen
├── .gitignore
├── README.md                       # Instalación y documentación técnica
└── EXPLICACION.md                  # Idea, funcionalidades y recursos del proyecto
```

## Resolución de problemas

| Problema | Comprobación o solución |
| --- | --- |
| `node` o `npm` no se reconoce | Instala Node.js 22 o superior y abre una terminal nueva. Comprueba `node --version` y `npm --version`. |
| `npm` no encuentra `package.json` | Ejecuta los comandos desde la raíz utilizando `--prefix backend`. |
| Faltan módulos al iniciar | Ejecuta `npm --prefix backend ci`. |
| `docker compose` no está disponible o no conecta al motor | Comprueba la instalación de Compose v2 y que Docker Engine o Docker Desktop esté arrancado. |
| Docker indica que `27018` está ocupado | Comprueba si ya hay una instancia MongoDB en ese puerto. Utilízala mediante `MONGODB_URI`, o cambia de forma coherente el puerto publicado y la URI. |
| El backend muestra un error de conexión a MongoDB | Revisa `docker compose ps`, `docker compose logs --tail=50 mongo` y `MONGODB_URI`. La URI debe incluir anfitrión, puerto y base de datos. El tiempo de selección de servidor es de 5 segundos; si MongoDB aún se está iniciando, espera y vuelve a arrancar el backend. |
| `EADDRINUSE` al iniciar Node.js | El puerto HTTP está ocupado. Detén el proceso que lo utiliza o cambia `PORT` y reinicia. |
| La aplicación no responde en `3001` | Consulta la dirección que imprime Node.js y revisa `PORT`. Sin esa variable, el respaldo es `3000`. |
| Al abrir el HTML faltan navegación, estilos o datos | Entra por la URL de Express, por ejemplo `http://localhost:3001`. Los módulos, las rutas absolutas y la API requieren servir el proyecto por HTTP. |
| La interfaz abre desde otro servidor pero falla `/api` | Usa el servidor Express del proyecto: las peticiones actuales esperan frontend y API en el mismo origen. |
| Gastos muestra cero aunque hay mantenimientos | Revisa el año y el vehículo seleccionados; el año inicial es el actual y puede aplicarse un vehículo predeterminado. |
| Una matrícula aparece como duplicada | Las matrículas se normalizan a mayúsculas y sin espacios. Comprueba el vehículo ya registrado. |
| No se puede eliminar un vehículo | Elimina primero sus mantenimientos desde Historial. |
| Las preferencias cambian al usar otro navegador o puerto | Se guardan en el almacenamiento local de cada navegador y origen. Configúralas de nuevo en Ajustes. |
| Fallan las pruebas de integración | Comprueba que MongoDB esté disponible en el puerto de pruebas o define `TEST_MONGODB_URI`; el servidor de la aplicación puede estar detenido. |

Para volver a comprobar el servidor tras corregir la configuración, arranca el backend y consulta `/api/health` en el puerto indicado por la terminal.
