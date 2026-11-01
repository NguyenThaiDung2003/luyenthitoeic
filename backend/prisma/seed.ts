import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import { existsSync } from 'node:fs';
import { PrismaClient, Role } from '../src/generated/prisma/client.js';

if (existsSync('.env')) process.loadEnvFile('.env');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const TOPICS = [
  'Thì của động từ',
  'Từ loại',
  'Đại từ',
  'Giới từ',
  'Liên từ',
  'Mệnh đề quan hệ',
  'Từ vựng',
  'Câu hỏi chi tiết',
  'Câu hỏi suy luận',
];

async function main() {
  for (const name of TOPICS) {
    await prisma.topic.upsert({ where: { name }, update: {}, create: { name } });
  }

  const email = process.env.SEED_TEACHER_EMAIL;
  const password = process.env.SEED_TEACHER_PASSWORD;
  if (!email || !password) {
    throw new Error('Thiếu SEED_TEACHER_EMAIL hoặc SEED_TEACHER_PASSWORD');
  }
  // Giữ nguyên mật khẩu nếu tài khoản đã tồn tại
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: await bcrypt.hash(password, 12),
      fullName: 'Giáo viên',
      role: Role.TEACHER,
    },
  });
}

await main();
await prisma.$disconnect();
