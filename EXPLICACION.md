# AutoRegistro — explicación del proyecto

## 1. Idea del proyecto

**AutoRegistro** es una aplicación web para llevar el control del mantenimiento de vehículos de uso personal. Su objetivo es reunir en un mismo lugar qué trabajos se han realizado a un coche o una moto, en qué fecha, con cuántos kilómetros y cuánto han costado.

El proyecto nace de una necesidad cotidiana: cuando se utilizan varios vehículos, los datos de sus revisiones pueden quedar repartidos entre facturas, notas o recuerdos. AutoRegistro permite convertir esa información en un historial organizado y consultable.

La aplicación está pensada para registrar los trabajos realizados y conocer el gasto asociado. Cada vehículo tiene sus propios mantenimientos, y los resúmenes permiten consultar tanto su situación individual como el conjunto de registros.

## 2. Problema que resuelve

Al mantener un vehículo resulta útil poder responder a preguntas como:

- ¿Cuándo se cambió el aceite por última vez?
- ¿A qué kilometraje se sustituyeron los neumáticos?
- ¿Qué trabajos se han realizado en cada vehículo?
- ¿Cuánto se ha gastado en mantenimiento durante un año?
- ¿Qué vehículo concentra la mayor parte de los gastos?

AutoRegistro centraliza los datos necesarios para responderlas y facilita su búsqueda sin tener que revisar documentos separados.

## 3. Objetivos

- Gestionar los vehículos mediante su nombre, tipo y matrícula.
- Registrar los mantenimientos con datos concretos y fáciles de consultar.
- Facilitar la búsqueda por operación, vehículo y fechas.
- Mostrar el gasto total y su distribución por mes y vehículo.
- Permitir corregir y eliminar registros cuando sea necesario.
- Ofrecer una interfaz en español que se adapte a ordenadores y móviles.
- Conservar los vehículos y mantenimientos en una base de datos MongoDB.

Como proyecto intermodular, integra el desarrollo de una interfaz web, la programación de un servidor, el diseño de modelos de datos y la comunicación entre esas partes mediante una API HTTP.

## 4. Funcionalidades desarrolladas

### Home

La página inicial ofrece una visión general: vehículos con mantenimientos, número de registros, gasto total, último mantenimiento y los tres más recientes. Desde ella se puede acceder al historial, añadir un mantenimiento o editar y eliminar registros.

### Vehículos

Permite añadir, editar y eliminar vehículos. Cada tarjeta muestra su identificación, número de mantenimientos, gasto total, fecha del último registro y kilometraje máximo registrado.

También incluye accesos directos para consultar el historial de un vehículo o registrar un nuevo mantenimiento. Las matrículas se normalizan y se comprueba que no estén duplicadas. Para eliminar un vehículo, primero deben eliminarse sus mantenimientos asociados.

### Historial

Reúne todos los mantenimientos y permite buscar operaciones, filtrar por vehículo y rango de fechas y ordenar por fecha o coste. Los resultados están paginados e incluyen acciones de edición y eliminación.

En escritorio se muestran como tabla y en móvil como tarjetas con la misma información.

### Gastos

Presenta los gastos derivados de los mantenimientos. Incluye filtros por año y vehículo, gasto total, número de mantenimientos y coste medio por registro.

El desglose mensual permite ver cómo se reparte el gasto durante el año, y la distribución por vehículo permite comparar sus importes.

### Añadir y editar mantenimiento

El formulario recoge vehículo, operación realizada, fecha, kilometraje y coste. Sirve tanto para crear registros como para modificar los existentes.

Se comprueban los campos obligatorios, las fechas y los valores numéricos. El coste se introduce en euros y se guarda internamente en céntimos.

### Ajustes

Permite elegir un vehículo predeterminado y el orden preferido del historial, además de restablecer los valores iniciales. Estas preferencias se guardan en el navegador utilizado.

## 5. Ejemplo de uso

1. Una persona añade su vehículo, por ejemplo, un SEAT León con su matrícula.
2. Después de una revisión, registra un cambio de aceite con la fecha, los kilómetros y el importe de la factura.
3. El mantenimiento aparece en el historial y actualiza el resumen del Home.
4. Más adelante, puede buscar «aceite» o filtrar el historial del vehículo para consultar ese trabajo.
5. En Gastos puede seleccionar el año correspondiente y comprobar el importe invertido en mantenimiento.
6. Si detecta un dato incorrecto, puede editar el registro y los resúmenes reflejan la modificación.

## 6. Cómo está construido

El proyecto se organiza en tres partes:

- **Frontend:** páginas HTML, estilos CSS y módulos JavaScript que gestionan la navegación, los formularios y la presentación de datos.
- **Backend:** servidor Node.js con Express que recibe las peticiones de la interfaz, valida los datos y ejecuta las operaciones mediante una API.
- **Base de datos:** MongoDB, con modelos Mongoose para vehículos y mantenimientos y una relación de un vehículo con muchos registros.

El servidor entrega tanto la interfaz como la API. Los datos de los vehículos y mantenimientos se guardan en MongoDB, mientras que las preferencias se conservan en el almacenamiento local del navegador.

El proyecto incluye pruebas automatizadas de los modelos, de la persistencia y de las rutas HTTP. La instalación, las variables de entorno, los comandos y el detalle de la API se explican en el [README.md](README.md).

## 7. Acceso a los recursos del proyecto

| Recurso | Enlace | Contenido |
| --- | --- | --- |
| Repositorio de GitHub | URL_DEL_REPOSITORIO_GITHUB | Código fuente, configuración, pruebas y documentación del proyecto |
| Diseño en Figma | URL_DEL_DISENO_FIGMA | Recurso de diseño de la interfaz de AutoRegistro |
| Documentación técnica | [README.md](README.md) | Requisitos, instalación, ejecución, base de datos, API y pruebas |

Dentro del repositorio, el trabajo está organizado en:

- [`frontend/`](frontend/): páginas y código de la interfaz.
- [`backend/src/`](backend/src/): servidor, rutas, controladores, servicios y modelos.
- [`backend/test/`](backend/test/): pruebas automatizadas.
- [`compose.yaml`](compose.yaml): configuración de MongoDB con Docker Compose.

## 8. Cómo acceder a la aplicación

Para ejecutar AutoRegistro, sigue los pasos de [instalación y primera ejecución del README](README.md#instalación-y-primera-ejecución).

Con el archivo de configuración de ejemplo y el servidor arrancado, la aplicación se abre en **http://localhost:3001**. Desde esa dirección se accede al Home y a las demás páginas mediante la navegación principal.

Esta dirección corresponde a la instalación local: para utilizarla deben estar en funcionamiento el backend y la base de datos indicados en la documentación técnica.
