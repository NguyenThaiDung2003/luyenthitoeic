export const MAX_EXPLANATION_WORDS = 200;

const FIELDS = ['whyCorrect', 'whyWrong', 'keyPoint', 'similarExample'] as const;

export type Explanation = Record<(typeof FIELDS)[number], string>;

export const EXPLANATION_JSON_SCHEMA = {
  type: 'object',
  properties: Object.fromEntries(FIELDS.map((field) => [field, { type: 'string' }])),
  required: FIELDS,
};

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

// Yêu cầu khoảng 150 từ, ngưỡng 200 chừa khoảng dung sai cho mô hình.
// Mô hình có thể trả sai cấu trúc nên phải kiểm tra lại, không tin đầu ra.
export function parseExplanation(text: string): Explanation | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null) return null;

  const record = data as Record<string, unknown>;
  const values = FIELDS.map((field) => record[field]);
  if (!values.every((value) => typeof value === 'string' && value.trim().length > 0)) return null;

  const explanation = Object.fromEntries(
    FIELDS.map((field) => [field, (record[field] as string).trim()]),
  ) as Explanation;
  const words = countWords(Object.values(explanation).join(' '));
  return words <= MAX_EXPLANATION_WORDS ? explanation : null;
}
