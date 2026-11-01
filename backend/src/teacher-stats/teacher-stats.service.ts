import { Injectable } from '@nestjs/common';
import { AttemptsService } from '../attempts/attempts.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

export const AT_RISK_ACCURACY = 50;
const HARDEST_QUESTION_LIMIT = 10;
const MAX_READING_SCORE = 495;

@Injectable()
export class TeacherStatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attempts: AttemptsService,
  ) {}

  async overview() {
    await this.attempts.finalizeExpiredFor();
    const [row] = await this.prisma.$queryRaw<
      {
        students: number;
        active_students: number;
        submitted_attempts: number;
        average_score: number | null;
        accuracy: number | null;
      }[]
    >`
      SELECT
        (SELECT COUNT(*)::int FROM users WHERE role = 'STUDENT') AS students,
        COUNT(DISTINCT user_id)::int AS active_students,
        COUNT(*)::int AS submitted_attempts,
        ROUND(AVG(estimated_score), 1)::float AS average_score,
        ROUND(100.0 * SUM(correct_count) / NULLIF(SUM(total_questions), 0), 1)::float AS accuracy
      FROM attempts
      WHERE status = 'SUBMITTED'
    `;
    return {
      students: row.students,
      activeStudents: row.active_students,
      submittedAttempts: row.submitted_attempts,
      averageScore: row.average_score,
      accuracy: row.accuracy,
    };
  }

  // Điểm theo chủ đề là tỷ lệ đúng quy đổi tuyến tính trên thang 495
  async topics() {
    await this.attempts.finalizeExpiredFor();
    return this.prisma.$queryRaw<
      {
        topicId: string;
        name: string;
        total: number;
        correct: number;
        accuracy: number;
        averageScore: number;
        students: number;
      }[]
    >`
      SELECT
        t.id AS "topicId",
        t.name,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE an.is_correct)::int AS correct,
        ROUND(100.0 * COUNT(*) FILTER (WHERE an.is_correct) / COUNT(*), 1)::float AS accuracy,
        ROUND(${MAX_READING_SCORE} * COUNT(*) FILTER (WHERE an.is_correct)::numeric / COUNT(*), 1)::float
          AS "averageScore",
        COUNT(DISTINCT a.user_id)::int AS students
      FROM answers an
      JOIN attempts a ON a.id = an.attempt_id AND a.status = 'SUBMITTED'
      JOIN questions q ON q.id = an.question_id
      JOIN topics t ON t.id = q.topic_id
      GROUP BY t.id, t.name
      ORDER BY accuracy ASC, total DESC, t.name ASC
    `;
  }

  async hardestQuestions() {
    await this.attempts.finalizeExpiredFor();
    return this.prisma.$queryRaw<
      {
        questionId: string;
        content: string;
        part: string;
        topic: string;
        total: number;
        wrong: number;
        wrongRate: number;
      }[]
    >`
      SELECT
        q.id AS "questionId",
        q.content,
        q.part::text AS part,
        t.name AS topic,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE NOT an.is_correct)::int AS wrong,
        ROUND(100.0 * COUNT(*) FILTER (WHERE NOT an.is_correct) / COUNT(*), 1)::float AS "wrongRate"
      FROM answers an
      JOIN attempts a ON a.id = an.attempt_id AND a.status = 'SUBMITTED'
      JOIN questions q ON q.id = an.question_id
      JOIN topics t ON t.id = q.topic_id
      GROUP BY q.id, q.content, q.part, t.name
      HAVING COUNT(*) FILTER (WHERE NOT an.is_correct) > 0
      ORDER BY "wrongRate" DESC, total DESC, q.id ASC
      LIMIT ${HARDEST_QUESTION_LIMIT}
    `;
  }

  // Học viên cần hỗ trợ: tỷ lệ đúng trong 5 lần nộp gần nhất dưới ngưỡng
  async studentsAtRisk() {
    await this.attempts.finalizeExpiredFor();
    return this.prisma.$queryRaw<
      {
        userId: string;
        fullName: string;
        email: string;
        attempts: number;
        accuracy: number;
        lastSubmittedAt: Date;
      }[]
    >`
      WITH ranked AS (
        SELECT
          a.*,
          ROW_NUMBER() OVER (PARTITION BY a.user_id ORDER BY a.submitted_at DESC) AS position
        FROM attempts a
        WHERE a.status = 'SUBMITTED'
      )
      SELECT
        u.id AS "userId",
        u.full_name AS "fullName",
        u.email,
        COUNT(*)::int AS attempts,
        ROUND(100.0 * SUM(r.correct_count) / NULLIF(SUM(r.total_questions), 0), 1)::float AS accuracy,
        MAX(r.submitted_at) AS "lastSubmittedAt"
      FROM ranked r
      JOIN users u ON u.id = r.user_id
      WHERE r.position <= 5
      GROUP BY u.id, u.full_name, u.email
      HAVING 100.0 * SUM(r.correct_count) / NULLIF(SUM(r.total_questions), 0) < ${AT_RISK_ACCURACY}
      ORDER BY accuracy ASC, u.full_name ASC
    `;
  }
}
