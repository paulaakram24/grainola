import { transcriptionService } from './transcription.service';
import { summarizationService } from './summarization.service';
import { logger } from '../utils/logger';

/**
 * Runs transcription → summarization sequentially in the background.
 * Called with fire-and-forget after upload confirmation.
 * No Redis or job queue required.
 */
export async function processRecordingAsync(
  meetingId: string,
  recordingId: string,
  localPath: string
): Promise<void> {
  try {
    logger.info(`[Processor] Starting transcription for meeting ${meetingId}`);
    await transcriptionService.transcribeRecording(recordingId, meetingId, localPath);

    logger.info(`[Processor] Starting summarization for meeting ${meetingId}`);
    await summarizationService.summarizeMeeting(meetingId);

    logger.info(`[Processor] Completed meeting ${meetingId}`);
  } catch (err) {
    logger.error(`[Processor] Failed for meeting ${meetingId}:`, err);
    // Status is set to FAILED inside each service on error
  }
}
