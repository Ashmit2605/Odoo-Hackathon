// Handles HttpError, ZodError, and anything else
export function errorHandler(err, _req, res, _next) {
  // Zod validation errors
  if (err?.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed',
      issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }

  // Known HttpError
  if (err?.status && err.status >= 400 && err.status < 600) {
    return res.status(err.status).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Unexpected
  console.error('[error]', err);
  res.status(500).json({ error: 'Internal server error' });
}

export function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'Not found' });
}