import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import session from 'express-session';
import passport from 'passport';
import { RedisStore } from 'connect-redis';
import Redis from 'ioredis';
import { HealthController } from './health/health.controller';
import { DbModule } from './db/db.module';
import { QueueModule } from './queue/queue.module';
import { AuthModule } from './auth/auth.module';
import { ContentCalendarModule } from './content-calendar/content-calendar.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { LlmModule } from './modules/llm/llm.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]),
    DbModule,
    QueueModule,
    AuthModule,
    ContentCalendarModule,
    JobsModule,
    LlmModule,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    const ioredis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });

    // connect-redis v9 uses redis v4 API: set(key, val, {EX: n})
    // ioredis uses positional args: set(key, val, 'EX', n) — translate here
    const storeClient = {
      get: (key: string) => ioredis.get(key),
      set: (key: string, value: string, options?: { EX?: number }) =>
        options?.EX ? ioredis.set(key, value, 'EX', options.EX) : ioredis.set(key, value),
      del: (key: string) => ioredis.del(key),
      expire: (key: string, ttl: number) => ioredis.expire(key, ttl),
    };

    const store = new RedisStore({ client: storeClient as any });

    consumer
      .apply(
        session({
          store,
          secret: (() => {
            const secret = process.env.SESSION_SECRET;
            if (!secret) throw new Error('SESSION_SECRET env var is required');
            return secret;
          })(),
          resave: false,
          saveUninitialized: false,
          cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000,
          },
        }),
        passport.initialize(),
        passport.session(),
      )
      .forRoutes('*');
  }
}
