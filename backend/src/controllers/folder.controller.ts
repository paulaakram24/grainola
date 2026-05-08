import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { folderService } from '../services/folder.service';
import { sendSuccess } from '../utils/apiResponse';
import { AuthRequest } from '../middleware/auth.middleware';

export const createFolderSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  }),
});

export const updateFolderSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  }),
});

export const getFolders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const folders = await folderService.getFolders(req.userId!);
    sendSuccess(res, folders);
  } catch (err) { next(err); }
};

export const createFolder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const folder = await folderService.createFolder(req.userId!, req.body.name, req.body.color);
    sendSuccess(res, folder, 'Folder created', 201);
  } catch (err) { next(err); }
};

export const updateFolder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const folder = await folderService.updateFolder(req.userId!, req.params.id, req.body);
    sendSuccess(res, folder, 'Folder updated');
  } catch (err) { next(err); }
};

export const deleteFolder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await folderService.deleteFolder(req.userId!, req.params.id);
    sendSuccess(res, null, 'Folder deleted');
  } catch (err) { next(err); }
};

export const reorderFolders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await folderService.reorderFolders(req.userId!, req.body.orderedIds);
    sendSuccess(res, null, 'Folders reordered');
  } catch (err) { next(err); }
};
