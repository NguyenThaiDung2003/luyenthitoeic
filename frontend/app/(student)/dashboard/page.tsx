"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AttemptList } from "@/components/attempt-list";
import { useAuth } from "@/components/auth-provider";
import { Icon } from "@/components/icon";
import { AccuracyBar, Card, EmptyState, ErrorBanner, PageHeader, primaryButtonClass, StatCard } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { AttemptListItem, Overview, TopicStat } from "@/lib/types";

interface DashboardData {
  overview: Overview;
  topics: TopicStat[];
  attempts: AttemptListItem[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api<Overview>("/stats/me/overview"),
      api<TopicStat[]>("/stats/me/topics"),
      api<AttemptListItem[]>("/attempts"),
    ])
      .then(([overview, topics, attempts]) => setData({ overview, topics, attempts }))
      .catch((caught: unknown) =>
        setError(caught instanceof ApiError ? caught.message : "Không tải được dữ liệu."),
      );
  }, []);

  return (
    <>
      <PageHeader title={`Chào ${user?.fullName ?? "bạn"}!`} description="Đây là tiến độ luyện TOEIC Reading của bạn." />
      {error && <ErrorBanner message={error} />}
      {data && (
        <>
          <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Điểm Reading ước lượng" value={data.overview.latestScore === null ? "Chưa có" : `${data.overview.latestScore}/495`} hint="Theo lần nộp gần nhất" />
            <StatCard label="Số đề đã hoàn thành" value={String(data.overview.completedExams)} />
            <StatCard label="Độ chính xác chung" value={data.overview.accuracy === null ? "Chưa có" : `${data.overview.accuracy}%`} hint={`${data.overview.correctQuestions}/${data.overview.totalQuestions} câu`} />
            <StatCard label="Thời gian làm bài" value={`${data.overview.totalMinutes} phút`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
            <Card>
              <h2 className="mb-3 text-headline-sm font-semibold">Chủ đề cần ôn</h2>
              {data.topics.length === 0 ? (
                <EmptyState icon="insights" title="Chưa có dữ liệu">
                  <Link href="/exams" className={primaryButtonClass}>Làm đề đầu tiên</Link>
                </EmptyState>
              ) : (
                <ul className="flex flex-col gap-3">
                  {data.topics.slice(0, 3).map((topic) => (
                    <li key={topic.topicId} className="rounded-xl bg-surface-container-low p-3">
                      <div className="mb-2 flex justify-between gap-2">
                        <span className="font-semibold">{topic.name}</span>
                        <span className="whitespace-nowrap text-body-subtle font-semibold">{topic.accuracy}%</span>
                      </div>
                      <AccuracyBar value={topic.accuracy} label={topic.name} />
                      <p className="mt-2 text-body-subtle text-on-surface-variant">{topic.correct}/{topic.total} câu đúng</p>
                    </li>
                  ))}
                </ul>
              )}
              {data.topics.length > 0 && (
                <Link href="/review" className={`${primaryButtonClass} mt-4`}>
                  Ôn tập gợi ý <Icon name="arrow_forward" />
                </Link>
              )}
            </Card>
            <Card>
              <h2 className="mb-3 text-headline-sm font-semibold">Đề gần đây</h2>
              <AttemptList attempts={data.attempts.slice(0, 4)} />
            </Card>
          </div>
        </>
      )}
    </>
  );
}
