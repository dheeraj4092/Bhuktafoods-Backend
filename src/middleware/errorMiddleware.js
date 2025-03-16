// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    timestamp: new Date().toISOString(),
    supabaseError: err.supabaseError || undefined
  });

  // Handle Supabase-specific errors
  if (err.supabaseError) {
    return res.status(err.status || 500).json({
      error: 'Database operation failed',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
      code: err.supabaseError.code
    });
  }

  // Handle authentication errors
  if (err.name === 'UnauthorizedError' || err.status === 401) {
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid or expired token'
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      message: err.message
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: 'Server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
};

// 404 handler
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Cannot ${req.method} ${req.path}`
  });
}; 