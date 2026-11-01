// Xuất mẫu ngẫu nhiên để chấm tay: npm run ai-eval:export -- 60
import { PrismaPg } from '@prisma/adapter-pg';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { EVAL_COLUMNS, toCsv } from '../src/ai/evaluation.js';
import type { Explanation } from '../src/ai/explanation.schema.js';
import { pickRandom } from '../src/exams/pick-random.js';
import { PrismaClient } from '../src/generated/prisma/client.js';

if (existsSync('.env')) process.loadEnvFile('.env');

const MIN_SAMPLE = 50;
const MAX_SAMPLE = 100;
const requested = Number(process.argv[2] ?? MAX_SAMPLE);
if (!Number.isInteger(requested) || requested < MIN_SAMPLE || requested > MAX_SAMPLE) {
  console.error(`Số mẫu phải từ ${MIN_SAMPLE} đến ${MAX_SAMPLE}`);
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const all = await prisma.aiExplanation.findMany({ include: { question: true } });
if (all.length < MIN_SAMPLE) {
  console.error(`CSDL mới có ${all.length} lời giải thích, cần ít nhất ${MIN_SAMPLE}.`);
  await prisma.$disconnect();
  process.exit(1);
}

const rows = pickRandom(all, requested).map((item) => {
  const content = item.content as unknown as Explanation;
  return {
    explanation_id: item.id,
    prompt_version: item.promptVersion,
    cau_hoi: item.question.content,
    dap_an_chon: item.selectedOption,
    dap_an_dung: item.question.correctOption,
    loi_giai_thich: [
      `Vì sao đúng: ${content.whyCorrect}`,
      `Vì sao sai: ${content.whyWrong}`,
      `Điểm cần nhớ: ${content.keyPoint}`,
      `Ví dụ: ${content.similarExample}`,
    ].join('\n'),
  };
});

const dir = join('..', 'data', 'ai-eval');
mkdirSync(dir, { recursive: true });
const file = join(dir, `danh-gia-${new Date().toISOString().slice(0, 10)}.csv`);
writeFileSync(file, toCsv(rows, EVAL_COLUMNS));
console.log(`Đã xuất ${rows.length} mẫu ra ${file}. Chấm các cột cuối theo thang 1-5.`);
await prisma.$disconnect();
