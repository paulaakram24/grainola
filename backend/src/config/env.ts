import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV:   z.enum(['development', 'production', 'test']).default('development'),
  PORT:       z.string().default('4000'),

  // Can be a single URL OR a comma-separated list of origins (for dev + prod).
  // CORS code parses and validates each — no need to be strict here.
  FRONTEND_URL: z.string().min(1).default('http://localhost:3000'),

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

  GOOGLE_CLIENT_ID:     z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  // Defaults so the service can boot even before Google's redirect URI is wired up.
  GOOGLE_REDIRECT_URI:  z.string().optional().default('http://localhost:4000/api/v1/calendar/oauth/callback'),

  // Optional — used only if the user clicks "Continue with GitHub"
  GITHUB_CLIENT_ID:     z.string().optional().default(''),
  GITHUB_CLIENT_SECRET: z.string().optional().default(''),

  // Used to build OAuth callback URLs that match what's registered with each provider
  BACKEND_URL:          z.string().optional().default('http://localhost:4000'),

  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX:       z.string().default('100'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const errors = parsed.error.flatten().fieldErrors;
  console.error('\n❌ Invalid environment variables — server cannot start:\n');
  for (const [field, msgs] of Object.entries(errors)) {
    console.error(`  • ${field}: ${(msgs as string[]).join(', ')}`);
  }
  console.error('\n  See backend/.env.example for the expected shape.\n');
  process.exit(1);
}

export const env = parsed.data;
