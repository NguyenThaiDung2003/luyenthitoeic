import { Controller, Get } from '@nestjs/common';
import { type AuthUser, CurrentUser, Roles } from '../auth/decorators.js';
import { Role } from '../generated/prisma/client.js';
import { StatsService } from './stats.service.js';

@Roles(Role.STUDENT)
@Controller('stats/me')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('overview')
  overview(@CurrentUser() user: AuthUser) {
    return this.stats.overview(user.id);
  }

  @Get('topics')
  topics(@CurrentUser() user: AuthUser) {
    return this.stats.topics(user.id);
  }

  @Get('trend')
  trend(@CurrentUser() user: AuthUser) {
    return this.stats.trend(user.id);
  }
}
