import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { User } from '../models/User';
import { PLANS, PlanLimits } from '../services/subscription.service';
import { sendError } from '../utils/apiResponse';

/**
 * Factory that creates a middleware enforcing a minimum plan requirement.
 *
 * Usage:
 *   router.post('/upload', authenticate, requirePlan('basic'), uploadHandler)
 */
export const requirePlan = (...allowedPlans: Array<'free' | 'basic' | 'premium'>) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = await User.findById(req.userId).select('subscription');
    if (!user) return sendError(res, 'User not found', 401);

    const planOrder: Record<string, number> = { free: 0, basic: 1, premium: 2 };
    const userLevel = planOrder[user.subscription.plan] ?? 0;
    const minRequired = Math.min(...allowedPlans.map((p) => planOrder[p] ?? 99));

    if (userLevel < minRequired) {
      const lowestAllowed = allowedPlans.sort((a, b) => planOrder[a] - planOrder[b])[0];
      return sendError(
        res,
        `This feature requires the "${lowestAllowed}" plan or higher. Please upgrade your subscription.`,
        403
      );
    }

    next();
  };
};

/**
 * Middleware that attaches the user's plan limits to req so handlers can
 * check limits without a second DB round-trip.
 *
 * Usage:
 *   router.post('/upload', authenticate, attachPlanLimits, uploadHandler)
 * Access in handler:
 *   req.planLimits.maxMeetingDurationMinutes
 */
declare module 'express' {
  interface Request {
    planLimits?: PlanLimits;
    userPlan?: string;
  }
}

export const attachPlanLimits = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const user = await User.findById(req.userId).select('subscription');
  if (!user) return sendError(res, 'User not found', 401);

  const plan = PLANS.find((p) => p.id === user.subscription.plan);
  if (plan) {
    req.planLimits = plan.limits;
    req.userPlan   = plan.id;
  }
  next();
};
