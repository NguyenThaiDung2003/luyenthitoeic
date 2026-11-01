const PARTS = ['PART_5', 'PART_6', 'PART_7'] as const;
const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const;
const OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;

export interface ImportPassage {
  title: string;
  content: string;
}

export interface ImportQuestion {
  part: (typeof PARTS)[number];
  question: string;
  options: string[];
  correct: (typeof OPTION_KEYS)[number];
  topic: string;
  difficulty: (typeof DIFFICULTIES)[number];
  explanation: string;
  source: string;
  license: string;
  passage?: ImportPassage;
}

export interface ImportError {
  line: number;
  message: string;
}

// Tìm dòng bắt đầu của từng phần tử trong mảng JSON gốc, bỏ qua ký tự nằm trong chuỗi
export function findItemLines(text: string) {
  const lines: number[] = [];
  let line = 1;
  let depth = 0;
  let inString = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '\n') line += 1;
    if (inString) {
      if (char === '\\') i += 1;
      else if (char === '"') inString = false;
    } else if (char === '"') {
      inString = true;
    } else if (char === '{' || char === '[') {
      if (depth === 1 && char === '{') lines.push(line);
      depth += 1;
    } else if (char === '}' || char === ']') {
      depth -= 1;
    }
  }
  return lines;
}

const isText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

function validateItem(item: Record<string, unknown>) {
  const errors: string[] = [];
  for (const field of ['question', 'topic', 'explanation', 'source', 'license']) {
    if (!isText(item[field])) errors.push(`thiếu trường "${field}"`);
  }
  if (!PARTS.includes(item.part as never)) errors.push('"part" phải là PART_5, PART_6 hoặc PART_7');
  if (!DIFFICULTIES.includes(item.difficulty as never)) {
    errors.push('"difficulty" phải là EASY, MEDIUM hoặc HARD');
  }
  if (!OPTION_KEYS.includes(item.correct as never)) {
    errors.push('"correct" phải là A, B, C hoặc D');
  }
  if (
    !Array.isArray(item.options) ||
    item.options.length !== 4 ||
    !item.options.every((option) => isText(option))
  ) {
    errors.push('"options" phải có đúng 4 lựa chọn không rỗng');
  } else if (new Set(item.options).size !== 4) {
    errors.push('"options" có lựa chọn trùng nhau');
  }

  const passage = item.passage as Partial<ImportPassage> | undefined;
  if (item.part === 'PART_5' && passage) errors.push('câu Part 5 không có "passage"');
  if (item.part === 'PART_6' || item.part === 'PART_7') {
    if (!isText(passage?.title) || !isText(passage?.content)) {
      errors.push('câu Part 6 và Part 7 cần "passage" có "title" và "content"');
    }
  }
  return errors;
}

// Kiểm tra toàn bộ file, gom mọi lỗi kèm số dòng để sửa một lần
export function parseImportFile(text: string) {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (error) {
    return {
      items: [],
      errors: [{ line: 1, message: `JSON không hợp lệ: ${(error as Error).message}` }],
    };
  }
  if (!Array.isArray(data)) {
    return { items: [], errors: [{ line: 1, message: 'File phải là một mảng JSON' }] };
  }

  const lines = findItemLines(text);
  const errors: ImportError[] = [];
  data.forEach((item: unknown, index) => {
    const line = lines[index] ?? 1;
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      errors.push({ line, message: `câu ${index + 1}: phải là một đối tượng` });
      return;
    }
    for (const message of validateItem(item as Record<string, unknown>)) {
      errors.push({ line, message: `câu ${index + 1}: ${message}` });
    }
  });
  return { items: errors.length ? [] : (data as ImportQuestion[]), errors };
}
