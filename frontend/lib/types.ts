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

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
