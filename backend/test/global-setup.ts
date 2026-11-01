import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

// Chuyển mọi test sang CSDL test và áp migration trước khi chạy
export default function setup() {
  if (existsSync('.env')) process.loadEnvFile('.env');
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('Thiếu TEST_DATABASE_URL');
  process.env.DATABASE_URL = url;
  process.env.JWT_SECRET = 'test-secret-chi-dung-trong-moi-truong-test';
  process.env.JWT_EXPIRES_IN_SECONDS = '3600';
  process.env.AUTH_RATE_LIMIT = '100000';
  process.env.GLOBAL_RATE_LIMIT = '100000';
  execSync('npx prisma migrate deploy', { stdio: 'pipe', env: process.env });
}
