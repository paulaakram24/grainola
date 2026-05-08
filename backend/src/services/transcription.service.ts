import fs from 'fs';
import path from 'path';
import Groq from 'groq-sdk';
import { Meeting } from '../models/Meeting';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

export class TranscriptionService {
  /** localPath is the file path on disk (passed from processor.service.ts) */
  async transcribeRecording(recordingId: string, meetingId: string, localPath: string) {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting || !meeting.transcript) throw new Error('Meeting/transcript not found');

    meeting.transcript.status = 'PROCESSING';
    await meeting.save();

    try {
      if (!fs.existsSync(localPath)) {
        throw new Error(`Audio file not found at path: ${localPath}`);
      }

      logger.info(`[Groq Whisper] Transcribing ${localPath}`);

      const result: any = await groq.audio.transcriptions.create({
        file:            fs.createReadStream(localPath),
        model:           'whisper-large-v3',
        response_format: 'verbose_json',
        timestamp_granularities: ['segment'],
      });

      const segments = ((result.segments ?? []) as any[]).map((seg) => ({
        text:      seg.text,
        startTime: seg.start,
        endTime:   seg.end,
      }));

      meeting.transcript.fullText = result.text;
      meeting.transcript.language = result.language ?? 'en';
      meeting.transcript.status   = 'COMPLETED';
      meeting.transcript.segments = segments as any;

      const lastSeg = segments.at(-1);
      if (lastSeg) meeting.durationSeconds = Math.ceil(lastSeg.endTime);

      await meeting.save();
      logger.info(`[Groq Whisper] Done for meeting ${meetingId}`);
    } catch (err) {
      meeting.transcript.status   = 'FAILED';
      meeting.transcript.errorMsg = (err as Error).message;
      await meeting.save();
      throw err;
    }
  }
}

export const transcriptionService = new TranscriptionService();
