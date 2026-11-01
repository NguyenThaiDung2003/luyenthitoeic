"use client";

import { useEffect, useState } from "react";
import { AccuracyBar, Card, EmptyState, ErrorBanner, PageHeader, StatCard } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { type HardestQuestion, PART_LABELS, type StudentAtRisk, type TeacherOverview, type TeacherTopicStat } from "@/lib/types";

interface StatsData {
  overview: TeacherOverview;
  topics: TeacherTopicStat[];
  hardest: HardestQuestion[];
  atRisk: StudentAtRisk[];
}

export default function TeacherStatsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api<TeacherOverview>("/teacher/stats/overview"),
      api<TeacherTopicStat[]>("/teacher/stats/topics"),
      api<HardestQuestion[]>("/teacher/stats/hardest-questions"),
      api<StudentAtRisk[]>("/teacher/stats/students-at-risk"),
    ])
      .then(([overview, topics, hardest, atRisk]) => setData({ overview, topics, hardest, atRisk }))
      .catch((caught: unknown) =>
        setError(caught instanceof ApiError ? caught.message : "Không tải được thống kê."),
      );
  }, []);

  return (
    <>
      <PageHeader title="Thống kê kết quả" description="Tổng hợp trên toàn bộ học viên." />
      {error && <ErrorBanner message={error} />}
      {data && (
        <>
          <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Tổng số học viên" value={String(data.overview.students)} hint={`${data.overview.activeStudents} học viên đã nộp bài`} />
            <StatCard label="Bài đã nộp" value={String(data.overview.submittedAttempts)} />
            <StatCard label="Điểm trung bình" value={data.overview.averageScore === null ? "Chưa có" : `${data.overview.averageScore}/495`} hint="Điểm ước lượng" />
            <StatCard label="Độ chính xác chung" value={data.overview.accuracy === null ? "Chưa có" : `${data.overview.accuracy}%`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="mb-3 text-headline-sm font-semibold">Điểm trung bình theo chủ đề</h2>
              {data.topics.length === 0 ? (
                <EmptyState icon="monitoring" title="Chưa có bài nộp" />
              ) : (
                <ul className="flex flex-col gap-3">
                  {data.topics.map((topic) => (
                    <li key={topic.topicId}>
                      <div className="mb-1 flex justify-between gap-2 text-body-subtle">
                        <span>{topic.name}</span>
                        <span className="whitespace-nowrap font-semibold">{topic.averageScore}/495 · {topic.accuracy}%</span>
                      </div>
                      <AccuracyBar value={topic.accuracy} label={topic.name} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <h2 className="mb-1 text-headline-sm font-semibold">Học viên cần hỗ trợ</h2>
              <p className="mb-3 text-body-subtle text-on-surface-variant">Tỷ lệ đúng dưới 50% trong 5 lần nộp gần nhất.</p>
              {data.atRisk.length === 0 ? (
                <EmptyState icon="verified" title="Không có học viên nào dưới ngưỡng" />
              ) : (
                <ul className="flex flex-col gap-2">
                  {data.atRisk.map((student) => (
                    <li key={student.userId} className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-low p-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{student.fullName}</p>
                        <p className="truncate text-body-subtle text-on-surface-variant">{student.email}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-semibold text-error">{student.accuracy}%</p>
                        <p className="text-label-sm text-on-surface-variant">{formatDate(student.lastSubmittedAt)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="lg:col-span-2">
              <h2 className="mb-3 text-headline-sm font-semibold">Câu hỏi hay sai nhất</h2>
              {data.hardest.length === 0 ? (
                <EmptyState icon="quiz" title="Chưa có dữ liệu" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left">
                    <thead className="font-label text-label text-on-surface-variant">
                      <tr>
                        <th className="p-2 font-medium">Câu hỏi</th>
                        <th className="p-2 font-medium">Part</th>
                        <th className="p-2 font-medium">Chủ đề</th>
                        <th className="p-2 font-medium">Tỷ lệ sai</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.hardest.map((question) => (
                        <tr key={question.questionId} className="border-t border-surface-container">
                          <td className="max-w-md p-2"><span className="line-clamp-2">{question.content}</span></td>
                          <td className="whitespace-nowrap p-2">{PART_LABELS[question.part]}</td>
                          <td className="p-2">{question.topic}</td>
                          <td className="whitespace-nowrap p-2 font-semibold">{question.wrongRate}% ({question.wrong}/{question.total})</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </>
  );
}
