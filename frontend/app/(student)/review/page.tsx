"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { TrendChart } from "@/components/trend-chart";
import { AccuracyBar, Card, EmptyState, ErrorBanner, PageHeader, primaryButtonClass } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { DIFFICULTY_LABELS, type Recommendation, type TopicStat, type TrendPoint } from "@/lib/types";

function topicLevel(accuracy: number) {
  if (accuracy < 50) return "Yếu";
  if (accuracy < 75) return "Cần chú ý";
  return "Vững";
}

export default function ReviewPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<TopicStat[] | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([
      api<TopicStat[]>("/stats/me/topics"),
      api<TrendPoint[]>("/stats/me/trend"),
      api<Recommendation[]>("/recommendations"),
    ])
      .then(([topicList, trendPoints, recommended]) => {
        setTopics(topicList);
        setTrend(trendPoints);
        setRecommendations(recommended);
      })
      .catch((caught: unknown) =>
        setError(caught instanceof ApiError ? caught.message : "Không tải được dữ liệu."),
      );
  }, []);

  const noQuestionsLeft = recommendations.every((item) => item.unseenQuestions === 0);

  const createSet = async () => {
    setError(null);
    setCreating(true);
    try {
      const { attemptId } = await api<{ attemptId: string }>("/recommendations/review-sets", { method: "POST" });
      router.push(`/attempts/${attemptId}`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không tạo được bộ ôn tập.");
      setCreating(false);
    }
  };

  return (
    <>
      <PageHeader title="Điểm yếu và ôn tập gợi ý" description="Gợi ý dựa trên tỷ lệ đúng theo chủ đề của bạn." />
      {error && <ErrorBanner message={error} />}

      {topics?.length === 0 ? (
        <Card>
          <EmptyState icon="insights" title="Chưa có dữ liệu để phân tích">
            <Link href="/exams" className={primaryButtonClass}>Làm đề đầu tiên</Link>
          </EmptyState>
        </Card>
      ) : (
        topics && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="lg:row-span-2">
              <h2 className="mb-3 text-headline-sm font-semibold">Độ chính xác theo chủ đề</h2>
              <ul className="flex flex-col gap-4">
                {topics.map((topic) => (
                  <li key={topic.topicId}>
                    <div className="mb-1 flex justify-between gap-2 text-body-subtle">
                      <span className="font-semibold">{topic.name}</span>
                      <span className="whitespace-nowrap">
                        {topic.correct}/{topic.total} · {topic.accuracy}% · {topicLevel(topic.accuracy)}
                      </span>
                    </div>
                    <AccuracyBar value={topic.accuracy} label={topic.name} />
                    {topic.recentAccuracy !== null && topic.recentAccuracy !== topic.accuracy && (
                      <p className="mt-1 text-label-sm text-on-surface-variant">5 lần gần nhất: {topic.recentAccuracy}%</p>
                    )}
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <h2 className="mb-3 text-headline-sm font-semibold">Bộ ôn tập gợi ý</h2>
              {recommendations.length === 0 ? (
                <p className="text-on-surface-variant">Bạn chưa có chủ đề yếu. Hãy làm thêm đề mới.</p>
              ) : noQuestionsLeft ? (
                <p className="text-on-surface-variant">
                  Bạn đã làm hết các câu thuộc chủ đề yếu. Hãy chờ giáo viên bổ sung câu hỏi mới.
                </p>
              ) : (
                <>
                  <ul className="mb-4 flex flex-col gap-2">
                    {recommendations.map((item) => (
                      <li key={item.topicId} className="rounded-xl bg-surface-container-low p-3">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-body-subtle text-on-surface-variant">
                          Dự kiến {item.plannedQuestions} câu · Mức {DIFFICULTY_LABELS[item.targetDifficulty]} · Còn {item.unseenQuestions} câu chưa làm
                        </p>
                      </li>
                    ))}
                  </ul>
                  <button type="button" disabled={creating} onClick={() => void createSet()} className={primaryButtonClass}>
                    <Icon name="play_arrow" /> {creating ? "Đang tạo..." : "Bắt đầu ôn tập"}
                  </button>
                </>
              )}
            </Card>

            <Card>
              <h2 className="mb-3 text-headline-sm font-semibold">Xu hướng 5 lần gần nhất</h2>
              <TrendChart points={trend} />
            </Card>
          </div>
        )
      )}
    </>
  );
}
