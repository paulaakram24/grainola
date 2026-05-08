import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  getFolders, createFolder, createFolderSchema,
  updateFolder, updateFolderSchema,
  deleteFolder, reorderFolders,
} from '../controllers/folder.controller';

const router = Router();
router.use(authenticate);

router.get('/',          getFolders);
router.post('/',         validate(createFolderSchema), createFolder);
router.put('/reorder',   reorderFolders);
router.put('/:id',       validate(updateFolderSchema), updateFolder);
router.delete('/:id',    deleteFolder);

export default router;
