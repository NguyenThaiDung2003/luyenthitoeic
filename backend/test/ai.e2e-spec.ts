import { OptionKey, Role } from '../src/generated/prisma/client.js';
import { createExam, createTestApp, createUser, resetDatabase, TestContext } from './helpers.js';

const { A, B } = OptionKey;
const content = {
  whyCorrect: 'Vì đúng',
  whyWrong: 'Vì sai',
  keyPoint: 'Ghi nhớ',
  similarExample: 'She arrived early.',
};

function reply(body: object) {
  const text = JSON.stringify(body);
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }));
}

describe('AI giải thích đáp án (e2e)', () => {
  let context: TestContext;
  let teacher: Awaited<ReturnType<typeof createUser>>;
  let student: Awaited<ReturnType<typeof createUser>>;
  let exam: Awaited<ReturnType<typeof createExam>>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    context = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(context.prisma);
    process.env.GEMINI_API_KEY = 'khoa-test';
    process.env.GEMINI_MODEL = 'model-test';
    process.env.AI_DAILY_LIMIT = '20';
    fetchMock = vi.fn(async () => reply(content));
    vi.stubGlobal('fetch', fetchMock);
    teacher = await createUser(context, Role.TEACHER);
    student = await createUser(context);
    // Câu 1 chọn sai, câu 2 chọn đúng, câu 3 bỏ trống, câu 4 chọn sai
    exam = await createExam(context, teacher.id, [
      { topic: 'T', correctOption: A },
      { topic: 'T', correctOption: A },
      { topic: 'T', correctOption: A },
      { topic: 'T', correctOption: A },
    ]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  afterAll(async () => {
    await context.app.close();
  });

  async function takeExam(user = student, submit = true) {
    const started = await context
      .http()
      .post(`/api/exams/${exam.exam.id}/attempts`)
      .set('Cookie', user.cookie)
      .expect(201);
    const attemptId = started.body.id as string;
    await context
      .http()
      .put(`/api/attempts/${attemptId}/answers`)
      .set('Cookie', user.cookie)
      .send({
        answers: [
          { questionId: exam.questions[0].id, selectedOption: B },
          { questionId: exam.questions[1].id, selectedOption: A },
          { questionId: exam.questions[3].id, selectedOption: B },
        ],
      })
      .expect(200);
    if (submit) {
      await context
        .http()
        .post(`/api/attempts/${attemptId}/submit`)
        .set('Cookie', user.cookie)
        .expect(200);
    }
    return attemptId;
  }

  const explain = (attemptId: string, index = 0, user = student) =>
    context
      .http()
      .post(`/api/attempts/${attemptId}/questions/${exam.questions[index].id}/explanation`)
      .set('Cookie', user.cookie);
  const vote = (id: string, helpful: unknown, user = student) =>
    context
      .http()
      .post(`/api/ai-explanations/${id}/feedback`)
      .set('Cookie', user.cookie)
      .send({ helpful });
  const usage = async () =>
    (await context.prisma.aiUsage.findFirst({ where: { userId: student.id } }))?.count ?? 0;

  it('tạo lời giải thích và lưu vào ai_explanations', async () => {
    const attemptId = await takeExam();

    const response = await explain(attemptId).expect(200);

    expect(response.body).toMatchObject({ content, helpful: null });
    const stored = await context.prisma.aiExplanation.findFirstOrThrow();
    expect(stored).toMatchObject({
      selectedOption: 'B',
      model: 'model-test',
      promptVersion: 'explanation-v1',
    });
    expect(await usage()).toBe(1);
  });

  it('prompt có đủ dữ liệu nhưng không có thông tin học viên', async () => {
    await explain(await takeExam()).expect(200);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.body).toContain('Câu 1');
    expect(init.body).toContain('correctOption');
    expect(init.body).not.toContain(student.email);
    expect(init.body).not.toContain(student.fullName);
  });

  it('cache theo câu hỏi và đáp án chọn, không tốn lượt, dùng chung giữa học viên', async () => {
    const other = await createUser(context);
    const attemptId = await takeExam();
    const otherAttempt = await takeExam(other);

    const first = await explain(attemptId).expect(200);
    const second = await explain(attemptId).expect(200);
    const third = await explain(otherAttempt, 0, other).expect(200);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second.body.id).toBe(first.body.id);
    expect(third.body.id).toBe(first.body.id);
    expect(await usage()).toBe(1);
  });

  it('gọi đồng thời vẫn chỉ lưu một bản', async () => {
    const attemptId = await takeExam();

    const responses = await Promise.all(Array.from({ length: 4 }, () => explain(attemptId)));

    expect(responses.every((response) => response.status === 200)).toBe(true);
    expect(await context.prisma.aiExplanation.count()).toBe(1);
  });

  it('chỉ giải thích câu sai đã chọn đáp án', async () => {
    const attemptId = await takeExam();

    await explain(attemptId, 1).expect(422);
    await explain(attemptId, 2).expect(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('chưa nộp bài thì không xem được', async () => {
    await explain(await takeExam(student, false)).expect(409);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('không xem được qua lượt của người khác', async () => {
    const other = await createUser(context);
    await explain(await takeExam(), 0, other).expect(403);
  });

  it('hết lượt thì trả 429 và không gọi Gemini', async () => {
    process.env.AI_DAILY_LIMIT = '1';
    const attemptId = await takeExam();

    await explain(attemptId, 0).expect(200);
    await explain(attemptId, 3).expect(429);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('gọi đồng thời không vượt giới hạn ngày', async () => {
    process.env.AI_DAILY_LIMIT = '1';
    const attemptId = await takeExam();

    const responses = await Promise.all([explain(attemptId, 0), explain(attemptId, 3)]);

    expect(responses.map((response) => response.status).sort((a, b) => a - b)).toEqual([200, 429]);
  });

  it('Gemini lỗi thì trả 503, hoàn lượt và không lộ chi tiết', async () => {
    fetchMock.mockImplementation(async () => new Response('chi tiết nội bộ', { status: 500 }));
    const attemptId = await takeExam();

    const response = await explain(attemptId).expect(503);

    expect(response.text).not.toContain('chi tiết nội bộ');
    expect(await usage()).toBe(0);
    expect(await context.prisma.aiExplanation.count()).toBe(0);
  });

  it('đầu ra sai định dạng được thử lại một lần', async () => {
    fetchMock.mockImplementationOnce(async () => reply({ whyCorrect: 'thiếu' }));
    const attemptId = await takeExam();

    await explain(attemptId).expect(200);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(await usage()).toBe(1);
  });

  it('chưa cấu hình khóa thì trả 503 và không tính lượt', async () => {
    delete process.env.GEMINI_API_KEY;
    const attemptId = await takeExam();

    const response = await explain(attemptId).expect(503);

    expect(response.body.message).toContain('chưa được cấu hình');
    expect(await usage()).toBe(0);
  });

  describe('phản hồi', () => {
    it('mỗi người một phiếu, đổi ý thì cập nhật số đếm', async () => {
      const { body } = await explain(await takeExam()).expect(200);

      await vote(body.id, true).expect(200);
      await vote(body.id, true).expect(200);
      await vote(body.id, false).expect(200);

      const stored = await context.prisma.aiExplanation.findUniqueOrThrow({ where: { id: body.id } });
      expect(stored).toMatchObject({ helpfulCount: 0, notHelpfulCount: 1 });
      const again = await explain((await context.prisma.attempt.findFirstOrThrow()).id).expect(200);
      expect(again.body.helpful).toBe(false);
    });

    it('người chưa chọn đáp án đó không đánh giá được', async () => {
      const other = await createUser(context);
      const { body } = await explain(await takeExam()).expect(200);

      await vote(body.id, true, other).expect(403);
    });

    it('kiểm tra dữ liệu đầu vào', async () => {
      const { body } = await explain(await takeExam()).expect(200);
      await vote(body.id, 'co').expect(400);
    });
  });
});
