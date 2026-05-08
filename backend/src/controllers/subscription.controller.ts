import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import { subscriptionService } from '../services/subscription.service';
import { SubscriptionPlan } from '../models/User';
import { sendSuccess, sendError } from '../utils/apiResponse';

// ── Validation schemas ────────────────────────────────────────────────────────

export const subscribePlanSchema = z.object({
  body: z.object({
    plan: z.enum(['free', 'basic', 'premium']),
  }),
});

export const changePlanSchema = z.object({
  body: z.object({
    plan: z.enum(['free', 'basic', 'premium']),
  }),
});

// ── Handlers ──────────────────────────────────────────────────────────────────

export const getPlans = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const plans = subscriptionService.getPlans();
    sendSuccess(res, plans);
  } catch (err) {
    next(err);
  }
};

export const getMyPlan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await subscriptionService.getMySubscription(req.userId!);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const subscribe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { plan } = req.body as { plan: SubscriptionPlan };
    const result = await subscriptionService.subscribe(req.userId!, plan);
    sendSuccess(res, result, `Subscribed to ${plan} plan successfully`);
  } catch (err) {
    next(err);
  }
};

export const changePlan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { plan } = req.body as { plan: SubscriptionPlan };
    const result = await subscriptionService.changePlan(req.userId!, plan);
    sendSuccess(res, result, `Plan changed to ${plan} successfully`);
  } catch (err) {
    next(err);
  }
};
