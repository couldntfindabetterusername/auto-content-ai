import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './shared/error-filter';
import { sql } from 'drizzle-orm';
import Redis from 'ioredis';
import './workers/content-calendar.worker';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = parseInt(process.env.PORT || '3000', 10);

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  const db = app.get('DB');
  await db.execute(sql`SELECT 1`);
  console.log('✓ Database connected');

  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  });
  await redis.ping();
  console.log('✓ Redis connected');
  redis.disconnect();

  console.log('✓ Worker initialized');

  await app.listen(port);
  console.log(`Application running on port ${port}`);
}

bootstrap();
