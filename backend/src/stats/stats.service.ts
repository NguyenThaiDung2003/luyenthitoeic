import { Injectable } from '@nestjs/common';
import { AttemptsService } from '../attempts/attempts.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface TopicStat {
  topicId: string;
  name: string;
  total: number;
  correct: number;
  accuracy: number;
  recentAccuracy: number | null;
}

@Injectable()
export class StatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attempts: AttemptsService,
  ) {}

  async overview(userId: string) {
    await this.attempts.finalizeExpiredFor(userId);
    const [row] = await this.prisma.$queryRaw<
      {
        completed: number;
        total_questions: number;
        correct_questions: number;
        total_seconds: number;
        latest_score: number | null;
      }[]
    >`
      SELECT
        COUNT(*)::int AS completed,
        COALESCE(SUM(total_questions), 0)::int AS total_questions,
        COALESCE(SUM(correct_count), 0)::int AS correct_questions,
        COALESCE(SUM(EXTRACT(EPOCH FROM submitted_at - started_at)), 0)::int AS total_seconds,
        (
          SELECT estimated_score FROM attempts
          WHERE user_id = ${userId}::uuid AND status = 'SUBMITTED'
          ORDER BY submitted_at DESC LIMIT 1
        ) AS latest_score
      FROM attempts
      WHERE user_id = ${userId}::uuid AND status = 'SUBMITTED'
    `;
    return {
      completedExams: row.completed,
      totalQuestions: row.total_questions,
      correctQuestions: row.correct_questions,
      accuracy: row.total_questions
        ? Math.round((1000 * row.correct_questions) / row.total_questions) / 10
        : null,
      totalMinutes: Math.round(row.total_seconds / 60),
      latestScore: row.latest_score,
    };
  }

  // Tỷ lệ đúng theo chủ đề, sắp từ yếu nhất; recentAccuracy chỉ tính 5 lần nộp gần nhất
  async topics(userId: string): Promise<TopicStat[]> {
    await this.attempts.finalizeExpiredFor(userId);
    return this.prisma.$queryRaw<TopicStat[]>`
      WITH recent AS (
        SELECT id FROM attempts
        WHERE user_id = ${userId}::uuid AND status = 'SUBMITTED'
        ORDER BY submitted_at DESC
        LIMIT 5
      )
      SELECT
        t.id AS "topicId",
        t.name,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE an.is_correct)::int AS correct,
        ROUND(100.0 * COUNT(*) FILTER (WHERE an.is_correct) / COUNT(*), 1)::float AS accuracy,
        ROUND(
          100.0 * COUNT(*) FILTER (WHERE an.is_correct AND r.id IS NOT NULL)
            / NULLIF(COUNT(*) FILTER (WHERE r.id IS NOT NULL), 0),
          1
        )::float AS "recentAccuracy"
      FROM answers an
      JOIN attempts a ON a.id = an.attempt_id
      JOIN questions q ON q.id = an.question_id
      JOIN topics t ON t.id = q.topic_id
      LEFT JOIN recent r ON r.id = a.id
      WHERE a.user_id = ${userId}::uuid AND a.status = 'SUBMITTED'
      GROUP BY t.id, t.name
      ORDER BY accuracy ASC, total DESC, t.name ASC
    `;
  }

  // Xu hướng 5 lần nộp gần nhất, trả theo thứ tự thời gian tăng dần để vẽ biểu đồ
  async trend(userId: string) {
    await this.attempts.finalizeExpiredFor(userId);
    return this.prisma.$queryRaw<
      {
        attemptId: string;
        examTitle: string;
        submittedAt: Date;
        estimatedScore: number;
        accuracy: number;
      }[]
    >`
      SELECT * FROM (
        SELECT
          a.id AS "attemptId",
          e.title AS "examTitle",
          a.submitted_at AS "submittedAt",
          a.estimated_score AS "estimatedScore",
          ROUND(100.0 * a.correct_count / NULLIF(a.total_questions, 0), 1)::float AS accuracy
        FROM attempts a
        JOIN exams e ON e.id = a.exam_id
        WHERE a.user_id = ${userId}::uuid AND a.status = 'SUBMITTED'
        ORDER BY a.submitted_at DESC
        LIMIT 5
      ) latest
      ORDER BY "submittedAt" ASC
    `;
  }
}
