/**
 * Consistent error handler middleware.
 * Always returns { error: string } — never leaks internals.
 */
const errorHandler = (err, req, res, next) => {
  // Log full error server-side (never include passwords or tokens)
  const safeLog = {
    message: err.message,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  };
  console.error('[ERROR]', safeLog);

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    if (field === 'email') {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    if (field === 'date' || (err.keyValue && err.keyValue.date)) {
      return res.status(409).json({ error: 'Already checked in for this date.', code: 'DUPLICATE_CHECKIN' });
    }
    if (field === 'weekNumber' || (err.keyValue && err.keyValue.weekNumber)) {
      return res.status(409).json({ error: 'Weekly log already submitted for this week.', code: 'DUPLICATE_WEEKLY' });
    }
    return res.status(409).json({ error: 'Duplicate entry.' });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: messages.join('. ') });
  }

  // JWT errors handled in authGuard already
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }

  // Default
  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : 'Something went wrong. Please try again.';
  res.status(status).json({ error: message });
};

module.exports = { errorHandler };
