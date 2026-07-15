import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './shared/error-filter';
import { sql } from 'drizzle-orm';
import Redis from 'ioredis';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = parseInt(process.env.PORT || '3000', 10);

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      process.env.FRONTEND_URL,
    ].filter(Boolean) as string[],
    credentials: true,
  });

  const db = app.get('DB');
  await db.execute(sql`SELECT 1`);
  console.log('✓ Database connected');

  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  await redis.ping();
  console.log('✓ Redis connected');
  redis.disconnect();

  await app.listen(port);
  console.log(`Application running on port ${port}`);
}

bootstrap();
