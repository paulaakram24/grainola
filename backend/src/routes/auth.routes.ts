import { Router } from 'express';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  register, registerSchema,
  login, loginSchema,
  refreshToken, logout, getProfile,
} from '../controllers/auth.controller';
import {
  googleOAuthStart,
  githubOAuthStart, githubOAuthCallback,
} from '../controllers/oauth.controller';

const router = Router();

// Email/password
router.post('/register', validate(registerSchema), register);
router.post('/login',    validate(loginSchema),    login);
router.post('/refresh',  refreshToken);
router.post('/logout',   logout);
router.get('/me',        authenticate, getProfile);

// OAuth — providers
// Google login: starts here, returns via the shared /calendar/oauth/callback
// (which dispatches login-tagged state back into oauth.controller).
router.get('/oauth/google',           googleOAuthStart);
router.get('/oauth/github',           githubOAuthStart);
router.get('/oauth/github/callback',  githubOAuthCallback);

export default router;
