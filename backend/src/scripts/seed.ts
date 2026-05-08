import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Folder } from '../models/Folder';

dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('Connected to MongoDB');

  const email = 'demo@example.com';
  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name:         'Demo User',
      email,
      passwordHash: await bcrypt.hash('password123', 12),
    });
    console.log('Created demo user');
  }

  const hasDefault = await Folder.findOne({ userId: user._id, isDefault: true });
  if (!hasDefault) {
    await Folder.create({ name: 'All Meetings', userId: user._id, isDefault: true, color: '#6366f1', position: 0 });
  }

  const extraFolders = [
    { name: 'Product Team', color: '#10b981', position: 1 },
    { name: 'Engineering',  color: '#3b82f6', position: 2 },
    { name: 'Sales Calls',  color: '#f59e0b', position: 3 },
  ];
  for (const f of extraFolders) {
    await Folder.updateOne(
      { userId: user._id, name: f.name },
      { $setOnInsert: { ...f, userId: user._id } },
      { upsert: true }
    );
  }

  console.log('Seed complete — demo@example.com / password123');
  await mongoose.disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });
