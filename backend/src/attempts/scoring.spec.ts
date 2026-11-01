import { OptionKey } from '../generated/prisma/client.js';
import { estimateScore, gradeAnswers } from './scoring.js';

describe('estimateScore', () => {
  it.each([
    [100, 100, 495],
    [84, 100, 415],
    [50, 100, 250],
    [1, 100, 5],
    [0, 100, 5],
    [7, 10, 345],
    [0, 0, 5],
  ])('%i/%i câu đúng được %i điểm', (correct, total, expected) => {
    expect(estimateScore(correct, total)).toBe(expected);
  });
});

describe('gradeAnswers', () => {
  const questions = [
    { id: 'q1', correctOption: OptionKey.A },
    { id: 'q2', correctOption: OptionKey.B },
    { id: 'q3', correctOption: OptionKey.C },
    { id: 'q4', correctOption: OptionKey.D },
  ];

  it('đếm câu đúng, tính câu sai và câu bỏ trống là sai', () => {
    const selected = new Map<string, OptionKey | null>([
      ['q1', OptionKey.A],
      ['q2', OptionKey.C],
      ['q3', null],
    ]);

    const result = gradeAnswers(questions, selected);

    expect(result.correctCount).toBe(1);
    expect(result.estimatedScore).toBe(125);
    expect(result.graded).toEqual([
      { questionId: 'q1', selectedOption: 'A', isCorrect: true },
      { questionId: 'q2', selectedOption: 'C', isCorrect: false },
      { questionId: 'q3', selectedOption: null, isCorrect: false },
      { questionId: 'q4', selectedOption: null, isCorrect: false },
    ]);
  });
});
