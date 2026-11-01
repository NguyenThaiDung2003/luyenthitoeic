import { createTestApp, TestContext } from './helpers.js';

describe('Health (e2e)', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await createTestApp();
  });

  afterAll(async () => {
    await context.app.close();
  });

  it('GET /api/health kết nối được CSDL thật', async () => {
    const response = await context.http().get('/api/health').expect(200);
    expect(response.body).toEqual({ status: 'ok', database: 'up' });
  });
});
