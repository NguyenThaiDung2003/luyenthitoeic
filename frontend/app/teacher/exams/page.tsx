"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { Card, EmptyState, ErrorBanner, PageHeader, primaryButtonClass, secondaryButtonClass } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { ExamSummary } from "@/lib/types";

export default function TeacherExamsPage() {
  const [exams, setExams] = useState<ExamSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setExams(await api<ExamSummary[]>("/exams"));
  }, []);

  const run = useCallback(
    async (action: () => Promise<unknown>) => {
      setError(null);
      try {
        await action();
        await load();
      } catch (caught) {
        setError(caught instanceof ApiError ? caught.message : "Không thực hiện được thao tác.");
      }
    },
    [load],
  );

  useEffect(() => {
    api<ExamSummary[]>("/exams")
      .then(setExams)
      .catch((caught: unknown) =>
        setError(caught instanceof ApiError ? caught.message : "Không tải được danh sách đề."),
      );
  }, []);

  return (
    <>
      <PageHeader
        title="Tạo đề & Đề thi"
        action={
          <Link href="/teacher/exams/new" className={primaryButtonClass}>
            <Icon name="add_circle" /> Tạo đề mới
          </Link>
        }
      />
      {error && <ErrorBanner message={error} />}
      <Card className="p-0!">
        {exams?.length === 0 ? (
          <EmptyState icon="assignment_add" title="Chưa có đề thi" />
        ) : (
          <ul>
            {exams?.map((exam) => (
              <li key={exam.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-container p-4 first:border-t-0">
                <div className="min-w-0">
                  <Link href={`/teacher/exams/${exam.id}`} className="font-semibold text-primary hover:underline">{exam.title}</Link>
                  <p className="text-body-subtle text-on-surface-variant">
                    {exam.questionCount} câu · {exam.durationMinutes} phút · {exam.attemptCount ?? 0} lượt làm
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 font-label text-label-sm font-semibold ${exam.status === "PUBLISHED" ? "bg-tertiary-fixed text-on-tertiary-fixed-variant" : "bg-surface-container text-on-surface-variant"}`}>
                    {exam.status === "PUBLISHED" ? "Đã xuất bản" : "Bản nháp"}
                  </span>
                  {exam.status === "DRAFT" && (
                    <button type="button" onClick={() => void run(() => api(`/exams/${exam.id}/publish`, { method: "POST" }))} className={primaryButtonClass}>
                      Xuất bản
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Xóa đề "${exam.title}"?`)) {
                        void run(() => api(`/exams/${exam.id}`, { method: "DELETE" }));
                      }
                    }}
                    className={secondaryButtonClass}
                  >
                    Xóa
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
