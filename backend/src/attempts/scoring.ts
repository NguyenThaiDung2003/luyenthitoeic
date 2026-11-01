import type { OptionKey } from '../generated/prisma/client.js';

const MAX_READING_SCORE = 495;
const MIN_READING_SCORE = 5;
const SCORE_STEP = 5;

// Quy đổi tuyến tính, làm tròn theo bước 5 như thang TOEIC. Đây là ước lượng, không phải bảng điểm ETS.
export function estimateScore(correctCount: number, totalQuestions: number) {
  if (totalQuestions === 0) return MIN_READING_SCORE;
  const raw = (MAX_READING_SCORE * correctCount) / totalQuestions;
  return Math.max(MIN_READING_SCORE, Math.round(raw / SCORE_STEP) * SCORE_STEP);
}

export interface GradableQuestion {
  id: string;
  correctOption: OptionKey;
}

// Câu bỏ trống được tính là sai
export function gradeAnswers(
  questions: GradableQuestion[],
  selected: Map<string, OptionKey | null>,
) {
  const graded = questions.map((question) => ({
    questionId: question.id,
    selectedOption: selected.get(question.id) ?? null,
    isCorrect: selected.get(question.id) === question.correctOption,
  }));
  const correctCount = graded.filter((item) => item.isCorrect).length;
  return { graded, correctCount, estimatedScore: estimateScore(correctCount, questions.length) };
}
