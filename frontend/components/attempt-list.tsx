import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { AttemptListItem } from "@/lib/types";
import { EmptyState } from "./ui";

export function AttemptList({ attempts }: { attempts: AttemptListItem[] }) {
  if (attempts.length === 0) {
    return <EmptyState icon="assignment" title="Chưa có lượt làm bài nào" />;
  }
  return (
    <ul className="flex flex-col gap-2">
      {attempts.map((attempt) => {
        const submitted = attempt.status === "SUBMITTED";
        return (
          <li key={attempt.id}>
            <Link
              href={submitted ? `/attempts/${attempt.id}/result` : `/attempts/${attempt.id}`}
              className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-low p-3 hover:bg-surface-container"
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold">{attempt.examTitle}</span>
                <span className="text-body-subtle text-on-surface-variant">{formatDate(attempt.startedAt)}</span>
              </span>
              <span className="shrink-0 text-right font-semibold text-primary">
                {submitted ? `${attempt.estimatedScore}/495` : "Đang làm"}
                {submitted && (
                  <span className="block text-body-subtle font-normal text-on-surface-variant">
                    {attempt.correctCount}/{attempt.totalQuestions} câu
                  </span>
                )}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
