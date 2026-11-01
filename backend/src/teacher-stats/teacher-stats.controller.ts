import { Controller, Get } from '@nestjs/common';
import { Roles } from '../auth/decorators.js';
import { Role } from '../generated/prisma/client.js';
import { TeacherStatsService } from './teacher-stats.service.js';

@Roles(Role.TEACHER)
@Controller('teacher/stats')
export class TeacherStatsController {
  constructor(private readonly stats: TeacherStatsService) {}

  @Get('overview')
  overview() {
    return this.stats.overview();
  }

  @Get('topics')
  topics() {
    return this.stats.topics();
  }

  @Get('hardest-questions')
  hardestQuestions() {
    return this.stats.hardestQuestions();
  }

  @Get('students-at-risk')
  studentsAtRisk() {
    return this.stats.studentsAtRisk();
  }
}
