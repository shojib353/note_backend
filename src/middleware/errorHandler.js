/**
 * Centralized API Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for developers
  console.error('[Error Handler]', err);

  // Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid identifier: ${err.value}`;
    return res.status(404).json({ success: false, message });
  }

  // Mongoose duplicate key (Code 11000)
  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for ${duplicateField}. Must be unique.`;
    return res.status(400).json({ success: false, message });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({ success: false, message: messages.join(', ') });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid authentication token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Authentication token expired' });
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
  });
};

module.exports = errorHandler;
