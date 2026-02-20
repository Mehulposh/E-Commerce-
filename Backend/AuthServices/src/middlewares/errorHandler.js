const errorHandler = (err, req, res, next) => {
  console.error(`[Auth Service Error] ${err.message}`);

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate field value' });
  }

  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal server error',
  });
};

export default errorHandler