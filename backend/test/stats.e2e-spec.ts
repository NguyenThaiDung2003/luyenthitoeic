import { OptionKey, Role } from '../src/generated/prisma/client.js';
import { createExam, createTestApp, createUser, resetDatabase, TestContext } from './helpers.js';

const { A, B } = OptionKey;

describe('Chấm điểm, kết quả và thống kê (e2e)', () => {
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

  // Làm một đề và chọn đáp án theo danh sách cho trước, null là bỏ trống
  async function takeExam(
    questions: { id: string }[],
    examId: string,
    choices: (OptionKey | null)[],
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
        answers: questions.flatMap((question, index) =>
          choices[index] ? [{ questionId: question.id, selectedOption: choices[index] }] : [],
        ),
      })
      .expect(200);
    await context
      .http()
      .post(`/api/attempts/${attemptId}/submit`)
      .set('Cookie', user.cookie)
      .expect(200);
    return attemptId;
  }

  const get = (path: string, user = student) =>
    context.http().get(`/api/${path}`).set('Cookie', user.cookie).expect(200);

  it('trang kết quả có điểm, thống kê theo Part, chủ đề và đáp án từng câu', async () => {
    const { exam, questions } = await createExam(context, teacher.id, [
      { topic: 'Giới từ', correctOption: A },
      { topic: 'Giới từ', correctOption: B },
      { topic: 'Từ vựng', correctOption: A },
      { topic: 'Từ vựng', correctOption: A },
    ]);
    const attemptId = await takeExam(questions, exam.id, [A, A, null, A]);

    const { body } = await get(`attempts/${attemptId}/result`);

    expect(body).toMatchObject({ correctCount: 2, totalQuestions: 4, estimatedScore: 250 });
    expect(body.byPart).toEqual([{ key: 'PART_5', correct: 2, total: 4 }]);
    expect(body.byTopic).toEqual([
      { key: 'Giới từ', correct: 1, total: 2 },
      { key: 'Từ vựng', correct: 1, total: 2 },
    ]);
    expect(body.questions[1]).toMatchObject({
      selectedOption: 'A',
      correctOption: 'B',
      isCorrect: false,
      explanation: 'Giải thích 2',
    });
    expect(body.questions[2]).toMatchObject({ selectedOption: null, isCorrect: false });
  });

  it('thống kê chủ đề tính đúng tỷ lệ và xếp yếu nhất lên đầu', async () => {
    const { exam, questions } = await createExam(context, teacher.id, [
      { topic: 'Giới từ', correctOption: A },
      { topic: 'Giới từ', correctOption: A },
      { topic: 'Giới từ', correctOption: A },
      { topic: 'Giới từ', correctOption: A },
      { topic: 'Từ vựng', correctOption: A },
      { topic: 'Từ vựng', correctOption: A },
    ]);
    await takeExam(questions, exam.id, [A, B, B, B, A, A]);

    const { body } = await get('stats/me/topics');

    expect(body).toMatchObject([
      { name: 'Giới từ', total: 4, correct: 1, accuracy: 25, recentAccuracy: 25 },
      { name: 'Từ vựng', total: 2, correct: 2, accuracy: 100, recentAccuracy: 100 },
    ]);
  });

  it('xu hướng chỉ lấy 5 lần gần nhất và tăng dần theo thời gian', async () => {
    const { exam, questions } = await createExam(context, teacher.id, [
      { topic: 'T', correctOption: A },
      { topic: 'T', correctOption: A },
      { topic: 'T', correctOption: A },
      { topic: 'T', correctOption: A },
    ]);
    // 6 lần làm: số câu đúng 0, 0, 1, 2, 3, 4
    const plans: (OptionKey | null)[][] = [
      [B, B, B, B],
      [B, B, B, B],
      [A, B, B, B],
      [A, A, B, B],
      [A, A, A, B],
      [A, A, A, A],
    ];
    for (const [index, plan] of plans.entries()) {
      const attemptId = await takeExam(questions, exam.id, plan);
      // Cố định thời điểm nộp để thứ tự không phụ thuộc tốc độ chạy test
      await context.prisma.attempt.update({
        where: { id: attemptId },
        data: { submittedAt: new Date(2026, 0, index + 1) },
      });
    }

    const trend = await get('stats/me/trend');
    const topics = await get('stats/me/topics');

    expect(trend.body.map((item: { accuracy: number }) => item.accuracy)).toEqual([
      0, 25, 50, 75, 100,
    ]);
    expect(trend.body.map((item: { estimatedScore: number }) => item.estimatedScore)).toEqual([
      5, 125, 250, 370, 495,
    ]);
    // Toàn bộ: 10/24 câu đúng; 5 lần gần nhất: 10/20 câu đúng
    expect(topics.body[0]).toMatchObject({ total: 24, correct: 10, accuracy: 41.7, recentAccuracy: 50 });
  });

  it('tổng quan cộng dồn các lần đã nộp', async () => {
    const { exam, questions } = await createExam(context, teacher.id, [
      { topic: 'T', correctOption: A },
      { topic: 'T', correctOption: A },
    ]);
    await takeExam(questions, exam.id, [A, B]);
    await takeExam(questions, exam.id, [A, A]);

    const { body } = await get('stats/me/overview');

    expect(body).toMatchObject({
      completedExams: 2,
      totalQuestions: 4,
      correctQuestions: 3,
      accuracy: 75,
      latestScore: 495,
    });
  });

  it('chưa có dữ liệu thì trả giá trị rỗng', async () => {
    expect((await get('stats/me/overview')).body).toMatchObject({
      completedExams: 0,
      accuracy: null,
      latestScore: null,
    });
    expect((await get('stats/me/topics')).body).toEqual([]);
    expect((await get('stats/me/trend')).body).toEqual([]);
  });

  it('không lẫn dữ liệu giữa các học viên, không tính bài đang làm', async () => {
    const other = await createUser(context);
    const { exam, questions } = await createExam(context, teacher.id, [
      { topic: 'T', correctOption: A },
    ]);
    await takeExam(questions, exam.id, [A], other);
    await context
      .http()
      .post(`/api/exams/${exam.id}/attempts`)
      .set('Cookie', student.cookie)
      .expect(201);

    expect((await get('stats/me/topics')).body).toEqual([]);
    expect((await get('stats/me/overview')).body.completedExams).toBe(0);
  });

  it('giáo viên không gọi được thống kê cá nhân của học viên', async () => {
    await context.http().get('/api/stats/me/topics').set('Cookie', teacher.cookie).expect(403);
  });
});
