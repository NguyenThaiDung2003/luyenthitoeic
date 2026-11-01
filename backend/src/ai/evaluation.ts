export const CRITERIA = ['dung_noi_dung', 'de_hieu', 'huu_ich'] as const;

export const EVAL_COLUMNS = [
  'explanation_id',
  'prompt_version',
  'cau_hoi',
  'dap_an_chon',
  'dap_an_dung',
  'loi_giai_thich',
  ...CRITERIA,
] as const;

const escapeCell = (value: string) =>
  /[",\n\r;]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;

// Thêm BOM để Excel đọc đúng tiếng Việt
export function toCsv(rows: Record<string, string>[], columns: readonly string[]) {
  const lines = [columns.join(',')];
  for (const row of rows) {
    lines.push(columns.map((column) => escapeCell(row[column] ?? '')).join(','));
  }
  return `﻿${lines.join('\r\n')}\r\n`;
}

// Excel theo vùng Việt Nam có thể lưu bằng dấu chấm phẩy nên dò dấu phân cách từ dòng tiêu đề
export function parseCsv(input: string) {
  const text = input.replace(/^﻿/, '');
  const delimiter = text.split(/\r?\n/, 1)[0].includes(';') ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char !== '"') cell += char;
      else if (text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else quoted = false;
    } else if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (cell || row.length) rows.push([...row, cell]);
  return rows.filter((cells) => cells.some((value) => value.trim()));
}

interface Summary {
  promptVersion: string;
  count: number;
  averages: Record<string, number>;
  overall: number;
}

const round = (value: number) => Math.round(value * 100) / 100;

// Dòng chấm thiếu hoặc ngoài thang bị loại khỏi điểm trung bình và được báo lại để sửa
export function scoreEvaluation(text: string) {
  const [header, ...rows] = parseCsv(text);
  const indexOf = (name: string) => header?.indexOf(name) ?? -1;
  const missing = ['prompt_version', ...CRITERIA].filter((name) => indexOf(name) < 0);
  if (missing.length > 0) {
    return { summaries: [] as Summary[], errors: [`Thiếu cột: ${missing.join(', ')}`], skipped: rows.length };
  }

  const groups = new Map<string, number[][]>();
  const errors: string[] = [];
  rows.forEach((cells, index) => {
    const scores = CRITERIA.map((name) => Number((cells[indexOf(name)] ?? '').trim() || NaN));
    if (!scores.every((score) => Number.isInteger(score) && score >= 1 && score <= 5)) {
      errors.push(`Mục ${index + 1}: điểm phải là số nguyên từ 1 đến 5`);
      return;
    }
    const version = cells[indexOf('prompt_version')];
    groups.set(version, [...(groups.get(version) ?? []), scores]);
  });

  const summaries = [...groups.entries()].map(([promptVersion, scores]): Summary => {
    const averages = Object.fromEntries(
      CRITERIA.map((name, column) => [
        name,
        round(scores.reduce((sum, row) => sum + row[column], 0) / scores.length),
      ]),
    );
    const overall = round(scores.flat().reduce((sum, value) => sum + value, 0) / scores.flat().length);
    return { promptVersion, count: scores.length, averages, overall };
  });
  return { summaries, errors, skipped: errors.length };
}
