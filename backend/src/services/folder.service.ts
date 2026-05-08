import mongoose from 'mongoose';
import { Folder } from '../models/Folder';
import { Meeting } from '../models/Meeting';
import { AppError } from '../middleware/error.middleware';

export class FolderService {
  async getFolders(userId: string) {
    let folders = await Folder.find({ userId }).sort({ isDefault: -1, position: 1 });

    // Self-heal: every user must have an "All Meetings" default folder.
    const hasDefault = folders.some((f) => f.isDefault);
    if (!hasDefault) {
      const created = await Folder.create({
        name:      'All Meetings',
        userId,
        isDefault: true,
        color:     '#6366f1',
        position:  0,
      });
      folders = [created, ...folders];
    }

    // Attach meeting counts
    const counts = await Meeting.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$folderId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c: any) => [c._id.toString(), c.count]));

    return folders.map((f) => ({
      ...f.toObject({ virtuals: true }),
      id: f._id,
      _count: { meetings: countMap.get(f._id.toString()) ?? 0 },
    }));
  }

  async createFolder(userId: string, name: string, color?: string) {
    const count = await Folder.countDocuments({ userId });
    const folder = await Folder.create({
      name, userId, color: color ?? '#6366f1', position: count,
    });
    return { ...folder.toObject(), id: folder._id, _count: { meetings: 0 } };
  }

  async updateFolder(userId: string, folderId: string, data: { name?: string; color?: string }) {
    const folder = await this.requireFolder(userId, folderId);
    if (folder.isDefault && data.name) throw new AppError('Cannot rename the default folder', 400);
    Object.assign(folder, data);
    await folder.save();
    return folder;
  }

  async deleteFolder(userId: string, folderId: string) {
    const folder = await this.requireFolder(userId, folderId);
    if (folder.isDefault) throw new AppError('Cannot delete the default folder', 400);

    const defaultFolder = await Folder.findOne({ userId, isDefault: true });
    if (defaultFolder) {
      await Meeting.updateMany({ userId, folderId }, { folderId: defaultFolder._id });
    }

    await folder.deleteOne();
  }

  async reorderFolders(userId: string, orderedIds: string[]) {
    await Promise.all(
      orderedIds.map((id, index) =>
        Folder.updateOne({ _id: id, userId }, { position: index })
      )
    );
  }

  private async requireFolder(userId: string, folderId: string) {
    const folder = await Folder.findOne({ _id: folderId, userId });
    if (!folder) throw new AppError('Folder not found', 404);
    return folder;
  }
}

export const folderService = new FolderService();
