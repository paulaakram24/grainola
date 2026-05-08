import mongoose, { Schema, Document, Model } from 'mongoose';

// ── Embedded sub-schemas ──────────────────────────────────────────────────────

const recordingSchema = new Schema({
  s3Key:      { type: String },
  s3Url:      { type: String },
  localPath:  { type: String },
  fileName:   { type: String, required: true },
  fileSize:   { type: Number, required: true },
  mimeType:   { type: String, required: true },
  durationSec:{ type: Number },
  version:    { type: Number, default: 1 },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true });

const segmentSchema = new Schema({
  text:      { type: String, required: true },
  startTime: { type: Number, required: true },
  endTime:   { type: Number, required: true },
  speakerLabel: { type: String },
  confidence:   { type: Number },
}, { _id: true });

const speakerSchema = new Schema({
  label: { type: String, required: true },
  name:  { type: String },
}, { _id: true });

const transcriptSchema = new Schema({
  fullText: { type: String },
  language: { type: String },
  status:   { type: String, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'PENDING' },
  errorMsg: { type: String },
  segments: [segmentSchema],
  speakers: [speakerSchema],
}, { timestamps: true });

const summarySchema = new Schema({
  shortText:    { type: String },
  bulletPoints: [{ type: String }],
  actionItems:  [{ text: String, owner: String, dueDate: String }],
  keyTopics:    [{ type: String }],
  sentiment:    { type: String, enum: ['positive', 'neutral', 'negative'] },
  status:       { type: String, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'PENDING' },
  errorMsg:     { type: String },
}, { timestamps: true });

const highlightSchema = new Schema({
  text:      { type: String, required: true },
  startTime: { type: Number, required: true },
  endTime:   { type: Number, required: true },
  color:     { type: String, default: '#fbbf24' },
  note:      { type: String },
}, { timestamps: true });

// ── Main Meeting schema ───────────────────────────────────────────────────────

export interface IMeeting extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  userId: mongoose.Types.ObjectId;
  folderId: mongoose.Types.ObjectId;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  meetingDate: Date;
  durationSeconds?: number;
  calendarEventId?: string;
  calendarSource?: string;
  participants?: { name?: string; email?: string }[];
  recordings: mongoose.Types.DocumentArray<any>;
  transcript?: any;
  summary?: any;
  highlights: mongoose.Types.DocumentArray<any>;
  createdAt: Date;
  updatedAt: Date;
}

const meetingSchema = new Schema<IMeeting>(
  {
    title:           { type: String, required: true, trim: true },
    description:     { type: String },
    userId:          { type: Schema.Types.ObjectId, ref: 'User', required: true },
    folderId:        { type: Schema.Types.ObjectId, ref: 'Folder', required: true },
    status:          { type: String, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'PENDING' },
    meetingDate:     { type: Date, default: Date.now },
    durationSeconds: { type: Number },
    calendarEventId: { type: String },
    calendarSource:  { type: String },
    participants:    [{ name: String, email: String }],
    recordings:      [recordingSchema],
    transcript:      transcriptSchema,
    summary:         summarySchema,
    highlights:      [highlightSchema],
  },
  { timestamps: true }
);

meetingSchema.index({ userId: 1, meetingDate: -1 });
meetingSchema.index({ userId: 1, folderId: 1 });
meetingSchema.index({ userId: 1, status: 1 });
meetingSchema.index({ 'transcript.segments.text': 'text', title: 'text' });

export const Meeting: Model<IMeeting> = mongoose.model<IMeeting>('Meeting', meetingSchema);
