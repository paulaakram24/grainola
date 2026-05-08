import app from './app';
import { env } from './config/env';
import { connectDB } from './config/database';
import { logger } from './utils/logger';

async function bootstrap() {
  await connectDB();

  const PORT   = parseInt(env.PORT);
  const server = app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down`);
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Startup failed:', err);
  process.exit(1);
});
