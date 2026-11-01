import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { EXPLANATION_JSON_SCHEMA, parseExplanation } from './explanation.schema.js';
import { GeminiClient, GeminiError } from './gemini.client.js';

export const MAX_GENERATE_TRIES = 2;

export interface ExplanationInput {
  part: string;
  topic: string;
  question: string;
  options: string[];
  correctOption: string;
  selectedOption: string;
  passage: { title: string; content: string } | null;
}

export function defaultPromptVersion() {
  return process.env.AI_PROMPT_VERSION ?? 'explanation-v1';
}

// Phiên bản prompt chỉ gồm chữ thường, số và gạch nối nên không thể đọc tệp ngoài thư mục prompts
export function loadPrompt(version: string) {
  if (!/^[a-z0-9-]+$/.test(version)) throw new Error('AI_PROMPT_VERSION không hợp lệ');
  return readFileSync(join(process.cwd(), 'prompts', `${version}.md`), 'utf8');
}

export function buildPrompt(template: string, input: ExplanationInput) {
  return `${template.trim()}\n\nDữ liệu:\n\`\`\`json\n${JSON.stringify(input, null, 2)}\n\`\`\``;
}

// Dùng chung cho API và script đánh giá. Thử lại khi đầu ra sai định dạng vì mô hình không ổn định.
export async function requestExplanation(
  client: GeminiClient,
  version: string,
  input: ExplanationInput,
) {
  const prompt = buildPrompt(loadPrompt(version), input);
  for (let attempt = 0; attempt < MAX_GENERATE_TRIES; attempt += 1) {
    const content = parseExplanation(await client.generateJson(prompt, EXPLANATION_JSON_SCHEMA));
    if (content) return content;
  }
  throw new GeminiError('unavailable');
}
