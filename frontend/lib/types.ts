export type Part = "PART_5" | "PART_6" | "PART_7";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type OptionKey = "A" | "B" | "C" | "D";

export const OPTION_KEYS: OptionKey[] = ["A", "B", "C", "D"];

export const PART_LABELS: Record<Part, string> = {
  PART_5: "Part 5",
  PART_6: "Part 6",
  PART_7: "Part 7",
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  EASY: "Dễ",
  MEDIUM: "Trung bình",
  HARD: "Nâng cao",
};

export interface Topic {
  id: string;
  name: string;
}

export interface Passage {
  id: string;
  title: string;
  content: string;
  source: string;
  license: string;
  _count?: { questions: number };
}

export interface Question {
  id: string;
  part: Part;
  content: string;
  options: string[];
  correctOption: OptionKey;
  difficulty: Difficulty;
  explanation: string | null;
  source: string;
  license: string;
  topicId: string;
  passageId: string | null;
  topic: Topic;
  passage: { id: string; title: string } | null;
}

export interface ExamSummary {
  id: string;
  title: string;
  description: string | null;
  status: "DRAFT" | "PUBLISHED";
  durationMinutes: number;
  questionCount: number;
  parts: Part[];
  attemptCount?: number;
  latestAttempt: {
    id: string;
    status: "IN_PROGRESS" | "SUBMITTED";
    estimatedScore: number | null;
  } | null;
}

export interface ResultQuestion {
  id: string;
  position: number;
  part: Part;
  content: string;
  options: string[];
  correctOption: OptionKey;
  explanation: string | null;
  topic: Topic;
  passage: { id: string; title: string; content: string } | null;
  selectedOption: OptionKey | null;
  isFlagged: boolean;
  isCorrect: boolean;
}

export interface GroupStat {
  key: string;
  correct: number;
  total: number;
}

export interface AttemptResult {
  id: string;
  exam: { id: string; title: string; durationMinutes: number };
  startedAt: string;
  submittedAt: string;
  autoSubmitted: boolean;
  correctCount: number;
  totalQuestions: number;
  estimatedScore: number;
  byPart: GroupStat[];
  byTopic: GroupStat[];
  questions: ResultQuestion[];
}

export interface AttemptListItem {
  id: string;
  examTitle: string;
  examKind: "STANDARD" | "REVIEW";
  status: "IN_PROGRESS" | "SUBMITTED";
  startedAt: string;
  submittedAt: string | null;
  correctCount: number | null;
  totalQuestions: number;
  estimatedScore: number | null;
}

export interface Overview {
  completedExams: number;
  totalQuestions: number;
  correctQuestions: number;
  accuracy: number | null;
  totalMinutes: number;
  latestScore: number | null;
}

export interface TopicStat {
  topicId: string;
  name: string;
  total: number;
  correct: number;
  accuracy: number;
  recentAccuracy: number | null;
}

export interface TrendPoint {
  attemptId: string;
  examTitle: string;
  submittedAt: string;
  estimatedScore: number;
  accuracy: number;
}

export interface Recommendation {
  topicId: string;
  name: string;
  accuracy: number;
  correct: number;
  total: number;
  targetDifficulty: Difficulty;
  plannedQuestions: number;
  unseenQuestions: number;
}

export interface TeacherOverview {
  students: number;
  activeStudents: number;
  submittedAttempts: number;
  averageScore: number | null;
  accuracy: number | null;
}

export interface TeacherTopicStat {
  topicId: string;
  name: string;
  total: number;
  correct: number;
  accuracy: number;
  averageScore: number;
  students: number;
}

export interface HardestQuestion {
  questionId: string;
  content: string;
  part: Part;
  topic: string;
  total: number;
  wrong: number;
  wrongRate: number;
}

export interface StudentAtRisk {
  userId: string;
  fullName: string;
  email: string;
  attempts: number;
  accuracy: number;
  lastSubmittedAt: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
