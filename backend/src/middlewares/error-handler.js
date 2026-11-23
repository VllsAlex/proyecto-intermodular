export function errorHandler(error, _req, res, _next) {
  if (error.code === 11000) {
    return res.status(409).json({ message: 'Ya existe un vehículo con esa matrícula.', fields: { plate: 'Esta matrícula ya está registrada.' } });
  }
  if (error.name === 'ValidationError') {
    const fields = Object.fromEntries(Object.keys(error.errors).map((field) => [field, 'Revisa este campo: el valor no es válido.']));
    return res.status(400).json({ message: 'Revisa los datos del formulario.', fields });
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'El cuerpo de la petición debe ser JSON válido.' });
  }
  if (error.status && error.status < 500) {
    return res.status(error.status).json({ message: error.message, fields: error.fields || {} });
  }
  console.error(error);
  res.status(500).json({ message: 'No se ha podido completar la operación. Inténtalo de nuevo.' });
}
