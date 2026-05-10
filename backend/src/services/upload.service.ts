import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as FileType from 'file-type';
import { Meeting } from '../models/Meeting';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import { processRecordingAsync } from './processor.service';
import { uploadsDir } from '../config/multer';
import { subscriptionService } from './subscription.service';

const ALLOWED_MIME_TYPES = [
  'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm',
  'audio/webm;codecs=opus',
  'video/mp4', 'video/webm', 'video/quicktime',
];

// MIME types we accept after magic-byte sniffing. webm is the same container
// for both audio and video — we accept either for an audio-recording flow.
const ALLOWED_DETECTED_MIMES = new Set([
  'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm',
  'audio/mp4', 'audio/x-m4a',
  'video/webm', 'video/mp4', 'video/quicktime',
  'application/ogg',
]);

export class UploadService {
  async directUpload(
    userId: string,
    meetingId: string,
    audioBase64: string,
    mimeType: string,
    fileName: string,
    fileSize: number,
  ) {
    const baseMime = mimeType.split(';')[0];
    if (!ALLOWED_MIME_TYPES.some((m) => mimeType.startsWith(m.split(';')[0]))) {
      throw new AppError(`Unsupported file type: ${mimeType}`, 400);
    }

    const meeting = await Meeting.findOne({ _id: meetingId, userId });
    if (!meeting) throw new AppError('Meeting not found', 404);

    // Enforce per-plan recording limit
    const maxRecordings = await subscriptionService.enforceLimit(userId, 'maxRecordingsPerMeeting');
    const activeCount   = (meeting.recordings ?? []).filter((r: any) => r.isActive).length;
    if (maxRecordings !== null && activeCount >= (maxRecordings as number)) {
      throw new AppError(
        `Your plan allows ${maxRecordings} recording(s) per meeting. Upgrade to add more.`,
        403,
      );
    }

    const ext       = this.extForMime(baseMime);
    const diskName  = `${uuidv4()}${ext}`;
    const localPath = path.join(uploadsDir, diskName);

    const buffer = Buffer.from(audioBase64, 'base64');

    // Magic-byte sniffing — never trust the client-supplied mimeType. Without
    // this, a user with a stolen access token could upload an HTML/exe payload
    // labelled "audio/webm" and have us serve it from /uploads/...
    const detected = await FileType.fromBuffer(buffer);
    if (!detected || !ALLOWED_DETECTED_MIMES.has(detected.mime)) {
      throw new AppError(
        `File contents are not a recognised audio/video format${detected ? ` (got ${detected.mime})` : ''}`,
        400,
      );
    }

    fs.writeFileSync(localPath, buffer);

    const fileUrl = `/uploads/${diskName}`;

    meeting.recordings.push({
      localPath,
      s3Url:    fileUrl,
      s3Key:    '',
      fileName,
      fileSize: buffer.byteLength,
      mimeType,
      isActive: true,
    } as any);

    meeting.status = 'PROCESSING';
    if (!meeting.transcript) {
      (meeting as any).transcript = { status: 'PENDING', segments: [], speakers: [] };
    }
    if (!meeting.summary) {
      (meeting as any).summary = { status: 'PENDING' };
    }

    await meeting.save();
    const recordingId = meeting.recordings.at(-1)!._id.toString();

    processRecordingAsync(meeting._id.toString(), recordingId, localPath)
      .catch((err) => logger.error(`Background processing failed for meeting ${meeting._id}:`, err));

    return { recordingId, meetingId: meeting._id };
  }

  async deleteRecording(userId: string, recordingId: string) {
    const meeting = await Meeting.findOne({ userId, 'recordings._id': recordingId });
    if (!meeting) throw new AppError('Recording not found', 404);

    const recording = meeting.recordings.id(recordingId);
    if (!recording) throw new AppError('Recording not found', 404);

    if (recording.localPath && fs.existsSync(recording.localPath)) {
      fs.unlinkSync(recording.localPath);
    }

    meeting.recordings.pull(recordingId);
    await meeting.save();
  }

  private extForMime(mime: string): string {
    const map: Record<string, string> = {
      'audio/webm': '.webm',
      'audio/ogg':  '.ogg',
      'audio/mpeg': '.mp3',
      'audio/mp4':  '.m4a',
      'audio/wav':  '.wav',
      'video/mp4':  '.mp4',
      'video/webm': '.webm',
    };
    return map[mime] ?? '.webm';
  }
}

export const uploadService = new UploadService();
