import { Router } from 'express';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  register, registerSchema,
  login, loginSchema,
  refreshToken, logout, getProfile,
} from '../controllers/auth.controller';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login',    validate(loginSchema),    login);
router.post('/refresh',  refreshToken);
router.post('/logout',   logout);
router.get('/me',        authenticate, getProfile);

export default router;
