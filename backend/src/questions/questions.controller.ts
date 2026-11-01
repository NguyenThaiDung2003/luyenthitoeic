import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { type AuthUser, CurrentUser, Roles } from '../auth/decorators.js';
import { Role } from '../generated/prisma/client.js';
import { CreateQuestionDto, ListQuestionsQuery, UpdateQuestionDto } from './question.dto.js';
import { QuestionsService } from './questions.service.js';

@Roles(Role.TEACHER)
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questions: QuestionsService) {}

  @Get()
  list(@Query() query: ListQuestionsQuery) {
    return this.questions.list(query);
  }

  @Post()
  create(@Body() dto: CreateQuestionDto, @CurrentUser() user: AuthUser) {
    return this.questions.create(dto, user.id);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.questions.get(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateQuestionDto) {
    return this.questions.update(id, dto);
  }

  @HttpCode(204)
  @Delete(':id')
  archive(@Param('id', ParseUUIDPipe) id: string) {
    return this.questions.archive(id);
  }
}
