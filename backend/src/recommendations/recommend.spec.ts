import {
  allocateSlots,
  buildReviewSet,
  type Candidate,
  selectWeakTopics,
  targetDifficulty,
  type TopicPerformance,
} from './recommend.js';

const topic = (topicId: string, correct: number, total: number): TopicPerformance => ({
  topicId,
  name: topicId,
  correct,
  total,
  accuracy: (100 * correct) / total,
});

function pool(topicId: string, counts: Partial<Record<Candidate['difficulty'], number>>) {
  return Object.entries(counts).flatMap(([difficulty, count]) =>
    Array.from({ length: count }, (_, index) => ({
      id: `${topicId}-${difficulty}-${index}`,
      topicId,
      difficulty: difficulty as Candidate['difficulty'],
    })),
  );
}

const countByTopic = (questions: Candidate[]) =>
  Object.fromEntries(
    [...new Set(questions.map((question) => question.topicId))].map((id) => [
      id,
      questions.filter((question) => question.topicId === id).length,
    ]),
  );

describe('selectWeakTopics', () => {
  it('lấy tối đa 3 chủ đề sai nhiều nhất và bỏ chủ đề đúng hết', () => {
    const result = selectWeakTopics([
      topic('tot', 9, 10),
      topic('yeu', 2, 10),
      topic('hoan-hao', 10, 10),
      topic('kha', 7, 10),
      topic('trung-binh', 5, 10),
    ]);
    expect(result.map((item) => item.topicId)).toEqual(['yeu', 'trung-binh', 'kha']);
  });

  it('bằng tỷ lệ thì ưu tiên chủ đề có nhiều câu hơn', () => {
    const result = selectWeakTopics([topic('it', 1, 2), topic('nhieu', 5, 10)]);
    expect(result[0].topicId).toBe('nhieu');
  });
});

describe('targetDifficulty', () => {
  it.each([
    [0, 'EASY'],
    [49.9, 'EASY'],
    [50, 'MEDIUM'],
    [74.9, 'MEDIUM'],
    [75, 'HARD'],
  ])('tỷ lệ đúng %d chọn mức %s', (accuracy, expected) => {
    expect(targetDifficulty(accuracy)).toBe(expected);
  });
});

describe('allocateSlots', () => {
  it('chia theo tỷ lệ sai và tổng đúng bằng số câu', () => {
    // Tỷ lệ sai 80, 60, 20: phần chia 5.0, 3.75, 1.25
    const slots = allocateSlots([topic('a', 2, 10), topic('b', 4, 10), topic('c', 8, 10)], 10);
    expect([...slots.values()]).toEqual([5, 4, 1]);
  });

  it('một chủ đề nhận toàn bộ', () => {
    expect(allocateSlots([topic('a', 2, 10)], 10).get('a')).toBe(10);
  });
});

describe('buildReviewSet', () => {
  const topics = [topic('a', 2, 10), topic('b', 4, 10), topic('c', 8, 10)];

  it('tạo đủ 10 câu theo phân bổ', () => {
    const candidates = [...pool('a', { EASY: 8 }), ...pool('b', { MEDIUM: 8 }), ...pool('c', { HARD: 8 })];
    const { questions } = buildReviewSet(topics, candidates);

    expect(questions).toHaveLength(10);
    expect(countByTopic(questions)).toEqual({ a: 5, b: 4, c: 1 });
    expect(new Set(questions.map((question) => question.id)).size).toBe(10);
  });

  it('ưu tiên mức độ phù hợp trước', () => {
    const candidates = pool('a', { HARD: 5, MEDIUM: 5, EASY: 5 });
    const { questions } = buildReviewSet([topic('a', 2, 10)], candidates, 5);

    expect(questions.every((question) => question.difficulty === 'EASY')).toBe(true);
  });

  it('thiếu mức phù hợp thì lấy mức gần nhất', () => {
    const candidates = pool('a', { HARD: 3, MEDIUM: 2 });
    const { questions } = buildReviewSet([topic('a', 2, 10)], candidates, 3);

    expect(questions.map((question) => question.difficulty)).toEqual(['MEDIUM', 'MEDIUM', 'HARD']);
  });

  it('chủ đề yếu thiếu câu thì bù từ chủ đề khác', () => {
    const candidates = [...pool('a', { EASY: 1 }), ...pool('b', { MEDIUM: 3 }), ...pool('khac', { EASY: 9 })];
    const { questions } = buildReviewSet(topics, candidates);

    expect(questions).toHaveLength(10);
    expect(countByTopic(questions)).toEqual({ a: 1, b: 3, khac: 6 });
  });

  it('kho câu ít hơn 10 thì trả hết', () => {
    expect(buildReviewSet(topics, pool('a', { EASY: 4 })).questions).toHaveLength(4);
  });

  it('không có chủ đề yếu thì không tạo bộ', () => {
    const result = buildReviewSet([topic('a', 10, 10)], pool('a', { EASY: 4 }));
    expect(result.questions).toEqual([]);
  });
});
