import { Module } from '@nestjs/common';
import { AttemptsModule } from '../attempts/attempts.module.js';
import { TeacherStatsController } from './teacher-stats.controller.js';
import { TeacherStatsService } from './teacher-stats.service.js';

@Module({
  imports: [AttemptsModule],
  controllers: [TeacherStatsController],
  providers: [TeacherStatsService],
})
export class TeacherStatsModule {}
