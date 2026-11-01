import { OptionKey, Role } from '../src/generated/prisma/client.js';
import { createExam, createTestApp, createUser, resetDatabase, TestContext } from './helpers.js';

const ID = '00000000-0000-4000-8000-000000000000';

// Danh sách đầy đủ endpoint và vai trò được phép; thêm endpoint mới mà quên khai báo thì test đầu tiên báo lỗi
const ROUTES: { method: 'get' | 'post' | 'put' | 'patch' | 'delete'; path: string; role?: Role }[] = [
  { method: 'post', path: '/api/auth/logout' },
  { method: 'post', path: '/api/auth/refresh' },
  { method: 'get', path: '/api/auth/me' },
  { method: 'get', path: '/api/topics' },
  { method: 'post', path: '/api/topics', role: Role.TEACHER },
  { method: 'get', path: '/api/questions', role: Role.TEACHER },
  { method: 'post', path: '/api/questions', role: Role.TEACHER },
  { method: 'get', path: `/api/questions/${ID}`, role: Role.TEACHER },
  { method: 'patch', path: `/api/questions/${ID}`, role: Role.TEACHER },
  { method: 'delete', path: `/api/questions/${ID}`, role: Role.TEACHER },
  { method: 'get', path: '/api/passages', role: Role.TEACHER },
  { method: 'post', path: '/api/passages', role: Role.TEACHER },
  { method: 'get', path: `/api/passages/${ID}`, role: Role.TEACHER },
  { method: 'patch', path: `/api/passages/${ID}`, role: Role.TEACHER },
  { method: 'delete', path: `/api/passages/${ID}`, role: Role.TEACHER },
  { method: 'get', path: '/api/exams' },
  { method: 'post', path: '/api/exams', role: Role.TEACHER },
  { method: 'post', path: '/api/exams/random', role: Role.TEACHER },
  { method: 'get', path: `/api/exams/${ID}`, role: Role.TEACHER },
  { method: 'patch', path: `/api/exams/${ID}`, role: Role.TEACHER },
  { method: 'delete', path: `/api/exams/${ID}`, role: Role.TEACHER },
  { method: 'post', path: `/api/exams/${ID}/publish`, role: Role.TEACHER },
  { method: 'post', path: `/api/exams/${ID}/attempts`, role: Role.STUDENT },
  { method: 'get', path: '/api/attempts', role: Role.STUDENT },
  { method: 'get', path: `/api/attempts/${ID}`, role: Role.STUDENT },
  { method: 'get', path: `/api/attempts/${ID}/result`, role: Role.STUDENT },
  { method: 'put', path: `/api/attempts/${ID}/answers`, role: Role.STUDENT },
  { method: 'post', path: `/api/attempts/${ID}/submit`, role: Role.STUDENT },
  { method: 'get', path: '/api/stats/me/overview', role: Role.STUDENT },
  { method: 'get', path: '/api/stats/me/topics', role: Role.STUDENT },
  { method: 'get', path: '/api/stats/me/trend', role: Role.STUDENT },
  { method: 'get', path: '/api/recommendations', role: Role.STUDENT },
  { method: 'post', path: '/api/recommendations/review-sets', role: Role.STUDENT },
  { method: 'post', path: `/api/attempts/${ID}/questions/${ID}/explanation`, role: Role.STUDENT },
  { method: 'post', path: `/api/ai-explanations/${ID}/feedback`, role: Role.STUDENT },
  { method: 'get', path: '/api/teacher/stats/overview', role: Role.TEACHER },
  { method: 'get', path: '/api/teacher/stats/topics', role: Role.TEACHER },
  { method: 'get', path: '/api/teacher/stats/hardest-questions', role: Role.TEACHER },
  { method: 'get', path: '/api/teacher/stats/students-at-risk', role: Role.TEACHER },
];
const PUBLIC_ROUTES = ['POST /api/auth/register', 'POST /api/auth/login', 'GET /api/health'];

function registeredRoutes(context: TestContext) {
  const express = context.app.getHttpAdapter().getInstance() as unknown as {
    router: { stack: { route?: { path: string; methods: Record<string, boolean> } }[] };
  };
  return express.router.stack.flatMap(({ route }) =>
    route
      ? Object.keys(route.methods).map(
          (method) => `${method.toUpperCase()} ${route.path.replace(/:\w+/g, ID)}`,
        )
      : [],
  );
}

