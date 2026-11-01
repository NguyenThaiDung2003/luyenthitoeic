// Sinh lời giải thích cho mọi đáp án sai: npm run ai-eval:generate -- explanation-v2
import { PrismaPg } from '@prisma/adapter-pg';
import { existsSync } from 'node:fs';
import { GeminiClient, GeminiError } from '../src/ai/gemini.client.js';
import { defaultPromptVersion, requestExplanation } from '../src/ai/request-explanation.js';
import { PrismaClient, type OptionKey } from '../src/generated/prisma/client.js';

if (existsSync('.env')) process.loadEnvFile('.env');

const OPTION_KEYS: OptionKey[] = ['A', 'B', 'C', 'D'];
// Giãn cách các lần gọi để không vượt hạn mức của gói miễn phí
const DELAY_MS = Number(process.env.AI_EVAL_DELAY_MS ?? 5000);

const version = process.argv[2] ?? defaultPromptVersion();
const client = new GeminiClient();
if (!client.isConfigured) {
  console.error('Thiếu GEMINI_API_KEY hoặc GEMINI_MODEL');
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const questions = await prisma.question.findMany({
  where: { archivedAt: null },
  include: {
    topic: { select: { name: true } },
    passage: { select: { title: true, content: true } },
  },
});

let created = 0;
let skipped = 0;
let failed = 0;
let quotaExceeded = false;
questions: for (const question of questions) {
  for (const selectedOption of OPTION_KEYS.filter((key) => key !== question.correctOption)) {
    const key = { questionId: question.id, selectedOption, promptVersion: version };
    const existing = await prisma.aiExplanation.findUnique({
      where: { questionId_selectedOption_promptVersion: key },
    });
    if (existing) {
      skipped += 1;
      continue;
    }
    try {
      const content = await requestExplanation(client, version, {
        part: question.part,
        topic: question.topic.name,
        question: question.content,
        options: question.options,
        correctOption: question.correctOption,
        selectedOption,
        passage: question.passage,
      });
      await prisma.aiExplanation.create({ data: { ...key, content, model: client.model } });
      created += 1;
    } catch (error) {
      // Hết hạn mức thì dừng; chạy lại sau sẽ bỏ qua các câu đã có
      if (error instanceof GeminiError && error.kind === 'quota_exceeded') {
        quotaExceeded = true;
        break questions;
      }
      failed += 1;
    }
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  }
}

console.log(`${version}: tạo ${created}, đã có ${skipped}, lỗi ${failed}.`);
if (quotaExceeded) console.log('Đã dừng vì hết hạn mức Gemini. Chạy lại sau khi hạn mức được cấp lại.');
await prisma.$disconnect();
process.exitCode = failed > 0 || quotaExceeded ? 1 : 0;
