import { JwtService } from '@nestjs/jwt';
import { Role } from '../src/generated/prisma/client.js';
import { createTestApp, createUser, PASSWORD, resetDatabase, TestContext } from './helpers.js';

describe('Xác thực và phân quyền (e2e)', () => {
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

  const register = (body: object) => context.http().post('/api/auth/register').send(body);

  describe('đăng ký', () => {
    const valid = { email: 'HV@Example.com', password: 'mat-khau-dai', fullName: 'Học viên' };

    it('tạo học viên, băm mật khẩu và đặt cookie HttpOnly', async () => {
      const response = await register(valid).expect(201);

      expect(response.body.user).toMatchObject({ email: 'hv@example.com', role: 'STUDENT' });
      expect(response.body.user).not.toHaveProperty('passwordHash');
      expect(response.body).not.toHaveProperty('token');
      expect(response.headers['set-cookie'][0]).toMatch(/access_token=.*HttpOnly.*SameSite=Lax/);

      const stored = await context.prisma.user.findUniqueOrThrow({
        where: { email: 'hv@example.com' },
      });
      expect(stored.passwordHash).toMatch(/^\$2[aby]\$12\$/);
    });

    it('từ chối tự cấp vai trò giáo viên', async () => {
      await register({ ...valid, role: 'TEACHER' }).expect(400);
      expect(await context.prisma.user.count()).toBe(0);
    });

    it('từ chối email trùng', async () => {
      await register(valid).expect(201);
      await register({ ...valid, email: 'hv@example.com' }).expect(409);
    });

    it('từ chối mật khẩu quá ngắn', async () => {
      await register({ ...valid, password: 'ngan' }).expect(400);
    });
  });

  describe('đăng nhập', () => {
    it('sai mật khẩu và email không tồn tại trả cùng thông báo', async () => {
      const user = await createUser(context);

      const wrongPassword = await context
        .http()
        .post('/api/auth/login')
        .send({ email: user.email, password: 'mat-khau-sai' })
        .expect(401);
      const unknownEmail = await context
        .http()
        .post('/api/auth/login')
        .send({ email: 'khong-co@example.com', password: PASSWORD })
        .expect(401);

      expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
      expect(wrongPassword.headers['set-cookie']).toBeUndefined();
    });

    it('cookie đăng nhập truy cập được /auth/me', async () => {
      const user = await createUser(context);
      const response = await context
        .http()
        .get('/api/auth/me')
        .set('Cookie', user.cookie)
        .expect(200);
      expect(response.body.user).toMatchObject({ id: user.id, role: 'STUDENT' });
    });

    it('đăng xuất xóa cookie', async () => {
      const user = await createUser(context);
      const response = await context
        .http()
        .post('/api/auth/logout')
        .set('Cookie', user.cookie)
        .expect(204);
      expect(response.headers['set-cookie'][0]).toMatch(/access_token=;/);
    });
  });

  describe('token', () => {
    it('chưa đăng nhập bị chặn', async () => {
      await context.http().get('/api/auth/me').expect(401);
    });

    it('token hết hạn bị chặn', async () => {
      const user = await createUser(context);
      const expired = await context.app
        .get(JwtService)
        .signAsync({ sub: user.id, role: user.role }, { expiresIn: -10 });

      await context
        .http()
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expired}`)
        .expect(401);
    });

    it('token ký bằng khóa khác bị chặn', async () => {
      const user = await createUser(context);
      const forged = await new JwtService({ secret: 'khoa-gia-mao' }).signAsync({
        sub: user.id,
        role: Role.TEACHER,
      });

      await context.http().get('/api/auth/me').set('Authorization', `Bearer ${forged}`).expect(401);
    });

    it('token không ký (alg none) bị chặn', async () => {
      const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
      const token = `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: 'x', role: 'TEACHER' })}.`;

      await context.http().get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(401);
    });
  });

  describe('phân quyền', () => {
    it('học viên không dùng được endpoint giáo viên', async () => {
      const student = await createUser(context);
      await context
        .http()
        .post('/api/topics')
        .set('Cookie', student.cookie)
        .send({ name: 'Chủ đề mới' })
        .expect(403);
    });

    it('giáo viên dùng được endpoint giáo viên', async () => {
      const teacher = await createUser(context, Role.TEACHER);
      await context
        .http()
        .post('/api/topics')
        .set('Cookie', teacher.cookie)
        .send({ name: 'Chủ đề mới' })
        .expect(201);
    });
  });

  it('giới hạn theo email kể cả khi mỗi lần đến từ một IP khác', async () => {
    const limited = process.env.AUTH_RATE_LIMIT;
    process.env.AUTH_RATE_LIMIT = '3';
    const fresh = await createTestApp();
    try {
      const attempt = (email: string, ip: string) =>
        fresh
          .http()
          .post('/api/auth/login')
          .set('X-Forwarded-For', ip)
          .send({ email, password: PASSWORD });

      for (let i = 1; i <= 3; i += 1) await attempt('nan-nhan@example.com', `203.0.113.${i}`).expect(401);
      await attempt('NAN-NHAN@example.com', '203.0.113.4').expect(429);
      // Tài khoản khác không bị ảnh hưởng
      await attempt('nguoi-khac@example.com', '203.0.113.5').expect(401);
    } finally {
      process.env.AUTH_RATE_LIMIT = limited;
      await fresh.app.close();
    }
  });

  it('khóa đăng nhập tạm thời sau quá nhiều lần thử', async () => {
    const limited = process.env.AUTH_RATE_LIMIT;
    process.env.AUTH_RATE_LIMIT = '3';
    const fresh = await createTestApp();
    try {
      const attempt = () =>
        fresh
          .http()
          .post('/api/auth/login')
          .send({ email: 'khong-co@example.com', password: PASSWORD });

      for (let i = 0; i < 3; i += 1) await attempt().expect(401);
      await attempt().expect(429);
    } finally {
      process.env.AUTH_RATE_LIMIT = limited;
      await fresh.app.close();
    }
  });
});
