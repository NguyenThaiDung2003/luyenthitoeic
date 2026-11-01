import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  type Attempt,
  AttemptStatus,
  ExamKind,
  ExamStatus,
  Prisma,
  type OptionKey,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SaveAnswersDto } from './attempt.dto.js';
import { gradeAnswers } from './scoring.js';

const remainingSeconds = (attempt: Attempt, now = new Date()) =>
  Math.max(0, Math.ceil((attempt.expiresAt.getTime() - now.getTime()) / 1000));

@Injectable()
export class AttemptsService {
  constructor(private readonly prisma: PrismaService) {}

  async start(examId: string, userId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { _count: { select: { questions: true } } },
    });
    if (!exam || exam.status !== ExamStatus.PUBLISHED) {
      throw new NotFoundException('Không tìm thấy đề thi');
    }
    // Bộ ôn tập là của riêng học viên đã tạo
    if (exam.kind === ExamKind.REVIEW && exam.createdById !== userId) {
      throw new ForbiddenException('Bạn không có quyền làm đề này');
    }

    const active = await this.findActive(examId, userId);
    if (active) return { id: active.id };

    const now = new Date();
    try {
      const attempt = await this.prisma.attempt.create({
        data: {
          userId,
          examId,
          startedAt: now,
          expiresAt: new Date(now.getTime() + exam.durationMinutes * 60_000),
          totalQuestions: exam._count.questions,
        },
      });
      return { id: attempt.id };
    } catch (error) {
      // Hai yêu cầu cùng lúc: chỉ mục duy nhất giữ lại một lượt, yêu cầu còn lại dùng lượt đó
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await this.findActive(examId, userId);
        if (existing) return { id: existing.id };
      }
      throw error;
    }
  }

  async paper(id: string, userId: string) {
    const attempt = await this.getOwned(id, userId);
    const current = await this.finalizeIfExpired(attempt);
    const examQuestions = await this.prisma.examQuestion.findMany({
      where: { examId: current.examId },
      orderBy: { position: 'asc' },
      // Liệt kê từng trường được phép, đáp án và giải thích không bao giờ được lấy ra
      select: {
        position: true,
        question: {
          select: {
            id: true,
            part: true,
            content: true,
            options: true,
            passage: { select: { id: true, title: true, content: true } },
          },
        },
      },
    });
    const answers = await this.prisma.answer.findMany({
      where: { attemptId: id },
      select: { questionId: true, selectedOption: true, isFlagged: true },
    });
    const answerByQuestion = new Map(answers.map((answer) => [answer.questionId, answer]));
    const exam = await this.prisma.exam.findUniqueOrThrow({
      where: { id: current.examId },
      select: { title: true, durationMinutes: true },
    });

    return {
      id: current.id,
      status: current.status,
      examTitle: exam.title,
      durationMinutes: exam.durationMinutes,
      remainingSeconds: remainingSeconds(current),
      questions: examQuestions.map(({ position, question }) => ({
        ...question,
        position,
        selectedOption: answerByQuestion.get(question.id)?.selectedOption ?? null,
        isFlagged: answerByQuestion.get(question.id)?.isFlagged ?? false,
      })),
    };
  }

  async saveAnswers(id: string, userId: string, dto: SaveAnswersDto) {
    await this.getOwned(id, userId);
    return this.prisma.$transaction(async (tx) => {
      // Khóa dòng để lưu nháp không chen vào giữa lúc chấm bài
      const attempt = await lockAttempt(tx, id);
      if (attempt.status !== AttemptStatus.IN_PROGRESS) {
        throw new ConflictException('Bài đã nộp');
      }
      if (attempt.expiresAt <= new Date()) throw new ConflictException('Đã hết giờ làm bài');

      const allowed = await tx.examQuestion.findMany({
        where: { examId: attempt.examId },
        select: { questionId: true },
      });
      const allowedIds = new Set(allowed.map((item) => item.questionId));
      if (dto.answers.some((answer) => !allowedIds.has(answer.questionId))) {
        throw new BadRequestException('Câu hỏi không thuộc đề này');
      }

      for (const { questionId, selectedOption, isFlagged } of dto.answers) {
        await tx.answer.upsert({
          where: { attemptId_questionId: { attemptId: id, questionId } },
          update: { selectedOption, isFlagged },
          create: { attemptId: id, questionId, selectedOption, isFlagged },
        });
      }
      return { savedAt: new Date(), remainingSeconds: remainingSeconds(attempt) };
    });
  }

  async submit(id: string, userId: string) {
    await this.getOwned(id, userId);
    const attempt = await this.finalize(id, false);
    if (!attempt) throw new ConflictException('Bài đã được nộp trước đó');
    return {
      id: attempt.id,
      correctCount: attempt.correctCount,
      totalQuestions: attempt.totalQuestions,
      estimatedScore: attempt.estimatedScore,
      autoSubmitted: attempt.autoSubmitted,
    };
  }

  async list(userId: string) {
    await this.finalizeExpiredFor(userId);
    const attempts = await this.prisma.attempt.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 100,
      include: { exam: { select: { title: true, kind: true } } },
    });
    return attempts.map((attempt) => ({
      id: attempt.id,
      examTitle: attempt.exam.title,
      examKind: attempt.exam.kind,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      correctCount: attempt.correctCount,
      totalQuestions: attempt.totalQuestions,
      estimatedScore: attempt.estimatedScore,
    }));
  }

  // Chỉ lượt đã nộp mới được trả đáp án và giải thích
  async result(id: string, userId: string) {
    const current = await this.finalizeIfExpired(await this.getOwned(id, userId));
    if (current.status !== AttemptStatus.SUBMITTED) {
      throw new ConflictException('Bài chưa nộp nên chưa xem được kết quả');
    }
    const [exam, examQuestions, answers] = await Promise.all([
      this.prisma.exam.findUniqueOrThrow({
        where: { id: current.examId },
        select: { id: true, title: true, durationMinutes: true },
      }),
      this.prisma.examQuestion.findMany({
        where: { examId: current.examId },
        orderBy: { position: 'asc' },
        select: {
          position: true,
          question: {
            select: {
              id: true,
              part: true,
              content: true,
              options: true,
              correctOption: true,
              explanation: true,
              topic: { select: { id: true, name: true } },
              passage: { select: { id: true, title: true, content: true } },
            },
          },
        },
      }),
      this.prisma.answer.findMany({ where: { attemptId: id } }),
    ]);
    const answerByQuestion = new Map(answers.map((answer) => [answer.questionId, answer]));
    const questions = examQuestions.map(({ position, question }) => {
      const answer = answerByQuestion.get(question.id);
      return {
        ...question,
        position,
        selectedOption: answer?.selectedOption ?? null,
        isFlagged: answer?.isFlagged ?? false,
        isCorrect: answer?.isCorrect ?? false,
      };
    });

    return {
      id: current.id,
      exam,
      startedAt: current.startedAt,
      submittedAt: current.submittedAt,
      autoSubmitted: current.autoSubmitted,
      correctCount: current.correctCount,
      totalQuestions: current.totalQuestions,
      estimatedScore: current.estimatedScore,
      byPart: summarize(questions, (question) => question.part),
      byTopic: summarize(questions, (question) => question.topic.name),
      questions,
    };
  }

  async finalizeExpiredFor(userId?: string) {
    const expired = await this.prisma.attempt.findMany({
      where: { userId, status: AttemptStatus.IN_PROGRESS, expiresAt: { lte: new Date() } },
      select: { id: true },
    });
    for (const { id } of expired) await this.finalize(id, true);
  }

  async getOwned(id: string, userId: string) {
    const attempt = await this.prisma.attempt.findUnique({ where: { id } });
    if (!attempt) throw new NotFoundException('Không tìm thấy lượt làm bài');
    if (attempt.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem lượt làm bài này');
    }
    return attempt;
  }

  async finalizeIfExpired(attempt: Attempt) {
    const expired =
      attempt.status === AttemptStatus.IN_PROGRESS && attempt.expiresAt <= new Date();
    if (!expired) return attempt;
    return (
      (await this.finalize(attempt.id, true)) ??
      this.prisma.attempt.findUniqueOrThrow({ where: { id: attempt.id } })
    );
  }

  // Trả về null nếu bài đã được chấm trước đó, nhờ khóa dòng nên mỗi lượt chỉ chấm một lần
  private finalize(id: string, auto: boolean) {
    return this.prisma.$transaction(async (tx) => {
      const attempt = await lockAttempt(tx, id);
      if (attempt.status !== AttemptStatus.IN_PROGRESS) return null;

      const now = new Date();
      const examQuestions = await tx.examQuestion.findMany({
        where: { examId: attempt.examId },
        select: { question: { select: { id: true, correctOption: true } } },
      });
      const answers = await tx.answer.findMany({
        where: { attemptId: id },
        select: { questionId: true, selectedOption: true },
      });
      const selected = new Map<string, OptionKey | null>(
        answers.map((answer) => [answer.questionId, answer.selectedOption]),
      );
      const { graded, correctCount, estimatedScore } = gradeAnswers(
        examQuestions.map((item) => item.question),
        selected,
      );

      for (const { questionId, selectedOption, isCorrect } of graded) {
        await tx.answer.upsert({
          where: { attemptId_questionId: { attemptId: id, questionId } },
          update: { isCorrect },
          create: { attemptId: id, questionId, selectedOption, isCorrect },
        });
      }
      return tx.attempt.update({
        where: { id },
        data: {
          status: AttemptStatus.SUBMITTED,
          submittedAt: attempt.expiresAt < now ? attempt.expiresAt : now,
          autoSubmitted: auto || attempt.expiresAt <= now,
          correctCount,
          estimatedScore,
        },
      });
    });
  }

  private async findActive(examId: string, userId: string) {
    await this.finalizeExpiredFor(userId);
    return this.prisma.attempt.findFirst({
      where: { examId, userId, status: AttemptStatus.IN_PROGRESS },
    });
  }
}

function summarize<T extends { isCorrect: boolean }>(items: T[], keyOf: (item: T) => string) {
  const groups = new Map<string, { key: string; correct: number; total: number }>();
  for (const item of items) {
    const key = keyOf(item);
    const group = groups.get(key) ?? { key, correct: 0, total: 0 };
    group.total += 1;
    if (item.isCorrect) group.correct += 1;
    groups.set(key, group);
  }
  return [...groups.values()];
}

async function lockAttempt(tx: Prisma.TransactionClient, id: string) {
  await tx.$queryRaw`SELECT id FROM attempts WHERE id = ${id}::uuid FOR UPDATE`;
  return tx.attempt.findUniqueOrThrow({ where: { id } });
}
