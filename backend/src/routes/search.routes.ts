import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { summarizationService } from '../services/summarization.service';
import { sendSuccess, sendError } from '../utils/apiResponse';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { q, page, limit } = req.query as Record<string, string>;
    if (!q || q.trim().length < 2) {
      return sendError(res, 'Query must be at least 2 characters', 400);
    }
    const result = await summarizationService.searchTranscripts(
      req.userId!,
      q.trim(),
      page  ? parseInt(page)            : 1,
      limit ? Math.min(parseInt(limit), 50) : 10
    );
    sendSuccess(res, result.results, undefined, 200, result.meta);
  } catch (err) { next(err); }
});

export default router;
