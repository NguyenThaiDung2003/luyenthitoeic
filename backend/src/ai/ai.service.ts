import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AttemptsService } from '../attempts/attempts.service.js';
import { AttemptStatus, type OptionKey, Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { GeminiClient, GeminiError } from './gemini.client.js';
import { defaultPromptVersion, requestExplanation } from './request-explanation.js';

const TIME_ZONE = 'Asia/Ho_Chi_Minh';
const dailyLimit = () => Number(process.env.AI_DAILY_LIMIT ?? 20);

// Ngày tính theo giờ Việt Nam để lượt được làm mới lúc 0 giờ của người dùng
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: TIME_ZONE });

function unavailable(error: unknown) {
  if (error instanceof GeminiError) {
    return new ServiceUnavailableException(
      error.kind === 'not_configured'
        ? 'Tính năng giải thích bằng AI chưa được cấu hình'
        : 'AI đang bận, vui lòng thử lại sau',
    );
  }
  return error;
}

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attempts: AttemptsService,
    private readonly gemini: GeminiClient,
  ) {}

  async explain(attemptId: string, questionId: string, userId: string) {
    const attempt = await this.attempts.finalizeIfExpired(
      await this.attempts.getOwned(attemptId, userId),
    );
    // Giải thích chứa đáp án nên chỉ mở sau khi nộp bài
    if (attempt.status !== AttemptStatus.SUBMITTED) {
      throw new ConflictException('Bài chưa nộp nên chưa xem được giải thích');
    }

    const answer = await this.prisma.answer.findUnique({
      where: { attemptId_questionId: { attemptId, questionId } },
      include: {
        question: {
          include: {
            topic: { select: { name: true } },
            passage: { select: { title: true, content: true } },
          },
        },
      },
    });
    if (!answer) throw new NotFoundException('Không tìm thấy câu trả lời');
    if (!answer.selectedOption) {
      throw new UnprocessableEntityException('Bạn đã bỏ qua câu này');
    }
    if (answer.isCorrect) throw new UnprocessableEntityException('Bạn đã trả lời đúng câu này');

    const selectedOption = answer.selectedOption;
    const promptVersion = defaultPromptVersion();
    const key = { questionId, selectedOption, promptVersion };

    const cached = await this.findCached(key);
    if (cached) return this.present(cached, userId);

    if (!this.gemini.isConfigured) throw unavailable(new GeminiError('not_configured'));

    const date = today();
    await this.reserveQuota(userId, date);

    let content: object;
    try {
      const { question } = answer;
      content = await requestExplanation(this.gemini, promptVersion, {
        part: question.part,
        topic: question.topic.name,
        question: question.content,
        options: question.options,
        correctOption: question.correctOption,
        selectedOption,
        passage: question.passage,
      });
    } catch (error) {
      await this.releaseQuota(userId, date);
      throw unavailable(error);
    }

    try {
      const saved = await this.prisma.aiExplanation.create({
        data: { ...key, content, model: this.gemini.model },
      });
      return await this.present(saved, userId);
    } catch (error) {
      // Hai học viên cùng bấm: chỉ mục duy nhất giữ một bản, bên còn lại dùng bản đó
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await this.findCached(key);
        if (existing) return this.present(existing, userId);
      }
      throw error;
    }
  }

  async feedback(explanationId: string, userId: string, helpful: boolean) {
    const explanation = await this.prisma.aiExplanation.findUnique({
      where: { id: explanationId },
    });
    if (!explanation) throw new NotFoundException('Không tìm thấy lời giải thích');

    // Chỉ người đã chọn đúng đáp án sai đó trong bài đã nộp mới được đánh giá
    const answered = await this.prisma.answer.count({
      where: {
        questionId: explanation.questionId,
        selectedOption: explanation.selectedOption,
        attempt: { userId, status: AttemptStatus.SUBMITTED },
      },
    });
    if (answered === 0) throw new ForbiddenException('Bạn không thể đánh giá lời giải thích này');

    await this.prisma.$transaction(async (tx) => {
      // Khóa dòng để đếm lại không bị lệch khi nhiều người bấm cùng lúc
      await tx.$queryRaw`SELECT id FROM ai_explanations WHERE id = ${explanationId}::uuid FOR UPDATE`;
      await tx.aiExplanationFeedback.upsert({
        where: { explanationId_userId: { explanationId, userId } },
        update: { helpful },
        create: { explanationId, userId, helpful },
      });
      const [helpfulCount, notHelpfulCount] = await Promise.all([
        tx.aiExplanationFeedback.count({ where: { explanationId, helpful: true } }),
        tx.aiExplanationFeedback.count({ where: { explanationId, helpful: false } }),
      ]);
      await tx.aiExplanation.update({
        where: { id: explanationId },
        data: { helpfulCount, notHelpfulCount },
      });
    });
    return { helpful };
  }

  private findCached(key: { questionId: string; selectedOption: OptionKey; promptVersion: string }) {
    return this.prisma.aiExplanation.findUnique({
      where: { questionId_selectedOption_promptVersion: key },
    });
  }

  private async present(explanation: { id: string; content: unknown }, userId: string) {
    const feedback = await this.prisma.aiExplanationFeedback.findUnique({
      where: { explanationId_userId: { explanationId: explanation.id, userId } },
    });
    return {
      id: explanation.id,
      content: explanation.content,
      helpful: feedback?.helpful ?? null,
    };
  }

  // Tăng đếm và kiểm tra trần trong một câu lệnh nên gọi đồng thời không vượt được giới hạn
  private async reserveQuota(userId: string, date: string) {
    const limit = dailyLimit();
    const rows = await this.prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO ai_usage (user_id, date, count)
      VALUES (${userId}::uuid, ${date}::date, 1)
      ON CONFLICT (user_id, date) DO UPDATE SET count = ai_usage.count + 1
      WHERE ai_usage.count < ${limit}
      RETURNING count
    `;
    if (rows.length === 0 || limit < 1) {
      throw new HttpException(
        'Bạn đã dùng hết lượt giải thích bằng AI hôm nay',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async releaseQuota(userId: string, date: string) {
    await this.prisma.$executeRaw`
      UPDATE ai_usage SET count = GREATEST(count - 1, 0)
      WHERE user_id = ${userId}::uuid AND date = ${date}::date
    `;
  }
}
