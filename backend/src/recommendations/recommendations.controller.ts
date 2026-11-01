import { Controller, Get, Post } from '@nestjs/common';
import { type AuthUser, CurrentUser, Roles } from '../auth/decorators.js';
import { Role } from '../generated/prisma/client.js';
import { RecommendationsService } from './recommendations.service.js';

@Roles(Role.STUDENT)
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendations: RecommendationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.recommendations.list(user.id);
  }

  @Post('review-sets')
  createReviewSet(@CurrentUser() user: AuthUser) {
    return this.recommendations.createReviewSet(user.id);
  }
}
