import type { Difficulty } from '../generated/prisma/client.js';

export const REVIEW_SET_SIZE = 10;
export const MAX_WEAK_TOPICS = 3;

export interface TopicPerformance {
  topicId: string;
  name: string;
  total: number;
  correct: number;
  accuracy: number;
}

export interface Candidate {
  id: string;
  topicId: string;
  difficulty: Difficulty;
}

// Bước 1: chọn các chủ đề có tỷ lệ sai cao nhất, chủ đề làm nhiều câu hơn được ưu tiên khi bằng nhau
export function selectWeakTopics(topics: TopicPerformance[]) {
  return topics
    .filter((topic) => topic.correct < topic.total)
    .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)
    .slice(0, MAX_WEAK_TOPICS);
}

// Bước 2: mức độ phù hợp theo năng lực hiện tại, yếu thì củng cố bằng câu dễ trước
export function targetDifficulty(accuracy: number): Difficulty {
  if (accuracy < 50) return 'EASY';
  if (accuracy < 75) return 'MEDIUM';
  return 'HARD';
}

const PREFERENCE: Record<Difficulty, Difficulty[]> = {
  EASY: ['EASY', 'MEDIUM', 'HARD'],
  MEDIUM: ['MEDIUM', 'EASY', 'HARD'],
  HARD: ['HARD', 'MEDIUM', 'EASY'],
};

// Bước 3: chia số câu theo tỷ lệ sai bằng phương pháp phần dư lớn nhất, tổng luôn bằng `slots`
export function allocateSlots(weakTopics: TopicPerformance[], slots: number) {
  const weights = weakTopics.map((topic) => 100 - topic.accuracy);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const shares = weights.map((weight) => (slots * weight) / totalWeight);
  const allocation = shares.map(Math.floor);

  const byRemainder = shares
    .map((share, index) => ({ index, remainder: share - Math.floor(share) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  const leftover = slots - allocation.reduce((sum, value) => sum + value, 0);
  for (let i = 0; i < leftover; i += 1) allocation[byRemainder[i].index] += 1;

  return new Map(weakTopics.map((topic, index) => [topic.topicId, allocation[index]]));
}

function takeFrom(pool: Candidate[], topic: TopicPerformance, count: number, chosen: Candidate[]) {
  for (const difficulty of PREFERENCE[targetDifficulty(topic.accuracy)]) {
    for (const candidate of pool) {
      if (count === 0) return;
      if (candidate.topicId !== topic.topicId || candidate.difficulty !== difficulty) continue;
      if (chosen.includes(candidate)) continue;
      chosen.push(candidate);
      count -= 1;
    }
  }
}

// Bước 4: chọn câu chưa làm. `candidates` cần được xáo trước để mỗi lần tạo bộ khác nhau.
// Thiếu câu ở chủ đề yếu thì lấy thêm từ chủ đề yếu khác, sau đó từ các chủ đề còn lại.
export function buildReviewSet(
  topics: TopicPerformance[],
  candidates: Candidate[],
  size = REVIEW_SET_SIZE,
) {
  const weakTopics = selectWeakTopics(topics);
  if (weakTopics.length === 0) return { weakTopics, questions: [] as Candidate[] };

  const slots = allocateSlots(weakTopics, size);
  const chosen: Candidate[] = [];
  for (const topic of weakTopics) takeFrom(candidates, topic, slots.get(topic.topicId) ?? 0, chosen);

  for (const topic of weakTopics) takeFrom(candidates, topic, size - chosen.length, chosen);
  for (const candidate of candidates) {
    if (chosen.length >= size) break;
    if (!chosen.includes(candidate)) chosen.push(candidate);
  }
  return { weakTopics, questions: chosen };
}
