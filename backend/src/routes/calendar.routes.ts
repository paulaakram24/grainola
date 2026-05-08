import { Router, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { calendarService } from '../services/calendar.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { env } from '../config/env';
import { handleGoogleLoginCallback, isLoginState } from '../controllers/oauth.controller';

const router = Router();

// OAuth redirect — browser navigates here directly so can't send an Authorization header.
// We accept the JWT as a ?token= query param only for this one endpoint.
router.get('/oauth/connect', (req: AuthRequest, res: Response) => {
  const token = req.query.token as string | undefined;
  if (!token) return sendError(res, 'No token provided', 401);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    const url = calendarService.getAuthUrl(payload.userId);
    res.redirect(url);
  } catch {
    return sendError(res, 'Invalid or expired token', 401);
  }
});

router.get('/oauth/callback', async (req: AuthRequest, res: Response) => {
  const { code, state } = req.query as { code: string; state: string };
  if (!code || !state) return sendError(res, 'Missing code or state', 400);

  // Login flow uses the same Google redirect URI but tags state with "login:..."
  if (isLoginState(state)) {
    return handleGoogleLoginCallback(req, res);
  }

  try {
    // Otherwise the state is a userId from the calendar-link flow
    await calendarService.handleCallback(code, state);
    res.redirect(`${env.FRONTEND_URL}/dashboard?calendar=connected`);
  } catch (err) {
    res.redirect(`${env.FRONTEND_URL}/dashboard?calendar=error`);
  }
});

// Protected routes
router.use(authenticate);

router.delete('/disconnect', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await calendarService.disconnectCalendar(req.userId!);
    sendSuccess(res, null, 'Calendar disconnected');
  } catch (err) { next(err); }
});

router.get('/events', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const events = await calendarService.getUpcomingEvents(req.userId!);
    sendSuccess(res, events);
  } catch (err) { next(err); }
});

router.post('/import', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { eventIds } = req.body as { eventIds: string[] };
    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return sendError(res, 'eventIds array required', 400);
    }
    const meetings = await calendarService.importEventsAsMeetings(req.userId!, eventIds);
    sendSuccess(res, meetings, `${meetings.length} meetings imported`);
  } catch (err) { next(err); }
});

export default router;
