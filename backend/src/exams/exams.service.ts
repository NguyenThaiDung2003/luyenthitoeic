import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { AuthUser } from '../auth/decorators.js';
import {
  ExamKind,
  ExamStatus,
  Part,
  type Prisma,
  Role,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateExamDto, RandomExamDto, UpdateExamDto } from './exam.dto.js';
import { pickRandom } from './pick-random.js';

const PART_ORDER: Part[] = [Part.PART_5, Part.PART_6, Part.PART_7];

interface OrderableQuestion {
  id: string;
  part: Part;
  passageId: string | null;
}

// Xếp theo Part và gom các câu cùng đoạn văn cạnh nhau như đề thật
export function orderQuestions<T extends OrderableQuestion>(questions: T[]) {
  return [...questions].sort(
    (a, b) =>
      PART_ORDER.indexOf(a.part) - PART_ORDER.indexOf(b.part) ||
      (a.passageId ?? '').localeCompare(b.passageId ?? ''),
  );
}

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthUser) {
    const isTeacher = user.role === Role.TEACHER;
    const exams = await this.prisma.exam.findMany({
      where: {
        kind: ExamKind.STANDARD,
        status: isTeacher ? undefined : ExamStatus.PUBLISHED,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        questions: { select: { question: { select: { part: true } } } },
        attempts: {
          where: { userId: user.id },
          orderBy: { startedAt: 'desc' },
          take: 1,
          select: { id: true, status: true, estimatedScore: true },
        },
        _count: { select: { attempts: true } },
      },
    });

    return exams.map((exam) => ({
      id: exam.id,
      title: exam.title,
      description: exam.description,
      status: exam.status,
      durationMinutes: exam.durationMinutes,
      questionCount: exam.questions.length,
      parts: [...new Set(exam.questions.map((item) => item.question.part))].sort(),
      attemptCount: isTeacher ? exam._count.attempts : undefined,
      latestAttempt: exam.attempts[0] ?? null,
    }));
  }

  async get(id: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id, kind: ExamKind.STANDARD },
      include: {
        questions: {
          orderBy: { position: 'asc' },
          include: {
            question: {
              include: {
                topic: { select: { id: true, name: true } },
                passage: { select: { id: true, title: true } },
              },
            },
          },
        },
      },
    });
    if (!exam) throw new NotFoundException('Không tìm thấy đề thi');
    return { ...exam, questions: exam.questions.map((item) => item.question) };
  }

  async create(dto: CreateExamDto, userId: string) {
    const questions = await this.loadQuestions(dto.questionIds);
    return this.saveNew(dto, orderQuestions(questions), userId);
  }

  async createRandom(dto: RandomExamDto, userId: string) {
    const chosen: OrderableQuestion[] = [];
    for (const criterion of dto.criteria) {
      const candidates = await this.prisma.question.findMany({
        where: {
          archivedAt: null,
          part: criterion.part,
          topicId: criterion.topicId,
          difficulty: criterion.difficulty,
          id: { notIn: chosen.map((question) => question.id) },
        },
        select: { id: true, part: true, passageId: true },
      });
      if (candidates.length < criterion.count) {
        throw new UnprocessableEntityException(
          `Không đủ câu hỏi: cần ${criterion.count}, chỉ có ${candidates.length}`,
        );
      }
      chosen.push(...pickRandom(candidates, criterion.count));
    }
    return this.saveNew(dto, orderQuestions(chosen), userId);
  }

  async update(id: string, dto: UpdateExamDto) {
    const exam = await this.findDraftable(id);
    if (exam.status !== ExamStatus.DRAFT) {
      throw new ConflictException('Đề đã xuất bản nên không sửa được');
    }
    const { questionIds, ...info } = dto;
    const questions = questionIds ? orderQuestions(await this.loadQuestions(questionIds)) : null;

    await this.prisma.$transaction(async (tx) => {
      await tx.exam.update({ where: { id }, data: info });
      if (questions) {
        await tx.examQuestion.deleteMany({ where: { examId: id } });
        await tx.examQuestion.createMany({ data: toPositions(id, questions) });
      }
    });
    return this.get(id);
  }

  async publish(id: string) {
    await this.findDraftable(id);
    const questionCount = await this.prisma.examQuestion.count({ where: { examId: id } });
    if (questionCount === 0) throw new ConflictException('Đề chưa có câu hỏi');
    return this.prisma.exam.update({ where: { id }, data: { status: ExamStatus.PUBLISHED } });
  }

  async remove(id: string) {
    await this.findDraftable(id);
    const attempts = await this.prisma.attempt.count({ where: { examId: id } });
    if (attempts > 0) throw new ConflictException('Đề đã có lượt làm nên không xóa được');
    await this.prisma.exam.delete({ where: { id } });
  }

  private async findDraftable(id: string) {
    const exam = await this.prisma.exam.findFirst({ where: { id, kind: ExamKind.STANDARD } });
    if (!exam) throw new NotFoundException('Không tìm thấy đề thi');
    return exam;
  }

  private async loadQuestions(ids: string[]) {
    const questions = await this.prisma.question.findMany({
      where: { id: { in: ids }, archivedAt: null },
      select: { id: true, part: true, passageId: true },
    });
    if (questions.length !== ids.length) {
      throw new BadRequestException('Có câu hỏi không tồn tại hoặc đã lưu trữ');
    }
    return questions;
  }

  private saveNew(
    dto: { title: string; description?: string; durationMinutes: number },
    questions: OrderableQuestion[],
    userId: string,
  ) {
    const data: Prisma.ExamUncheckedCreateInput = {
      title: dto.title,
      description: dto.description,
      durationMinutes: dto.durationMinutes,
      createdById: userId,
      questions: {
        create: questions.map((question, index) => ({
          position: index + 1,
          question: { connect: { id: question.id } },
        })),
      },
    };
    return this.prisma.exam.create({ data });
  }
}

function toPositions(examId: string, questions: OrderableQuestion[]) {
  return questions.map((question, index) => ({
    examId,
    questionId: question.id,
    position: index + 1,
  }));
}
