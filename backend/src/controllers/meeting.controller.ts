import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { meetingService } from '../services/meeting.service';
import { sendSuccess } from '../utils/apiResponse';
import { AuthRequest } from '../middleware/auth.middleware';

export const createMeetingSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    folderId: z.string().min(1).optional(),
    meetingDate: z.string().datetime().optional(),
  }),
});

export const updateMeetingSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    folderId: z.string().min(1).optional(),
    meetingDate: z.string().datetime().optional(),
  }),
});

export const listMeetings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page, limit, folderId, search, status } = req.query as Record<string, string>;
    const result = await meetingService.listMeetings(req.userId!, {
      page: page ? parseInt(page) : 1,
      limit: limit ? Math.min(parseInt(limit), 100) : 20,
      folderId,
      search,
      status: status as any,
    });
    sendSuccess(res, result.meetings, undefined, 200, result.meta);
  } catch (err) { next(err); }
};

export const getMeeting = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const meeting = await meetingService.getMeeting(req.userId!, req.params.id);
    sendSuccess(res, meeting);
  } catch (err) { next(err); }
};

export const createMeeting = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const meeting = await meetingService.createMeeting(req.userId!, req.body);
    sendSuccess(res, meeting, 'Meeting created', 201);
  } catch (err) { next(err); }
};

export const updateMeeting = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const meeting = await meetingService.updateMeeting(req.userId!, req.params.id, req.body);
    sendSuccess(res, meeting, 'Meeting updated');
  } catch (err) { next(err); }
};

export const moveMeeting = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { folderId } = req.body;
    const meeting = await meetingService.moveMeeting(req.userId!, req.params.id, folderId);
    sendSuccess(res, meeting, 'Meeting moved');
  } catch (err) { next(err); }
};

export const deleteMeeting = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await meetingService.deleteMeeting(req.userId!, req.params.id);
    sendSuccess(res, null, 'Meeting deleted');
  } catch (err) { next(err); }
};

export const addHighlight = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const highlight = await meetingService.addHighlight(req.userId!, req.params.id, req.body);
    sendSuccess(res, highlight, 'Highlight added', 201);
  } catch (err) { next(err); }
};

export const deleteHighlight = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await meetingService.deleteHighlight(req.userId!, req.params.id, req.params.highlightId);
    sendSuccess(res, null, 'Highlight deleted');
  } catch (err) { next(err); }
};
