import { Response, NextFunction } from 'express';
import { uploadService } from '../services/upload.service';
import { sendSuccess } from '../utils/apiResponse';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

export const directUploadHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { meetingId, audioBase64, mimeType, fileName, fileSize } = req.body;
    if (!meetingId)    throw new AppError('meetingId is required', 400);
    if (!audioBase64)  throw new AppError('audioBase64 is required', 400);
    if (!mimeType)     throw new AppError('mimeType is required', 400);

    const result = await uploadService.directUpload(
      req.userId!,
      meetingId,
      audioBase64,
      mimeType,
      fileName ?? 'recording.webm',
      fileSize  ?? 0,
    );
    sendSuccess(res, result, 'Upload saved, transcription queued', 201);
  } catch (err) { next(err); }
};

export const deleteRecording = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await uploadService.deleteRecording(req.userId!, req.params.recordingId);
    sendSuccess(res, null, 'Recording deleted');
  } catch (err) { next(err); }
};
