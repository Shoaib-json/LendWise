import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import AppError from '../utils/AppError';

const globalErrorHandler: ErrorRequestHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Flash message (for views)
  if (req.flash) {
    req.flash('error', err.message);
  }

  // For API routes, send JSON
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    return; // Early return without returning the response object
  }

  // For web views, redirect back
  res.redirect('back');
};

export default globalErrorHandler;