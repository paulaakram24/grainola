import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { sendError } from '../utils/apiResponse';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError && err.isOperational) {
    return sendError(res, err.message, err.statusCode);
  }

  // Prisma unique constraint violation
  if ((err as any).code === 'P2002') {
    const field = (err as any).meta?.target?.[0] ?? 'field';
    return sendError(res, `${field} already exists`, 409);
  }

  logger.error('Unhandled error:', err);
  return sendError(res, 'Internal server error', 500);
};

export const notFound = (req: Request, res: Response) => {
  sendError(res, `Route ${req.originalUrl} not found`, 404);
};
