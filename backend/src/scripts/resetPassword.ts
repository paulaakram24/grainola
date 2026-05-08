import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db!;
  const users = db.collection('users');

  const email    = 'demo@example.com';
  const password = 'password123';
  const hash     = await bcrypt.hash(password, 12);

  const result = await users.updateOne(
    { email },
    { $set: { passwordHash: hash } },
  );

  if (result.matchedCount === 0) {
    console.log('User not found — creating demo user...');
    await users.insertOne({
      name:         'Demo User',
      email,
      passwordHash: hash,
      createdAt:    new Date(),
      updatedAt:    new Date(),
    });
    console.log('Demo user created.');
  } else {
    console.log('Password reset for demo@example.com');
  }

  await mongoose.disconnect();
  console.log('Done. Login with: demo@example.com / password123');
}

run().catch((err) => { console.error(err); process.exit(1); });
