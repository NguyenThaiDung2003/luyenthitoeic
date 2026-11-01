import { Body, ConflictException, Controller, Get, Post } from '@nestjs/common';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Roles } from '../auth/decorators.js';
import { Prisma, Role } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

class CreateTopicDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}

@Controller('topics')
export class TopicsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.topic.findMany({ orderBy: { name: 'asc' } });
  }

  @Roles(Role.TEACHER)
  @Post()
  async create(@Body() dto: CreateTopicDto) {
    try {
      return await this.prisma.topic.create({ data: { name: dto.name.trim() } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Chủ đề đã tồn tại');
      }
      throw error;
    }
  }
}
