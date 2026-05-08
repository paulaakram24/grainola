import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFolder extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  userId: mongoose.Types.ObjectId;
  isDefault: boolean;
  color: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

const folderSchema = new Schema<IFolder>(
  {
    name:      { type: String, required: true, trim: true },
    userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isDefault: { type: Boolean, default: false },
    color:     { type: String, default: '#6366f1' },
    position:  { type: Number, default: 0 },
  },
  { timestamps: true }
);

folderSchema.index({ userId: 1, name: 1 }, { unique: true });
folderSchema.index({ userId: 1, position: 1 });

export const Folder: Model<IFolder> = mongoose.model<IFolder>('Folder', folderSchema);
