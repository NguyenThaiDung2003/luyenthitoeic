// Chạy toàn bộ dự án bằng một lệnh: npm run dev
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const isWindows = process.platform === 'win32';

function run(command, cwd = root) {
  console.log(`\n> ${command}`);
  const result = spawnSync(command, { cwd, stdio: 'inherit', shell: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Tạo file .env từ mẫu; khóa JWT được sinh ngẫu nhiên, không dùng giá trị cố định
function ensureEnv(app) {
  const target = join(root, app, '.env');
  if (existsSync(target)) return;
  copyFileSync(join(root, app, '.env.example'), target);
  const content = readFileSync(target, 'utf8').replace(
    'JWT_SECRET=change-me',
    `JWT_SECRET=${randomBytes(32).toString('hex')}`,
  );
  writeFileSync(target, content);
}

for (const app of ['backend', 'frontend']) {
  ensureEnv(app);
  if (!existsSync(join(root, app, 'node_modules'))) run('npm install', join(root, app));
}

run('docker compose up -d --wait');
run('npx prisma migrate deploy', join(root, 'backend'));
run('npm run seed', join(root, 'backend'));

const children = ['backend', 'frontend'].map((app) =>
  spawn('npm run dev', { cwd: join(root, app), stdio: 'inherit', shell: true }),
);

// Dừng cả hai tiến trình khi một tiến trình thoát hoặc khi nhấn Ctrl+C
function stopAll() {
  for (const child of children) {
    if (child.exitCode !== null) continue;
    if (isWindows) spawnSync(`taskkill /pid ${child.pid} /T /F`, { shell: true, stdio: 'ignore' });
    else child.kill('SIGTERM');
  }
}

for (const child of children) {
  child.on('exit', () => {
    stopAll();
    process.exitCode = child.exitCode ?? 0;
  });
}
process.on('SIGINT', stopAll);
process.on('SIGTERM', stopAll);
