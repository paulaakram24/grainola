import Groq from 'groq-sdk';
import { Meeting } from '../models/Meeting';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

const PROMPT = `You are an expert at analysing meeting transcripts. Given the transcript below, extract:
1. A short summary (2-3 sentences max)
2. Key bullet points (5-8 most important points)
3. Action items (include owner and due date if mentioned)
4. Key topics (5-8 main topics as short phrases)
5. Overall sentiment (positive/neutral/negative)

Respond ONLY with valid JSON:
{
  "shortSummary": "string",
  "bulletPoints": ["string"],
  "actionItems": [{ "text": "string", "owner": "string|null", "dueDate": "string|null" }],
  "keyTopics": ["string"],
  "sentiment": "positive|neutral|negative"
}

TRANSCRIPT:
`;

export class SummarizationService {
  async summarizeMeeting(meetingId: string) {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting || !meeting.transcript?.fullText) {
      throw new Error('Transcript not available');
    }
    if (!meeting.summary) throw new Error('Summary record not found');

    meeting.summary.status = 'PROCESSING';
    await meeting.save();

    try {
      // Llama 3 has a 32k context window — truncate to ~24k chars to stay safe
      const truncated = meeting.transcript.fullText.slice(0, 24000);

      const completion = await groq.chat.completions.create({
        model:    'llama-3.3-70b-versatile',  // free, best quality on Groq
        messages: [{ role: 'user', content: PROMPT + truncated }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens:  2000,
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new Error('Empty response from Groq');
      const result = JSON.parse(raw);

      meeting.summary.shortText    = result.shortSummary;
      meeting.summary.bulletPoints = result.bulletPoints;
      meeting.summary.actionItems  = result.actionItems;
      meeting.summary.keyTopics    = result.keyTopics;
      meeting.summary.sentiment    = result.sentiment;
      meeting.summary.status       = 'COMPLETED';
      meeting.status               = 'COMPLETED';

      await meeting.save();
      logger.info(`[Groq Llama] Summary done for meeting ${meetingId}`);
    } catch (err) {
      meeting.summary.status   = 'FAILED';
      meeting.summary.errorMsg = (err as Error).message;
      meeting.status           = 'FAILED';
      await meeting.save();
      throw err;
    }
  }

  async searchTranscripts(userId: string, query: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const results = await Meeting.aggregate([
      { $match: { userId, 'transcript.segments': { $exists: true } } },
      { $unwind: '$transcript.segments' },
      { $match: { 'transcript.segments.text': { $regex: query, $options: 'i' } } },
      {
        $project: {
          title:       1,
          meetingDate: 1,
          segment:     '$transcript.segments',
        },
      },
      { $sort: { meetingDate: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const totalAgg = await Meeting.aggregate([
      { $match: { userId, 'transcript.segments': { $exists: true } } },
      { $unwind: '$transcript.segments' },
      { $match: { 'transcript.segments.text': { $regex: query, $options: 'i' } } },
      { $count: 'total' },
    ]);

    const total = totalAgg[0]?.total ?? 0;
    return {
      results,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}

export const summarizationService = new SummarizationService();
