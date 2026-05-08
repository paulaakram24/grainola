import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  listMeetings, getMeeting,
  createMeeting, createMeetingSchema,
  updateMeeting, updateMeetingSchema,
  moveMeeting, deleteMeeting,
  addHighlight, deleteHighlight,
} from '../controllers/meeting.controller';

const router = Router();
router.use(authenticate);

router.get('/',                         listMeetings);
router.post('/',                        validate(createMeetingSchema), createMeeting);
router.get('/:id',                      getMeeting);
router.put('/:id',                      validate(updateMeetingSchema), updateMeeting);
router.patch('/:id/move',               moveMeeting);
router.delete('/:id',                   deleteMeeting);
router.post('/:id/highlights',          addHighlight);
router.delete('/:id/highlights/:highlightId', deleteHighlight);

export default router;
