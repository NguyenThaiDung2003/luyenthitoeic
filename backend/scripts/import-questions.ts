// Nạp câu hỏi từ file JSON: npm run import:questions -- <đường-dẫn-file>
import { PrismaPg } from '@prisma/adapter-pg';
import { existsSync, readFileSync } from 'node:fs';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { parseImportFile } from '../src/questions/import-validator.js';

if (existsSync('.env')) process.loadEnvFile('.env');

const filePath = process.argv[2];
if (!filePath) {
  console.error('Cách dùng: npm run import:questions -- <đường-dẫn-file>');
  process.exit(1);
}

const { items, errors } = parseImportFile(readFileSync(filePath, 'utf8').replace(/^﻿/, ''));
if (errors.length > 0) {
  console.error(`File không hợp lệ, chưa nạp câu nào. Có ${errors.length} lỗi:`);
  for (const error of errors) console.error(`  Dòng ${error.line}: ${error.message}`);
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Giao dịch toàn bộ: lỗi giữa chừng thì không nạp câu nào
const { created, skipped } = await prisma.$transaction(async (tx) => {
  let created = 0;
  let skipped = 0;
  for (const item of items) {
    const topic = await tx.topic.upsert({
      where: { name: item.topic.trim() },
      update: {},
      create: { name: item.topic.trim() },
    });

    let passageId: string | null = null;
    if (item.passage) {
      const passage =
        (await tx.passage.findFirst({
          where: { title: item.passage.title, content: item.passage.content },
        })) ??
        (await tx.passage.create({
          data: { ...item.passage, source: item.source, license: item.license },
        }));
      passageId = passage.id;
    }

    // Bỏ qua câu đã có để chạy lại script không tạo bản trùng
    const existing = await tx.question.findFirst({
      where: { content: item.question, passageId, archivedAt: null },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    await tx.question.create({
      data: {
        part: item.part,
        content: item.question,
        options: item.options,
        correctOption: item.correct,
        difficulty: item.difficulty,
        explanation: item.explanation,
        source: item.source,
        license: item.license,
        topicId: topic.id,
        passageId,
      },
    });
    created += 1;
  }
  return { created, skipped };
});

console.log(`Đã nạp ${created} câu, bỏ qua ${skipped} câu đã có.`);
await prisma.$disconnect();
