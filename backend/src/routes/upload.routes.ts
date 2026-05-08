import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { directUploadHandler, deleteRecording } from '../controllers/upload.controller';

const router = Router();
router.use(authenticate);

router.post('/upload',         directUploadHandler);
router.delete('/:recordingId', deleteRecording);

export default router;
