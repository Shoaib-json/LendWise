// utils/globalError.ts
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import AppError from './AppError';

interface DatabaseError extends Error {
  code?: string | number;
  errno?: number;
  sqlState?: string;
  sqlMessage?: string;
  sql?: string;
}

const handleDatabaseError = (err: DatabaseError): AppError => {
  let message = 'Database operation failed';
  
  // Handle specific MySQL/Database errors
  switch (err.code) {
    case 'ER_DUP_ENTRY':
      message = 'Duplicate entry. This record already exists.';
      return new AppError(message, 409);
    case 'ER_NO_REFERENCED_ROW_2':
      message = 'Referenced record does not exist.';
      return new AppError(message, 400);
    case 'ER_ROW_IS_REFERENCED_2':
      message = 'Cannot delete record as it is referenced by other records.';
      return new AppError(message, 400);
    case 'ER_BAD_NULL_ERROR':
      message = 'Required field cannot be null.';
      return new AppError(message, 400);
    case 'ER_DATA_TOO_LONG':
      message = 'Data too long for field.';
      return new AppError(message, 400);
    case 'ECONNREFUSED':
      message = 'Database connection refused.';
      return new AppError(message, 503);
    case 'ETIMEDOUT':
      message = 'Database connection timeout.';
      return new AppError(message, 503);
    default:
      return new AppError(message, 500);
  }
};

const sendErrorDev = (err: AppError, req: Request, res: Response): void => {
  console.error('🚨 ERROR DETAILS:');
  console.error('Status Code:', err.statusCode);
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  
  if (req.flash) {
    req.flash('error', `[DEV] ${err.message}`);
  }

  // For API routes, send detailed JSON in development
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err
    });
    return;
  }

  // For web views, try to redirect back or to home
  try {
    const backURL = req.get('Referrer') || '/';
    res.redirect(backURL);
  } catch (redirectError) {
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      message: err.message,
      stack: err.stack
    });
  }
};

const sendErrorProd = (err: AppError, req: Request, res: Response): void => {
  // Only log operational errors briefly in production
  if (err.isOperational) {
    console.error('⚠️  Operational Error:', err.message);
  } else {
    console.error('💥 Programming Error:', err);
  }

  if (req.flash) {
    if (err.isOperational) {
      req.flash('error', err.message);
    } else {
      req.flash('error', 'Something went wrong. Please try again.');
    }
  }

  // For API routes
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong!'
      });
    }
    return;
  }

  // For web views
  try {
    const backURL = req.get('Referrer') || '/';
    res.redirect(backURL);
  } catch (redirectError) {
    if (err.isOperational) {
      res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        message: err.message
      });
    } else {
      res.status(500).render('error', {
        title: 'Something went wrong!',
        message: 'Please try again later.'
      });
    }
  }
};

const globalErrorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Set default values
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Create a copy of the error
  let error = { ...err };
  error.message = err.message;

  // Handle specific database errors
  if (err.code || err.errno || err.sqlMessage) {
    error = handleDatabaseError(err);
  }

  // Handle other specific errors
  if (err.name === 'ValidationError') {
    error = new AppError('Invalid input data', 400);
  }

  if (err.name === 'CastError') {
    error = new AppError('Invalid data format', 400);
  }

  // Handle multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new AppError('File too large', 400);
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    error = new AppError('Too many files', 400);
  }

  // Send error based on environment
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
};

export default globalErrorHandler;