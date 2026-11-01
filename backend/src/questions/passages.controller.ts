import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { type AuthUser, CurrentUser, Roles } from '../auth/decorators.js';
import { Role } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

class CreatePassageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  content: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  source: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  license: string;
}

class UpdatePassageDto extends PartialType(CreatePassageDto) {}

@Roles(Role.TEACHER)
@Controller('passages')
export class PassagesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.passage.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { questions: true } } },
    });
  }

  @Post()
  create(@Body() dto: CreatePassageDto, @CurrentUser() user: AuthUser) {
    return this.prisma.passage.create({ data: { ...dto, createdById: user.id } });
  }

  @Get(':id')
  async get(@Param('id', ParseUUIDPipe) id: string) {
    const passage = await this.prisma.passage.findUnique({ where: { id } });
    if (!passage) throw new NotFoundException('Không tìm thấy đoạn văn');
    return passage;
  }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePassageDto) {
    await this.get(id);
    return this.prisma.passage.update({ where: { id }, data: dto });
  }

  @HttpCode(204)
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.get(id);
    const used = await this.prisma.question.count({ where: { passageId: id } });
    if (used > 0) throw new ConflictException('Đoạn văn còn câu hỏi nên không xóa được');
    await this.prisma.passage.delete({ where: { id } });
  }
}
