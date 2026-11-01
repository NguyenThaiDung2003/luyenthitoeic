import { Difficulty, OptionKey, Role } from '../src/generated/prisma/client.js';
import { createExam, createTestApp, createUser, resetDatabase, TestContext } from './helpers.js';

const { A, B } = OptionKey;

describe('Gợi ý ôn tập và thống kê giáo viên (e2e)', () => {
  let context: TestContext;
  let teacher: Awaited<ReturnType<typeof createUser>>;
  let student: Awaited<ReturnType<typeof createUser>>;

  beforeAll(async () => {
    context = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(context.prisma);
    teacher = await createUser(context, Role.TEACHER);
    student = await createUser(context);
  });

  afterAll(async () => {
    await context.app.close();
  });

  async function takeExam(
    examId: string,
    questions: { id: string }[],
    choices: OptionKey[],
    user = student,
  ) {
    const started = await context
      .http()
      .post(`/api/exams/${examId}/attempts`)
      .set('Cookie', user.cookie)
      .expect(201);
    const attemptId = started.body.id as string;
    await context
      .http()
      .put(`/api/attempts/${attemptId}/answers`)
      .set('Cookie', user.cookie)
      .send({
        answers: questions.map((question, index) => ({
          questionId: question.id,
          selectedOption: choices[index],
        })),
      })
      .expect(200);
    await context
      .http()
      .post(`/api/attempts/${attemptId}/submit`)
      .set('Cookie', user.cookie)
      .expect(200);
    return attemptId;
  }

  const get = (path: string, user = teacher) =>
    context.http().get(`/api/${path}`).set('Cookie', user.cookie).expect(200);

  describe('gợi ý ôn tập', () => {
    const createSet = (user = student) =>
      context.http().post('/api/recommendations/review-sets').set('Cookie', user.cookie);

    it('chưa làm đề thì không tạo được bộ ôn tập', async () => {
      const response = await createSet().expect(422);
      expect(response.body.message).toContain('ít nhất một đề');
    });

    it('tạo bộ từ câu chưa làm của chủ đề yếu, không lộ cho người khác', async () => {
      const done = await createExam(context, teacher.id, [
        { topic: 'Yếu', correctOption: A },
        { topic: 'Mạnh', correctOption: A },
      ]);
      await takeExam(done.exam.id, done.questions, [B, A]);
      const extra = await createExam(context, teacher.id, [
        { topic: 'Yếu', correctOption: A, difficulty: Difficulty.HARD },
        { topic: 'Yếu', correctOption: A, difficulty: Difficulty.EASY },
      ]);

      const recommendation = await get('recommendations', student);
      expect(recommendation.body).toMatchObject([
        { name: 'Yếu', accuracy: 0, targetDifficulty: 'EASY', plannedQuestions: 10, unseenQuestions: 2 },
      ]);

      const created = await createSet().expect(201);
      expect(created.body.questionCount).toBe(2);

      const paper = await get(`attempts/${created.body.attemptId}`, student);
      const ids = paper.body.questions.map((question: { id: string }) => question.id);
      expect(ids.sort()).toEqual(extra.questions.map((question) => question.id).sort());
      expect(paper.text).not.toContain('correctOption');

      const other = await createUser(context);
      await context
        .http()
        .post(`/api/exams/${created.body.examId}/attempts`)
        .set('Cookie', other.cookie)
        .expect(403);
    });

    it('bộ ôn tập không hiện trong danh sách đề chung', async () => {
      const done = await createExam(context, teacher.id, [{ topic: 'Yếu', correctOption: A }]);
      await takeExam(done.exam.id, done.questions, [B]);
      await createExam(context, teacher.id, [{ topic: 'Yếu', correctOption: A }]);
      const created = await createSet().expect(201);

      const exams = await get('exams', student);
      expect(exams.body.map((exam: { id: string }) => exam.id)).not.toContain(created.body.examId);
    });

    it('đã làm hết câu thì báo rõ', async () => {
      const done = await createExam(context, teacher.id, [{ topic: 'Yếu', correctOption: A }]);
      await takeExam(done.exam.id, done.questions, [B]);

      const response = await createSet().expect(422);
      expect(response.body.message).toContain('đã làm hết');
    });
  });

  describe('thống kê giáo viên', () => {
    it('tính đúng theo dữ liệu mẫu', async () => {
      const good = await createUser(context);
      const { exam, questions } = await createExam(context, teacher.id, [
        { topic: 'Giới từ', correctOption: A },
        { topic: 'Giới từ', correctOption: A },
        { topic: 'Từ vựng', correctOption: A },
        { topic: 'Từ vựng', correctOption: A },
      ]);
      await takeExam(exam.id, questions, [A, A, A, A], good);
      await takeExam(exam.id, questions, [B, B, B, A]);

      const overview = await get('teacher/stats/overview');
      expect(overview.body).toMatchObject({
        students: 2,
        activeStudents: 2,
        submittedAttempts: 2,
        averageScore: 310,
        accuracy: 62.5,
      });

      const topics = await get('teacher/stats/topics');
      expect(topics.body).toMatchObject([
        { name: 'Giới từ', total: 4, correct: 2, accuracy: 50, averageScore: 247.5, students: 2 },
        { name: 'Từ vựng', total: 4, correct: 3, accuracy: 75, averageScore: 371.3, students: 2 },
      ]);

      const hardest = await get('teacher/stats/hardest-questions');
      expect(hardest.body).toHaveLength(3);
      expect(hardest.body[0]).toMatchObject({ total: 2, wrong: 1, wrongRate: 50 });

      const atRisk = await get('teacher/stats/students-at-risk');
      expect(atRisk.body).toMatchObject([{ userId: student.id, attempts: 1, accuracy: 25 }]);
    });

    it('học viên cần hỗ trợ chỉ xét 5 lần gần nhất', async () => {
      const { exam, questions } = await createExam(context, teacher.id, [
        { topic: 'T', correctOption: A },
      ]);
      // Sai 2 lần cũ, sau đó đúng 5 lần liên tiếp
      for (const [index, choice] of [B, B, A, A, A, A, A].entries()) {
        const attemptId = await takeExam(exam.id, questions, [choice]);
        await context.prisma.attempt.update({
          where: { id: attemptId },
          data: { submittedAt: new Date(2026, 0, index + 1) },
        });
      }

      expect((await get('teacher/stats/students-at-risk')).body).toEqual([]);
    });

    it('chưa có bài nộp thì trả giá trị rỗng', async () => {
      expect((await get('teacher/stats/overview')).body).toMatchObject({
        students: 1,
        submittedAttempts: 0,
        averageScore: null,
      });
      expect((await get('teacher/stats/topics')).body).toEqual([]);
    });

    it('chỉ giáo viên truy cập được', async () => {
      for (const path of ['overview', 'topics', 'hardest-questions', 'students-at-risk']) {
        await context
          .http()
          .get(`/api/teacher/stats/${path}`)
          .set('Cookie', student.cookie)
          .expect(403);
        await context.http().get(`/api/teacher/stats/${path}`).expect(401);
      }
    });
  });
});
