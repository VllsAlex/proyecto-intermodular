# Proyecto intermodular

Estructura inicial de una aplicación web con frontend en **HTML, CSS y JavaScript** y backend en **Node.js y Express**.

## Requisitos

- Node.js 22 o superior.
- npm, incluido con Node.js.

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
│       │   └── env.js             # Lectura de variables de entorno
│       ├── routes/                # Definición de rutas de la API
│       │   └── index.js
│       ├── controllers/           # Gestión de las peticiones y respuestas
│       │   └── health.controller.js
│       ├── services/              # Lógica de negocio
│       ├── models/                # Modelos y acceso a datos
│       └── middlewares/           # Validación, autenticación y otros intermediarios
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
npm --prefix backend run dev
```

Abre **http://localhost:3000** en el navegador (o el puerto configurado en tu entorno). Express sirve tanto los archivos del frontend como la API, por lo que basta con arrancar este servidor. La página inicial muestra el resumen de mantenimiento de AutoRegistro.

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

El archivo `.env` está excluido de Git. Usa `.env.example` para documentar nuevas variables sin incluir credenciales reales.

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
- **Modelos:** añade los modelos y el acceso a la base de datos en `backend/src/models/` cuando el proyecto lo necesite.
- **Middlewares:** añade funciones compartidas de validación, autenticación o tratamiento de errores en `backend/src/middlewares/`.

El frontend utiliza módulos nativos de JavaScript y no requiere un proceso de compilación. La estructura inicial no incluye una conexión a base de datos.

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
