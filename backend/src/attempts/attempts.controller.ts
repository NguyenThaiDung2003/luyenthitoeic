import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { type AuthUser, CurrentUser, Roles } from '../auth/decorators.js';
import { Role } from '../generated/prisma/client.js';
import { SaveAnswersDto } from './attempt.dto.js';
import { AttemptsService } from './attempts.service.js';

@Roles(Role.STUDENT)
@Controller()
export class AttemptsController {
  constructor(private readonly attempts: AttemptsService) {}

  @Post('exams/:id/attempts')
  start(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.attempts.start(id, user.id);
  }

  @Get('attempts')
  list(@CurrentUser() user: AuthUser) {
    return this.attempts.list(user.id);
  }

  @Get('attempts/:id/result')
  result(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.attempts.result(id, user.id);
  }

  @Get('attempts/:id')
  paper(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.attempts.paper(id, user.id);
  }

  @Put('attempts/:id/answers')
  save(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: SaveAnswersDto,
  ) {
    return this.attempts.saveAnswers(id, user.id, dto);
  }

  @HttpCode(200)
  @Post('attempts/:id/submit')
  submit(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.attempts.submit(id, user.id);
  }
}
