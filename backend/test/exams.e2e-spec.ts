import { OptionKey, Role } from '../src/generated/prisma/client.js';
import { createExam, createTestApp, createUser, resetDatabase, TestContext } from './helpers.js';

const { A, B, C } = OptionKey;

describe('Tạo đề và làm bài (e2e)', () => {
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

  const startAttempt = async (examId: string, cookie = student.cookie) => {
    const response = await context
      .http()
      .post(`/api/exams/${examId}/attempts`)
      .set('Cookie', cookie)
      .expect(201);
    return response.body.id as string;
  };
  const save = (attemptId: string, answers: object[], cookie = student.cookie) =>
    context.http().put(`/api/attempts/${attemptId}/answers`).set('Cookie', cookie).send({ answers });
  const submit = (attemptId: string, cookie = student.cookie) =>
    context.http().post(`/api/attempts/${attemptId}/submit`).set('Cookie', cookie);
  const expire = (attemptId: string) =>
    context.prisma.attempt.update({
      where: { id: attemptId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

  describe('tạo đề', () => {
    const asTeacher = (path: string, body: object) =>
      context.http().post(path).set('Cookie', teacher.cookie).send(body);

    it('chọn tay, xuất bản rồi học viên mới thấy đề', async () => {
      const { questions } = await createExam(context, teacher.id, [{ topic: 'T', correctOption: A }]);
      const created = await asTeacher('/api/exams', {
        title: 'Đề mới',
        durationMinutes: 10,
        questionIds: [questions[0].id],
      }).expect(201);

      const before = await context.http().get('/api/exams').set('Cookie', student.cookie);
      expect(before.body.map((exam: { id: string }) => exam.id)).not.toContain(created.body.id);

      await context
        .http()
        .post(`/api/exams/${created.body.id}/publish`)
        .set('Cookie', teacher.cookie)
        .expect(200);

      const after = await context.http().get('/api/exams').set('Cookie', student.cookie);
      expect(after.body.map((exam: { id: string }) => exam.id)).toContain(created.body.id);
    });

    it('ngẫu nhiên theo chủ đề và mức độ, không trùng câu', async () => {
      const { questions } = await createExam(context, teacher.id, [
        { topic: 'Giới từ', correctOption: A },
        { topic: 'Giới từ', correctOption: B },
        { topic: 'Giới từ', correctOption: C },
        { topic: 'Từ vựng', correctOption: A },
      ]);
      const created = await asTeacher('/api/exams/random', {
        title: 'Đề ngẫu nhiên',
        durationMinutes: 10,
        criteria: [{ topicId: questions[0].topicId, count: 2 }, { topicId: questions[0].topicId, count: 1 }],
      }).expect(201);

      const rows = await context.prisma.examQuestion.findMany({
        where: { examId: created.body.id },
        include: { question: { include: { topic: true } } },
      });
      expect(new Set(rows.map((row) => row.questionId)).size).toBe(3);
      expect(rows.every((row) => row.question.topic.name === 'Giới từ')).toBe(true);
    });

    it('báo lỗi khi không đủ câu', async () => {
      const response = await asTeacher('/api/exams/random', {
        title: 'Đề',
        durationMinutes: 10,
        criteria: [{ count: 5 }],
      }).expect(422);
      expect(response.body.message).toContain('Không đủ câu hỏi');
    });

    it('học viên không tạo được đề và không xem được chi tiết đề', async () => {
      const { exam } = await createExam(context, teacher.id, [{ topic: 'T', correctOption: A }]);
      await context
        .http()
        .post('/api/exams')
        .set('Cookie', student.cookie)
        .send({ title: 'X', durationMinutes: 10, questionIds: [] })
        .expect(403);
      await context.http().get(`/api/exams/${exam.id}`).set('Cookie', student.cookie).expect(403);
    });

    it('đề đã xuất bản không sửa được, đề có lượt làm không xóa được', async () => {
      const { exam } = await createExam(context, teacher.id, [{ topic: 'T', correctOption: A }]);
      await startAttempt(exam.id);

      await context
        .http()
        .patch(`/api/exams/${exam.id}`)
        .set('Cookie', teacher.cookie)
        .send({ title: 'Mới' })
        .expect(409);
      await context.http().delete(`/api/exams/${exam.id}`).set('Cookie', teacher.cookie).expect(409);
    });
  });

  describe('không lộ đáp án', () => {
    const SECRET_FIELDS = ['correctOption', 'explanation', 'isCorrect'];

    it('đề thi, lưu nháp và danh sách không chứa đáp án trước khi nộp', async () => {
      const { exam, questions } = await createExam(context, teacher.id, [
        { topic: 'T', correctOption: C },
      ]);
      const attemptId = await startAttempt(exam.id);

      const paper = await context
        .http()
        .get(`/api/attempts/${attemptId}`)
        .set('Cookie', student.cookie)
        .expect(200);
      const saved = await save(attemptId, [{ questionId: questions[0].id, selectedOption: A }]);
      const list = await context.http().get('/api/exams').set('Cookie', student.cookie);

      for (const body of [paper.text, saved.text, list.text]) {
        for (const field of SECRET_FIELDS) expect(body).not.toContain(field);
      }
      expect(paper.text).not.toContain('Giải thích');
    });

    it('học viên chưa nộp không xem được kết quả', async () => {
      const { exam } = await createExam(context, teacher.id, [{ topic: 'T', correctOption: C }]);
      const attemptId = await startAttempt(exam.id);

      await context
        .http()
        .get(`/api/attempts/${attemptId}/result`)
        .set('Cookie', student.cookie)
        .expect(409);
    });
  });

  describe('làm bài', () => {
    it('tiếp tục lượt đang làm thay vì tạo lượt mới', async () => {
      const { exam } = await createExam(context, teacher.id, [{ topic: 'T', correctOption: A }]);
      expect(await startAttempt(exam.id)).toBe(await startAttempt(exam.id));
    });

    it('hai yêu cầu bắt đầu cùng lúc chỉ tạo một lượt', async () => {
      const { exam } = await createExam(context, teacher.id, [{ topic: 'T', correctOption: A }]);
      const ids = await Promise.all(Array.from({ length: 5 }, () => startAttempt(exam.id)));

      expect(new Set(ids).size).toBe(1);
      expect(await context.prisma.attempt.count()).toBe(1);
    });

    it('thời gian còn lại do máy chủ tính', async () => {
      const { exam } = await createExam(context, teacher.id, [{ topic: 'T', correctOption: A }], 30);
      const attemptId = await startAttempt(exam.id);
      const paper = await context
        .http()
        .get(`/api/attempts/${attemptId}`)
        .set('Cookie', student.cookie);

      expect(paper.body.remainingSeconds).toBeGreaterThan(1790);
      expect(paper.body.remainingSeconds).toBeLessThanOrEqual(1800);
    });

    it('lưu nháp giữ lựa chọn và cờ, lần sau ghi đè lần trước', async () => {
      const { exam, questions } = await createExam(context, teacher.id, [
        { topic: 'T', correctOption: A },
      ]);
      const attemptId = await startAttempt(exam.id);
      const questionId = questions[0].id;

      await save(attemptId, [{ questionId, selectedOption: A, isFlagged: true }]).expect(200);
      await save(attemptId, [{ questionId, selectedOption: B }]).expect(200);

      const paper = await context
        .http()
        .get(`/api/attempts/${attemptId}`)
        .set('Cookie', student.cookie);
      expect(paper.body.questions[0]).toMatchObject({ selectedOption: 'B', isFlagged: true });
    });

    it('không nhận câu hỏi ngoài đề', async () => {
      const first = await createExam(context, teacher.id, [{ topic: 'T', correctOption: A }]);
      const second = await createExam(context, teacher.id, [{ topic: 'T', correctOption: A }]);
      const attemptId = await startAttempt(first.exam.id);

      await save(attemptId, [{ questionId: second.questions[0].id, selectedOption: A }]).expect(400);
    });

    it('đề nháp không làm được', async () => {
      const { exam } = await createExam(context, teacher.id, [{ topic: 'T', correctOption: A }]);
      await context.prisma.exam.update({ where: { id: exam.id }, data: { status: 'DRAFT' } });

      await context
        .http()
        .post(`/api/exams/${exam.id}/attempts`)
        .set('Cookie', student.cookie)
        .expect(404);
    });
  });

  describe('nộp trùng', () => {
    it('lần nộp thứ hai bị từ chối và kết quả giữ nguyên', async () => {
      const { exam, questions } = await createExam(context, teacher.id, [
        { topic: 'T', correctOption: A },
      ]);
      const attemptId = await startAttempt(exam.id);
      await save(attemptId, [{ questionId: questions[0].id, selectedOption: A }]).expect(200);

      const first = await submit(attemptId).expect(200);
      await submit(attemptId).expect(409);

      expect(first.body).toMatchObject({ correctCount: 1, totalQuestions: 1, estimatedScore: 495 });
      await save(attemptId, [{ questionId: questions[0].id, selectedOption: B }]).expect(409);
      const stored = await context.prisma.answer.findFirstOrThrow({ where: { attemptId } });
      expect(stored.selectedOption).toBe('A');
    });

    it('nhiều yêu cầu nộp cùng lúc chỉ một yêu cầu thành công', async () => {
      const { exam } = await createExam(context, teacher.id, [{ topic: 'T', correctOption: A }]);
      const attemptId = await startAttempt(exam.id);

      const responses = await Promise.all(Array.from({ length: 5 }, () => submit(attemptId)));

      expect(responses.map((response) => response.status).sort()).toEqual([
        200, 409, 409, 409, 409,
      ]);
    });
  });

  describe('hết giờ', () => {
    it('không nhận lưu nháp sau khi hết giờ', async () => {
      const { exam, questions } = await createExam(context, teacher.id, [
        { topic: 'T', correctOption: A },
      ]);
      const attemptId = await startAttempt(exam.id);
      await expire(attemptId);

      await save(attemptId, [{ questionId: questions[0].id, selectedOption: A }]).expect(409);
      expect(await context.prisma.answer.count()).toBe(0);
    });

    it('nộp sau khi hết giờ chỉ chấm câu đã lưu và đánh dấu tự nộp', async () => {
      const { exam, questions } = await createExam(context, teacher.id, [
        { topic: 'T', correctOption: A },
        { topic: 'T', correctOption: B },
      ]);
      const attemptId = await startAttempt(exam.id);
      await save(attemptId, [{ questionId: questions[0].id, selectedOption: A }]).expect(200);
      await expire(attemptId);

      const response = await submit(attemptId).expect(200);

      expect(response.body).toMatchObject({ correctCount: 1, autoSubmitted: true });
    });

    it('mở lại đề quá giờ thì bài được chấm tự động', async () => {
      const { exam } = await createExam(context, teacher.id, [{ topic: 'T', correctOption: A }]);
      const attemptId = await startAttempt(exam.id);
      await expire(attemptId);

      const paper = await context
        .http()
        .get(`/api/attempts/${attemptId}`)
        .set('Cookie', student.cookie)
        .expect(200);

      expect(paper.body).toMatchObject({ status: 'SUBMITTED', remainingSeconds: 0 });
      const attempt = await context.prisma.attempt.findUniqueOrThrow({ where: { id: attemptId } });
      expect(attempt).toMatchObject({ autoSubmitted: true, correctCount: 0 });
    });

    it('bắt đầu lại đề quá giờ tạo lượt mới', async () => {
      const { exam } = await createExam(context, teacher.id, [{ topic: 'T', correctOption: A }]);
      const first = await startAttempt(exam.id);
      await expire(first);

      const second = await startAttempt(exam.id);

      expect(second).not.toBe(first);
    });
  });

  describe('truy cập bài của người khác', () => {
    it('không xem, không lưu, không nộp được', async () => {
      const other = await createUser(context);
      const { exam, questions } = await createExam(context, teacher.id, [
        { topic: 'T', correctOption: A },
      ]);
      const attemptId = await startAttempt(exam.id);

      await context
        .http()
        .get(`/api/attempts/${attemptId}`)
        .set('Cookie', other.cookie)
        .expect(403);
      await save(attemptId, [{ questionId: questions[0].id, selectedOption: A }], other.cookie).expect(403);
      await submit(attemptId, other.cookie).expect(403);
      await context
        .http()
        .get(`/api/attempts/${attemptId}/result`)
        .set('Cookie', other.cookie)
        .expect(403);
    });

    it('không làm được bộ ôn tập của người khác', async () => {
      const other = await createUser(context);
      const { exam } = await createExam(context, student.id, [{ topic: 'T', correctOption: A }]);
      await context.prisma.exam.update({ where: { id: exam.id }, data: { kind: 'REVIEW' } });

      await context
        .http()
        .post(`/api/exams/${exam.id}/attempts`)
        .set('Cookie', other.cookie)
        .expect(403);
      await startAttempt(exam.id);
    });
  });
});
