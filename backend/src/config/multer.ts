import fs from 'fs';
import path from 'path';
import { env } from './env';

const uploadsDir = path.resolve(env.UPLOADS_DIR);
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

export { uploadsDir };
