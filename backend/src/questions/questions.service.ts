import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Part, Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateQuestionDto, ListQuestionsQuery, UpdateQuestionDto } from './question.dto.js';

const INCLUDE = {
  topic: { select: { id: true, name: true } },
  passage: { select: { id: true, title: true } },
} satisfies Prisma.QuestionInclude;

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListQuestionsQuery) {
    const where: Prisma.QuestionWhereInput = {
      archivedAt: null,
      part: query.part,
      topicId: query.topicId,
      difficulty: query.difficulty,
      content: query.q ? { contains: query.q, mode: 'insensitive' } : undefined,
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.question.findMany({
        where,
        include: INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.question.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async get(id: string) {
    const question = await this.prisma.question.findFirst({
      where: { id, archivedAt: null },
      include: INCLUDE,
    });
    if (!question) throw new NotFoundException('Không tìm thấy câu hỏi');
    return question;
  }

  async create(dto: CreateQuestionDto, userId: string) {
    this.assertPassageRule(dto.part, dto.passageId);
    await this.assertReferences(dto.topicId, dto.passageId);
    return this.prisma.question.create({
      data: { ...dto, createdById: userId },
      include: INCLUDE,
    });
  }

  async update(id: string, dto: UpdateQuestionDto) {
    const current = await this.get(id);
    const passageId = dto.passageId === undefined ? current.passageId : dto.passageId;
    this.assertPassageRule(dto.part ?? current.part, passageId);
    await this.assertReferences(dto.topicId, dto.passageId);
    return this.prisma.question.update({ where: { id }, data: dto, include: INCLUDE });
  }

  // Lưu trữ thay vì xóa để các bài đã làm vẫn xem lại được
  async archive(id: string) {
    await this.get(id);
    await this.prisma.question.update({ where: { id }, data: { archivedAt: new Date() } });
  }

  private assertPassageRule(part: Part, passageId?: string | null) {
    if (part === Part.PART_5 && passageId) {
      throw new BadRequestException('Câu hỏi Part 5 không có đoạn văn');
    }
    if (part !== Part.PART_5 && !passageId) {
      throw new BadRequestException('Câu hỏi Part 6 và Part 7 phải thuộc một đoạn văn');
    }
  }

  private async assertReferences(topicId?: string, passageId?: string | null) {
    if (topicId && !(await this.prisma.topic.findUnique({ where: { id: topicId } }))) {
      throw new BadRequestException('Chủ đề không tồn tại');
    }
    if (passageId && !(await this.prisma.passage.findUnique({ where: { id: passageId } }))) {
      throw new BadRequestException('Đoạn văn không tồn tại');
    }
  }
}
