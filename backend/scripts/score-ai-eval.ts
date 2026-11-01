// Tính điểm trung bình theo cấu hình prompt: npm run ai-eval:score -- <file-csv>
import { readFileSync } from 'node:fs';
import { CRITERIA, scoreEvaluation } from '../src/ai/evaluation.js';

const file = process.argv[2];
if (!file) {
  console.error('Cách dùng: npm run ai-eval:score -- <file-csv>');
  process.exit(1);
}

const { summaries, errors, skipped } = scoreEvaluation(readFileSync(file, 'utf8'));

console.log(['Cấu hình', 'Số mẫu', ...CRITERIA, 'Trung bình'].join(' | '));
for (const item of summaries) {
  console.log(
    [
      item.promptVersion,
      item.count,
      ...CRITERIA.map((name) => item.averages[name]),
      item.overall,
    ].join(' | '),
  );
}
if (errors.length > 0) {
  console.error(`\nBỏ qua ${skipped} mục:`);
  for (const error of errors) console.error(`  ${error}`);
  process.exitCode = 1;
}
