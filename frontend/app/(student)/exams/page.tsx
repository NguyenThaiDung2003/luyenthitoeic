"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icon";
import { Card, EmptyState, ErrorBanner, fieldClass, PageHeader, primaryButtonClass, secondaryButtonClass } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { type ExamSummary, type Part, PART_LABELS } from "@/lib/types";

type DoneFilter = "all" | "todo" | "done";

export default function ExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<ExamSummary[] | null>(null);
  const [part, setPart] = useState<Part | "">("");
  const [done, setDone] = useState<DoneFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);

  useEffect(() => {
    api<ExamSummary[]>("/exams")
      .then(setExams)
      .catch((caught: unknown) =>
        setError(caught instanceof ApiError ? caught.message : "Không tải được danh sách đề."),
      );
  }, []);

  const visible = useMemo(
    () =>
      (exams ?? []).filter((exam) => {
        const finished = exam.latestAttempt?.status === "SUBMITTED";
        if (part && !exam.parts.includes(part)) return false;
        if (done === "todo") return !finished;
        if (done === "done") return finished;
        return true;
      }),
    [exams, part, done],
  );

  const start = async (examId: string) => {
    setStartingId(examId);
    try {
      const attempt = await api<{ id: string }>(`/exams/${examId}/attempts`, { method: "POST" });
      router.push(`/attempts/${attempt.id}`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không bắt đầu được bài thi.");
      setStartingId(null);
    }
  };

  return (
    <>
      <PageHeader title="Đề luyện tập" description="Làm bài trong điều kiện bấm giờ như phòng thi thật." />
      {error && <ErrorBanner message={error} />}

      <div className="mb-4 flex flex-wrap gap-3">
        <select aria-label="Lọc theo Part" value={part} onChange={(event) => setPart(event.target.value as Part | "")} className={`${fieldClass} w-auto!`}>
          <option value="">Tất cả các Part</option>
          {Object.entries(PART_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select aria-label="Lọc theo trạng thái" value={done} onChange={(event) => setDone(event.target.value as DoneFilter)} className={`${fieldClass} w-auto!`}>
          <option value="all">Tất cả</option>
          <option value="todo">Chưa làm</option>
          <option value="done">Đã làm</option>
        </select>
      </div>

      {exams && visible.length === 0 ? (
        <Card><EmptyState icon="assignment" title="Không có đề phù hợp" /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((exam) => {
            const attempt = exam.latestAttempt;
            const inProgress = attempt?.status === "IN_PROGRESS";
            return (
              <Card key={exam.id} className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-1">
                  {exam.parts.map((item) => (
                    <span key={item} className="rounded-full bg-surface-container px-2 py-0.5 font-label text-label-sm font-semibold text-primary">
                      {PART_LABELS[item]}
                    </span>
                  ))}
                </div>
                <h2 className="text-headline-sm font-semibold">{exam.title}</h2>
                {exam.description && <p className="text-body-subtle text-on-surface-variant">{exam.description}</p>}
                <p className="mt-auto flex items-center gap-3 text-body-subtle text-on-surface-variant">
                  <span className="flex items-center gap-1"><Icon name="help" /> {exam.questionCount} câu</span>
                  <span className="flex items-center gap-1"><Icon name="timer" /> {exam.durationMinutes} phút</span>
                </p>
                {attempt?.status === "SUBMITTED" && (
                  <p className="text-body-subtle font-semibold text-primary">Lần gần nhất: {attempt.estimatedScore}/495 (ước lượng)</p>
                )}
                <div className="flex gap-2">
                  <button type="button" disabled={startingId === exam.id} onClick={() => void start(exam.id)} className={`${primaryButtonClass} flex-1`}>
                    {inProgress ? "Tiếp tục làm" : attempt ? "Làm lại" : "Bắt đầu làm bài"}
                  </button>
                  {attempt?.status === "SUBMITTED" && (
                    <Link href={`/attempts/${attempt.id}/result`} className={secondaryButtonClass}>Xem kết quả</Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
