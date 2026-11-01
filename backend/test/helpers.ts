import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';
import {
  Difficulty,
  ExamStatus,
  type OptionKey,
  Part,
  Role,
} from '../src/generated/prisma/client.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

export const PASSWORD = 'mat-khau-test-123';

export async function createTestApp() {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>();
  configureApp(app);
  await app.init();
  return { app, prisma: app.get(PrismaService), http: () => request(app.getHttpServer()) };
}

export type TestContext = Awaited<ReturnType<typeof createTestApp>>;

// Xóa sạch dữ liệu giữa các test, chỉ chạy trên CSDL test
export async function resetDatabase(prisma: PrismaService) {
  await prisma.$executeRawUnsafe(
    'TRUNCATE ai_explanations, answers, attempts, exam_questions, exams, questions, passages, topics, users CASCADE',
  );
}

// Tạo đề đã xuất bản gồm các câu với đáp án cho trước, mỗi câu thuộc một chủ đề
export async function createExam(
  context: TestContext,
  teacherId: string,
  questions: { topic: string; correctOption: OptionKey; difficulty?: Difficulty }[],
  durationMinutes = 30,
) {
  const created = [];
  for (const [index, item] of questions.entries()) {
    const topic = await context.prisma.topic.upsert({
      where: { name: item.topic },
      update: {},
      create: { name: item.topic },
    });
    created.push(
      await context.prisma.question.create({
        data: {
          part: Part.PART_5,
          content: `Câu ${index + 1}`,
          options: ['a', 'b', 'c', 'd'],
          correctOption: item.correctOption,
          difficulty: item.difficulty ?? Difficulty.MEDIUM,
          explanation: `Giải thích ${index + 1}`,
          source: 'Test',
          license: 'Test',
          topicId: topic.id,
        },
      }),
    );
  }
  const exam = await context.prisma.exam.create({
    data: {
      title: 'Đề test',
      status: ExamStatus.PUBLISHED,
      durationMinutes,
      createdById: teacherId,
      questions: {
        create: created.map((question, index) => ({
          position: index + 1,
          questionId: question.id,
        })),
      },
    },
  });
  return { exam, questions: created };
}

let userCounter = 0;
// Hash cố định với cost thấp để test chạy nhanh
const passwordHash = bcrypt.hashSync(PASSWORD, 4);

export async function createUser(context: TestContext, role: Role = Role.STUDENT) {
  userCounter += 1;
  const email = `user${userCounter}@example.com`;
  const user = await context.prisma.user.create({
    data: { email, passwordHash, fullName: `Người dùng ${userCounter}`, role },
  });
  const response = await context
    .http()
    .post('/api/auth/login')
    .send({ email, password: PASSWORD })
    .expect(200);
  const cookie = response.headers['set-cookie'][0].split(';')[0];
  return { ...user, cookie };
}
