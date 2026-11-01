import { Body, Controller, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { type AuthUser, CurrentUser, Roles } from '../auth/decorators.js';
import { Role } from '../generated/prisma/client.js';
import { AiService } from './ai.service.js';

class FeedbackDto {
  @IsBoolean()
  helpful: boolean;
}

@Roles(Role.STUDENT)
@Controller()
export class AiController {
  constructor(private readonly ai: AiService) {}

  @HttpCode(200)
  @Post('attempts/:id/questions/:questionId/explanation')
  explain(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ai.explain(id, questionId, user.id);
  }

  @HttpCode(200)
  @Post('ai-explanations/:id/feedback')
  feedback(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FeedbackDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ai.feedback(id, user.id, dto.helpful);
  }
}
