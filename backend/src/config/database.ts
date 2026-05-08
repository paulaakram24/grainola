import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

export async function connectDB() {
  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      });
      logger.info('MongoDB connected');
      return;
    } catch (err) {
      attempt++;
      if (attempt >= maxRetries) {
        logger.error('MongoDB connection failed after all retries. Starting without DB...');
        // Don't exit — let the server start so at least static/health routes work
        return;
      }
      const wait = attempt * 3000;
      logger.warn(`MongoDB connection attempt ${attempt} failed. Retrying in ${wait / 1000}s...`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
mongoose.connection.on('error', (err) => logger.error('MongoDB error:', err));
