import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AttemptsModule } from './attempts/attempts.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ExamsModule } from './exams/exams.module.js';
import { HealthController } from './health/health.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { QuestionsModule } from './questions/questions.module.js';
import { StatsModule } from './stats/stats.module.js';
import { TopicsController } from './topics/topics.controller.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    QuestionsModule,
    ExamsModule,
    AttemptsModule,
    StatsModule,
    ThrottlerModule.forRoot([
      { ttl: 60_000, limit: () => Number(process.env.GLOBAL_RATE_LIMIT ?? 300) },
    ]),
  ],
  controllers: [HealthController, TopicsController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
