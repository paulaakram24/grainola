import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models/User';
import { sendError } from '../utils/apiResponse';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return sendError(res, 'No token provided', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      userId: string;
      email: string;
    };

    const user = await User.findById(payload.userId);
    if (!user) return sendError(res, 'User not found', 401);

    req.userId    = payload.userId;
    req.userEmail = payload.email;
    next();
  } catch {
    return sendError(res, 'Invalid or expired token', 401);
  }
};
