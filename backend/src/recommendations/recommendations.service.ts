import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { AttemptsService } from '../attempts/attempts.service.js';
import { orderQuestions } from '../exams/exams.service.js';
import { pickRandom } from '../exams/pick-random.js';
import { AttemptStatus, ExamKind, ExamStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StatsService } from '../stats/stats.service.js';
import { allocateSlots, buildReviewSet, REVIEW_SET_SIZE, selectWeakTopics, targetDifficulty } from './recommend.js';

const MINUTES_PER_QUESTION = 1.5;

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stats: StatsService,
    private readonly attempts: AttemptsService,
  ) {}

  async list(userId: string) {
    const weakTopics = selectWeakTopics(await this.stats.topics(userId));
    if (weakTopics.length === 0) return [];

    const slots = allocateSlots(weakTopics, REVIEW_SET_SIZE);
    const unseen = await this.unseenQuestions(userId);
    return weakTopics.map((topic) => ({
      topicId: topic.topicId,
      name: topic.name,
      accuracy: topic.accuracy,
      correct: topic.correct,
      total: topic.total,
      targetDifficulty: targetDifficulty(topic.accuracy),
      plannedQuestions: slots.get(topic.topicId) ?? 0,
      unseenQuestions: unseen.filter((question) => question.topicId === topic.topicId).length,
    }));
  }

  async createReviewSet(userId: string) {
    // Bộ cũ chưa làm xong thì mở lại, tránh bấm nhiều lần tạo đề thừa trong CSDL
    await this.attempts.finalizeExpiredFor(userId);
    const unfinished = await this.prisma.attempt.findFirst({
      where: { userId, status: AttemptStatus.IN_PROGRESS, exam: { kind: ExamKind.REVIEW } },
    });
    if (unfinished) {
      return {
        examId: unfinished.examId,
        attemptId: unfinished.id,
        questionCount: unfinished.totalQuestions,
      };
    }

    const topics = await this.stats.topics(userId);
    if (topics.length === 0) {
      throw new UnprocessableEntityException('Hãy làm ít nhất một đề để hệ thống có dữ liệu gợi ý');
    }

    const unseen = await this.unseenQuestions(userId);
    // Xáo trước khi chọn để hai lần tạo bộ không giống hệt nhau
    const shuffled = pickRandom(unseen, unseen.length);
    const { weakTopics, questions } = buildReviewSet(topics, shuffled);
    if (weakTopics.length === 0) {
      throw new UnprocessableEntityException('Bạn chưa có chủ đề yếu, hãy làm thêm đề mới');
    }
    if (questions.length === 0) {
      throw new UnprocessableEntityException('Bạn đã làm hết các câu trong ngân hàng câu hỏi');
    }

    const ordered = orderQuestions(questions as (typeof unseen)[number][]);
    const exam = await this.prisma.exam.create({
      data: {
        title: `Ôn tập: ${weakTopics.map((topic) => topic.name).join(', ')}`,
        kind: ExamKind.REVIEW,
        status: ExamStatus.PUBLISHED,
        durationMinutes: Math.ceil(ordered.length * MINUTES_PER_QUESTION),
        createdById: userId,
        questions: {
          create: ordered.map((question, index) => ({
            position: index + 1,
            question: { connect: { id: question.id } },
          })),
        },
      },
    });
    const attempt = await this.attempts.start(exam.id, userId);
    return { examId: exam.id, attemptId: attempt.id, questionCount: ordered.length };
  }

  // Câu chưa làm: chưa xuất hiện trong bất kỳ lượt đã nộp nào của học viên
  private unseenQuestions(userId: string) {
    return this.prisma.question.findMany({
      where: {
        archivedAt: null,
        answers: { none: { attempt: { userId, status: 'SUBMITTED' } } },
      },
      select: { id: true, topicId: true, difficulty: true, part: true, passageId: true },
    });
  }
}
