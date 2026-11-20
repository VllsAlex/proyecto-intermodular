export function getHealth(_req, res) {
  res.json({
    status: 'ok',
    message: 'El servidor está funcionando correctamente.',
  });
}
