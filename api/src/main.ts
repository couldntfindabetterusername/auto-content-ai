import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { sql } from 'drizzle-orm';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = parseInt(process.env.PORT || '3000', 10);

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  const db = app.get('DB');
  await db.execute(sql`SELECT 1`);
  console.log('✓ Database connected');

  await app.listen(port);
  console.log(`Application running on port ${port}`);
}

bootstrap();
