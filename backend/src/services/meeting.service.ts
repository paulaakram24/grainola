import mongoose from 'mongoose';
import { Meeting } from '../models/Meeting';
import { Folder } from '../models/Folder';
import { AppError } from '../middleware/error.middleware';

interface CreateMeetingInput {
  title: string;
  description?: string;
  folderId?: string;
  meetingDate?: string;
}

interface ListMeetingsQuery {
  page?: number;
  limit?: number;
  folderId?: string;
  search?: string;
  status?: string;
}

export class MeetingService {
  async listMeetings(userId: string, query: ListMeetingsQuery) {
    const { page = 1, limit = 20, folderId, search, status } = query;
    const skip = (page - 1) * limit;

    const filter: any = { userId };
    if (folderId) filter.folderId = folderId;
    if (status)   filter.status   = status;
    if (search) {
      filter.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [meetings, total] = await Promise.all([
      Meeting.find(filter)
        .sort({ meetingDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate('folderId', 'name color')
        .select('-transcript.segments -transcript.fullText'),
      Meeting.countDocuments(filter),
    ]);

    // Shape data to match frontend expectations
    const shaped = meetings.map((m) => ({
      ...m.toObject(),
      id: m._id,
      folder: m.folderId,
      recordings: (m.recordings ?? []).filter((r: any) => r.isActive),
      summary: m.summary
        ? { shortText: m.summary.shortText, status: m.summary.status }
        : null,
      _count: { highlights: m.highlights?.length ?? 0 },
    }));

    return {
      meetings: shaped,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getMeeting(userId: string, meetingId: string) {
    const meeting = await Meeting.findOne({ _id: meetingId, userId })
      .populate('folderId', 'name color id');
    if (!meeting) throw new AppError('Meeting not found', 404);

    return {
      ...meeting.toObject(),
      id: meeting._id,
      folder: meeting.folderId,
      recordings: (meeting.recordings ?? [])
        .filter((r: any) => r.isActive)
        .map((r: any) => ({ ...r.toObject(), id: r._id })),
    };
  }

  async createMeeting(userId: string, input: CreateMeetingInput) {
    let folderId = input.folderId;
    if (!folderId) {
      // Self-heal: if the user has no default folder (e.g. from an older
      // registration flow or accidental data loss), create one on the fly.
      let defaultFolder = await Folder.findOne({ userId, isDefault: true });
      if (!defaultFolder) {
        defaultFolder = await Folder.create({
          name:      'All Meetings',
          userId,
          isDefault: true,
          color:     '#6366f1',
          position:  0,
        });
      }
      folderId = defaultFolder._id.toString();
    } else {
      const folder = await Folder.findOne({ _id: folderId, userId });
      if (!folder) throw new AppError('Folder not found', 404);
    }

    const meeting = await Meeting.create({
      title:       input.title,
      description: input.description,
      folderId,
      userId,
      meetingDate: input.meetingDate ? new Date(input.meetingDate) : new Date(),
      status:      'PENDING',
    });

    return { ...meeting.toObject(), id: meeting._id };
  }

  async updateMeeting(userId: string, meetingId: string, data: Partial<CreateMeetingInput>) {
    const meeting = await this.requireMeeting(userId, meetingId);

    if (data.folderId) {
      const folder = await Folder.findOne({ _id: data.folderId, userId });
      if (!folder) throw new AppError('Folder not found', 404);
      meeting.folderId = new mongoose.Types.ObjectId(data.folderId);
    }
    if (data.title)       meeting.title       = data.title;
    if (data.description !== undefined) meeting.description = data.description;
    if (data.meetingDate) meeting.meetingDate = new Date(data.meetingDate);

    await meeting.save();
    return meeting;
  }

  async moveMeeting(userId: string, meetingId: string, targetFolderId: string) {
    const meeting = await this.requireMeeting(userId, meetingId);
    const folder  = await Folder.findOne({ _id: targetFolderId, userId });
    if (!folder) throw new AppError('Target folder not found', 404);

    meeting.folderId = new mongoose.Types.ObjectId(targetFolderId);
    await meeting.save();
    return meeting;
  }

  async deleteMeeting(userId: string, meetingId: string) {
    const meeting = await this.requireMeeting(userId, meetingId);
    await meeting.deleteOne();
  }

  async addHighlight(
    userId: string,
    meetingId: string,
    data: { text: string; startTime: number; endTime: number; note?: string; color?: string }
  ) {
    const meeting = await this.requireMeeting(userId, meetingId);
    meeting.highlights.push(data as any);
    await meeting.save();
    return meeting.highlights.at(-1);
  }

  async deleteHighlight(userId: string, meetingId: string, highlightId: string) {
    const meeting = await this.requireMeeting(userId, meetingId);
    meeting.highlights = meeting.highlights.filter(
      (h: any) => h._id.toString() !== highlightId
    ) as any;
    await meeting.save();
  }

  async requireMeeting(userId: string, meetingId: string) {
    const meeting = await Meeting.findOne({ _id: meetingId, userId });
    if (!meeting) throw new AppError('Meeting not found', 404);
    return meeting;
  }
}

export const meetingService = new MeetingService();
