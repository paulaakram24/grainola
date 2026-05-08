import { Router } from 'express';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  getPlans,
  getMyPlan,
  subscribe,  subscribePlanSchema,
  changePlan, changePlanSchema,
} from '../controllers/subscription.controller';

const router = Router();

// Public – anyone can view available plans
router.get('/plans', getPlans);

// Protected – requires a valid JWT
router.get('/my-plan',     authenticate, getMyPlan);
router.post('/subscribe',  authenticate, validate(subscribePlanSchema),  subscribe);
router.post('/change-plan', authenticate, validate(changePlanSchema), changePlan);

export default router;