describe('Bảo mật (e2e)', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(context.prisma);
  });

  afterAll(async () => {
    await context.app.close();
  });

  it('mọi endpoint thật đều được khai báo trong bảng quyền', () => {
    const declared = [
      ...ROUTES.map((route) => `${route.method.toUpperCase()} ${route.path}`),
      ...PUBLIC_ROUTES,
    ];
    expect(registeredRoutes(context).sort()).toEqual(declared.sort());
  });

  it.each(ROUTES)('$method $path cần đăng nhập', async ({ method, path }) => {
    await context.http()[method](path).expect(401);
  });

  it.each(ROUTES.filter((route) => route.role))(
    '$method $path chặn sai vai trò',
    async ({ method, path, role }) => {
      const other = await createUser(
        context,
        role === Role.TEACHER ? Role.STUDENT : Role.TEACHER,
      );
      await context.http()[method](path).set('Cookie', other.cookie).expect(403);
    },
  );

  it('học viên không đọc được đáp án qua bất kỳ endpoint nào trước khi nộp', async () => {
    const teacher = await createUser(context, Role.TEACHER);
    const student = await createUser(context);
    const { exam, questions } = await createExam(context, teacher.id, [
      { topic: 'T', correctOption: OptionKey.C },
    ]);
    const started = await context
      .http()
      .post(`/api/exams/${exam.id}/attempts`)
      .set('Cookie', student.cookie)
      .expect(201);

    const reads = [
      '/api/exams',
      `/api/exams/${exam.id}`,
      `/api/questions/${questions[0].id}`,
      `/api/attempts/${started.body.id}`,
      `/api/attempts/${started.body.id}/result`,
      '/api/attempts',
      '/api/stats/me/topics',
    ];
    for (const path of reads) {
      const response = await context.http().get(path).set('Cookie', student.cookie);
      expect(response.text).not.toContain('correctOption');
      expect(response.text).not.toContain('Giải thích 1');
    }
  });

  it('id không phải UUID bị từ chối trước khi chạm CSDL', async () => {
    const student = await createUser(context);
    await context
      .http()
      .get("/api/attempts/1'%20OR%20'1'='1")
      .set('Cookie', student.cookie)
      .expect(400);
  });

  it('lỗi không làm lộ chi tiết nội bộ', async () => {
    const response = await context.http().post('/api/auth/login').send({ email: 'sai' }).expect(400);
    expect(response.text).not.toMatch(/prisma|stack|node_modules/i);
  });

  it('gửi body quá lớn bị từ chối', async () => {
    await context
      .http()
      .post('/api/auth/login')
      .send({ email: 'a@example.com', password: 'x'.repeat(200_000) })
      .expect(413);
  });

  it('header bảo mật và CORS đúng nguồn', async () => {
    const allowed = await context
      .http()
      .get('/api/health')
      .set('Origin', process.env.FRONTEND_ORIGIN ?? 'http://localhost:3002');
    const blocked = await context.http().get('/api/health').set('Origin', 'https://evil.example');

    expect(allowed.headers['x-content-type-options']).toBe('nosniff');
    expect(allowed.headers['access-control-allow-origin']).toBeDefined();
    expect(blocked.headers['access-control-allow-origin']).not.toBe('https://evil.example');
  });

  it('gia hạn phiên trả cookie mới và lấy vai trò hiện tại từ CSDL', async () => {
    const user = await createUser(context);
    await context.prisma.user.update({ where: { id: user.id }, data: { role: Role.TEACHER } });

    const response = await context
      .http()
      .post('/api/auth/refresh')
      .set('Cookie', user.cookie)
      .expect(200);

    expect(response.body.user.role).toBe('TEACHER');
    expect(response.headers['set-cookie'][0]).toMatch(/access_token=.*HttpOnly/);
  });

  it('bấm tạo bộ ôn tập nhiều lần không sinh đề thừa', async () => {
    const teacher = await createUser(context, Role.TEACHER);
    const student = await createUser(context);
    const done = await createExam(context, teacher.id, [{ topic: 'Yếu', correctOption: OptionKey.A }]);
    const started = await context
      .http()
      .post(`/api/exams/${done.exam.id}/attempts`)
      .set('Cookie', student.cookie)
      .expect(201);
    await context
      .http()
      .post(`/api/attempts/${started.body.id}/submit`)
      .set('Cookie', student.cookie)
      .expect(200);
    await createExam(context, teacher.id, [{ topic: 'Yếu', correctOption: OptionKey.A }]);

    const create = () =>
      context
        .http()
        .post('/api/recommendations/review-sets')
        .set('Cookie', student.cookie)
        .expect(201);
    const first = await create();
    const second = await create();

    expect(second.body.attemptId).toBe(first.body.attemptId);
    expect(await context.prisma.exam.count({ where: { kind: 'REVIEW' } })).toBe(1);
  });
});
