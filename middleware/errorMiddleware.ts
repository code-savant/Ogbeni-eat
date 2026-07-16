export {};
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  // Log error in development, don't leak details in production
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : (err.message || 'Server error'),
  });
};

module.exports = errorHandler;
