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

Ejecuta estos comandos desde la raíz del proyecto:

```bash
npm --prefix backend install
cp backend/.env.example backend/.env
npm --prefix backend run dev
```

Abre **http://localhost:3000** en el navegador. Express sirve tanto los archivos del frontend como la API, por lo que basta con arrancar este servidor. La página inicial consulta la API y muestra el estado de la conexión.

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
