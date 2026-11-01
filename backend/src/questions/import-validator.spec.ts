import { findItemLines, parseImportFile } from './import-validator.js';

const valid = {
  part: 'PART_5',
  question: 'The report _____ yesterday.',
  options: ['arrive', 'arrived', 'arriving', 'arrives'],
  correct: 'B',
  topic: 'Thì của động từ',
  difficulty: 'EASY',
  explanation: 'Có yesterday nên dùng quá khứ đơn.',
  source: 'Tự biên soạn',
  license: 'CC0',
};

const toFile = (items: unknown[]) => JSON.stringify(items, null, 2);

describe('findItemLines', () => {
  it('tìm đúng dòng và không bị dấu ngoặc trong chuỗi đánh lừa', () => {
    const text = '[\n  { "a": "{ [ \\" }" },\n\n  {\n    "b": { "c": 1 }\n  }\n]';
    expect(findItemLines(text)).toEqual([2, 4]);
  });
});

describe('parseImportFile', () => {
  it('nhận dữ liệu hợp lệ', () => {
    const result = parseImportFile(toFile([valid]));
    expect(result.errors).toEqual([]);
    expect(result.items).toHaveLength(1);
  });

  it('báo JSON sai cú pháp', () => {
    const result = parseImportFile('[{ "a": }]');
    expect(result.errors[0].message).toContain('JSON không hợp lệ');
  });

  it('báo lỗi khi gốc không phải mảng', () => {
    expect(parseImportFile('{}').errors[0].message).toContain('mảng');
  });

  it('báo đúng dòng của câu lỗi và không trả câu nào nếu có lỗi', () => {
    const result = parseImportFile(toFile([valid, { ...valid, correct: 'E' }]));
    const secondItemLine = findItemLines(toFile([valid, valid]))[1];

    expect(result.items).toEqual([]);
    expect(result.errors).toEqual([
      { line: secondItemLine, message: 'câu 2: "correct" phải là A, B, C hoặc D' },
    ]);
  });

  it('gom nhiều lỗi của một câu', () => {
    const result = parseImportFile(
      toFile([{ ...valid, options: ['a', 'b'], difficulty: 'X', source: '' }]),
    );
    expect(result.errors.map((error) => error.message)).toEqual([
      'câu 1: thiếu trường "source"',
      'câu 1: "difficulty" phải là EASY, MEDIUM hoặc HARD',
      'câu 1: "options" phải có đúng 4 lựa chọn không rỗng',
    ]);
  });

  it('từ chối lựa chọn trùng', () => {
    const result = parseImportFile(toFile([{ ...valid, options: ['a', 'a', 'b', 'c'] }]));
    expect(result.errors[0].message).toContain('trùng');
  });

  it('bắt buộc passage với Part 7 và cấm với Part 5', () => {
    const missing = parseImportFile(toFile([{ ...valid, part: 'PART_7' }]));
    const extra = parseImportFile(toFile([{ ...valid, passage: { title: 't', content: 'c' } }]));

    expect(missing.errors[0].message).toContain('cần "passage"');
    expect(extra.errors[0].message).toContain('không có "passage"');
  });
});
