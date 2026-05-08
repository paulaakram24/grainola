import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Folder } from '../models/Folder';
import { Meeting } from '../models/Meeting';
import { RefreshToken } from '../models/RefreshToken';

dotenv.config();

async function removeDemoData() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('Connected to MongoDB');

  const demoEmail = 'demo@example.com';
  const user = await User.findOne({ email: demoEmail });

  if (!user) {
    console.log('No demo user found — nothing to remove.');
    await mongoose.disconnect();
    return;
  }

  const userId = user._id;

  const [folders, meetings, tokens] = await Promise.all([
    Folder.deleteMany({ userId }),
    Meeting.deleteMany({ userId }),
    RefreshToken.deleteMany({ userId }),
  ]);

  await User.deleteOne({ _id: userId });

  console.log(`Removed demo user (${demoEmail})`);
  console.log(`  Folders deleted:       ${folders.deletedCount}`);
  console.log(`  Meetings deleted:      ${meetings.deletedCount}`);
  console.log(`  Refresh tokens deleted:${tokens.deletedCount}`);
  console.log('Done.');

  await mongoose.disconnect();
}

removeDemoData().catch((e) => { console.error(e); process.exit(1); });
