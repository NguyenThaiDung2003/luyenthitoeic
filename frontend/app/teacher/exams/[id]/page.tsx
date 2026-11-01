"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, ErrorBanner, PageHeader, secondaryButtonClass } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { DIFFICULTY_LABELS, OPTION_KEYS, PART_LABELS, type Question } from "@/lib/types";

interface ExamDetail {
  id: string;
  title: string;
  description: string | null;
  status: "DRAFT" | "PUBLISHED";
  durationMinutes: number;
  questions: Question[];
}

export default function TeacherExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<ExamDetail>(`/exams/${id}`)
      .then(setExam)
      .catch((caught: unknown) =>
        setError(caught instanceof ApiError ? caught.message : "Không tải được đề thi."),
      );
  }, [id]);

  return (
    <>
      <PageHeader
        title={exam?.title ?? "Đề thi"}
        description={exam ? `${exam.questions.length} câu · ${exam.durationMinutes} phút` : undefined}
        action={<Link href="/teacher/exams" className={secondaryButtonClass}>Quay lại</Link>}
      />
      {error && <ErrorBanner message={error} />}
      <div className="flex flex-col gap-3">
        {exam?.questions.map((question, index) => (
          <Card key={question.id}>
            <p className="mb-2 text-body-subtle text-on-surface-variant">
              Câu {index + 1} · {PART_LABELS[question.part]} · {question.topic.name} · {DIFFICULTY_LABELS[question.difficulty]}
            </p>
            <p className="font-semibold">{question.content}</p>
            <ol className="mt-2 flex flex-col gap-1">
              {question.options.map((option, optionIndex) => (
                <li key={OPTION_KEYS[optionIndex]} className={OPTION_KEYS[optionIndex] === question.correctOption ? "font-semibold text-on-tertiary-fixed-variant" : ""}>
                  {OPTION_KEYS[optionIndex]}. {option}
                </li>
              ))}
            </ol>
          </Card>
        ))}
      </div>
    </>
  );
}
