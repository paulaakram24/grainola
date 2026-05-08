import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV:   z.enum(['development', 'production', 'test']).default('development'),
  PORT:       z.string().default('4000'),
  FRONTEND_URL: z.string().url(),

  MONGODB_URI: z.string(),

  JWT_SECRET:          z.string().min(32),
  JWT_EXPIRES_IN:      z.string().default('15m'),
  JWT_REFRESH_SECRET:  z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  AWS_REGION:          z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID:   z.string().optional().default(''),
  AWS_SECRET_ACCESS_KEY: z.string().optional().default(''),
  AWS_S3_BUCKET:       z.string().optional().default(''),
  AWS_S3_PRESIGNED_URL_EXPIRY: z.string().default('3600'),

  UPLOADS_DIR: z.string().default('uploads'),

  GROQ_API_KEY:        z.string(),

  GOOGLE_CLIENT_ID:     z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI:  z.string().url(),

  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX:       z.string().default('100'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
