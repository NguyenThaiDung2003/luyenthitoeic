"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ResultQuestions } from "@/components/result-questions";
import { AccuracyBar, Card, ErrorBanner, PageHeader, primaryButtonClass, secondaryButtonClass, StatCard } from "@/components/ui";
import { formatDuration, percent } from "@/lib/format";
import { api, ApiError } from "@/lib/api";
import { type AttemptResult, type Part, PART_LABELS } from "@/lib/types";

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<AttemptResult>(`/attempts/${id}/result`)
      .then(setResult)
      .catch((caught: unknown) =>
        setError(caught instanceof ApiError ? caught.message : "Không tải được kết quả."),
      );
  }, [id]);

  if (error) return <ErrorBanner message={error} />;
  if (!result) return <p className="text-on-surface-variant">Đang tải kết quả...</p>;

  const wrong = result.totalQuestions - result.correctCount;
  const seconds = (new Date(result.submittedAt).getTime() - new Date(result.startedAt).getTime()) / 1000;

  return (
    <>
      <PageHeader
        title={result.exam.title}
        description={result.autoSubmitted ? "Bài được tự động nộp khi hết giờ." : "Đã nộp thành công."}
        action={
          <div className="flex gap-2">
            <Link href="/exams" className={secondaryButtonClass}>Đề luyện tập</Link>
            <Link href="/review" className={primaryButtonClass}>Ôn tập gợi ý</Link>
          </div>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Điểm Reading ước lượng" value={`${result.estimatedScore}/495`} hint="Quy đổi tuyến tính, không phải điểm chính thức" />
        <StatCard label="Độ chính xác" value={`${percent(result.correctCount, result.totalQuestions)}%`} hint={`${result.correctCount}/${result.totalQuestions} câu đúng`} />
        <StatCard label="Sai hoặc bỏ qua" value={`${wrong} câu`} />
        <StatCard label="Thời gian làm bài" value={formatDuration(seconds)} hint={`Quy định ${result.exam.durationMinutes} phút`} />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-headline-sm font-semibold">Theo Part</h2>
          <GroupList groups={result.byPart.map((group) => ({ ...group, key: PART_LABELS[group.key as Part] }))} />
        </Card>
        <Card>
          <h2 className="mb-3 text-headline-sm font-semibold">Theo chủ đề</h2>
          <GroupList groups={result.byTopic} />
        </Card>
      </div>

      <ResultQuestions attemptId={result.id} questions={result.questions} />
    </>
  );
}

function GroupList({ groups }: { groups: { key: string; correct: number; total: number }[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {groups.map((group) => (
        <li key={group.key}>
          <div className="mb-1 flex justify-between gap-2 text-body-subtle">
            <span>{group.key}</span>
            <span className="whitespace-nowrap font-semibold">
              {group.correct}/{group.total} ({percent(group.correct, group.total)}%)
            </span>
          </div>
          <AccuracyBar value={percent(group.correct, group.total)} label={group.key} />
        </li>
      ))}
    </ul>
  );
}
