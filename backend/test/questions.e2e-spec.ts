import { Role } from '../src/generated/prisma/client.js';
import { createTestApp, createUser, resetDatabase, TestContext } from './helpers.js';

describe('Ngân hàng câu hỏi (e2e)', () => {
  let context: TestContext;
  let cookie: string;
  let topicId: string;

  beforeAll(async () => {
    context = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(context.prisma);
    cookie = (await createUser(context, Role.TEACHER)).cookie;
    topicId = (await context.prisma.topic.create({ data: { name: 'Từ loại' } })).id;
  });

  afterAll(async () => {
    await context.app.close();
  });

  const payload = () => ({
    part: 'PART_5',
    content: 'She spoke very _____.',
    options: ['clear', 'clearly', 'clearer', 'clarity'],
    correctOption: 'B',
    difficulty: 'EASY',
    topicId,
    source: 'Tự biên soạn',
    license: 'CC0',
  });
  const post = (body: object) =>
    context.http().post('/api/questions').set('Cookie', cookie).send(body);
  const list = (query: string) =>
    context.http().get(`/api/questions?${query}`).set('Cookie', cookie).expect(200);

  it('tạo, sửa và lưu trữ câu hỏi', async () => {
    const created = await post(payload()).expect(201);
    const id = created.body.id as string;

    await context
      .http()
      .patch(`/api/questions/${id}`)
      .set('Cookie', cookie)
      .send({ difficulty: 'HARD' })
      .expect(200);
    await context.http().delete(`/api/questions/${id}`).set('Cookie', cookie).expect(204);

    await context.http().get(`/api/questions/${id}`).set('Cookie', cookie).expect(404);
    const stored = await context.prisma.question.findUniqueOrThrow({ where: { id } });
    expect(stored.difficulty).toBe('HARD');
    expect(stored.archivedAt).not.toBeNull();
  });

  it('lọc theo part, chủ đề, mức độ và từ khóa', async () => {
    const otherTopic = await context.prisma.topic.create({ data: { name: 'Giới từ' } });
    await post(payload()).expect(201);
    await post({
      ...payload(),
      content: 'Meet me _____ noon.',
      difficulty: 'HARD',
      topicId: otherTopic.id,
    }).expect(201);

    expect((await list('difficulty=HARD')).body.total).toBe(1);
    expect((await list(`topicId=${otherTopic.id}`)).body.items[0].topic.name).toBe('Giới từ');
    expect((await list('part=PART_7')).body.total).toBe(0);
    expect((await list('q=NOON')).body.total).toBe(1);
  });

  it('chuỗi tấn công SQL trong từ khóa chỉ được coi là văn bản', async () => {
    await post(payload()).expect(201);
    const attack = encodeURIComponent("' OR 1=1; DROP TABLE questions; --");

    expect((await list(`q=${attack}`)).body.total).toBe(0);
    expect(await context.prisma.question.count()).toBe(1);
  });

  it('kiểm tra dữ liệu đầu vào', async () => {
    await post({ ...payload(), options: ['a', 'b', 'c'] }).expect(400);
    await post({ ...payload(), correctOption: 'E' }).expect(400);
    await post({ ...payload(), part: 'PART_7' }).expect(400);
    await post({ ...payload(), topicId: '00000000-0000-4000-8000-000000000000' }).expect(400);
    await post({ ...payload(), extra: 'x' }).expect(400);
  });

  it('không xóa được đoạn văn còn câu hỏi', async () => {
    const passage = await context
      .http()
      .post('/api/passages')
      .set('Cookie', cookie)
      .send({ title: 'T', content: 'C', source: 'S', license: 'L' })
      .expect(201);
    const passageId = passage.body.id as string;
    await post({ ...payload(), part: 'PART_7', passageId }).expect(201);

    await context.http().delete(`/api/passages/${passageId}`).set('Cookie', cookie).expect(409);
  });

  it('học viên không truy cập được ngân hàng câu hỏi', async () => {
    const student = await createUser(context);
    for (const path of ['/api/questions', '/api/passages']) {
      await context.http().get(path).set('Cookie', student.cookie).expect(403);
    }
  });
});
