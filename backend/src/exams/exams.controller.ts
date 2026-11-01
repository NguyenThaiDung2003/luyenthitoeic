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
} from '@nestjs/common';
import { type AuthUser, CurrentUser, Roles } from '../auth/decorators.js';
import { Role } from '../generated/prisma/client.js';
import { CreateExamDto, RandomExamDto, UpdateExamDto } from './exam.dto.js';
import { ExamsService } from './exams.service.js';

@Controller('exams')
export class ExamsController {
  constructor(private readonly exams: ExamsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.exams.list(user);
  }

  @Roles(Role.TEACHER)
  @Post()
  create(@Body() dto: CreateExamDto, @CurrentUser() user: AuthUser) {
    return this.exams.create(dto, user.id);
  }

  @Roles(Role.TEACHER)
  @Post('random')
  createRandom(@Body() dto: RandomExamDto, @CurrentUser() user: AuthUser) {
    return this.exams.createRandom(dto, user.id);
  }

  @Roles(Role.TEACHER)
  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.exams.get(id);
  }

  @Roles(Role.TEACHER)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateExamDto) {
    return this.exams.update(id, dto);
  }

  @Roles(Role.TEACHER)
  @HttpCode(200)
  @Post(':id/publish')
  publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.exams.publish(id);
  }

  @Roles(Role.TEACHER)
  @HttpCode(204)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.exams.remove(id);
  }
}
